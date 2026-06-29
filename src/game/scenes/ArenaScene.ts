import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../../config/game";
import { SCENE_KEYS } from "../../config/routes";
import { requestAppFullscreen, toggleAppFullscreen } from "../../app/AppShell";
import { MobileControls } from "../ui/MobileControls";
import { SfxSystem } from "../systems/SfxSystem";
import { ARENA_BATTLE_ROUNDS } from "../data/bosses";
import type { ArenaBossDefinition } from "../data/bosses";
import type { InputState, RunResult } from "../types/game";

type FighterState = "idle" | "moving" | "punch" | "kick" | "block" | "dash" | "hurt" | "defeated";
type EnemyState = "idle" | "approach" | "windup" | "attack" | "guard" | "backstep" | "hurt" | "defeated";
type EnemyAttack = "jab" | "lunge" | "heavy";

type RoundConfig = ArenaBossDefinition;

const FLOOR_Y = GAME_HEIGHT - 104;
const PLAYER_DISPLAY_W = 118;
const PLAYER_DISPLAY_H = 154;
const PLAYER_START_X = 290;
const ENEMY_START_X = GAME_WIDTH - 286;
const LEFT_BOUND = GAME_WIDTH * 0.26;
const RIGHT_BOUND = GAME_WIDTH * 0.74;
const ROUNDS: RoundConfig[] = ARENA_BATTLE_ROUNDS;

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

  private playerHp = 100;
  private enemyHp = 1;
  private enemyMaxHp = 1;
  private roundIndex = 0;
  private score = 0;
  private activeElapsedMs = 0;
  private defeatedLeaks = 0;
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
  private playerInvincibleUntil = 0;
  private playerBlockUntil = 0;
  private playerActionUntil = 0;
  private punchCooldownUntil = 0;
  private kickCooldownUntil = 0;
  private dashCooldownUntil = 0;
  private lastPunchAt = 0;
  private comboStep = 0;
  private bossPhaseShown = false;

  private playerHpFill!: Phaser.GameObjects.Rectangle;
  private enemyHpFill!: Phaser.GameObjects.Rectangle;
  private playerHpText!: Phaser.GameObjects.Text;
  private enemyHpText!: Phaser.GameObjects.Text;
  private roundText!: Phaser.GameObjects.Text;
  private objectiveText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;

  constructor() {
    super(SCENE_KEYS.arena);
  }

  create(): void {
    this.playerHp = 100;
    this.enemyHp = 1;
    this.enemyMaxHp = 1;
    this.roundIndex = 0;
    this.score = 0;
    this.activeElapsedMs = 0;
    this.defeatedLeaks = 0;
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
    this.lastPunchAt = 0;
    this.comboStep = 0;
    this.bossPhaseShown = false;

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

    this.updatePlayer(input, now);
    this.updateEnemy(now);
    this.clampFighters();
  }

  private createArenaBackground(): void {
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "arena-bg-01")
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setDepth(0);

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x102b10, 0.08)
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
    this.add.rectangle(96, 0, 166, GAME_HEIGHT, 0x72ff57, 0.012).setDepth(2);
    this.add.rectangle(GAME_WIDTH - 96, 0, 166, GAME_HEIGHT, 0xa45cff, 0.012).setDepth(2);
  }

  private createFighters(): void {
    this.playerShadow = this.add.ellipse(PLAYER_START_X, FLOOR_Y - 2, 92, 22, 0x000000, 0.22).setDepth(9);
    this.enemyShadow = this.add.ellipse(ENEMY_START_X, FLOOR_Y - 2, 90, 22, 0x000000, 0.24).setDepth(9);

    this.playerAuraOuter = this.add.ellipse(PLAYER_START_X - 6, FLOOR_Y - 88, 106, 144, 0x72ff57, 0.06).setDepth(15);
    this.playerAuraInner = this.add.ellipse(PLAYER_START_X - 3, FLOOR_Y - 90, 70, 112, 0xfcfff7, 0.035).setDepth(16);
    this.enemyAura = this.add.ellipse(ENEMY_START_X + 6, FLOOR_Y - 82, 118, 136, 0xa45cff, 0.045).setDepth(15);

    this.player = this.physics.add.sprite(PLAYER_START_X, FLOOR_Y - PLAYER_DISPLAY_H * 0.5, "mascot-idle-front");
    this.player.setDisplaySize(PLAYER_DISPLAY_W, PLAYER_DISPLAY_H);
    this.player.setDepth(22);
    this.player.setCollideWorldBounds(false);
    this.player.setData("side", "player");
    this.setBody(this.player, 42, 78, 20);
    if (this.anims.exists("mascot-idle-front-anim")) this.player.play("mascot-idle-front-anim", true);

    this.enemy = this.physics.add.sprite(ENEMY_START_X, FLOOR_Y - ROUNDS[0].displayH * 0.5, ROUNDS[0].texture);
    this.enemy.setDepth(21);
    this.enemy.setCollideWorldBounds(false);
    this.enemy.setData("side", "enemy");
  }

  private createHud(): void {
    this.add.rectangle(156, 34, 272, 50, 0x061006, 0.74)
      .setStrokeStyle(2, 0x72ff57, 0.36)
      .setDepth(80);
    this.add.text(30, 13, "BROKE MASCOT", {
      fontFamily: "Arial", fontSize: "12px", color: "#72ff57", fontStyle: "bold", stroke: "#041004", strokeThickness: 3,
    }).setDepth(81);
    this.add.rectangle(156, 42, 228, 13, 0x1b251b, 1).setOrigin(0.5).setDepth(81);
    this.playerHpFill = this.add.rectangle(42, 42, 226, 11, 0x72ff57, 1).setOrigin(0, 0.5).setDepth(82);
    this.playerHpText = this.add.text(276, 27, "100/100", {
      fontFamily: "Arial", fontSize: "13px", color: "#fcfff7", fontStyle: "bold", stroke: "#041004", strokeThickness: 3,
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

    this.statusText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 24, "FIGHT", {
      fontFamily: "Arial", fontSize: "12px", color: "#fcfff7", fontStyle: "bold", stroke: "#041004", strokeThickness: 4,
    }).setOrigin(0.5).setDepth(84);

    this.comboText = this.add.text(PLAYER_START_X, FLOOR_Y - 188, "", {
      fontFamily: "Arial", fontSize: "18px", color: "#72ff57", fontStyle: "bold", stroke: "#041004", strokeThickness: 5,
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
    const config = ROUNDS[index];
    this.enemyMaxHp = config.hp;
    this.enemyHp = config.hp;
    this.enemyState = "idle";
    this.enemyCooldownUntil = Date.now() + 1400;
    this.enemyGuardUntil = 0;
    this.enemyBackstepUntil = 0;
    this.fightStarted = false;
    this.playerState = "idle";
    this.playerActionUntil = 0;
    this.playerInvincibleUntil = Date.now() + 600;
    this.bossPhaseShown = false;

    this.player.setPosition(PLAYER_START_X, FLOOR_Y - PLAYER_DISPLAY_H * 0.5);
    this.player.setVelocity(0, 0);
    this.player.setFlipX(false);
    this.player.setTint(0xffffff);
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

    this.roundText.setText(config.boss ? "BOSS ROUND" : `ROUND ${index + 1}`);
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
    const title = this.add.text(GAME_WIDTH / 2, 148, config.boss ? "BOSS FIGHT" : `ROUND ${this.roundIndex + 1}`, {
      fontFamily: "Arial", fontSize: "42px", color: config.boss ? "#ff8fa3" : "#72ff57", fontStyle: "bold", stroke: "#041004", strokeThickness: 8,
    }).setOrigin(0.5).setDepth(121);
    const sub = this.add.text(GAME_WIDTH / 2, 194, `BROKE MASCOT  VS  ${config.name.toUpperCase()}`, {
      fontFamily: "Arial", fontSize: "17px", color: "#fcfff7", fontStyle: "bold", stroke: "#041004", strokeThickness: 5,
    }).setOrigin(0.5).setDepth(121);
    const objective = this.add.text(GAME_WIDTH / 2, 226, config.leakLabel, {
      fontFamily: "Arial", fontSize: "14px", color: "#d9a7ff", fontStyle: "bold", stroke: "#041004", strokeThickness: 4,
    }).setOrigin(0.5).setDepth(121);
    const hint = this.add.text(GAME_WIDTH / 2, 258, config.introLine, {
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

    this.player.clearTint();
    this.playerState = Math.abs(input.x) > 0.08 ? "moving" : "idle";
    const speed = 260;
    this.player.setVelocityX(input.x * speed);
    this.player.setVelocityY(0);
    this.player.setFlipX(false);
    this.playPlayerAnim(this.playerState === "moving" ? "mascot-run-front-anim" : "mascot-idle-front-anim");
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
    this.tryHitEnemy(this.comboStep === 3 ? 16 : 8, this.comboStep === 3 ? 146 : 114, this.comboStep === 3 ? 260 : 150, this.comboStep === 3 ? "HEAVY PUNCH" : "PUNCH");
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
    this.tryHitEnemy(18, 164, 360, "KICK");
  }

  private dash(now: number, inputX: number): void {
    this.dashCooldownUntil = now + 860;
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
      this.player.clearTint();
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
    const rawDamage = damage + bonus;
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
    const config = ROUNDS[this.roundIndex];
    this.enemy.setFlipX(this.enemy.x > this.player.x);

    if (config.boss && !this.bossPhaseShown && this.enemyHp <= this.enemyMaxHp * 0.5) {
      this.bossPhaseShown = true;
      this.enemy.setTint(0xff4866);
      this.enemyCooldownUntil = Math.min(this.enemyCooldownUntil, now + 460);
      this.objectiveText.setText("BOSS PHASE 2");
      this.statusText.setText("BOSS ENRAGED");
      this.showImpact(this.enemy.x, this.enemy.y - this.enemy.displayHeight * 0.32, 0xff4866, true);
      this.showBossPhaseFx();
      this.showFloatingText("PHASE 2", this.enemy.x, this.enemy.y - this.enemy.displayHeight * 0.68, "#ff9aaa");
      this.cameras.main.shake(160, 0.0044);
      this.time.delayedCall(190, () => {
        if (this.enemy.active && this.enemyState !== "defeated") this.enemy.clearTint();
      });
    }

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
      const phaseBoost = config.boss && this.bossPhaseShown ? 1.16 : 1;
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

  private beginEnemyWindup(now: number, config: RoundConfig): void {
    this.enemyAttack = this.pickEnemyAttack(config);
    const phaseFast = config.boss && this.bossPhaseShown ? 0.82 : 1;
    const windupMs = Math.round((this.enemyAttack === "heavy" ? 680 : this.enemyAttack === "lunge" ? 500 : 360) * phaseFast);
    this.enemyState = "windup";
    this.enemyWindupUntil = now + windupMs;
    this.enemy.setTint(this.enemyAttack === "heavy" ? 0xff4866 : config.color);
    const label = this.enemyAttack === "heavy" ? this.getHeavyAttackName(config) : this.enemyAttack === "lunge" ? this.getLungeAttackName(config) : this.getJabAttackName(config);
    this.showEnemyWarning(label, config.color, windupMs, this.enemyAttack);
    this.statusText.setText(`${config.name}: ${label}`);
  }

  private shouldEnemyGuard(config: RoundConfig, distance: number): boolean {
    if (distance > config.attackRange * 0.82) return false;
    const roll = Phaser.Math.FloatBetween(0, 1);
    if (config.behavior === "impulse") return roll < 0.1;
    if (config.behavior === "emotion") return roll < 0.2;
    if (config.behavior === "rug") return roll < 0.28;
    return roll < (this.bossPhaseShown ? 0.18 : 0.24);
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
    if (config.behavior === "emotion") return 150;
    if (config.behavior === "rug") return 88;
    if (config.boss) return this.bossPhaseShown ? 118 : 96;
    return 126;
  }

  private getBackstepDuration(config: RoundConfig): number {
    if (config.behavior === "impulse") return 230;
    if (config.behavior === "emotion") return 310;
    if (config.behavior === "rug") return 260;
    return this.bossPhaseShown ? 220 : 280;
  }

  private pickEnemyAttack(config: RoundConfig): EnemyAttack {
    const attackRoll = Phaser.Math.FloatBetween(0, 1);
    if (config.behavior === "impulse") return attackRoll > 0.72 ? "lunge" : "jab";
    if (config.behavior === "emotion") return attackRoll > 0.52 ? "lunge" : attackRoll > 0.24 ? "jab" : "heavy";
    if (config.behavior === "rug") return attackRoll > 0.36 ? "heavy" : "lunge";
    if (config.boss && this.bossPhaseShown) return attackRoll > 0.42 ? "heavy" : "lunge";
    return attackRoll > 0.62 ? "heavy" : attackRoll > 0.28 ? "lunge" : "jab";
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
    if (config.behavior === "impulse") return 340;
    if (config.behavior === "emotion") return 360;
    if (config.behavior === "rug") return 520;
    return this.bossPhaseShown ? 360 : 460;
  }

  private performEnemyAttack(now: number, config: RoundConfig): void {
    this.enemyState = "attack";
    this.enemyAttackUntil = now + 230;
    this.enemyCooldownUntil = now + this.getEnemyCooldown(config);
    const dir = this.player.x < this.enemy.x ? -1 : 1;
    const phaseBonus = config.boss && this.bossPhaseShown ? 2 : 0;
    const damage = this.enemyAttack === "heavy" ? config.damage + 5 + phaseBonus : this.enemyAttack === "lunge" ? config.damage + 2 + phaseBonus : config.damage;
    const range = this.enemyAttack === "heavy" ? config.attackRange + 20 : this.enemyAttack === "lunge" ? config.attackRange + 42 : config.attackRange;

    if (this.enemyAttack === "lunge") {
      this.enemy.setVelocityX(dir * (config.behavior === "emotion" ? 380 : config.boss && this.bossPhaseShown ? 355 : 310));
    } else if (this.enemyAttack === "heavy") {
      this.enemy.setVelocityX(dir * (config.behavior === "rug" ? 170 : 120));
    } else {
      this.enemy.setVelocityX(dir * 116);
    }

    this.showEnemyAttackFx(config.color, this.enemyAttack);
    this.time.delayedCall(90, () => {
      if (this.runFinished || this.enemyState === "defeated") return;
      const distance = Math.abs(this.player.x - this.enemy.x);
      if (distance <= range) this.damagePlayer(damage, this.getAttackDamageLabel(config));
    });
  }

  private getEnemyCooldown(config: RoundConfig): number {
    if (config.behavior === "impulse") return 880;
    if (config.behavior === "emotion") return 960;
    if (config.behavior === "rug") return 1320;
    return this.bossPhaseShown ? 790 : 1040;
  }

  private getAttackDamageLabel(config: RoundConfig): string {
    if (this.enemyAttack === "heavy") return this.getHeavyAttackName(config);
    if (this.enemyAttack === "lunge") return this.getLungeAttackName(config);
    return this.getJabAttackName(config);
  }

  private damagePlayer(amount: number, label: string): void {
    const now = Date.now();
    if (now < this.playerInvincibleUntil) {
      this.showFloatingText("DODGE", this.player.x, this.player.y - 92, "#d9a7ff");
      return;
    }

    if (now < this.playerBlockUntil) {
      const blocked = Math.max(1, Math.floor(amount * 0.25));
      this.playerHp = Math.max(0, this.playerHp - blocked);
      this.sfx.playBlock();
      this.showBlockFx();
      this.showFloatingText("BLOCK", this.player.x, this.player.y - 100, "#72ff57");
      this.statusText.setText("BLOCK");
      this.cameras.main.shake(48, 0.0018);
      this.playerInvincibleUntil = now + 190;
      return;
    }

    this.playerHp = Math.max(0, this.playerHp - amount);
    this.playerState = "hurt";
    this.playerActionUntil = now + 220;
    this.playerInvincibleUntil = now + 360;
    this.player.setVelocityX(-210);
    this.player.setTint(0xff4866);
    this.playPlayerAnim("mascot-hurt-anim");
    this.sfx.playHit(amount >= 12);
    this.cameras.main.flash(70, 255, 72, 102, false);
    this.cameras.main.shake(95, 0.004);
    this.showImpact(this.player.x + 24, this.player.y - 18, 0xff4866, amount >= 12);
    this.showFloatingText(`-${amount} HP`, this.player.x, this.player.y - 108, "#ff9aaa");
    this.statusText.setText(label);

    this.time.delayedCall(220, () => {
      if (!this.player.active) return;
      this.player.clearTint();
    });

    if (this.playerHp <= 0) this.finishRun(false);
  }

  private defeatEnemy(): void {
    const config = ROUNDS[this.roundIndex];
    this.enemyState = "defeated";
    this.enemy.setVelocity(0, 0);
    this.enemy.setTint(0xffffff);
    this.defeatedLeaks += 1;
    this.score += config.boss ? 1500 : 700;
    this.showImpact(this.enemy.x, this.enemy.y - 42, config.boss ? 0xffeb72 : 0x72ff57, true);
    this.showFloatingText(config.defeatLine, this.enemy.x, this.enemy.y - 130, "#72ff57");
    this.showRoundClear(config);
    this.cameras.main.shake(180, 0.0045);
    this.enemy.setAlpha(0.62);

    if (this.roundIndex >= ROUNDS.length - 1) {
      this.time.delayedCall(1350, () => this.finishRun(true));
      return;
    }

    this.playerHp = Math.min(100, this.playerHp + 18);
    this.time.delayedCall(1550, () => {
      this.enemy.setAlpha(1);
      this.startRound(this.roundIndex + 1);
    });
  }

  private showRoundClear(config: RoundConfig): void {
    const nextText = this.roundIndex >= ROUNDS.length - 1 ? "FINAL LEAK BROKEN" : "NEXT LEAK INCOMING";
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
      bossDamage: victory ? 999 : Math.max(0, ROUNDS[this.roundIndex].hp - this.enemyHp),
      upgradesChosen: 0,
      pickupsCollected: 0,
      bossesBroken: victory ? 1 : 0,
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
    this.playerHpFill.width = 226 * Phaser.Math.Clamp(this.playerHp / 100, 0, 1);
    this.enemyHpFill.width = 226 * Phaser.Math.Clamp(this.enemyHp / Math.max(1, this.enemyMaxHp), 0, 1);
    this.playerHpText.setText(`${Math.max(0, this.playerHp)}/100`);
    const config = ROUNDS[this.roundIndex] ?? ROUNDS[0];
    if (this.enemyHp > 0) {
      const enemyPercent = Math.ceil((this.enemyHp / Math.max(1, this.enemyMaxHp)) * 100);
      this.enemyHpText.setText(`${config.name.toUpperCase()} · ${enemyPercent}%`);
    }
  }

  private updateShadows(): void {
    if (!this.playerShadow || !this.enemyShadow || !this.player || !this.enemy) return;
    const config = ROUNDS[this.roundIndex] ?? ROUNDS[0];
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

    const config = ROUNDS[this.roundIndex] ?? ROUNDS[0];
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
        .setTint(0xa45cff)
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

  private setBody(sprite: Phaser.Physics.Arcade.Sprite, width: number, height: number, offsetY = 0): void {
    const body = sprite.body as Phaser.Physics.Arcade.Body | null;
    if (!body) return;
    body.setSize(width, height, true);
    body.setOffset((sprite.width - width) / 2, (sprite.height - height) / 2 + offsetY);
  }

  private playPlayerAnim(key: string): void {
    if (this.anims.exists(key)) this.player.play(key, true);
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
    const heavy = attack === "heavy";
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

  private showBossPhaseFx(): void {
    const ring = this.add.circle(this.enemy.x, FLOOR_Y - 86, 62, 0xff4866, 0.05)
      .setStrokeStyle(7, 0xff4866, 0.76)
      .setDepth(47);
    const pulse = this.add.circle(this.enemy.x, FLOOR_Y - 86, 28, 0xffeb72, 0.08)
      .setStrokeStyle(4, 0xffeb72, 0.58)
      .setDepth(48);
    const warning = this.add.text(this.enemy.x, FLOOR_Y - 188, "BOSS ENRAGED", {
      fontFamily: "Arial", fontSize: "24px", color: "#ff9aaa", fontStyle: "bold", stroke: "#041004", strokeThickness: 7,
    }).setOrigin(0.5).setDepth(92);
    this.tweens.add({ targets: ring, radius: 156, alpha: 0, duration: 520, onComplete: () => ring.destroy() });
    this.tweens.add({ targets: pulse, radius: 112, alpha: 0, duration: 400, onComplete: () => pulse.destroy() });
    this.tweens.add({ targets: warning, y: warning.y - 26, alpha: 0, delay: 360, duration: 420, onComplete: () => warning.destroy() });
  }

  private showEnemyWarning(text: string, color: number, durationMs: number, attack: EnemyAttack = "jab"): void {
    const heavy = attack === "heavy";
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
      ? this.add.text(this.player.x, this.player.y - 128, "BLOCK NOW", {
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
