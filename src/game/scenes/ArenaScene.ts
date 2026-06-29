import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../../config/game";
import { SCENE_KEYS } from "../../config/routes";
import { requestAppFullscreen, toggleAppFullscreen } from "../../app/AppShell";
import { MobileControls } from "../ui/MobileControls";
import { SfxSystem } from "../systems/SfxSystem";
import type { InputState, RunResult } from "../types/game";

type FighterState = "idle" | "moving" | "punch" | "kick" | "block" | "dash" | "hurt" | "defeated";
type EnemyState = "idle" | "approach" | "windup" | "attack" | "hurt" | "defeated";
type EnemyAttack = "jab" | "lunge" | "heavy";

interface RoundConfig {
  name: string;
  leakLabel: string;
  texture: string;
  animation: string;
  hp: number;
  damage: number;
  speed: number;
  displayW: number;
  displayH: number;
  bodyW: number;
  bodyH: number;
  attackRange: number;
  color: number;
  boss?: boolean;
}

const FLOOR_Y = GAME_HEIGHT - 76;
const PLAYER_START_X = 190;
const ENEMY_START_X = GAME_WIDTH - 190;
const LEFT_BOUND = 74;
const RIGHT_BOUND = GAME_WIDTH - 74;

const ROUNDS: RoundConfig[] = [
  {
    name: "Impulse Buy Beast",
    leakLabel: "DEFEAT IMPULSE SPENDING",
    texture: "enemy-imp-01",
    animation: "enemy-bad-habit-move",
    hp: 70,
    damage: 7,
    speed: 104,
    displayW: 118,
    displayH: 118,
    bodyW: 56,
    bodyH: 72,
    attackRange: 104,
    color: 0x72ff57,
  },
  {
    name: "Emotional Trading Beast",
    leakLabel: "DEFEAT EMOTIONAL TRADING",
    texture: "enemy-runner-01",
    animation: "enemy-fomo-move",
    hp: 86,
    damage: 9,
    speed: 134,
    displayW: 138,
    displayH: 112,
    bodyW: 70,
    bodyH: 64,
    attackRange: 122,
    color: 0xffeb72,
  },
  {
    name: "Rug Pull Beast",
    leakLabel: "DEFEAT RUG PULLS",
    texture: "enemy-beast-01",
    animation: "enemy-scam-move",
    hp: 104,
    damage: 10,
    speed: 112,
    displayW: 140,
    displayH: 126,
    bodyW: 72,
    bodyH: 72,
    attackRange: 126,
    color: 0xa45cff,
  },
  {
    name: "Wallet Destroyer Boss",
    leakLabel: "BOSS ROUND",
    texture: "boss-thorn-01",
    animation: "boss-thorn-move",
    hp: 148,
    damage: 13,
    speed: 94,
    displayW: 178,
    displayH: 168,
    bodyW: 88,
    bodyH: 88,
    attackRange: 146,
    color: 0xff4866,
    boss: true,
  },
];

export class ArenaScene extends Phaser.Scene {
  private controls!: MobileControls;
  private sfx!: SfxSystem;

  private player!: Phaser.Physics.Arcade.Sprite;
  private enemy!: Phaser.Physics.Arcade.Sprite;
  private playerAura!: Phaser.GameObjects.Arc;
  private enemyAura!: Phaser.GameObjects.Arc;

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
  private playerInvincibleUntil = 0;
  private playerBlockUntil = 0;
  private playerActionUntil = 0;
  private punchCooldownUntil = 0;
  private kickCooldownUntil = 0;
  private dashCooldownUntil = 0;
  private lastPunchAt = 0;
  private comboStep = 0;

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

