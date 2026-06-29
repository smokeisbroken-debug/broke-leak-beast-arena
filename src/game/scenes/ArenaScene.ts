import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../../config/game";
import { SCENE_KEYS } from "../../config/routes";
import { requestAppFullscreen, toggleAppFullscreen } from "../../app/AppShell";
import { MobileControls } from "../ui/MobileControls";
import { SfxSystem } from "../systems/SfxSystem";
import { ARENA_BATTLE_ROUNDS } from "../data/bosses";
import { getBossMechanicProfile, getCampaignBattleRounds, getCampaignChapterForBoss, getSkillById, getSkinById, getSkinStatMultiplier, getStageById, getStageModifierLabel, loadPlayerProfile } from "../data/gameRegistry";
import type { ArenaBossDefinition } from "../data/bosses";
import type { BossMechanicProfile, BossPhaseDefinition, SkillDefinition, SkinDefinition, StageDefinition } from "../data/gameRegistry";
import type { InputState, RunResult } from "../types/game";

type FighterState = "idle" | "moving" | "punch" | "kick" | "block" | "dash" | "hurt" | "defeated";
type EnemyState = "idle" | "approach" | "windup" | "attack" | "guard" | "backstep" | "hurt" | "defeated";
type EnemyAttack = "jab" | "lunge" | "heavy" | "special";

type RoundConfig = ArenaBossDefinition;

const FLOOR_Y = GAME_HEIGHT - 104;
const PLAYER_DISPLAY_W = 118;
const PLAYER_DISPLAY_H = 154;
const PLAYER_START_X = 290;
const ENEMY_START_X = GAME_WIDTH - 286;
const LEFT_BOUND = GAME_WIDTH * 0.26;
const RIGHT_BOUND = GAME_WIDTH * 0.74;
const FALLBACK_ROUNDS: RoundConfig[] = ARENA_BATTLE_ROUNDS;
const MAX_ENERGY = 100;
const ULTIMATE_DURATION_MS = 5000;

export class ArenaScene extends Phaser.Scene {
  private controls!: MobileControls;
  private sfx!: SfxSystem;

  private player!: Phaser.Physics.Arcade.Sprite;
  private enemy!: Phaser.Physics.Arcade.Sprite;
  private playerShadow!: Phaser.GameObjects.Ellipse;
  private enemyShadow!: Phaser.GameObjects.Ellipse;
  private playerAuraOuter!: Phaser.GameObjects.Ellipse;
  private playerAuraInner!: Phaser.GameObjects.Ellipse;
  private enemyAura!: Phaser.GameObjects.Ellipse;
  private selectedSkin!: SkinDefinition;
  private selectedStage!: StageDefinition;
  private skill1!: SkillDefinition;
  private skill2!: SkillDefinition;
  private ultimateSkill!: SkillDefinition;
  private activeRounds: RoundConfig[] = FALLBACK_ROUNDS;
  private selectedCampaignId = "daily_leaks";
  private selectedBossId = "impulse_buy_beast";

  private playerHp = 100;
  private playerMaxHp = 100;
  private playerMoveSpeed = 260;
  private punchDamageMultiplier = 1;
  private kickDamageMultiplier = 1;
  private dashCooldownMs = 860;
  private blockDamageTakenMultiplier = 0.25;
  private playerEnergy = 45;
  private ultimateActiveUntil = 0;
  private enemyHp = 1;
  private enemyMaxHp = 1;
  private roundIndex = 0;
  private score = 0;
  private activeElapsedMs = 0;
  private defeatedLeaks = 0;
  private defeatedBossIds: string[] = [];
  private blocksCount = 0;
  private dodgesCount = 0;
  private skillsUsedCount = 0;
  private ultimatesUsedCount = 0;
  private damageTaken = 0;
  private runFinished = false;
  private fightStarted = false;

  private playerState: FighterState = "idle";
  private enemyState: EnemyState = "idle";
  private enemyAttack: EnemyAttack = "jab";
  private enemyWindupUntil = 0;
  private enemyAttackUntil = 0;
  private enemyCooldownUntil = 0;
  private enemyGuardUntil = 0;
  private enemyBackstepUntil = 0;
  private enemySpecialCooldownUntil = 0;
  private activeBossPhaseIndex = -1;
  private playerInvincibleUntil = 0;
  private playerBlockUntil = 0;
  private playerActionUntil = 0;
  private punchCooldownUntil = 0;
  private kickCooldownUntil = 0;
  private dashCooldownUntil = 0;
  private skill1CooldownUntil = 0;
  private skill2CooldownUntil = 0;
  private ultimateLockUntil = 0;
  private nextStageHazardAt = 0;
  private nextStageTickAt = 0;
  private stageSlowZoneX = GAME_WIDTH / 2;
  private stageLeakZoneX = GAME_WIDTH / 2;
  private stageWaveDirection = 1;
  private lastPunchAt = 0;
  private comboStep = 0;
  private bossPhaseShown = false;

  private playerHpFill!: Phaser.GameObjects.Rectangle;
  private enemyHpFill!: Phaser.GameObjects.Rectangle;
  private playerHpText!: Phaser.GameObjects.Text;
  private playerEnergyFill!: Phaser.GameObjects.Rectangle;
  private playerEnergyText!: Phaser.GameObjects.Text;
  private enemyHpText!: Phaser.GameObjects.Text;
  private roundText!: Phaser.GameObjects.Text;
  private objectiveText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private skillStatusText!: Phaser.GameObjects.Text;
  private ultimateStatusText!: Phaser.GameObjects.Text;
  private stageStatusText!: Phaser.GameObjects.Text;

  constructor() {
    super(SCENE_KEYS.arena);
  }

  create(): void {
    const profile = loadPlayerProfile();
    this.selectedSkin = getSkinById(profile.selectedSkinId);
    this.activeRounds = getCampaignBattleRounds(profile);
    this.selectedBossId = this.activeRounds[0]?.id ?? profile.selectedBossId;
    this.selectedCampaignId = getCampaignChapterForBoss(this.selectedBossId).id;
    this.selectedStage = getStageById(profile.selectedStageId);
    this.skill1 = getSkillById(profile.selectedSkillIds.skill1);
    this.skill2 = getSkillById(profile.selectedSkillIds.skill2);
    this.ultimateSkill = getSkillById(profile.selectedSkillIds.ultimate);
    const skinBonuses = this.selectedSkin.bonuses;
    this.playerMaxHp = Math.round(100 * getSkinStatMultiplier(skinBonuses.hpPercent));
    this.playerMoveSpeed = Math.round(260 * getSkinStatMultiplier(skinBonuses.speedPercent));
    this.punchDamageMultiplier = getSkinStatMultiplier(skinBonuses.punchDamagePercent);
    this.kickDamageMultiplier = getSkinStatMultiplier(skinBonuses.kickDamagePercent);
    this.dashCooldownMs = Math.max(560, Math.round(860 * getSkinStatMultiplier(skinBonuses.dashCooldownPercent)));
    this.blockDamageTakenMultiplier = Math.max(0.1, 0.25 * (1 - (skinBonuses.blockReductionPercent ?? 0) / 100));

    this.playerHp = this.playerMaxHp;
    this.playerEnergy = 45;
    this.ultimateActiveUntil = 0;
    this.ultimateLockUntil = 0;
    this.enemyHp = 1;
    this.enemyMaxHp = 1;
    this.roundIndex = 0;
    this.score = 0;
    this.activeElapsedMs = 0;
    this.defeatedLeaks = 0;
    this.defeatedBossIds = [];
    this.blocksCount = 0;
    this.dodgesCount = 0;
    this.skillsUsedCount = 0;
    this.ultimatesUsedCount = 0;
    this.damageTaken = 0;
    this.runFinished = false;
    this.fightStarted = false;
    this.playerState = "idle";
    this.enemyState = "idle";
    this.playerInvincibleUntil = 0;
    this.playerBlockUntil = 0;
    this.playerActionUntil = 0;
    this.punchCooldownUntil = 0;
    this.kickCooldownUntil = 0;
    this.dashCooldownUntil = 0;
    this.skill1CooldownUntil = 0;
    this.skill2CooldownUntil = 0;
    this.ultimateLockUntil = 0;
    this.lastPunchAt = 0;
    this.comboStep = 0;
    this.bossPhaseShown = false;
    this.nextStageHazardAt = 0;
    this.nextStageTickAt = 0;
    this.stageSlowZoneX = GAME_WIDTH / 2;
    this.stageLeakZoneX = GAME_WIDTH / 2;
    this.stageWaveDirection = 1;
    this.enemySpecialCooldownUntil = 0;
    this.activeBossPhaseIndex = -1;

    this.sfx = new SfxSystem();
    this.createArenaBackground();
    this.createFighters();
    this.createHud();
    this.controls = new MobileControls(this);
    this.createPauseAndFullscreenButtons();

    this.input.once("pointerdown", () => {
      this.sfx.unlock();
      void requestAppFullscreen(document.documentElement);
    });

    this.startRound(0);
  }

  update(_time: number, delta: number): void {
    if (this.runFinished) return;

    this.updateShadows();
    this.updateCharacterPresentation();
    this.updateHud();

    if (!this.fightStarted) return;

    this.activeElapsedMs += delta;
    const input = this.controls.getInputState();
    const now = Date.now();

    this.updateStageSystem(now, delta);
    this.updatePlayer(input, now);
    this.updateEnemy(now);
    this.clampFighters();
  }

  private createArenaBackground(): void {
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, this.selectedStage.backgroundKey)
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setDepth(0);

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, this.selectedStage.color, 0.055)
      .setDepth(1);

    this.add.rectangle(GAME_WIDTH / 2, FLOOR_Y + 32, GAME_WIDTH, 92, 0x071707, 0.34)
      .setDepth(2);
    this.add.rectangle(GAME_WIDTH / 2, FLOOR_Y - 86, 420, 210, 0xfcfff7, 0.018)
      .setDepth(2);

    // Clean calibrated floor. No large color blobs under fighters; only a subtle contact plane.
    this.add.line(0, 0, 205, FLOOR_Y - 2, GAME_WIDTH - 205, FLOOR_Y - 2, 0x72ff57, 0.14)
      .setOrigin(0, 0)
      .setLineWidth(2)
      .setDepth(3);
    this.add.rectangle(96, 0, 166, GAME_HEIGHT, this.selectedStage.color, 0.014).setDepth(2);
    this.add.rectangle(GAME_WIDTH - 96, 0, 166, GAME_HEIGHT, 0xa45cff, 0.012).setDepth(2);

    if (this.selectedStage.modifier === "slow_zones") this.createPersistentSlowZone();
    if (this.selectedStage.modifier === "leak_zones") this.createPersistentLeakZone();
  }

  private createFighters(): void {
    this.playerShadow = this.add.ellipse(PLAYER_START_X, FLOOR_Y - 2, 92, 22, 0x000000, 0.22).setDepth(9);
    this.enemyShadow = this.add.ellipse(ENEMY_START_X, FLOOR_Y - 2, 90, 22, 0x000000, 0.24).setDepth(9);

    this.playerAuraOuter = this.add.ellipse(PLAYER_START_X - 6, FLOOR_Y - 88, 106, 144, this.selectedSkin.auraColor, 0.06).setDepth(15);
    this.playerAuraInner = this.add.ellipse(PLAYER_START_X - 3, FLOOR_Y - 90, 70, 112, 0xfcfff7, 0.035).setDepth(16);
    this.enemyAura = this.add.ellipse(ENEMY_START_X + 6, FLOOR_Y - 82, 118, 136, 0xa45cff, 0.045).setDepth(15);

    this.player = this.physics.add.sprite(PLAYER_START_X, FLOOR_Y - PLAYER_DISPLAY_H * 0.5, this.selectedSkin.assetKey);
    this.player.setDisplaySize(PLAYER_DISPLAY_W, PLAYER_DISPLAY_H);
    this.player.setTint(this.selectedSkin.tintColor);
    this.player.setDepth(22);
    this.player.setCollideWorldBounds(false);
    this.player.setData("side", "player");
    this.setBody(this.player, 42, 78, 20);
    if (this.anims.exists("mascot-idle-front-anim")) this.player.play("mascot-idle-front-anim", true);

    this.enemy = this.physics.add.sprite(ENEMY_START_X, FLOOR_Y - this.getRound(0).displayH * 0.5, this.getRound(0).texture);
    this.enemy.setDepth(21);
    this.enemy.setCollideWorldBounds(false);
    this.enemy.setData("side", "enemy");
  }

  private createHud(): void {
    this.add.rectangle(156, 34, 272, 50, 0x061006, 0.74)
      .setStrokeStyle(2, 0x72ff57, 0.36)
      .setDepth(80);
    this.add.text(30, 13, this.selectedSkin.name.toUpperCase(), {
      fontFamily: "Arial", fontSize: "12px", color: "#72ff57", fontStyle: "bold", stroke: "#041004", strokeThickness: 3,
    }).setDepth(81);
    this.add.rectangle(156, 42, 228, 13, 0x1b251b, 1).setOrigin(0.5).setDepth(81);
    this.playerHpFill = this.add.rectangle(42, 42, 226, 11, 0x72ff57, 1).setOrigin(0, 0.5).setDepth(82);
    this.playerHpText = this.add.text(276, 27, `${this.playerMaxHp}/${this.playerMaxHp}`, {
      fontFamily: "Arial", fontSize: "13px", color: "#fcfff7", fontStyle: "bold", stroke: "#041004", strokeThickness: 3,
    }).setOrigin(1, 0).setDepth(83);

    this.add.rectangle(156, 62, 228, 8, 0x1b251b, 1).setOrigin(0.5).setDepth(81);
    this.playerEnergyFill = this.add.rectangle(42, 62, 0, 7, 0xffeb72, 1).setOrigin(0, 0.5).setDepth(82);
    this.playerEnergyText = this.add.text(276, 54, "ENERGY 35", {
      fontFamily: "Arial", fontSize: "10px", color: "#ffeb72", fontStyle: "bold", stroke: "#041004", strokeThickness: 3,
    }).setOrigin(1, 0).setDepth(83);

    this.add.rectangle(GAME_WIDTH - 156, 34, 272, 50, 0x061006, 0.74)
      .setStrokeStyle(2, 0xa45cff, 0.36)
      .setDepth(80);
    this.enemyHpText = this.add.text(GAME_WIDTH - 30, 13, "LEAK BEAST", {
      fontFamily: "Arial", fontSize: "12px", color: "#d9a7ff", fontStyle: "bold", stroke: "#041004", strokeThickness: 3,
    }).setOrigin(1, 0).setDepth(81);
    this.add.rectangle(GAME_WIDTH - 156, 42, 228, 13, 0x21172b, 1).setOrigin(0.5).setDepth(81);
    this.enemyHpFill = this.add.rectangle(GAME_WIDTH - 270, 42, 226, 11, 0xff4866, 1).setOrigin(0, 0.5).setDepth(82);

    this.roundText = this.add.text(GAME_WIDTH / 2, 16, "ROUND 1", {
      fontFamily: "Arial", fontSize: "22px", color: "#fcfff7", fontStyle: "bold", stroke: "#041004", strokeThickness: 5,
    }).setOrigin(0.5).setDepth(83);

    this.objectiveText = this.add.text(GAME_WIDTH / 2, 44, "DEFEAT THE LEAK", {
      fontFamily: "Arial", fontSize: "12px", color: "#72ff57", fontStyle: "bold", stroke: "#041004", strokeThickness: 4,
    }).setOrigin(0.5).setDepth(83);

    this.stageStatusText = this.add.text(GAME_WIDTH / 2, 60, `STAGE: ${this.selectedStage.name.toUpperCase()} · ${getStageModifierLabel(this.selectedStage).toUpperCase()}`, {
      fontFamily: "Arial", fontSize: "10px", color: this.selectedStage.uiColor, fontStyle: "bold", stroke: "#041004", strokeThickness: 3,
    }).setOrigin(0.5).setDepth(83);

    this.statusText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 24, "FIGHT", {
      fontFamily: "Arial", fontSize: "12px", color: "#fcfff7", fontStyle: "bold", stroke: "#041004", strokeThickness: 4,
    }).setOrigin(0.5).setDepth(84);

    this.comboText = this.add.text(PLAYER_START_X, FLOOR_Y - 188, "", {
      fontFamily: "Arial", fontSize: "18px", color: "#72ff57", fontStyle: "bold", stroke: "#041004", strokeThickness: 5,
    }).setOrigin(0.5).setDepth(84);

    this.skillStatusText = this.add.text(GAME_WIDTH / 2, 78, "", {
      fontFamily: "Arial", fontSize: "11px", color: "#fcfff7", fontStyle: "bold", stroke: "#041004", strokeThickness: 4,
    }).setOrigin(0.5).setDepth(84);

    this.ultimateStatusText = this.add.text(GAME_WIDTH / 2, 96, "", {
      fontFamily: "Arial", fontSize: "12px", color: "#ffeb72", fontStyle: "bold", stroke: "#041004", strokeThickness: 4,
    }).setOrigin(0.5).setDepth(84);
  }

  private createPauseAndFullscreenButtons(): void {
    const fullBg = this.add.circle(GAME_WIDTH - 86, 86, 18, 0x061006, 0.78)
      .setStrokeStyle(2, 0xa45cff, 0.38)
      .setDepth(88)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });
    this.add.text(GAME_WIDTH - 86, 86, "⛶", {
      fontFamily: "Arial", fontSize: "18px", color: "#fcfff7", fontStyle: "bold", stroke: "#041004", strokeThickness: 4,
    }).setOrigin(0.5).setDepth(89).setScrollFactor(0);
    fullBg.on("pointerdown", () => void toggleAppFullscreen(document.documentElement));
  }

  private startRound(index: number): void {
    this.roundIndex = index;
    const config = this.getRound(index);
    this.enemyMaxHp = config.hp;
    this.enemyHp = config.hp;
    this.enemyState = "idle";
    this.enemyCooldownUntil = Date.now() + 1400;
    this.enemyGuardUntil = 0;
    this.enemyBackstepUntil = 0;
    this.enemySpecialCooldownUntil = Date.now() + 2200;
    this.activeBossPhaseIndex = -1;
    this.fightStarted = false;
    this.playerState = "idle";
    this.playerActionUntil = 0;
    this.playerInvincibleUntil = Date.now() + 600;
    this.bossPhaseShown = false;
    this.nextStageHazardAt = Date.now() + Math.max(2600, this.selectedStage.hazardIntervalMs || 0);

    this.player.setTexture(this.selectedSkin.assetKey);
    this.player.setDisplaySize(PLAYER_DISPLAY_W, PLAYER_DISPLAY_H);
    this.player.setPosition(PLAYER_START_X, FLOOR_Y - PLAYER_DISPLAY_H * 0.5);
    this.player.setVelocity(0, 0);
    this.player.setFlipX(false);
    this.player.setTint(this.selectedSkin.tintColor);
    this.player.setDisplaySize(PLAYER_DISPLAY_W, PLAYER_DISPLAY_H);
    this.player.setAngle(0);
    this.player.setAlpha(1);
    this.playPlayerAnim("mascot-idle-front-anim");

    this.enemy.setTexture(config.texture);
    this.enemy.setDisplaySize(config.displayW, config.displayH);
    this.enemy.setPosition(ENEMY_START_X, FLOOR_Y - config.displayH * 0.5);
    this.enemy.setVelocity(0, 0);
    this.enemy.setFlipX(true);
    this.enemy.clearTint();
    this.enemy.setAngle(0);
    this.enemy.setAlpha(1);
    this.setBody(this.enemy, config.bodyW, config.bodyH, Math.max(0, config.displayH * 0.18));
    if (this.anims.exists(config.animation)) this.enemy.play(config.animation, true);

    this.roundText.setText(config.boss ? "BOSS MISSION" : `MISSION ${index + 1}`);
    this.objectiveText.setText(config.leakLabel);
    this.enemyHpText.setText(config.name.toUpperCase());
    this.enemyHpText.setColor(config.boss ? "#ff9aaa" : config.behavior === "emotion" ? "#ffeb72" : config.behavior === "rug" ? "#d9a7ff" : "#d7ffd0");
    this.enemyHpFill.setFillStyle(config.color, 1);
    this.statusText.setText("GET READY");
    this.updateHud();
    this.showRoundIntro(config);
  }

  private showRoundIntro(config: RoundConfig): void {
    const shade = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.38)
      .setDepth(120);
    const title = this.add.text(GAME_WIDTH / 2, 148, config.boss ? "BOSS FIGHT" : "CAMPAIGN FIGHT", {
      fontFamily: "Arial", fontSize: "42px", color: config.boss ? "#ff8fa3" : "#72ff57", fontStyle: "bold", stroke: "#041004", strokeThickness: 8,
    }).setOrigin(0.5).setDepth(121);
    const sub = this.add.text(GAME_WIDTH / 2, 194, `BROKE MASCOT  VS  ${config.name.toUpperCase()}`, {
      fontFamily: "Arial", fontSize: "17px", color: "#fcfff7", fontStyle: "bold", stroke: "#041004", strokeThickness: 5,
    }).setOrigin(0.5).setDepth(121);
    const objective = this.add.text(GAME_WIDTH / 2, 224, `${config.leakLabel} · ${this.selectedStage.name.toUpperCase()}`, {
      fontFamily: "Arial", fontSize: "14px", color: "#d9a7ff", fontStyle: "bold", stroke: "#041004", strokeThickness: 4,
    }).setOrigin(0.5).setDepth(121);
    const mechanics = this.getBossMechanics(config);
    const hint = this.add.text(GAME_WIDTH / 2, 258, `${config.introLine}\n${mechanics.shortHint}`, {
      fontFamily: "Arial", fontSize: "12px", color: "#fcfff7", fontStyle: "bold", stroke: "#041004", strokeThickness: 4,
      align: "center",
    }).setOrigin(0.5).setDepth(121).setAlpha(0.9);

    this.time.delayedCall(1250, () => {
      this.fightStarted = true;
      this.statusText.setText("FIGHT");
      this.tweens.add({
        targets: [shade, title, sub, objective, hint],
        alpha: 0,
        duration: 280,
        onComplete: () => {
          shade.destroy();
          title.destroy();
          sub.destroy();
          objective.destroy();
        },
      });
    });
  }

  private updatePlayer(input: InputState, now: number): void {
    const blockHeld = Boolean(input.shield);

    if (blockHeld && now > this.playerActionUntil - 120) {
      this.playerState = "block";
      this.playerBlockUntil = now + 120;
      this.player.setVelocity(0, 0);
      this.player.setTint(0x72ff57);
      this.playPlayerAnim("mascot-pulse-front-anim");
      this.statusText.setText("BLOCK");
      return;
    }

    if (input.skill1) {
      if (this.useActiveSkill(this.skill1, "skill1", now)) return;
    }

    if (input.skill2) {
      if (this.useActiveSkill(this.skill2, "skill2", now)) return;
    }

    if (input.ultimate) {
      if (this.useUltimate(now)) return;
    }

    if (input.dodge && now >= this.dashCooldownUntil) {
      this.dash(now, input.x);
      return;
    }

    if (input.pulse && now >= this.kickCooldownUntil) {
      this.kick(now);
      return;
    }

    if (input.attack && now >= this.punchCooldownUntil) {
      this.punch(now);
      return;
    }

    if (now < this.playerActionUntil) return;

    this.player.setTint(this.selectedSkin.tintColor);
    this.playerState = Math.abs(input.x) > 0.08 ? "moving" : "idle";
    const speed = Math.round(this.playerMoveSpeed * this.getStageMoveMultiplier());
    this.player.setVelocityX(input.x * speed);
    this.player.setVelocityY(0);
    this.player.setFlipX(false);
    this.playPlayerAnim(this.playerState === "moving" ? "mascot-run-front-anim" : "mascot-idle-front-anim");
  }

  private isUltimateActive(now = Date.now()): boolean {
    return now < this.ultimateActiveUntil;
  }

  private addEnergy(amount: number, label?: string): void {
    if (amount <= 0 || this.runFinished) return;
    const before = this.playerEnergy;
    this.playerEnergy = Phaser.Math.Clamp(this.playerEnergy + amount, 0, MAX_ENERGY);
    if (label && this.playerEnergy > before) {
      this.showFloatingText(`+${this.playerEnergy - before} ENERGY`, this.player.x, this.player.y - 136, "#ffeb72");
    }
    if (before < MAX_ENERGY && this.playerEnergy >= MAX_ENERGY) {
      this.statusText.setText("ULTIMATE READY");
      this.showFloatingText("ULT READY", this.player.x, this.player.y - 150, "#ffeb72");
      this.cameras.main.flash(40, 255, 235, 114, false);
    }
  }

  private spendEnergy(cost: number, label: string): boolean {
    if (cost <= 0) return true;
    if (this.playerEnergy < cost) {
      this.showFloatingText(`${label} NEEDS ${cost} ENERGY`, this.player.x, this.player.y - 126, "#ffeb72");
      this.statusText.setText("NOT ENOUGH ENERGY");
      return false;
    }
    this.playerEnergy = Phaser.Math.Clamp(this.playerEnergy - cost, 0, MAX_ENERGY);
    return true;
  }

  private useUltimate(now: number): boolean {
    if (now < this.ultimateLockUntil) {
      this.showFloatingText("ULTIMATE LOCKED", this.player.x, this.player.y - 132, "#fcfff7");
      return false;
    }

    if (!this.spendEnergy(this.ultimateSkill.energyCost || MAX_ENERGY, "ULTIMATE")) return false;

    this.ultimatesUsedCount += 1;
    this.ultimateLockUntil = now + ULTIMATE_DURATION_MS + 650;
    this.ultimateActiveUntil = now + ULTIMATE_DURATION_MS;
    this.playerActionUntil = now + 360;
    this.playerState = "block";
    this.playerInvincibleUntil = now + 520;
    this.player.setVelocity(0, 0);
    this.player.setTint(this.ultimateSkill.color);
    this.playPlayerAnim("mascot-pulse-front-anim");
    this.sfx.playPulse();
    this.statusText.setText(this.ultimateSkill.name.toUpperCase());
    this.comboText.setText("ULTIMATE MODE");
    this.comboText.setPosition(this.player.x + 30, this.player.y - 146);
    this.time.delayedCall(900, () => this.comboText.setText(""));
    this.showUltimateFx();
    this.cameras.main.flash(90, 114, 255, 87, false);
    this.cameras.main.shake(140, 0.0035);
    return true;
  }

  private useActiveSkill(skill: SkillDefinition, slot: "skill1" | "skill2", now: number): boolean {
    const cooldownUntil = slot === "skill1" ? this.skill1CooldownUntil : this.skill2CooldownUntil;
    if (now < cooldownUntil) {
      this.showFloatingText(`${skill.name.toUpperCase()} ${Math.ceil((cooldownUntil - now) / 1000)}s`, this.player.x, this.player.y - 126, "#fcfff7");
      this.statusText.setText("SKILL COOLDOWN");
      return false;
    }

    if (!this.spendEnergy(skill.energyCost, skill.name.toUpperCase())) return false;

    this.skillsUsedCount += 1;

    if (slot === "skill1") this.skill1CooldownUntil = now + skill.cooldownMs;
    else this.skill2CooldownUntil = now + skill.cooldownMs;

    this.comboStep = 0;
    this.playerActionUntil = now + (skill.effect === "heal" ? 260 : 330);
    this.playerState = skill.effect === "heal" ? "block" : "punch";
    this.player.setTint(skill.color);
    this.playPlayerAnim(skill.effect === "heal" ? "mascot-pulse-front-anim" : "mascot-attack-anim");
    this.statusText.setText(skill.name.toUpperCase());
    this.comboText.setText(skill.name.toUpperCase());
    this.comboText.setPosition(this.player.x + 42, this.player.y - 138);
    this.time.delayedCall(560, () => this.comboText.setText(""));

    if (skill.effect === "heal") {
      const heal = skill.healAmount ?? 16;
      const before = this.playerHp;
      this.playerHp = Math.min(this.playerMaxHp, this.playerHp + heal);
      this.sfx.playPickup();
      this.showSkillCastFx(skill, this.player.x + 16, this.player.y - 42, true);
      this.showFloatingText(`+${this.playerHp - before} HP`, this.player.x, this.player.y - 112, "#72ff57");
      this.cameras.main.flash(44, 114, 255, 87, false);
      return true;
    }

    if (skill.effect === "push") {
      this.sfx.playPulse();
      this.showSkillCastFx(skill, this.player.x + 68, this.player.y - 36, true);
      this.tryHitEnemy(skill.damage, skill.range, skill.knockback, skill.name.toUpperCase());
      this.cameras.main.shake(92, 0.0032);
      return true;
    }

    if (skill.effect === "trap") {
      this.sfx.playPulse();
      this.showSkillCastFx(skill, this.player.x + 92, FLOOR_Y - 44, true);
      this.tryHitEnemy(skill.damage, skill.range, skill.knockback, skill.name.toUpperCase());
      return true;
    }

    this.player.setVelocityX(84);
    this.sfx.playDashSlash();
    this.showSkillCastFx(skill, this.player.x + 106, this.player.y - 38, true);
    this.tryHitEnemy(skill.damage, skill.range, skill.knockback, skill.name.toUpperCase());
    return true;
  }

  private punch(now: number): void {
    if (now - this.lastPunchAt > 780) this.comboStep = 0;
    this.comboStep = (this.comboStep % 3) + 1;
    this.lastPunchAt = now;
    this.punchCooldownUntil = now + (this.comboStep === 3 ? 390 : 235);
    this.playerActionUntil = now + (this.comboStep === 3 ? 270 : 170);
    this.playerState = "punch";
    this.player.setVelocityX(48);
    this.player.setTint(this.comboStep === 3 ? 0xd9a7ff : 0xffffff);
    this.playPlayerAnim("mascot-attack-anim");
    this.sfx.playSword(this.comboStep === 3);
    this.showPunchFx(this.comboStep);
    this.tryHitEnemy(Math.round((this.comboStep === 3 ? 16 : 8) * this.punchDamageMultiplier), this.comboStep === 3 ? 146 : 114, this.comboStep === 3 ? 260 : 150, this.comboStep === 3 ? "HEAVY PUNCH" : "PUNCH");
  }

  private kick(now: number): void {
    this.kickCooldownUntil = now + 660;
    this.playerActionUntil = now + 300;
    this.playerState = "kick";
    this.comboStep = 0;
    this.player.setVelocityX(108);
    this.player.setTint(0xffeb72);
    this.playPlayerAnim("mascot-attack-anim");
    this.sfx.playDashSlash();
    this.showKickFx();
    this.tryHitEnemy(Math.round(18 * this.kickDamageMultiplier), 164, 360, "KICK");
  }

  private dash(now: number, inputX: number): void {
    this.dashCooldownUntil = now + this.dashCooldownMs;
    this.playerActionUntil = now + 230;
    this.playerInvincibleUntil = now + 280;
    this.playerState = "dash";
    const dir = inputX < -0.15 ? -1 : 1;
    this.spawnDashAfterimage(dir);
    this.player.setVelocityX(dir * 520);
    this.player.setAlpha(0.68);
    this.player.setTint(0xa45cff);
    this.playPlayerAnim("mascot-dash-anim");
    this.statusText.setText("DASH");
    this.time.delayedCall(230, () => {
      if (!this.player.active) return;
      this.player.setAlpha(1);
      this.player.setTint(this.selectedSkin.tintColor);
    });
  }

  private tryHitEnemy(damage: number, range: number, knockback: number, label: string): void {
    if (this.enemyState === "defeated") return;
    const distance = Math.abs(this.enemy.x - this.player.x);
    if (distance > range) {
      this.showFloatingText("MISS", this.player.x + 64, this.player.y - 84, "#fcfff7");
      this.statusText.setText(`${label} MISS`);
      return;
    }

    const counterHit = this.enemyState === "windup";
    const guarded = this.enemyState === "guard";
    const heavyHit = label.includes("HEAVY") || label === "KICK";
    const bonus = counterHit ? 4 : 0;
    const ultimateBonus = this.isUltimateActive() ? 1.32 : 1;
    const rawDamage = Math.round((damage + bonus) * ultimateBonus);
    const finalDamage = guarded ? Math.max(1, Math.floor(rawDamage * 0.35)) : rawDamage;
    this.enemyHp = Math.max(0, this.enemyHp - finalDamage);

    if (guarded) {
      this.enemyState = "backstep";
      this.enemyBackstepUntil = Date.now() + 300;
      this.enemyCooldownUntil = Math.max(this.enemyCooldownUntil, Date.now() + 520);
      this.enemy.setVelocityX(knockback * 0.4);
      this.enemy.setTint(0x72ff57);
      this.sfx.playBlock();
    } else {
      this.enemyState = "hurt";
      this.enemyAttackUntil = Date.now() + (heavyHit ? 210 : 165);
      this.enemyCooldownUntil = Math.max(this.enemyCooldownUntil, Date.now() + (counterHit ? 720 : 470));
      this.enemy.setVelocityX(knockback);
      this.enemy.setTint(heavyHit ? 0xffeb72 : 0xffffff);
      this.sfx.playHit(heavyHit);
    }

    this.score += finalDamage * 12 + (counterHit ? 70 : 0) + (guarded ? 10 : 0);
    this.addEnergy(Math.min(18, 5 + Math.floor(finalDamage * 0.28) + (counterHit ? 8 : 0)), counterHit ? "counter" : undefined);

    const impactX = this.enemy.x - Math.min(72, this.enemy.displayWidth * 0.38);
    const impactY = this.enemy.y - this.enemy.displayHeight * 0.34;
    const impactColor = guarded ? 0x72ff57 : heavyHit ? 0xffeb72 : 0x72ff57;
    this.showImpact(impactX, impactY, impactColor, heavyHit || guarded);
    this.showHitLine(this.player.x + 46, this.player.y - 42, impactX, impactY, impactColor, heavyHit || guarded);
    this.showFloatingText(`${guarded ? "GUARD" : label} -${finalDamage}`, this.enemy.x, this.enemy.y - this.enemy.displayHeight * 0.64, guarded ? "#72ff57" : heavyHit ? "#ffeb72" : "#d7ffd0");
    if (counterHit) this.showFloatingText("COUNTER", this.enemy.x - 8, this.enemy.y - this.enemy.displayHeight * 0.82, "#ffeb72");

    this.comboText.setText(guarded ? "GUARDED" : counterHit ? "COUNTER HIT" : label);
    this.comboText.setPosition(this.player.x + 40, this.player.y - 136);
    this.time.delayedCall(520, () => this.comboText.setText(""));
    this.statusText.setText(guarded ? "ENEMY GUARDED" : counterHit ? "COUNTER HIT" : label);
    this.cameras.main.shake(heavyHit ? 115 : guarded ? 70 : 58, heavyHit ? 0.0042 : guarded ? 0.0028 : 0.0022);
    if (heavyHit) this.cameras.main.flash(36, 255, 235, 114, false);

    this.time.delayedCall(heavyHit || guarded ? 130 : 95, () => {
      if (!this.enemy.active || this.enemyState === "defeated") return;
      this.enemy.clearTint();
    });

    if (this.enemyHp <= 0) {
      this.defeatEnemy();
    }
  }

  private updateEnemy(now: number): void {
    const config = this.getRound(this.roundIndex);
    this.enemy.setFlipX(this.enemy.x > this.player.x);

    this.updateBossPhase(now, config);

    if (this.enemyState === "defeated") return;

    if (this.enemyState === "guard") {
      this.enemy.setVelocityX(0);
      this.statusText.setText(`${config.name}: GUARD`);
      if (now >= this.enemyGuardUntil) {
        this.enemy.clearTint();
        this.enemyState = "idle";
        this.enemyCooldownUntil = Math.max(this.enemyCooldownUntil, now + 260);
      }
      return;
    }

    if (this.enemyState === "backstep") {
      const away = this.player.x < this.enemy.x ? 1 : -1;
      this.enemy.setVelocityX(away * this.getBackstepSpeed(config));
      this.statusText.setText(`${config.name}: RESET`);
      if (now >= this.enemyBackstepUntil) {
        this.enemy.setVelocityX(0);
        this.enemy.clearTint();
        this.enemyState = "idle";
        this.enemyCooldownUntil = Math.max(this.enemyCooldownUntil, now + this.getRecoveryDelay(config));
      }
      return;
    }

    if (this.enemyState === "hurt") {
      if (now < this.enemyAttackUntil) return;
      this.enemy.clearTint();
      this.enemyState = "idle";
      this.enemyCooldownUntil = Math.max(this.enemyCooldownUntil, now + this.getRecoveryDelay(config));
    }

    if (this.enemyState === "windup") {
      this.enemy.setVelocityX(0);
      if (now >= this.enemyWindupUntil) {
        this.performEnemyAttack(now, config);
      }
      return;
    }

    if (this.enemyState === "attack") {
      if (now >= this.enemyAttackUntil) {
        this.enemyState = "backstep";
        this.enemyBackstepUntil = now + this.getBackstepDuration(config);
        this.enemy.clearTint();
      }
      return;
    }

    const distance = Math.abs(this.player.x - this.enemy.x);
    const attackDistance = config.attackRange * (config.behavior === "emotion" ? 0.92 : config.behavior === "rug" ? 0.72 : 0.84);
    if (distance > attackDistance) {
      this.enemyState = "approach";
      const dir = this.player.x < this.enemy.x ? -1 : 1;
      const phase = this.getActiveBossPhase(config);
      const phaseBoost = phase?.speedMultiplier ?? 1;
      const behaviorBoost = config.behavior === "emotion" ? 1.05 : config.behavior === "rug" ? 0.86 : 1;
      const feint = config.behavior === "emotion" ? Math.sin(now / 170) * 28 : 0;
      this.enemy.setVelocityX(dir * (config.speed * phaseBoost * behaviorBoost + feint));
      if (this.anims.exists(config.animation)) this.enemy.play(config.animation, true);
      this.statusText.setText(config.threatLine);
      return;
    }

    this.enemy.setVelocityX(0);
    this.enemyState = "idle";

    if (now >= this.enemyCooldownUntil) {
      if (this.shouldEnemyGuard(config, distance)) {
        this.beginEnemyGuard(now, config);
      } else {
        this.beginEnemyWindup(now, config);
      }
    } else if (distance < config.attackRange * 0.58) {
      const away = this.player.x < this.enemy.x ? 1 : -1;
      const retreatSpeed = config.behavior === "rug" ? 34 : config.behavior === "emotion" ? 58 : 42;
      this.enemy.setVelocityX(away * retreatSpeed);
      this.statusText.setText(`${config.name}: SPACING`);
    }
  }

  private getBossMechanics(config: RoundConfig): BossMechanicProfile {
    return getBossMechanicProfile(config.mechanicProfileId);
  }

  private getActiveBossPhase(config: RoundConfig): BossPhaseDefinition | undefined {
    const mechanics = this.getBossMechanics(config);
    return mechanics.phases[this.activeBossPhaseIndex];
  }

  private updateBossPhase(now: number, config: RoundConfig): void {
    const mechanics = this.getBossMechanics(config);
    if (!mechanics.phases.length || this.enemyMaxHp <= 0 || this.enemyState === "defeated") return;

    const hpPercent = (this.enemyHp / this.enemyMaxHp) * 100;
    let nextPhaseIndex = -1;
    mechanics.phases.forEach((phase, index) => {
      if (hpPercent <= phase.hpPercentAtOrBelow) nextPhaseIndex = index;
    });

    if (nextPhaseIndex <= this.activeBossPhaseIndex) return;
    this.activeBossPhaseIndex = nextPhaseIndex;
    this.bossPhaseShown = nextPhaseIndex >= 0;
    const phase = mechanics.phases[nextPhaseIndex];
    this.enemy.setTint(phase.color);
    this.enemyCooldownUntil = Math.min(this.enemyCooldownUntil, now + 420);
    this.objectiveText.setText(phase.label);
    this.statusText.setText(phase.label);
    this.showImpact(this.enemy.x, this.enemy.y - this.enemy.displayHeight * 0.32, phase.color, true);
    this.showBossPhaseFx(phase);
    this.showFloatingText(phase.label, this.enemy.x, this.enemy.y - this.enemy.displayHeight * 0.68, phase.color === 0xffeb72 ? "#ffeb72" : "#ff9aaa");
    this.cameras.main.shake(170, 0.0046);
    this.time.delayedCall(210, () => {
      if (this.enemy.active && this.enemyState !== "defeated") this.enemy.clearTint();
    });
  }

  private beginEnemyWindup(now: number, config: RoundConfig): void {
    this.enemyAttack = this.pickEnemyAttack(config);
    const mechanics = this.getBossMechanics(config);
    const phase = this.getActiveBossPhase(config);
    const phaseFast = phase ? phase.cooldownMultiplier : 1;
    const windupBase = this.enemyAttack === "special" ? mechanics.special.windupMs : this.enemyAttack === "heavy" ? 680 : this.enemyAttack === "lunge" ? 500 : 360;
    const windupMs = Math.round(windupBase * phaseFast);
    this.enemyState = "windup";
    this.enemyWindupUntil = now + windupMs;
    this.enemy.setTint(this.enemyAttack === "heavy" || this.enemyAttack === "special" ? 0xff4866 : config.color);
    const label = this.getAttackDamageLabel(config);
    this.showEnemyWarning(label, this.enemyAttack === "special" ? mechanics.special.damageBonus > 7 ? 0xff4866 : config.color : config.color, windupMs, this.enemyAttack);
    this.statusText.setText(`${config.name}: ${label}`);
  }

  private shouldEnemyGuard(config: RoundConfig, distance: number): boolean {
    if (distance > config.attackRange * 0.82) return false;
    const mechanics = this.getBossMechanics(config);
    const phase = this.getActiveBossPhase(config);
    const roll = Phaser.Math.FloatBetween(0, 1);
    return roll < mechanics.guardChance + (phase?.guardChanceBonus ?? 0);
  }

  private beginEnemyGuard(now: number, config: RoundConfig): void {
    this.enemyState = "guard";
    this.enemyGuardUntil = now + (config.behavior === "rug" ? 420 : config.boss ? 380 : 300);
    this.enemyCooldownUntil = now + (config.behavior === "impulse" ? 620 : 740);
    this.enemy.setVelocityX(0);
    this.enemy.setTint(config.boss ? 0xff9aaa : 0x72ff57);
    this.showEnemyGuardFx(config.color);
    this.showFloatingText("GUARD", this.enemy.x, this.enemy.y - this.enemy.displayHeight * 0.7, "#72ff57");
    this.statusText.setText(`${config.name}: GUARD`);
  }

  private getBackstepSpeed(config: RoundConfig): number {
    const mechanics = this.getBossMechanics(config);
    const phase = this.getActiveBossPhase(config);
    return Math.round(mechanics.backstepSpeed * (phase?.speedMultiplier ?? 1));
  }

  private getBackstepDuration(config: RoundConfig): number {
    const mechanics = this.getBossMechanics(config);
    const phase = this.getActiveBossPhase(config);
    return Math.round(mechanics.backstepDurationMs * (phase?.cooldownMultiplier ?? 1));
  }

  private pickEnemyAttack(config: RoundConfig): EnemyAttack {
    const mechanics = this.getBossMechanics(config);
    const now = Date.now();
    if (now >= this.enemySpecialCooldownUntil && Phaser.Math.FloatBetween(0, 1) < this.getSpecialChance(config)) {
      return "special";
    }

    const total = mechanics.jabWeight + mechanics.lungeWeight + mechanics.heavyWeight;
    const attackRoll = Phaser.Math.FloatBetween(0, total);
    if (attackRoll < mechanics.jabWeight) return "jab";
    if (attackRoll < mechanics.jabWeight + mechanics.lungeWeight) return "lunge";
    return "heavy";
  }

  private getSpecialChance(config: RoundConfig): number {
    if (config.boss && this.activeBossPhaseIndex >= 1) return 0.42;
    if (config.boss && this.bossPhaseShown) return 0.34;
    if (config.behavior === "rug") return 0.2;
    if (config.behavior === "emotion") return 0.18;
    return 0.16;
  }

  private getJabAttackName(config: RoundConfig): string {
    if (config.behavior === "impulse") return "BUY RUSH";
    if (config.behavior === "emotion") return "PANIC TAP";
    if (config.behavior === "rug") return "FAKEOUT";
    return "WALLET JAB";
  }

  private getLungeAttackName(config: RoundConfig): string {
    if (config.behavior === "impulse") return "SPEND LUNGE";
    if (config.behavior === "emotion") return "FOMO LUNGE";
    if (config.behavior === "rug") return "RUG DASH";
    return "DESTROYER RUSH";
  }

  private getHeavyAttackName(config: RoundConfig): string {
    if (config.behavior === "impulse") return "CART SMASH";
    if (config.behavior === "emotion") return "PANIC SELL";
    if (config.behavior === "rug") return "RUG PULL";
    return this.bossPhaseShown ? "WALLET CRUSH" : "BOSS HEAVY";
  }

  private getRecoveryDelay(config: RoundConfig): number {
    const mechanics = this.getBossMechanics(config);
    const phase = this.getActiveBossPhase(config);
    return Math.round(mechanics.recoveryMs * (phase?.cooldownMultiplier ?? 1));
  }

  private performEnemyAttack(now: number, config: RoundConfig): void {
    this.enemyState = "attack";
    this.enemyAttackUntil = now + (this.enemyAttack === "special" ? 310 : 230);
    this.enemyCooldownUntil = now + this.getEnemyCooldown(config);
    const dir = this.player.x < this.enemy.x ? -1 : 1;
    const phase = this.getActiveBossPhase(config);
    const mechanics = this.getBossMechanics(config);
    const phaseDamage = phase?.damageBonus ?? 0;
    const special = this.enemyAttack === "special" ? mechanics.special : undefined;
    const damage = this.enemyAttack === "special"
      ? config.damage + (special?.damageBonus ?? 0) + phaseDamage
      : this.enemyAttack === "heavy"
        ? config.damage + 5 + phaseDamage
        : this.enemyAttack === "lunge"
          ? config.damage + 2 + phaseDamage
          : config.damage + phaseDamage;
    const range = this.enemyAttack === "special"
      ? config.attackRange + (special?.rangeBonus ?? 0)
      : this.enemyAttack === "heavy"
        ? config.attackRange + 20
        : this.enemyAttack === "lunge"
          ? config.attackRange + 42
          : config.attackRange;

    if (this.enemyAttack === "special") {
      this.enemySpecialCooldownUntil = now + mechanics.special.cooldownMs;
      const speed = mechanics.special.effect === "stun_dash" || mechanics.special.effect === "wallet_crush" ? 390 : 145;
      this.enemy.setVelocityX(dir * speed);
    } else if (this.enemyAttack === "lunge") {
      this.enemy.setVelocityX(dir * (config.behavior === "emotion" ? 380 : config.boss && this.bossPhaseShown ? 355 : 310));
    } else if (this.enemyAttack === "heavy") {
      this.enemy.setVelocityX(dir * (config.behavior === "rug" ? 170 : 120));
    } else {
      this.enemy.setVelocityX(dir * 116);
    }

    this.showEnemyAttackFx(this.enemyAttack === "special" ? mechanics.special.damageBonus > 7 ? 0xff4866 : config.color : config.color, this.enemyAttack);
    if (this.enemyAttack === "special") this.showBossSpecialFx(config, mechanics);

    this.time.delayedCall(this.enemyAttack === "special" ? 120 : 90, () => {
      if (this.runFinished || this.enemyState === "defeated") return;
      const distance = Math.abs(this.player.x - this.enemy.x);
      if (distance <= range) this.damagePlayer(damage, this.getAttackDamageLabel(config));
      if (this.enemyAttack === "special") this.applyBossSpecialEffect(config, mechanics, distance <= range);
    });
  }

  private getEnemyCooldown(config: RoundConfig): number {
    const mechanics = this.getBossMechanics(config);
    const phase = this.getActiveBossPhase(config);
    return Math.round(mechanics.cooldownMs * (phase?.cooldownMultiplier ?? 1));
  }

  private getAttackDamageLabel(config: RoundConfig): string {
    if (this.enemyAttack === "special") return this.getBossMechanics(config).special.name;
    if (this.enemyAttack === "heavy") return this.getHeavyAttackName(config);
    if (this.enemyAttack === "lunge") return this.getLungeAttackName(config);
    return this.getJabAttackName(config);
  }

  private applyBossSpecialEffect(config: RoundConfig, mechanics: BossMechanicProfile, hitPlayer: boolean): void {
    const effect = mechanics.special.effect;
    if (!hitPlayer && effect !== "hazard_zone" && effect !== "summon_pressure") return;

    if (mechanics.special.energyDrain && hitPlayer) {
      const before = this.playerEnergy;
      this.playerEnergy = Phaser.Math.Clamp(this.playerEnergy - mechanics.special.energyDrain, 0, MAX_ENERGY);
      const drained = before - this.playerEnergy;
      if (drained > 0) this.showFloatingText(`-${drained} ENERGY`, this.player.x, this.player.y - 136, "#ffeb72");
    }

    if (effect === "risk_burst" && hitPlayer) {
      const burst = Phaser.Math.Between(2, 7);
      this.playerHp = Math.max(0, this.playerHp - burst);
      this.showFloatingText(`RISK -${burst} HP`, this.player.x + 4, this.player.y - 124, "#ff9aaa");
      this.cameras.main.shake(80, 0.0032);
    }

    if (effect === "guard_break" && hitPlayer && Date.now() < this.playerBlockUntil) {
      this.playerBlockUntil = 0;
      this.playerInvincibleUntil = Math.max(this.playerInvincibleUntil, Date.now() + 120);
      this.showFloatingText("GUARD BROKEN", this.player.x, this.player.y - 144, "#ff4866");
      this.cameras.main.flash(52, 255, 72, 102, false);
    }

    if (effect === "hazard_zone" || effect === "summon_pressure") {
      this.spawnBossPressureZone(config, effect === "summon_pressure");
    }

    if (effect === "wallet_crush" && hitPlayer) {
      this.ultimateActiveUntil = Math.min(this.ultimateActiveUntil, Date.now() + 900);
      this.statusText.setText("WALLET CRUSHED");
    }
  }

  private spawnBossPressureZone(config: RoundConfig, summonPressure: boolean): void {
    const x = Phaser.Math.Clamp(this.player.x, LEFT_BOUND + 58, RIGHT_BOUND - 58);
    const y = FLOOR_Y - 20;
    const color = summonPressure ? 0xffeb72 : 0xff4866;
    const radius = summonPressure ? 48 : 58;
    const zone = this.add.circle(x, y, radius, color, 0.08)
      .setStrokeStyle(4, color, 0.72)
      .setDepth(38);
    const label = this.add.text(x, y - 50, summonPressure ? "PRESSURE" : "LEAK ZONE", {
      fontFamily: "Arial", fontSize: "13px", color: summonPressure ? "#ffeb72" : "#ff9aaa", fontStyle: "bold", stroke: "#041004", strokeThickness: 4,
    }).setOrigin(0.5).setDepth(91);

    this.time.delayedCall(720, () => {
      if (!zone.active || this.runFinished) return;
      const distance = Math.abs(this.player.x - x);
      if (distance <= radius + 18) {
        const damage = summonPressure ? 5 : 8;
        this.playerHp = Math.max(0, this.playerHp - damage);
        this.showFloatingText(`ZONE -${damage} HP`, this.player.x, this.player.y - 116, summonPressure ? "#ffeb72" : "#ff9aaa");
        this.cameras.main.shake(60, 0.0028);
        if (this.playerHp <= 0) this.finishRun(false);
      }
    });

    this.tweens.add({
      targets: [zone, label],
      alpha: 0,
      delay: 920,
      duration: 360,
      onComplete: () => {
        zone.destroy();
        label.destroy();
      },
    });
  }

  private getStageMoveMultiplier(): number {
    if (this.selectedStage.modifier !== "slow_zones") return 1;
    const inSlowZone = Math.abs(this.player.x - this.stageSlowZoneX) <= 82;
    return inSlowZone ? 0.62 : 1;
  }

  private updateStageSystem(now: number, _delta: number): void {
    if (!this.selectedStage || this.runFinished || this.enemyState === "defeated") return;

    if (this.selectedStage.modifier === "slow_zones") {
      if (Math.abs(this.player.x - this.stageSlowZoneX) <= 82 && now >= this.nextStageTickAt) {
        this.nextStageTickAt = now + 800;
        this.statusText.setText("SLOW ZONE");
        this.showFloatingText("SLOW", this.player.x, this.player.y - 126, "#4de8ff");
      }
      return;
    }

    if (this.selectedStage.modifier === "leak_zones") {
      if (Math.abs(this.player.x - this.stageLeakZoneX) <= 86 && now >= this.nextStageTickAt) {
        this.nextStageTickAt = now + 900;
        this.playerEnergy = Phaser.Math.Clamp(this.playerEnergy - 6, 0, MAX_ENERGY);
        this.applyStageDamage(this.selectedStage.hazardDamage, "LEAK ZONE", "#ffeb72");
      }
      return;
    }

    if (this.selectedStage.modifier === "neutral") return;
    if (now < this.nextStageHazardAt) return;

    const interval = Math.max(3200, this.selectedStage.hazardIntervalMs || 4200);
    this.nextStageHazardAt = now + interval;

    if (this.selectedStage.modifier === "risk_zones") {
      this.spawnStageRiskZone();
      return;
    }
    if (this.selectedStage.modifier === "impulse_traps") {
      this.spawnStageImpulseTrap();
      return;
    }
    if (this.selectedStage.modifier === "volatility_waves") {
      this.spawnStageVolatilityWave();
      return;
    }
    if (this.selectedStage.modifier === "boss_arena") {
      this.spawnBossPressureZone(this.getRound(this.roundIndex), true);
    }
  }

  private createPersistentSlowZone(): void {
    this.stageSlowZoneX = GAME_WIDTH / 2 + 56;
    const zone = this.add.ellipse(this.stageSlowZoneX, FLOOR_Y - 12, 172, 34, this.selectedStage.color, 0.06)
      .setStrokeStyle(3, this.selectedStage.color, 0.42)
      .setDepth(7);
    this.add.text(this.stageSlowZoneX, FLOOR_Y - 42, "SLOW ZONE", {
      fontFamily: "Arial", fontSize: "11px", color: this.selectedStage.uiColor, fontStyle: "bold", stroke: "#041004", strokeThickness: 4,
    }).setOrigin(0.5).setDepth(8);
    this.tweens.add({ targets: zone, scaleX: 1.08, alpha: 0.11, duration: 950, yoyo: true, repeat: -1 });
  }

  private createPersistentLeakZone(): void {
    this.stageLeakZoneX = GAME_WIDTH / 2 - 24;
    const zone = this.add.ellipse(this.stageLeakZoneX, FLOOR_Y - 12, 188, 38, this.selectedStage.color, 0.07)
      .setStrokeStyle(3, this.selectedStage.color, 0.48)
      .setDepth(7);
    this.add.text(this.stageLeakZoneX, FLOOR_Y - 44, "LEAK DRAIN", {
      fontFamily: "Arial", fontSize: "11px", color: this.selectedStage.uiColor, fontStyle: "bold", stroke: "#041004", strokeThickness: 4,
    }).setOrigin(0.5).setDepth(8);
    this.tweens.add({ targets: zone, scaleX: 1.08, alpha: 0.12, duration: 780, yoyo: true, repeat: -1 });
  }

  private spawnStageRiskZone(): void {
    const x = Phaser.Math.Between(Math.round(LEFT_BOUND + 60), Math.round(RIGHT_BOUND - 60));
    const radius = 54;
    const warning = this.add.circle(x, FLOOR_Y - 20, radius, this.selectedStage.color, 0.07)
      .setStrokeStyle(4, this.selectedStage.color, 0.76)
      .setDepth(39);
    const label = this.add.text(x, FLOOR_Y - 76, "RISK ZONE", {
      fontFamily: "Arial", fontSize: "13px", color: this.selectedStage.uiColor, fontStyle: "bold", stroke: "#041004", strokeThickness: 4,
    }).setOrigin(0.5).setDepth(91);
    this.statusText.setText("STAGE HAZARD: RISK ZONE");
    this.tweens.add({ targets: warning, scaleX: 1.15, scaleY: 1.15, alpha: 0.16, duration: 340, yoyo: true, repeat: 2 });

    this.time.delayedCall(920, () => {
      if (this.runFinished || !warning.active) return;
      this.showImpact(x, FLOOR_Y - 34, this.selectedStage.color, true);
      if (Math.abs(this.player.x - x) <= radius + 24) {
        this.applyStageDamage(this.selectedStage.hazardDamage, "RISK", this.selectedStage.uiColor);
      }
    });

    this.tweens.add({
      targets: [warning, label],
      alpha: 0,
      delay: 1200,
      duration: 360,
      onComplete: () => {
        warning.destroy();
        label.destroy();
      },
    });
  }

  private spawnStageImpulseTrap(): void {
    const x = Phaser.Math.Between(Math.round(LEFT_BOUND + 80), Math.round(RIGHT_BOUND - 80));
    const trap = this.add.rectangle(x, FLOOR_Y - 10, 118, 14, this.selectedStage.color, 0.12)
      .setStrokeStyle(3, this.selectedStage.color, 0.76)
      .setDepth(39);
    const label = this.add.text(x, FLOOR_Y - 44, "IMPULSE TRAP", {
      fontFamily: "Arial", fontSize: "12px", color: this.selectedStage.uiColor, fontStyle: "bold", stroke: "#041004", strokeThickness: 4,
    }).setOrigin(0.5).setDepth(91);
    this.statusText.setText("STAGE HAZARD: IMPULSE TRAP");

    this.time.delayedCall(760, () => {
      if (this.runFinished || !trap.active) return;
      trap.setFillStyle(this.selectedStage.color, 0.28);
      this.showImpact(x, FLOOR_Y - 30, this.selectedStage.color, false);
      if (Math.abs(this.player.x - x) <= 74) {
        this.player.setVelocityX(this.player.x < x ? -180 : 180);
        this.applyStageDamage(this.selectedStage.hazardDamage, "TRAP", this.selectedStage.uiColor);
      }
    });

    this.tweens.add({
      targets: [trap, label],
      alpha: 0,
      delay: 1180,
      duration: 320,
      onComplete: () => {
        trap.destroy();
        label.destroy();
      },
    });
  }

  private spawnStageVolatilityWave(): void {
    const dir = this.stageWaveDirection;
    this.stageWaveDirection *= -1;
    const startX = dir > 0 ? LEFT_BOUND - 40 : RIGHT_BOUND + 40;
    const endX = dir > 0 ? RIGHT_BOUND + 40 : LEFT_BOUND - 40;
    const wave = this.add.rectangle(startX, FLOOR_Y - 62, 18, 132, this.selectedStage.color, 0.15)
      .setStrokeStyle(3, this.selectedStage.color, 0.72)
      .setDepth(40);
    const label = this.add.text(GAME_WIDTH / 2, FLOOR_Y - 142, "VOLATILITY WAVE", {
      fontFamily: "Arial", fontSize: "13px", color: this.selectedStage.uiColor, fontStyle: "bold", stroke: "#041004", strokeThickness: 4,
    }).setOrigin(0.5).setDepth(91);
    this.statusText.setText("STAGE HAZARD: VOLATILITY WAVE");

    this.tweens.add({ targets: wave, x: endX, duration: 1180, ease: "Sine.easeInOut" });
    [360, 620, 880].forEach((delay) => {
      this.time.delayedCall(delay, () => {
        if (this.runFinished || !wave.active) return;
        if (Math.abs(this.player.x - wave.x) <= 34) {
          this.applyStageDamage(this.selectedStage.hazardDamage, "VOLATILITY", this.selectedStage.uiColor);
        }
      });
    });

    this.tweens.add({
      targets: [wave, label],
      alpha: 0,
      delay: 1250,
      duration: 260,
      onComplete: () => {
        wave.destroy();
        label.destroy();
      },
    });
  }

  private applyStageDamage(amount: number, label: string, color: string): void {
    if (amount <= 0 || this.runFinished) return;
    this.playerHp = Math.max(0, this.playerHp - amount);
    this.damageTaken += amount;
    this.showFloatingText(`${label} -${amount} HP`, this.player.x, this.player.y - 122, color);
    this.statusText.setText(label);
    this.cameras.main.shake(56, 0.0026);
    if (this.playerHp <= 0) this.finishRun(false);
  }

  private damagePlayer(amount: number, label: string): void {
    const now = Date.now();
    if (now < this.playerInvincibleUntil) {
      this.dodgesCount += 1;
      this.showFloatingText("DODGE", this.player.x, this.player.y - 92, "#d9a7ff");
      this.addEnergy(7);
      return;
    }

    if (now < this.playerBlockUntil) {
      const guardBreak = label === this.getBossMechanics(this.getRound(this.roundIndex)).special.name && this.getBossMechanics(this.getRound(this.roundIndex)).special.effect === "guard_break";
      const blockMultiplier = guardBreak ? 0.72 : this.isUltimateActive(now) ? Math.min(0.1, this.blockDamageTakenMultiplier * 0.55) : this.blockDamageTakenMultiplier;
      const blocked = Math.max(1, Math.floor(amount * blockMultiplier));
      this.blocksCount += 1;
      this.damageTaken += blocked;
      this.playerHp = Math.max(0, this.playerHp - blocked);
      this.sfx.playBlock();
      this.showBlockFx();
      this.showFloatingText(guardBreak ? "GUARD CRACK" : "BLOCK", this.player.x, this.player.y - 100, guardBreak ? "#ffeb72" : "#72ff57");
      this.statusText.setText(guardBreak ? "GUARD CRACK" : "BLOCK");
      this.cameras.main.shake(48, 0.0018);
      this.playerInvincibleUntil = now + 190;
      this.addEnergy(10, "block");
      return;
    }

    const finalAmount = this.isUltimateActive(now) ? Math.max(1, Math.floor(amount * 0.55)) : amount;
    this.damageTaken += finalAmount;
    this.playerHp = Math.max(0, this.playerHp - finalAmount);
    this.playerState = "hurt";
    this.playerActionUntil = now + 220;
    this.playerInvincibleUntil = now + 360;
    this.player.setVelocityX(-210);
    this.player.setTint(0xff4866);
    this.playPlayerAnim("mascot-hurt-anim");
    this.sfx.playHit(finalAmount >= 12);
    this.cameras.main.flash(70, 255, 72, 102, false);
    this.cameras.main.shake(95, 0.004);
    this.showImpact(this.player.x + 24, this.player.y - 18, 0xff4866, finalAmount >= 12);
    this.showFloatingText(`-${finalAmount} HP`, this.player.x, this.player.y - 108, "#ff9aaa");
    this.addEnergy(5);
    this.statusText.setText(label);

    this.time.delayedCall(220, () => {
      if (!this.player.active) return;
      this.player.setTint(this.selectedSkin.tintColor);
    });

    if (this.playerHp <= 0) this.finishRun(false);
  }

  private defeatEnemy(): void {
    const config = this.getRound(this.roundIndex);
    this.enemyState = "defeated";
    this.enemy.setVelocity(0, 0);
    this.enemy.setTint(0xffffff);
    this.defeatedLeaks += 1;
    if (!this.defeatedBossIds.includes(config.id)) this.defeatedBossIds.push(config.id);
    this.score += config.boss ? 1500 : 700;
    this.addEnergy(config.boss ? 24 : 16, "round");
    this.showImpact(this.enemy.x, this.enemy.y - 42, config.boss ? 0xffeb72 : 0x72ff57, true);
    this.showFloatingText(config.defeatLine, this.enemy.x, this.enemy.y - 130, "#72ff57");
    this.showRoundClear(config);
    this.cameras.main.shake(180, 0.0045);
    this.enemy.setAlpha(0.62);

    if (this.roundIndex >= this.activeRounds.length - 1) {
      this.time.delayedCall(1350, () => this.finishRun(true));
      return;
    }

    this.playerHp = Math.min(this.playerMaxHp, this.playerHp + 14);
    this.time.delayedCall(1550, () => {
      this.enemy.setAlpha(1);
      this.startRound(this.roundIndex + 1);
    });
  }

  private showRoundClear(config: RoundConfig): void {
    const nextText = this.roundIndex >= this.activeRounds.length - 1 ? "FINAL LEAK BROKEN" : "NEXT LEAK INCOMING";
    const panel = this.add.rectangle(GAME_WIDTH / 2, 128, 410, 70, 0x061006, 0.78)
      .setStrokeStyle(2, config.color, 0.48)
      .setDepth(122);
    const title = this.add.text(GAME_WIDTH / 2, 112, config.defeatLine, {
      fontFamily: "Arial", fontSize: "18px", color: "#72ff57", fontStyle: "bold", stroke: "#041004", strokeThickness: 5,
    }).setOrigin(0.5).setDepth(123);
    const sub = this.add.text(GAME_WIDTH / 2, 140, nextText, {
      fontFamily: "Arial", fontSize: "12px", color: "#fcfff7", fontStyle: "bold", stroke: "#041004", strokeThickness: 4,
    }).setOrigin(0.5).setDepth(123);

    this.tweens.add({
      targets: [panel, title, sub],
      y: "-=20",
      alpha: 0,
      delay: 840,
      duration: 360,
      onComplete: () => {
        panel.destroy();
        title.destroy();
        sub.destroy();
      },
    });
  }

  private finishRun(victory: boolean): void {
    if (this.runFinished) return;
    this.runFinished = true;
    this.fightStarted = false;
    this.player.setVelocity(0, 0);
    this.enemy.setVelocity(0, 0);

    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 28, victory ? "WALLET PROTECTED" : "WALLET HIT", {
      fontFamily: "Arial", fontSize: "42px", color: victory ? "#72ff57" : "#ff4866", fontStyle: "bold", stroke: "#041004", strokeThickness: 8,
    }).setOrigin(0.5).setDepth(140);
    this.tweens.add({ targets: title, scaleX: 1.04, scaleY: 1.04, duration: 360, yoyo: true, repeat: 1 });

    const result: RunResult = {
      score: this.score,
      leaksDefeated: this.defeatedLeaks,
      survivedSeconds: Math.floor(this.activeElapsedMs / 1000),
      safePoints: victory ? 100 : 0,
      bossDamage: victory ? 999 : Math.max(0, this.getRound(this.roundIndex).hp - this.enemyHp),
      upgradesChosen: 0,
      pickupsCollected: 0,
      bossesBroken: this.defeatedBossIds.length,
      selectedBossId: this.selectedBossId,
      selectedCampaignId: this.selectedCampaignId,
      defeatedBossIds: [...this.defeatedBossIds],
      blocks: this.blocksCount,
      dodges: this.dodgesCount,
      skillsUsed: this.skillsUsedCount,
      ultimatesUsed: this.ultimatesUsedCount,
      damageTaken: this.damageTaken,
      usedUltimate: this.ultimatesUsedCount > 0,
      victory,
    };

    this.time.delayedCall(1350, () => this.scene.start(SCENE_KEYS.result, result));
  }

  private clampFighters(): void {
    this.player.x = Phaser.Math.Clamp(this.player.x, LEFT_BOUND, RIGHT_BOUND);
    this.enemy.x = Phaser.Math.Clamp(this.enemy.x, LEFT_BOUND, RIGHT_BOUND);
    this.player.y = FLOOR_Y - this.player.displayHeight * 0.5;
    this.enemy.y = FLOOR_Y - this.enemy.displayHeight * 0.5;
  }

  private updateHud(): void {
    if (!this.playerHpFill || !this.enemyHpFill) return;
    this.playerHpFill.width = 226 * Phaser.Math.Clamp(this.playerHp / this.playerMaxHp, 0, 1);
    this.enemyHpFill.width = 226 * Phaser.Math.Clamp(this.enemyHp / Math.max(1, this.enemyMaxHp), 0, 1);
    this.playerHpText.setText(`${Math.max(0, this.playerHp)}/${this.playerMaxHp}`);
    this.playerEnergyFill.width = 226 * Phaser.Math.Clamp(this.playerEnergy / MAX_ENERGY, 0, 1);
    const energyLabel = this.playerEnergy >= MAX_ENERGY ? "ULT READY" : `ENERGY ${Math.floor(this.playerEnergy)}`;
    this.playerEnergyText.setText(energyLabel);
    this.playerEnergyText.setColor(this.playerEnergy >= MAX_ENERGY ? "#72ff57" : "#ffeb72");
    const config = this.getRound(this.roundIndex) ?? this.getRound(0);
    if (this.enemyHp > 0) {
      const enemyPercent = Math.ceil((this.enemyHp / Math.max(1, this.enemyMaxHp)) * 100);
      this.enemyHpText.setText(`${config.name.toUpperCase()} · ${enemyPercent}%`);
    }

    if (this.skillStatusText) {
      const now = Date.now();
      const s1 = now >= this.skill1CooldownUntil ? "READY" : `${Math.ceil((this.skill1CooldownUntil - now) / 1000)}s`;
      const s2 = now >= this.skill2CooldownUntil ? "READY" : `${Math.ceil((this.skill2CooldownUntil - now) / 1000)}s`;
      const skillEnergy = `E ${Math.floor(this.playerEnergy)}`;
      this.skillStatusText.setText(`S1 ${this.skill1.name}: ${s1}   ·   S2 ${this.skill2.name}: ${s2}   ·   ${skillEnergy}`);
    }

    if (this.ultimateStatusText) {
      const now = Date.now();
      if (this.isUltimateActive(now)) {
        this.ultimateStatusText.setText(`ULTIMATE ACTIVE ${Math.ceil((this.ultimateActiveUntil - now) / 1000)}s`);
        this.ultimateStatusText.setColor("#72ff57");
      } else if (this.playerEnergy >= MAX_ENERGY) {
        this.ultimateStatusText.setText(`ULT READY · ${this.ultimateSkill.name.toUpperCase()}`);
        this.ultimateStatusText.setColor("#ffeb72");
      } else {
        this.ultimateStatusText.setText(`ULT ${Math.floor(this.playerEnergy)}/${MAX_ENERGY}`);
        this.ultimateStatusText.setColor("#fcfff7");
      }
    }
  }

  private updateShadows(): void {
    if (!this.playerShadow || !this.enemyShadow || !this.player || !this.enemy) return;
    const config = this.getRound(this.roundIndex) ?? this.getRound(0);
    this.playerShadow.setPosition(this.player.x, FLOOR_Y - 2);
    this.playerShadow.setDisplaySize(PLAYER_DISPLAY_W * 0.84, 18);
    this.enemyShadow.setPosition(this.enemy.x, FLOOR_Y - 2);
    this.enemyShadow.setDisplaySize(Math.max(62, config.displayW * 0.62), config.boss ? 28 : 20);
    this.enemyShadow.setAlpha(config.boss ? 0.3 : 0.24);
  }

  private updateCharacterPresentation(): void {
    const time = this.time.now;
    const breathe = Math.sin(time / 180) * 0.012;

    let playerTargetScaleX = 1.02;
    let playerTargetScaleY = 1.02;
    let playerTargetAngle = -1.5;
    let auraOuterAlpha = 0.08;
    let auraInnerAlpha = 0.05;

    const ultimateActive = this.isUltimateActive();
    if (ultimateActive) {
      auraOuterAlpha = 0.18;
      auraInnerAlpha = 0.1;
    }

    switch (this.playerState) {
      case "moving":
        playerTargetScaleX = 1.05;
        playerTargetScaleY = 0.98;
        playerTargetAngle = -4;
        auraOuterAlpha = 0.09;
        break;
      case "punch":
        playerTargetScaleX = 1.14;
        playerTargetScaleY = 0.94;
        playerTargetAngle = -9;
        auraOuterAlpha = 0.12;
        auraInnerAlpha = 0.08;
        break;
      case "kick":
        playerTargetScaleX = 1.18;
        playerTargetScaleY = 0.9;
        playerTargetAngle = -13;
        auraOuterAlpha = 0.13;
        auraInnerAlpha = 0.09;
        break;
      case "block":
        playerTargetScaleX = 1.08;
        playerTargetScaleY = 0.96;
        playerTargetAngle = -6;
        auraOuterAlpha = 0.11;
        auraInnerAlpha = 0.075;
        break;
      case "dash":
        playerTargetScaleX = 1.16;
        playerTargetScaleY = 0.88;
        playerTargetAngle = -10;
        auraOuterAlpha = 0.15;
        auraInnerAlpha = 0.08;
        break;
      case "hurt":
        playerTargetScaleX = 0.95;
        playerTargetScaleY = 1.06;
        playerTargetAngle = 8;
        auraOuterAlpha = 0.07;
        auraInnerAlpha = 0.04;
        break;
      default:
        playerTargetScaleX += breathe;
        playerTargetScaleY -= breathe;
        break;
    }

    if (ultimateActive) {
      playerTargetScaleX *= 1.02;
      playerTargetScaleY *= 1.02;
      auraOuterAlpha = Math.max(auraOuterAlpha, 0.18);
      auraInnerAlpha = Math.max(auraInnerAlpha, 0.1);
    }

    const currentPlayerW = Phaser.Math.Linear(this.player.displayWidth, PLAYER_DISPLAY_W * playerTargetScaleX, 0.22);
    const currentPlayerH = Phaser.Math.Linear(this.player.displayHeight, PLAYER_DISPLAY_H * playerTargetScaleY, 0.22);
    this.player.setDisplaySize(currentPlayerW, currentPlayerH);
    this.player.angle = Phaser.Math.Linear(this.player.angle, playerTargetAngle, 0.22);

    this.playerAuraOuter.setPosition(this.player.x - 10, this.player.y - 6);
    this.playerAuraInner.setPosition(this.player.x - 5, this.player.y - 4);
    this.playerAuraOuter.setDisplaySize(currentPlayerW * 0.96, currentPlayerH * 0.98);
    this.playerAuraInner.setDisplaySize(currentPlayerW * 0.64, currentPlayerH * 0.76);
    this.playerAuraOuter.setAlpha(Phaser.Math.Linear(this.playerAuraOuter.alpha, auraOuterAlpha, 0.18));
    this.playerAuraInner.setAlpha(Phaser.Math.Linear(this.playerAuraInner.alpha, auraInnerAlpha, 0.18));

    const config = this.getRound(this.roundIndex) ?? this.getRound(0);
    const enemyPulse = 1 + Math.sin(time / 220) * 0.01;
    const enemyTargetScaleX = this.enemyState === "attack" ? 1.055 : this.enemyState === "windup" ? 1.035 : this.enemyState === "guard" ? 1.02 : this.enemyState === "backstep" ? 0.98 : this.enemyState === "hurt" ? 0.965 : enemyPulse;
    const enemyTargetScaleY = this.enemyState === "attack" ? 0.97 : this.enemyState === "windup" ? 1.018 : this.enemyState === "guard" ? 1.025 : this.enemyState === "backstep" ? 1.008 : this.enemyState === "hurt" ? 1.025 : enemyPulse;
    const enemyTargetAngle = this.enemyState === "attack" ? 5 : this.enemyState === "windup" ? -3 : this.enemyState === "guard" ? -5 : this.enemyState === "backstep" ? 4 : this.enemyState === "hurt" ? 6 : 0;
    const currentEnemyW = Phaser.Math.Linear(this.enemy.displayWidth, config.displayW * enemyTargetScaleX, 0.16);
    const currentEnemyH = Phaser.Math.Linear(this.enemy.displayHeight, config.displayH * enemyTargetScaleY, 0.16);
    this.enemy.setDisplaySize(currentEnemyW, currentEnemyH);
    this.enemy.angle = Phaser.Math.Linear(this.enemy.angle, enemyTargetAngle, 0.16);
    this.enemyAura.setPosition(this.enemy.x + 8, this.enemy.y - 4);
    this.enemyAura.setDisplaySize(Math.max(104, currentEnemyW * 0.68), Math.max(112, currentEnemyH * 0.78));
    const enemyAuraAlpha = this.enemyState === "windup" ? 0.08 : this.enemyState === "attack" ? 0.09 : this.enemyState === "guard" ? 0.075 : 0.05;
    this.enemyAura.setAlpha(Phaser.Math.Linear(this.enemyAura.alpha, enemyAuraAlpha, 0.16));
  }

  private spawnDashAfterimage(dir: number): void {
    for (let i = 0; i < 3; i += 1) {
      const ghost = this.add.image(this.player.x - dir * (i * 16), this.player.y, this.player.texture.key)
        .setDepth(20 - i)
        .setDisplaySize(PLAYER_DISPLAY_W, PLAYER_DISPLAY_H)
        .setAlpha(0.18 - i * 0.04)
        .setTint(this.selectedSkin.auraColor)
        .setFlipX(this.player.flipX);
      this.tweens.add({
        targets: ghost,
        x: ghost.x - dir * 20,
        alpha: 0,
        duration: 150 + i * 30,
        onComplete: () => ghost.destroy(),
      });
    }
  }

  private getRound(index: number): RoundConfig {
    return this.activeRounds[index] ?? this.activeRounds[0] ?? FALLBACK_ROUNDS[0];
  }

  private setBody(sprite: Phaser.Physics.Arcade.Sprite, width: number, height: number, offsetY = 0): void {
    const body = sprite.body as Phaser.Physics.Arcade.Body | null;
    if (!body) return;
    body.setSize(width, height, true);
    body.setOffset((sprite.width - width) / 2, (sprite.height - height) / 2 + offsetY);
  }

  private playPlayerAnim(key: string): void {
    if (this.anims.exists(key)) this.player.play(key, true);
  }

  private showSkillCastFx(skill: SkillDefinition, x: number, y: number, heavy = false): void {
    const ring = this.add.circle(x, y, heavy ? 28 : 20, skill.color, 0.11)
      .setStrokeStyle(heavy ? 6 : 4, skill.color, 0.86)
      .setDepth(49);
    const core = this.add.circle(x, y, heavy ? 9 : 6, 0xfcfff7, 0.72).setDepth(50);
    const label = this.add.text(x, y - 44, skill.name.toUpperCase(), {
      fontFamily: "Arial",
      fontSize: skill.name.length > 16 ? "12px" : "14px",
      color: skill.uiColor,
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 5,
    }).setOrigin(0.5).setDepth(92);
    this.tweens.add({ targets: ring, radius: heavy ? 82 : 58, alpha: 0, duration: heavy ? 330 : 240, onComplete: () => ring.destroy() });
    this.tweens.add({ targets: core, alpha: 0, scaleX: 2.6, scaleY: 2.6, duration: 180, onComplete: () => core.destroy() });
    this.tweens.add({ targets: label, y: label.y - 24, alpha: 0, duration: 620, onComplete: () => label.destroy() });
  }

  private showPunchFx(combo: number): void {
    const heavy = combo === 3;
    const x = this.player.x + (heavy ? 108 : 86);
    const y = this.player.y - (heavy ? 38 : 30);
    const slash = this.add.image(x, y, "arena-vfx-sheet", heavy ? 2 : 1)
      .setScale(heavy ? 0.42 : 0.31)
      .setRotation(heavy ? 0.08 : -0.1)
      .setAlpha(0.98)
      .setDepth(42);
    const line = this.add.line(0, 0, this.player.x + 32, this.player.y - 42, x + (heavy ? 64 : 48), y, heavy ? 0xffeb72 : 0x72ff57, heavy ? 0.94 : 0.82)
      .setOrigin(0, 0)
      .setLineWidth(heavy ? 8 : 5)
      .setDepth(43);
    const spark = this.add.circle(x + (heavy ? 54 : 38), y, heavy ? 10 : 6, 0xfcfff7, heavy ? 0.62 : 0.48)
      .setDepth(44);
    this.tweens.add({
      targets: [slash, line, spark],
      alpha: 0,
      scaleX: slash.scaleX * 1.18,
      scaleY: slash.scaleY * 1.18,
      duration: heavy ? 185 : 145,
      onComplete: () => {
        slash.destroy();
        line.destroy();
        spark.destroy();
      },
    });
  }

  private showKickFx(): void {
    const x = this.player.x + 122;
    const y = this.player.y - 24;
    const arc = this.add.image(x, y, "arena-vfx-sheet", 5)
      .setScale(0.5)
      .setAlpha(0.95)
      .setTint(0xffeb72)
      .setDepth(42);
    const trail = this.add.line(0, 0, this.player.x + 30, this.player.y - 14, x + 78, y - 10, 0xffeb72, 0.9)
      .setOrigin(0, 0)
      .setLineWidth(9)
      .setDepth(43);
    const shock = this.add.circle(x + 66, y - 2, 11, 0xfcfff7, 0.52)
      .setStrokeStyle(3, 0xffeb72, 0.74)
      .setDepth(44);
    this.tweens.add({
      targets: [arc, trail, shock],
      alpha: 0,
      duration: 240,
      onComplete: () => {
        arc.destroy();
        trail.destroy();
        shock.destroy();
      },
    });
  }

  private showEnemyAttackFx(color: number, attack: EnemyAttack): void {
    const dir = this.player.x < this.enemy.x ? -1 : 1;
    const heavy = attack === "heavy" || attack === "special";
    const x = this.enemy.x + dir * (heavy ? 92 : 74);
    const y = this.enemy.y - this.enemy.displayHeight * 0.28;
    const arc = this.add.image(x, y, "arena-vfx-sheet", heavy ? 2 : 4)
      .setScale(heavy ? 0.34 : 0.26)
      .setFlipX(dir < 0)
      .setTint(heavy ? 0xff4866 : color)
      .setAlpha(0.94)
      .setDepth(42);
    const danger = this.add.line(0, 0, this.enemy.x + dir * 18, this.enemy.y - 34, this.enemy.x + dir * (heavy ? 138 : 112), this.enemy.y - 30, heavy ? 0xff4866 : color, heavy ? 0.86 : 0.68)
      .setOrigin(0, 0)
      .setLineWidth(heavy ? 8 : 5)
      .setDepth(43);
    this.tweens.add({ targets: [arc, danger], alpha: 0, duration: heavy ? 220 : 170, onComplete: () => { arc.destroy(); danger.destroy(); } });
  }

  private showEnemyGuardFx(color: number): void {
    const shield = this.add.circle(this.enemy.x - 40, this.enemy.y - this.enemy.displayHeight * 0.3, 28, color, 0.05)
      .setStrokeStyle(5, color, 0.82)
      .setDepth(49);
    const guardLine = this.add.line(0, 0, this.enemy.x - 72, this.enemy.y - this.enemy.displayHeight * 0.3, this.enemy.x - 10, this.enemy.y - this.enemy.displayHeight * 0.3, color, 0.78)
      .setOrigin(0, 0)
      .setLineWidth(6)
      .setDepth(50);
    this.tweens.add({ targets: shield, radius: 48, alpha: 0, duration: 260, onComplete: () => shield.destroy() });
    this.tweens.add({ targets: guardLine, alpha: 0, duration: 210, onComplete: () => guardLine.destroy() });
  }

  private showBossSpecialFx(config: RoundConfig, mechanics: BossMechanicProfile): void {
    const color = mechanics.special.effect === "wallet_crush" || mechanics.special.effect === "guard_break" ? 0xff4866 : config.color;
    const dir = this.player.x < this.enemy.x ? -1 : 1;
    const originX = this.enemy.x + dir * 36;
    const originY = this.enemy.y - this.enemy.displayHeight * 0.32;
    const beam = this.add.line(0, 0, originX, originY, this.player.x, this.player.y - 40, color, 0.46)
      .setOrigin(0, 0)
      .setLineWidth(12)
      .setDepth(47);
    const ring = this.add.circle(originX, originY, 18, color, 0.08)
      .setStrokeStyle(5, color, 0.84)
      .setDepth(48);
    const label = this.add.text(originX, originY - 54, mechanics.special.name, {
      fontFamily: "Arial", fontSize: mechanics.special.name.length > 12 ? "12px" : "15px", color: "#fcfff7", fontStyle: "bold", stroke: "#041004", strokeThickness: 5,
    }).setOrigin(0.5).setDepth(92);
    this.tweens.add({ targets: beam, alpha: 0, duration: 230, onComplete: () => beam.destroy() });
    this.tweens.add({ targets: ring, radius: 72, alpha: 0, duration: 330, onComplete: () => ring.destroy() });
    this.tweens.add({ targets: label, y: label.y - 24, alpha: 0, duration: 620, onComplete: () => label.destroy() });
  }

  private showBossPhaseFx(phase?: BossPhaseDefinition): void {
    const phaseColor = phase?.color ?? 0xff4866;
    const phaseLabel = phase?.label ?? "BOSS ENRAGED";
    const ring = this.add.circle(this.enemy.x, FLOOR_Y - 86, 62, phaseColor, 0.05)
      .setStrokeStyle(7, phaseColor, 0.76)
      .setDepth(47);
    const pulse = this.add.circle(this.enemy.x, FLOOR_Y - 86, 28, 0xffeb72, 0.08)
      .setStrokeStyle(4, 0xffeb72, 0.58)
      .setDepth(48);
    const warning = this.add.text(this.enemy.x, FLOOR_Y - 188, phaseLabel, {
      fontFamily: "Arial", fontSize: "24px", color: "#ff9aaa", fontStyle: "bold", stroke: "#041004", strokeThickness: 7,
    }).setOrigin(0.5).setDepth(92);
    this.tweens.add({ targets: ring, radius: 156, alpha: 0, duration: 520, onComplete: () => ring.destroy() });
    this.tweens.add({ targets: pulse, radius: 112, alpha: 0, duration: 400, onComplete: () => pulse.destroy() });
    this.tweens.add({ targets: warning, y: warning.y - 26, alpha: 0, delay: 360, duration: 420, onComplete: () => warning.destroy() });
  }

  private showEnemyWarning(text: string, color: number, durationMs: number, attack: EnemyAttack = "jab"): void {
    const heavy = attack === "heavy" || attack === "special";
    const lunge = attack === "lunge";
    const dir = this.player.x < this.enemy.x ? -1 : 1;
    const warnColor = heavy ? 0xff4866 : lunge ? 0xffeb72 : color;
    const range = heavy ? 164 : lunge ? 190 : 126;

    const label = this.add.text(this.enemy.x, this.enemy.y - this.enemy.displayHeight * 0.66, text, {
      fontFamily: "Arial", fontSize: heavy ? "17px" : "15px", color: "#fcfff7", fontStyle: "bold", stroke: "#041004", strokeThickness: 5,
    }).setOrigin(0.5).setDepth(90);
    const marker = this.add.rectangle(this.enemy.x, this.enemy.y - this.enemy.displayHeight * 0.34, heavy ? 96 : 78, heavy ? 7 : 5, warnColor, 0.96)
      .setDepth(89);
    const attackLine = this.add.line(0, 0, this.enemy.x + dir * 26, FLOOR_Y - 72, this.enemy.x + dir * range, FLOOR_Y - 74, warnColor, heavy ? 0.74 : 0.52)
      .setOrigin(0, 0)
      .setLineWidth(heavy ? 9 : 6)
      .setDepth(88);
    const blockNow = heavy
      ? this.add.text(this.player.x, this.player.y - 128, attack === "special" ? this.getBossMechanics(this.getRound(this.roundIndex)).special.warning : "BLOCK NOW", {
        fontFamily: "Arial", fontSize: "16px", color: "#ffeb72", fontStyle: "bold", stroke: "#041004", strokeThickness: 5,
      }).setOrigin(0.5).setDepth(91)
      : undefined;

    const targets: Phaser.GameObjects.GameObject[] = blockNow ? [label, marker, attackLine, blockNow] : [label, marker, attackLine];
    this.tweens.add({
      targets,
      alpha: heavy ? 0.18 : 0.28,
      duration: Math.max(140, durationMs * 0.42),
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        label.destroy();
        marker.destroy();
        attackLine.destroy();
        blockNow?.destroy();
      },
    });
  }

  private showHitLine(x1: number, y1: number, x2: number, y2: number, color: number, heavy = false): void {
    const glow = this.add.line(0, 0, x1, y1, x2, y2, color, heavy ? 0.38 : 0.26)
      .setOrigin(0, 0)
      .setLineWidth(heavy ? 13 : 8)
      .setDepth(47);
    const core = this.add.line(0, 0, x1, y1, x2, y2, 0xfcfff7, heavy ? 0.92 : 0.72)
      .setOrigin(0, 0)
      .setLineWidth(heavy ? 4 : 3)
      .setDepth(48);
    this.tweens.add({
      targets: [glow, core],
      alpha: 0,
      duration: heavy ? 135 : 105,
      onComplete: () => {
        glow.destroy();
        core.destroy();
      },
    });
  }

  private showImpact(x: number, y: number, color: number, heavy = false): void {
    const ring = this.add.circle(x, y, heavy ? 22 : 14, color, heavy ? 0.2 : 0.16)
      .setStrokeStyle(heavy ? 6 : 4, color, 0.9)
      .setDepth(50);
    const core = this.add.circle(x, y, heavy ? 9 : 6, 0xfcfff7, 0.84).setDepth(51);
    this.tweens.add({
      targets: ring,
      radius: heavy ? 70 : 44,
      alpha: 0,
      duration: heavy ? 260 : 170,
      onComplete: () => ring.destroy(),
    });
    this.tweens.add({
      targets: core,
      alpha: 0,
      scaleX: heavy ? 2.6 : 1.9,
      scaleY: heavy ? 2.6 : 1.9,
      duration: heavy ? 180 : 120,
      onComplete: () => core.destroy(),
    });
  }

  private showUltimateFx(): void {
    const ring = this.add.circle(this.player.x, this.player.y - 36, 42, this.ultimateSkill.color, 0.08)
      .setStrokeStyle(7, this.ultimateSkill.color, 0.86)
      .setDepth(54);
    const core = this.add.circle(this.player.x, this.player.y - 36, 18, 0xfcfff7, 0.18)
      .setDepth(55);
    const beam = this.add.rectangle(this.player.x, this.player.y - 42, 16, 138, this.ultimateSkill.color, 0.16)
      .setDepth(53);
    const label = this.add.text(this.player.x, this.player.y - 158, "WALLET PROTECTION MODE", {
      fontFamily: "Arial", fontSize: "20px", color: "#72ff57", fontStyle: "bold", stroke: "#041004", strokeThickness: 6,
    }).setOrigin(0.5).setDepth(92);

    this.tweens.add({ targets: ring, radius: 122, alpha: 0, duration: 560, onComplete: () => ring.destroy() });
    this.tweens.add({ targets: core, alpha: 0, scaleX: 3.4, scaleY: 3.4, duration: 360, onComplete: () => core.destroy() });
    this.tweens.add({ targets: beam, alpha: 0, scaleY: 1.5, duration: 460, onComplete: () => beam.destroy() });
    this.tweens.add({ targets: label, y: label.y - 28, alpha: 0, delay: 520, duration: 520, onComplete: () => label.destroy() });
  }

  private showBlockFx(): void {
    const shield = this.add.circle(this.player.x + 36, this.player.y - 26, 26, 0x72ff57, 0.05)
      .setStrokeStyle(5, 0x72ff57, 0.82)
      .setDepth(48);
    const core = this.add.circle(this.player.x + 34, this.player.y - 28, 12, 0xfcfff7, 0.18)
      .setDepth(49);
    const line = this.add.line(0, 0, this.player.x + 4, this.player.y - 26, this.player.x + 72, this.player.y - 26, 0x72ff57, 0.74)
      .setOrigin(0, 0)
      .setLineWidth(5)
      .setDepth(49);
    this.tweens.add({ targets: shield, radius: 50, alpha: 0, duration: 240, onComplete: () => shield.destroy() });
    this.tweens.add({ targets: [core, line], alpha: 0, duration: 180, onComplete: () => { core.destroy(); line.destroy(); } });
  }

  private showFloatingText(text: string, x: number, y: number, color: string): void {
    const label = this.add.text(x, y, text, {
      fontFamily: "Arial", fontSize: "19px", color, fontStyle: "bold", stroke: "#041004", strokeThickness: 5,
    }).setOrigin(0.5).setDepth(92);
    this.tweens.add({
      targets: label,
      y: y - 28,
      alpha: 0,
      duration: 580,
      ease: "Cubic.easeOut",
      onComplete: () => label.destroy(),
    });
  }
}