    this.updateAuras();
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

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x102b10, 0.12)
      .setDepth(1);

    this.add.rectangle(GAME_WIDTH / 2, FLOOR_Y + 22, GAME_WIDTH, 78, 0x071707, 0.62)
      .setDepth(2);
    this.add.line(0, 0, 0, FLOOR_Y - 6, GAME_WIDTH, FLOOR_Y - 6, 0x72ff57, 0.42)
      .setOrigin(0, 0)
      .setLineWidth(3)
      .setDepth(3);

    this.add.ellipse(GAME_WIDTH / 2, FLOOR_Y + 24, 650, 88, 0x72ff57, 0.05)
      .setStrokeStyle(2, 0x72ff57, 0.14)
      .setDepth(3);
    this.add.ellipse(GAME_WIDTH / 2, FLOOR_Y + 26, 450, 54, 0xa45cff, 0.035)
      .setStrokeStyle(1, 0xa45cff, 0.12)
      .setDepth(3);

    this.add.rectangle(98, 0, 180, GAME_HEIGHT, 0x72ff57, 0.025).setDepth(2);
    this.add.rectangle(GAME_WIDTH - 98, 0, 180, GAME_HEIGHT, 0xa45cff, 0.025).setDepth(2);
  }

  private createFighters(): void {
    this.playerAura = this.add.circle(PLAYER_START_X, FLOOR_Y - 58, 58, 0x72ff57, 0.1).setDepth(9);
    this.enemyAura = this.add.circle(ENEMY_START_X, FLOOR_Y - 58, 62, 0xa45cff, 0.08).setDepth(9);

    this.player = this.physics.add.sprite(PLAYER_START_X, FLOOR_Y - 74, "mascot-idle-front");
    this.player.setDisplaySize(136, 178);
    this.player.setDepth(22);
    this.player.setCollideWorldBounds(false);
    this.player.setData("side", "player");
    this.setBody(this.player, 58, 112, 26);
    if (this.anims.exists("mascot-idle-front-anim")) this.player.play("mascot-idle-front-anim", true);

    this.enemy = this.physics.add.sprite(ENEMY_START_X, FLOOR_Y - 68, ROUNDS[0].texture);
    this.enemy.setDepth(21);
    this.enemy.setCollideWorldBounds(false);
    this.enemy.setData("side", "enemy");
  }

  private createHud(): void {
    this.add.rectangle(162, 36, 286, 54, 0x061006, 0.78)
      .setStrokeStyle(2, 0x72ff57, 0.36)
      .setDepth(80);
    this.add.text(30, 13, "BROKE MASCOT", {
      fontFamily: "Arial", fontSize: "12px", color: "#72ff57", fontStyle: "bold", stroke: "#041004", strokeThickness: 3,
    }).setDepth(81);
    this.add.rectangle(162, 43, 246, 14, 0x1b251b, 1).setOrigin(0.5).setDepth(81);
    this.playerHpFill = this.add.rectangle(39, 43, 244, 12, 0x72ff57, 1).setOrigin(0, 0.5).setDepth(82);
    this.playerHpText = this.add.text(286, 28, "100/100", {
      fontFamily: "Arial", fontSize: "13px", color: "#fcfff7", fontStyle: "bold", stroke: "#041004", strokeThickness: 3,
    }).setOrigin(1, 0).setDepth(83);

    this.add.rectangle(GAME_WIDTH - 162, 36, 286, 54, 0x061006, 0.78)
      .setStrokeStyle(2, 0xa45cff, 0.36)
      .setDepth(80);
    this.enemyHpText = this.add.text(GAME_WIDTH - 30, 13, "LEAK BEAST", {
      fontFamily: "Arial", fontSize: "12px", color: "#d9a7ff", fontStyle: "bold", stroke: "#041004", strokeThickness: 3,
    }).setOrigin(1, 0).setDepth(81);
    this.add.rectangle(GAME_WIDTH - 162, 43, 246, 14, 0x21172b, 1).setOrigin(0.5).setDepth(81);
    this.enemyHpFill = this.add.rectangle(GAME_WIDTH - 285, 43, 244, 12, 0xff4866, 1).setOrigin(0, 0.5).setDepth(82);

    this.roundText = this.add.text(GAME_WIDTH / 2, 16, "ROUND 1", {
      fontFamily: "Arial", fontSize: "22px", color: "#fcfff7", fontStyle: "bold", stroke: "#041004", strokeThickness: 5,
    }).setOrigin(0.5).setDepth(83);

    this.objectiveText = this.add.text(GAME_WIDTH / 2, 44, "DEFEAT THE LEAK", {
      fontFamily: "Arial", fontSize: "12px", color: "#72ff57", fontStyle: "bold", stroke: "#041004", strokeThickness: 4,
    }).setOrigin(0.5).setDepth(83);

    this.statusText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 28, "PUNCH · KICK · BLOCK · DASH", {
      fontFamily: "Arial", fontSize: "13px", color: "#fcfff7", fontStyle: "bold", stroke: "#041004", strokeThickness: 4,
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
    this.fightStarted = false;
    this.playerState = "idle";
    this.playerActionUntil = 0;
    this.playerInvincibleUntil = Date.now() + 600;

    this.player.setPosition(PLAYER_START_X, FLOOR_Y - 74);
    this.player.setVelocity(0, 0);
    this.player.setFlipX(false);
    this.player.setTint(0xffffff);
    this.playPlayerAnim("mascot-idle-front-anim");

    this.enemy.setTexture(config.texture);
    this.enemy.setDisplaySize(config.displayW, config.displayH);
    this.enemy.setPosition(ENEMY_START_X, FLOOR_Y - config.displayH * 0.46);
    this.enemy.setVelocity(0, 0);
    this.enemy.setFlipX(true);
    this.enemy.clearTint();
    this.setBody(this.enemy, config.bodyW, config.bodyH, Math.max(0, config.displayH * 0.18));
    if (this.anims.exists(config.animation)) this.enemy.play(config.animation, true);

    this.roundText.setText(config.boss ? "BOSS ROUND" : `ROUND ${index + 1}`);
    this.objectiveText.setText(config.leakLabel);
    this.enemyHpText.setText(config.name.toUpperCase());
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
    const sub = this.add.text(GAME_WIDTH / 2, 198, `BROKE MASCOT  VS  ${config.name.toUpperCase()}`, {
      fontFamily: "Arial", fontSize: "17px", color: "#fcfff7", fontStyle: "bold", stroke: "#041004", strokeThickness: 5,
    }).setOrigin(0.5).setDepth(121);
    const objective = this.add.text(GAME_WIDTH / 2, 234, config.leakLabel, {
      fontFamily: "Arial", fontSize: "14px", color: "#d9a7ff", fontStyle: "bold", stroke: "#041004", strokeThickness: 4,
    }).setOrigin(0.5).setDepth(121);

    this.time.delayedCall(1150, () => {
      this.fightStarted = true;
      this.statusText.setText("FIGHT");
      this.tweens.add({
        targets: [shade, title, sub, objective],
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
    this.punchCooldownUntil = now + (this.comboStep === 3 ? 380 : 245);
    this.playerActionUntil = now + (this.comboStep === 3 ? 250 : 155);
    this.playerState = "punch";
    this.player.setVelocityX(0);
    this.player.setTint(this.comboStep === 3 ? 0xd9a7ff : 0xffffff);
    this.playPlayerAnim("mascot-attack-anim");
    this.sfx.playSword(this.comboStep === 3);
    this.showPunchFx(this.comboStep);
    this.tryHitEnemy(this.comboStep === 3 ? 13 : 7, this.comboStep === 3 ? 128 : 104, this.comboStep === 3 ? 240 : 135, this.comboStep === 3 ? "HEAVY PUNCH" : "PUNCH");
  }

  private kick(now: number): void {
    this.kickCooldownUntil = now + 620;
    this.playerActionUntil = now + 260;
    this.playerState = "kick";
    this.comboStep = 0;
    this.player.setVelocityX(40);
    this.player.setTint(0xffeb72);
    this.playPlayerAnim("mascot-attack-anim");
    this.sfx.playDashSlash();
    this.showKickFx();
    this.tryHitEnemy(14, 146, 330, "KICK");
  }

  private dash(now: number, inputX: number): void {
    this.dashCooldownUntil = now + 860;
    this.playerActionUntil = now + 230;
    this.playerInvincibleUntil = now + 280;
    this.playerState = "dash";
    const dir = inputX < -0.15 ? -1 : 1;
    this.player.setVelocityX(dir * 520);
    this.player.setAlpha(0.6);
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
      this.showFloatingText("MISS", this.player.x + 56, this.player.y - 72, "#fcfff7");
      this.statusText.setText(`${label} MISS`);
      return;
    }

    const bonus = this.enemyState === "windup" ? 3 : 0;
    const finalDamage = damage + bonus;
    this.enemyHp = Math.max(0, this.enemyHp - finalDamage);
    this.enemyState = "hurt";
    this.enemyAttackUntil = Date.now() + 120;
    this.enemy.setVelocityX(knockback);
    this.enemy.setTint(0xffffff);
    this.sfx.playHit(finalDamage >= 13);
    this.score += finalDamage * 10 + (bonus > 0 ? 40 : 0);
    this.showImpact(this.enemy.x - 34, this.enemy.y - 24, finalDamage >= 13 ? 0xffeb72 : 0x72ff57, finalDamage >= 13);
    this.showFloatingText(`-${finalDamage}`, this.enemy.x, this.enemy.y - this.enemy.displayHeight * 0.56, finalDamage >= 13 ? "#ffeb72" : "#d7ffd0");
    this.comboText.setText(label);
    this.comboText.setPosition(this.player.x + 34, this.player.y - 104);
    this.time.delayedCall(420, () => this.comboText.setText(""));
    this.cameras.main.shake(finalDamage >= 13 ? 80 : 42, finalDamage >= 13 ? 0.0034 : 0.0018);

    if (this.enemyHp <= 0) {
      this.defeatEnemy();
    }
  }

  private updateEnemy(now: number): void {
    const config = ROUNDS[this.roundIndex];
    this.enemy.setFlipX(this.enemy.x > this.player.x);

    if (this.enemyState === "defeated") return;

    if (this.enemyState === "hurt") {
      if (now < this.enemyAttackUntil) return;
      this.enemy.clearTint();
      this.enemyState = "idle";
      this.enemyCooldownUntil = Math.max(this.enemyCooldownUntil, now + 420);
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
        this.enemyState = "idle";
        this.enemy.clearTint();
      }
      return;
    }

    const distance = Math.abs(this.player.x - this.enemy.x);
    if (distance > config.attackRange * 0.82) {
      this.enemyState = "approach";
      const dir = this.player.x < this.enemy.x ? -1 : 1;
      this.enemy.setVelocityX(dir * config.speed);
      if (this.anims.exists(config.animation)) this.enemy.play(config.animation, true);
      return;
    }

    this.enemy.setVelocityX(0);
    this.enemyState = "idle";

    if (now >= this.enemyCooldownUntil) {
      this.beginEnemyWindup(now, config);
    }
  }

  private beginEnemyWindup(now: number, config: RoundConfig): void {
    const attackRoll = Phaser.Math.FloatBetween(0, 1);
    this.enemyAttack = config.boss && this.enemyHp <= this.enemyMaxHp * 0.5
      ? Phaser.Math.RND.pick(["heavy", "lunge"] as EnemyAttack[])
      : attackRoll > 0.68 ? "heavy" : attackRoll > 0.38 ? "lunge" : "jab";

    const windupMs = this.enemyAttack === "heavy" ? 640 : this.enemyAttack === "lunge" ? 480 : 360;
    this.enemyState = "windup";
    this.enemyWindupUntil = now + windupMs;
    this.enemy.setTint(this.enemyAttack === "heavy" ? 0xff4866 : config.color);
    this.showEnemyWarning(this.enemyAttack === "heavy" ? "HEAVY" : this.enemyAttack === "lunge" ? "LUNGE" : "JAB", config.color, windupMs);
  }

  private performEnemyAttack(now: number, config: RoundConfig): void {
    this.enemyState = "attack";
    this.enemyAttackUntil = now + 230;
    this.enemyCooldownUntil = now + (config.boss ? 1050 : 1250);
    const dir = this.player.x < this.enemy.x ? -1 : 1;
    const damage = this.enemyAttack === "heavy" ? config.damage + 5 : this.enemyAttack === "lunge" ? config.damage + 2 : config.damage;
    const range = this.enemyAttack === "heavy" ? config.attackRange + 18 : this.enemyAttack === "lunge" ? config.attackRange + 34 : config.attackRange;

    if (this.enemyAttack === "lunge") {
      this.enemy.setVelocityX(dir * 300);
    } else {
      this.enemy.setVelocityX(dir * 110);
    }

    this.showEnemyAttackFx(config.color);
    this.time.delayedCall(90, () => {
      if (this.runFinished || this.enemyState === "defeated") return;
      const distance = Math.abs(this.player.x - this.enemy.x);
      if (distance <= range) this.damagePlayer(damage, this.enemyAttack.toUpperCase());
    });
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
      this.playerInvincibleUntil = now + 160;
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
    this.showFloatingText("LEAK BROKEN", this.enemy.x, this.enemy.y - 130, "#72ff57");
    this.cameras.main.shake(180, 0.0045);
    this.enemy.setAlpha(0.62);

    if (this.roundIndex >= ROUNDS.length - 1) {
      this.time.delayedCall(1200, () => this.finishRun(true));
      return;
    }

    this.playerHp = Math.min(100, this.playerHp + 18);
    this.time.delayedCall(1350, () => {
      this.enemy.setAlpha(1);
      this.startRound(this.roundIndex + 1);
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
    this.player.y = FLOOR_Y - 74;
    const config = ROUNDS[this.roundIndex];
    this.enemy.y = FLOOR_Y - config.displayH * 0.46;
  }

  private updateHud(): void {
    if (!this.playerHpFill || !this.enemyHpFill) return;
    this.playerHpFill.width = 244 * Phaser.Math.Clamp(this.playerHp / 100, 0, 1);
    this.enemyHpFill.width = 244 * Phaser.Math.Clamp(this.enemyHp / Math.max(1, this.enemyMaxHp), 0, 1);
    this.playerHpText.setText(`${Math.max(0, this.playerHp)}/100`);
  }

  private updateAuras(): void {
    if (!this.playerAura || !this.enemyAura || !this.player || !this.enemy) return;
    const config = ROUNDS[this.roundIndex] ?? ROUNDS[0];
    this.playerAura.setPosition(this.player.x, this.player.y + 26);
    this.enemyAura.setPosition(this.enemy.x, this.enemy.y + config.displayH * 0.18);
    this.enemyAura.setFillStyle(config.color, config.boss ? 0.11 : 0.08);
    this.enemyAura.setRadius(config.boss ? 78 : 62);
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
    const x = this.player.x + (combo === 3 ? 94 : 78);
    const y = this.player.y - 28;
    const slash = this.add.image(x, y, "arena-vfx-sheet", combo === 3 ? 2 : 1)
      .setScale(combo === 3 ? 0.28 : 0.22)
      .setRotation(combo === 3 ? 0.08 : -0.08)
      .setAlpha(0.96)
      .setDepth(42);
    const line = this.add.line(0, 0, this.player.x + 28, this.player.y - 36, x + 44, y, combo === 3 ? 0xffeb72 : 0x72ff57, 0.84)
      .setOrigin(0, 0)
      .setLineWidth(combo === 3 ? 6 : 4)
      .setDepth(43);
    this.tweens.add({
      targets: [slash, line],
      alpha: 0,
      scaleX: slash.scaleX * 1.15,
      scaleY: slash.scaleY * 1.15,
      duration: 150,
      onComplete: () => {
        slash.destroy();
        line.destroy();
      },
    });
  }

  private showKickFx(): void {
    const x = this.player.x + 106;
    const y = this.player.y - 18;
    const arc = this.add.image(x, y, "arena-vfx-sheet", 5)
      .setScale(0.31)
      .setAlpha(0.92)
      .setDepth(42);
    const trail = this.add.line(0, 0, this.player.x + 28, this.player.y - 14, x + 58, y - 8, 0xffeb72, 0.82)
      .setOrigin(0, 0)
      .setLineWidth(6)
      .setDepth(43);
    this.tweens.add({
      targets: [arc, trail],
      alpha: 0,
      duration: 210,
      onComplete: () => {
        arc.destroy();
        trail.destroy();
      },
    });
  }

  private showEnemyAttackFx(color: number): void {
    const dir = this.player.x < this.enemy.x ? -1 : 1;
    const x = this.enemy.x + dir * 72;
    const y = this.enemy.y - 16;
    const arc = this.add.image(x, y, "arena-vfx-sheet", 4)
      .setScale(0.24)
      .setFlipX(dir < 0)
      .setTint(color)
      .setAlpha(0.92)
      .setDepth(42);
    this.tweens.add({ targets: arc, alpha: 0, duration: 170, onComplete: () => arc.destroy() });
  }

  private showEnemyWarning(text: string, color: number, durationMs: number): void {
    const label = this.add.text(this.enemy.x, this.enemy.y - this.enemy.displayHeight * 0.62, text, {
      fontFamily: "Arial", fontSize: "15px", color: "#fcfff7", fontStyle: "bold", stroke: "#041004", strokeThickness: 5,
    }).setOrigin(0.5).setDepth(90);
    const marker = this.add.rectangle(this.enemy.x, this.enemy.y - this.enemy.displayHeight * 0.34, 78, 5, color, 0.92)
      .setDepth(89);
    this.tweens.add({
      targets: [label, marker],
      alpha: 0.28,
      duration: Math.max(140, durationMs * 0.5),
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        label.destroy();
        marker.destroy();
      },
    });
  }

  private showImpact(x: number, y: number, color: number, heavy = false): void {
    const ring = this.add.circle(x, y, heavy ? 18 : 12, color, 0.14)
      .setStrokeStyle(heavy ? 5 : 3, color, 0.86)
      .setDepth(50);
    const core = this.add.circle(x, y, heavy ? 7 : 5, 0xfcfff7, 0.78).setDepth(51);
    this.tweens.add({
      targets: ring,
      radius: heavy ? 58 : 36,
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
    const shield = this.add.circle(this.player.x + 42, this.player.y - 26, 24, 0x72ff57, 0.06)
      .setStrokeStyle(4, 0x72ff57, 0.78)
      .setDepth(48);
    this.tweens.add({ targets: shield, radius: 44, alpha: 0, duration: 220, onComplete: () => shield.destroy() });
  }

  private showFloatingText(text: string, x: number, y: number, color: string): void {
    const label = this.add.text(x, y, text, {
      fontFamily: "Arial", fontSize: "17px", color, fontStyle: "bold", stroke: "#041004", strokeThickness: 5,
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
