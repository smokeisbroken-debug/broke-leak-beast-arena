import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../../config/game";
import { SCENE_KEYS } from "../../config/routes";
import { requestAppFullscreen, toggleAppFullscreen } from "../../app/AppShell";
import { PlayerMascot } from "../entities/PlayerMascot";
import { WaveSystem } from "../systems/WaveSystem";
import { MobileControls } from "../ui/MobileControls";
import { Hud } from "../ui/Hud";
import type { AttackSpec, PlayerUpgradeId, RunResult } from "../types/game";

type UpgradeRarity = "core" | "rare" | "survival";

interface UpgradeOption {
  id: PlayerUpgradeId;
  title: string;
  description: string;
  rarity: UpgradeRarity;
  tag: string;
}

const UPGRADE_POOL: UpgradeOption[] = [
  { id: "damage", title: "Razor Combo", description: "+1 damage on every combo hit", rarity: "core", tag: "DAMAGE" },
  { id: "attack_speed", title: "Quick Hands", description: "combo attacks recover faster", rarity: "core", tag: "COMBO" },
  { id: "wide_swing", title: "Wide Swing", description: "larger attack arc and range", rarity: "core", tag: "AREA" },
  { id: "speed", title: "Clean Footwork", description: "+movement speed for kiting", rarity: "core", tag: "MOVE" },
  { id: "dash", title: "Leak Step", description: "dodge cooldown reduced", rarity: "rare", tag: "DODGE" },
  { id: "pulse", title: "Safe Pulse+", description: "pulse hits harder and wider", rarity: "rare", tag: "SKILL" },
  { id: "shield_battery", title: "Shield Battery", description: "+1 shield block and longer shield", rarity: "survival", tag: "BLOCK" },
  { id: "heart", title: "Wallet HP", description: "+max HP and heal now", rarity: "survival", tag: "HP" },
  { id: "boss_breaker", title: "Boss Breaker", description: "skills hit harder for mini-boss waves", rarity: "rare", tag: "BOSS" },
];

export class ArenaScene extends Phaser.Scene {
  private player!: PlayerMascot;
  private waves!: WaveSystem;
  private controls!: MobileControls;
  private hud!: Hud;
  private countdownText!: Phaser.GameObjects.Text;
  private arenaBackground!: Phaser.GameObjects.Image;
  private arenaShade!: Phaser.GameObjects.Rectangle;
  private pauseButton!: Phaser.GameObjects.Container;
  private fullscreenButton!: Phaser.GameObjects.Container;
  private pauseOverlay?: Phaser.GameObjects.Container;
  private currentArenaBackgroundKey = "";

  private score = 0;
  private hp = 5;
  private activeElapsedMs = 0;
  private runFinished = false;
  private fightStarted = false;
  private fightPaused = false;
  private lastShownWave = 1;
  private lastUpgradeWave = 1;
  private upgradeChoicesTaken = 0;
  private nextUpgradeDefeatedTarget = 7;
  private upgradeOverlayActive = false;
  private contactDamageReadyAt = 0;
  private hazardDamageReadyAt = 0;

  constructor() {
    super(SCENE_KEYS.arena);
  }

  create(): void {
    this.score = 0;
    this.hp = 5;
    this.activeElapsedMs = 0;
    this.runFinished = false;
    this.fightStarted = false;
    this.fightPaused = false;
    this.lastShownWave = 1;
    this.lastUpgradeWave = 1;
    this.upgradeChoicesTaken = 0;
    this.nextUpgradeDefeatedTarget = 7;
    this.upgradeOverlayActive = false;
    this.contactDamageReadyAt = 0;
    this.hazardDamageReadyAt = 0;
    this.currentArenaBackgroundKey = "";

    this.createArenaBackground();

    this.player = new PlayerMascot(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 18);
    this.waves = new WaveSystem(this);
    this.controls = new MobileControls(this);
    this.hud = new Hud(this);
    this.createPauseButton();
    this.input.once("pointerdown", () => {
      void requestAppFullscreen(document.documentElement);
    });

    this.hud.update(this.getHudState());
    this.createCountdown();
    this.startCountdown();

    this.physics.add.overlap(
      this.player.sprite,
      this.waves.group,
      (_, enemy) => this.onEnemyContact(enemy as Phaser.Physics.Arcade.Sprite),
    );

    this.physics.add.overlap(
      this.player.sprite,
      this.waves.projectiles,
      (_, projectile) => this.onProjectileHit(projectile as Phaser.Physics.Arcade.Sprite),
    );
  }

  update(_time: number, delta: number): void {
    if (this.runFinished) return;

    if (!this.fightStarted || this.fightPaused) {
      this.hud.update(this.getHudState());
      return;
    }

    const input = this.controls.getInputState();
    this.player.update(input, delta);
    this.player.keepInsideArena();

    const attack = this.player.consumeAttackStarted();
    if (attack) {
      this.resolvePlayerAttack(attack);
    }

    const slash = this.player.consumeSlashStarted();
    if (slash) {
      this.resolveDashSlash(slash);
    }

    if (this.player.consumePulseStarted()) {
      this.resolveSafePulse();
    }

    if (this.player.consumeShieldStarted()) {
      this.resolveLeakShield();
    }

    this.activeElapsedMs += delta;
    this.waves.update(this.activeElapsedMs, delta, this.player.sprite.x, this.player.sprite.y, this.fightPaused);
    this.checkHazardDamage();

    if (this.waves.currentWave !== this.lastShownWave) {
      this.lastShownWave = this.waves.currentWave;
      this.updateArenaBackgroundForWave(this.lastShownWave);
      this.showWaveBanner(this.lastShownWave);

      if (this.lastShownWave >= 2 && this.lastShownWave % 2 === 0 && this.lastUpgradeWave !== this.lastShownWave) {
        this.time.delayedCall(450, () => this.showUpgradeChoice(`Wave ${this.lastShownWave} cleared`));
      }
    }

    this.score += Math.floor(delta / 120);

    const bossRewardWave = this.waves.consumeBossRewardWave();
    if (bossRewardWave > 0 && !this.upgradeOverlayActive && !this.fightPaused) {
      this.time.delayedCall(420, () => this.showUpgradeChoice(`Boss wave ${bossRewardWave} cleared`));
    } else {
      this.maybeOfferDefeatUpgrade();
    }

    this.hud.update(this.getHudState());
  }

  private createArenaBackground(): void {
    this.arenaBackground = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "arena-bg-01")
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setDepth(0);

    this.arenaShade = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x030406, 0.36)
      .setDepth(1);

    // Wide landscape arena: readable center, controls stay outside the main fight focus.
    this.add.ellipse(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 12, 590, 300, 0x071007, 0.22)
      .setStrokeStyle(3, 0x39ff14, 0.2)
      .setDepth(4);
    this.add.ellipse(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 12, 500, 240, 0x050805, 0.08)
      .setStrokeStyle(2, 0xb66cff, 0.12)
      .setDepth(4);

    for (let i = -2; i <= 2; i += 1) {
      const y = GAME_HEIGHT / 2 + 12 + i * 38;
      this.add.line(0, 0, 188, y, GAME_WIDTH - 188, y, 0x39ff14, 0.055)
        .setOrigin(0, 0)
        .setDepth(4);
    }

    for (let i = -2; i <= 2; i += 1) {
      const x = GAME_WIDTH / 2 + i * 72;
      this.add.line(0, 0, x, 105, x, GAME_HEIGHT - 88, 0xb66cff, 0.045)
        .setOrigin(0, 0)
        .setDepth(4);
    }

    // Soft masks behind thumb zones so buttons are readable without covering the arena.
    this.add.rectangle(112, GAME_HEIGHT - 78, 210, 144, 0x020402, 0.22)
      .setDepth(5);
    this.add.rectangle(GAME_WIDTH - 126, GAME_HEIGHT - 82, 250, 154, 0x020402, 0.22)
      .setDepth(5);

    this.updateArenaBackgroundForWave(1);
  }

  private createPauseButton(): void {
    const fullBg = this.add.circle(GAME_WIDTH - 86, 34, 18, 0x050805, 0.72)
      .setStrokeStyle(2, 0xb66cff, 0.3);
    const fullIcon = this.add.text(GAME_WIDTH - 86, 34, "⛶", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#f5fff1",
      fontStyle: "bold",
      stroke: "#050805",
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.fullscreenButton = this.add.container(0, 0, [fullBg, fullIcon]).setDepth(85);
    fullBg.setInteractive({ useHandCursor: true });
    fullBg.on("pointerdown", () => {
      void toggleAppFullscreen(document.documentElement);
    });

    const bg = this.add.circle(GAME_WIDTH - 34, 34, 20, 0x050805, 0.72)
      .setStrokeStyle(2, 0x39ff14, 0.3);
    const bars = this.add.text(GAME_WIDTH - 34, 34, "II", {
      fontFamily: "Arial",
      fontSize: "20px",
      color: "#f5fff1",
      fontStyle: "bold",
      stroke: "#050805",
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.pauseButton = this.add.container(0, 0, [bg, bars]).setDepth(85);
    bg.setInteractive({ useHandCursor: true });
    bg.on("pointerdown", () => this.togglePauseState());
  }

  private togglePauseState(): void {
    if (!this.fightStarted || this.runFinished || this.upgradeOverlayActive) return;

    this.fightPaused = !this.fightPaused;

    if (this.fightPaused) {
      this.physics.pause();
      const dim = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.45);
      const panel = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 260, 118, 0x050805, 0.9)
        .setStrokeStyle(2, 0x39ff14, 0.35);
      const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 18, "PAUSED", {
        fontFamily: "Arial", fontSize: "28px", color: "#39ff14", fontStyle: "bold", stroke: "#050805", strokeThickness: 5,
      }).setOrigin(0.5);
      const hint = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20, "Tap pause again to continue", {
        fontFamily: "Arial", fontSize: "14px", color: "#f5fff1", stroke: "#050805", strokeThickness: 3,
      }).setOrigin(0.5);
      this.pauseOverlay = this.add.container(0, 0, [dim, panel, title, hint]).setDepth(149);
    } else {
      this.physics.resume();
      this.pauseOverlay?.destroy(true);
      this.pauseOverlay = undefined;
    }
  }

  private updateArenaBackgroundForWave(wave: number): void {
    const index = Phaser.Math.Clamp(Math.floor((wave - 1) / 2) + 1, 1, 10);
    const nextKey = `arena-bg-${String(index).padStart(2, "0")}`;
    if (this.currentArenaBackgroundKey === nextKey) return;
    this.currentArenaBackgroundKey = nextKey;
    this.arenaBackground.setTexture(nextKey);

    const shadeAlpha = wave % 3 === 0 ? 0.44 : 0.36;
    this.arenaShade.setFillStyle(0x030406, shadeAlpha);
  }

  private createCountdown(): void {
    this.countdownText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 18, "3", {
      fontFamily: "Arial",
      fontSize: "72px",
      color: "#39ff14",
      fontStyle: "bold",
      stroke: "#050805",
      strokeThickness: 8,
    }).setOrigin(0.5).setDepth(120);
  }

  private getHudState() {
    const cooldowns = this.player?.getCooldownState() ?? {
      attackReady: true,
      dodgeReady: true,
      pulseReady: true,
      shieldReady: true,
      slashReady: true,
      shieldActive: false,
      shieldCharges: 0,
    };

    return {
      hp: this.hp,
      maxHp: 5 + (this.player?.getMaxHpBonus() ?? 0),
      score: this.score,
      wave: this.waves?.currentWave ?? 1,
      defeated: this.waves?.defeatedCount ?? 0,
      survivedSeconds: Math.floor(this.activeElapsedMs / 1000),
      bossActive: Boolean(this.waves?.bossActive),
      comboStep: this.player?.getComboStep() ?? 0,
      upgradeCount: this.upgradeChoicesTaken,
      nextUpgradeIn: Math.max(0, this.nextUpgradeDefeatedTarget - (this.waves?.defeatedCount ?? 0)),
      ...cooldowns,
    };
  }

  private startCountdown(): void {
    const steps = ["3", "2", "1", "FIGHT"];
    steps.forEach((label, index) => {
      this.time.delayedCall(index * 700, () => {
        this.countdownText.setText(label);
        this.countdownText.setScale(label === "FIGHT" ? 0.9 : 1.15);
        this.tweens.add({
          targets: this.countdownText,
          scale: label === "FIGHT" ? 1.06 : 0.92,
          duration: 240,
          yoyo: true,
        });
      });
    });

    this.time.delayedCall(steps.length * 700, () => {
      this.fightStarted = true;
      this.activeElapsedMs = 0;
      this.waves.spawnOpeningPack(this.player.sprite.x, this.player.sprite.y);
      this.showFloatingText("OPENING WAVE", GAME_WIDTH / 2, 84, "#39ff14");
      this.tweens.add({
        targets: this.countdownText,
        alpha: 0,
        duration: 260,
        onComplete: () => this.countdownText.destroy(),
      });
    });
  }

  private resolvePlayerAttack(attack: AttackSpec): void {
    this.showAttackArc(attack);

    const hitResult = this.waves.hitEnemiesInArc(this.player.sprite.x, this.player.sprite.y, attack);
    if (hitResult.hits <= 0) {
      return;
    }

    const points = hitResult.score + hitResult.hits * 6 + (attack.comboStep === 3 ? 28 : 0);
    this.score += points;
    this.cameras.main.flash(42, 57, 255, 20, false);
    if (attack.comboStep === 3 || hitResult.bossHit) this.cameras.main.shake(45, 0.0014);
    this.showFloatingText(
      `HIT x${hitResult.hits} +${points}`,
      this.player.sprite.x,
      this.player.sprite.y - 64,
      hitResult.bossHit ? "#b66cff" : "#39ff14",
    );
    if (hitResult.defeated > 0) this.maybeOfferDefeatUpgrade();
  }

  private resolveDashSlash(attack: AttackSpec): void {
    this.showDashSlash(attack);
    const hitResult = this.waves.hitEnemiesInArc(this.player.sprite.x, this.player.sprite.y, attack);
    const points = hitResult.score + hitResult.hits * 18 + (hitResult.bossHit ? 55 : 0);
    this.score += points;

    if (hitResult.hits > 0) {
      this.cameras.main.shake(hitResult.bossHit ? 95 : 64, hitResult.bossHit ? 0.003 : 0.0019);
      this.showFloatingText(`SLASH x${hitResult.hits} +${points}`, this.player.sprite.x, this.player.sprite.y - 70, "#39ff14");
    }
    if (hitResult.defeated > 0) this.maybeOfferDefeatUpgrade();
  }

  private resolveSafePulse(): void {
    this.showSafePulse();
    const damage = this.player.getPulsePower();
    const hitResult = this.waves.hitEnemiesNear(this.player.sprite.x, this.player.sprite.y, this.player.getPulseRadius(), damage, 12);
    const points = hitResult.score + hitResult.hits * 12 + (hitResult.bossHit ? 40 : 0);
    this.score += points;

    if (hitResult.hits > 0) {
      this.cameras.main.shake(hitResult.bossHit ? 90 : 58, hitResult.bossHit ? 0.0028 : 0.0016);
    }
    this.showFloatingText(hitResult.hits > 0 ? `PULSE x${hitResult.hits} +${points}` : "PULSE", this.player.sprite.x, this.player.sprite.y - 70, "#39ff14");
    if (hitResult.defeated > 0) this.maybeOfferDefeatUpgrade();
  }

  private resolveLeakShield(): void {
    this.showLeakShield();
    this.showFloatingText(`SHIELD x${this.player.getShieldCapacity()}`, this.player.sprite.x, this.player.sprite.y - 70, "#39ff14");
  }

  private onEnemyContact(enemy: Phaser.Physics.Arcade.Sprite): void {
    if (this.runFinished || !this.fightStarted || this.fightPaused || !enemy.active) return;
    if (this.player.isInvincible) return;

    const now = Date.now();
    if (now < this.contactDamageReadyAt) return;
    this.contactDamageReadyAt = now + 620;

    const damage = Boolean(enemy.getData("boss")) ? 2 : 1;
    this.damagePlayer(damage, "HIT");

    const push = new Phaser.Math.Vector2(this.player.sprite.x - enemy.x, this.player.sprite.y - enemy.y);
    if (push.lengthSq() <= 0) push.set(1, 0);
    push.normalize().scale(265);
    this.player.sprite.setVelocity(push.x, push.y);
  }

  private onProjectileHit(projectile: Phaser.Physics.Arcade.Sprite): void {
    if (this.runFinished || !this.fightStarted || this.fightPaused || !projectile.active) return;
    projectile.disableBody(true, true);
    if (this.player.isInvincible) {
      this.showFloatingText("DODGED", this.player.sprite.x, this.player.sprite.y - 58, "#b66cff");
      return;
    }

    this.damagePlayer(Number(projectile.getData("damage") ?? 1), "SCAM HIT");
  }

  private checkHazardDamage(): void {
    if (this.player.isInvincible || !this.waves.isPointInActiveHazard(this.player.sprite.x, this.player.sprite.y)) return;

    const now = Date.now();
    if (now < this.hazardDamageReadyAt) return;
    this.hazardDamageReadyAt = now + 900;
    this.damagePlayer(1, "SMOKE");
  }

  private damagePlayer(amount: number, label: string): void {
    if (this.player.tryBlockDamage()) {
      this.cameras.main.shake(70, 0.003);
      this.showBlockFlash();
      this.showFloatingText("BLOCK", this.player.sprite.x, this.player.sprite.y - 62, "#39ff14");
      return;
    }

    this.hp -= amount;
    this.player.flashHit();
    this.cameras.main.flash(70, 255, 51, 85, false);
    this.cameras.main.shake(105, 0.0042);
    this.showFloatingText(`-${amount} HP`, this.player.sprite.x, this.player.sprite.y - 58, "#ff3355");
    this.showFloatingText(label, this.player.sprite.x, this.player.sprite.y - 78, "#ff9aaa");

    if (this.hp <= 0) {
      this.finishRun();
    }
  }

  private showAttackArc(attack: AttackSpec): void {
    const direction = attack.direction.clone().normalize();
    const centerX = this.player.sprite.x + direction.x * (attack.range * 0.48);
    const centerY = this.player.sprite.y + direction.y * (attack.range * 0.42);
    const frame = attack.comboStep === 3 ? 2 : 1;
    const fx = this.add.image(centerX, centerY, "arena-vfx-sheet", frame)
      .setScale(attack.comboStep === 3 ? 0.24 : 0.2)
      .setRotation(direction.angle())
      .setDepth(30)
      .setAlpha(0.95);

    const streak = this.add.line(0, 0, this.player.sprite.x, this.player.sprite.y, centerX, centerY, 0x39ff14, attack.comboStep === 3 ? 0.72 : 0.46)
      .setOrigin(0, 0)
      .setLineWidth(attack.comboStep === 3 ? 5 : 3)
      .setDepth(36);

    this.tweens.add({
      targets: streak,
      alpha: 0,
      duration: 120,
      onComplete: () => streak.destroy(),
    });

    this.tweens.add({
      targets: fx,
      scaleX: fx.scaleX * 1.18,
      scaleY: fx.scaleY * 1.18,
      alpha: 0,
      duration: 170,
      onComplete: () => fx.destroy(),
    });
  }

  private showDashSlash(attack: AttackSpec): void {
    const direction = attack.direction.clone().normalize();
    const midX = this.player.sprite.x + direction.x * 86;
    const midY = this.player.sprite.y + direction.y * 86;
    const endX = this.player.sprite.x + direction.x * 170;
    const endY = this.player.sprite.y + direction.y * 170;

    const trail = this.add.image(midX, midY, "arena-vfx-sheet", 5)
      .setScale(0.26)
      .setRotation(direction.angle())
      .setDepth(37)
      .setAlpha(0.92);
    const impact = this.add.image(endX, endY, "arena-vfx-sheet", 2)
      .setScale(0.24)
      .setRotation(direction.angle())
      .setDepth(38);
    const line = this.add.line(0, 0, this.player.sprite.x, this.player.sprite.y, endX, endY, 0x39ff14, 0.74)
      .setOrigin(0, 0)
      .setLineWidth(5)
      .setDepth(39);

    this.tweens.add({
      targets: [trail, impact, line],
      alpha: 0,
      duration: 230,
      onComplete: () => {
        trail.destroy();
        impact.destroy();
      },
    });
  }

  private showSafePulse(): void {
    const logicRadius = this.player.getPulseRadius();
    const visualRadius = Math.min(76, Math.max(44, logicRadius * 0.34));
    const ring = this.add.circle(this.player.sprite.x, this.player.sprite.y, 10, 0x39ff14, 0.08)
      .setStrokeStyle(5, 0x78ff62, 0.82)
      .setDepth(35);
    const innerRing = this.add.circle(this.player.sprite.x, this.player.sprite.y, 8, 0xbfff8d, 0.04)
      .setStrokeStyle(2, 0xf5fff1, 0.36)
      .setDepth(36);
    const glow = this.add.circle(this.player.sprite.x, this.player.sprite.y, 8, 0xbfff8d, 0.22)
      .setDepth(34);

    this.tweens.add({
      targets: ring,
      radius: visualRadius,
      alpha: 0,
      duration: 220,
      ease: "Cubic.easeOut",
      onComplete: () => ring.destroy(),
    });

    this.tweens.add({
      targets: innerRing,
      radius: visualRadius * 0.72,
      alpha: 0,
      duration: 190,
      ease: "Cubic.easeOut",
      onComplete: () => innerRing.destroy(),
    });

    this.tweens.add({
      targets: glow,
      radius: visualRadius * 0.55,
      alpha: 0,
      duration: 210,
      ease: "Cubic.easeOut",
      onComplete: () => glow.destroy(),
    });
  }

  private showLeakShield(): void {
    const shield = this.add.circle(this.player.sprite.x, this.player.sprite.y, 20, 0x39ff14, 0.04)
      .setStrokeStyle(3, 0x39ff14, 0.42)
      .setDepth(34);

    this.tweens.add({
      targets: shield,
      radius: 26,
      alpha: 0.12,
      duration: 2850,
      onUpdate: () => {
        if (!this.player?.sprite.active) return;
        shield.setPosition(this.player.sprite.x, this.player.sprite.y);
      },
      onComplete: () => shield.destroy(),
    });
  }

  private showBlockFlash(): void {
    const block = this.add.image(this.player.sprite.x, this.player.sprite.y, "arena-vfx-sheet", 8)
      .setScale(0.18)
      .setDepth(36)
      .setAlpha(0.9);
    const guard = this.add.circle(this.player.sprite.x, this.player.sprite.y, 22, 0x39ff14, 0.03)
      .setStrokeStyle(4, 0x39ff14, 0.65)
      .setDepth(37);

    this.tweens.add({
      targets: [block, guard],
      scaleX: 1.35,
      scaleY: 1.35,
      alpha: 0,
      duration: 220,
      onComplete: () => {
        block.destroy();
        guard.destroy();
      },
    });
  }

  private showWaveBanner(wave: number): void {
    const isBossWave = wave % 3 === 0;
    const text = this.add.text(GAME_WIDTH / 2, 86, isBossWave ? `WAVE ${wave}: MINI-BOSS PATTERN` : `WAVE ${wave}`, {
      fontFamily: "Arial",
      fontSize: isBossWave ? "18px" : "20px",
      color: isBossWave ? "#b66cff" : "#39ff14",
      fontStyle: "bold",
      stroke: "#050805",
      strokeThickness: 5,
    }).setOrigin(0.5).setDepth(100);

    this.tweens.add({
      targets: text,
      y: 64,
      alpha: 0,
      duration: 1150,
      ease: "Cubic.easeOut",
      onComplete: () => text.destroy(),
    });
  }

  private maybeOfferDefeatUpgrade(): void {
    if (this.runFinished || this.fightPaused || this.upgradeOverlayActive) return;
    if ((this.waves?.defeatedCount ?? 0) < this.nextUpgradeDefeatedTarget) return;
    this.showUpgradeChoice(`${this.nextUpgradeDefeatedTarget} leaks defeated`);
  }

  private showUpgradeChoice(reason: string): void {
    if (this.runFinished || this.fightPaused || this.upgradeOverlayActive) return;
    if (this.waves?.currentWave) this.lastUpgradeWave = this.waves.currentWave;
    this.upgradeOverlayActive = true;
    this.fightPaused = true;
    this.physics.pause();

    const overlayObjects: Phaser.GameObjects.GameObject[] = [];
    const add = <T extends Phaser.GameObjects.GameObject>(obj: T): T => {
      overlayObjects.push(obj);
      return obj;
    };

    add(this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.74).setDepth(150));
    add(this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH - 110, GAME_HEIGHT - 90, 0x071107, 0.98)
      .setStrokeStyle(2, 0x39ff14, 0.55)
      .setDepth(151));

    add(this.add.text(GAME_WIDTH / 2, 84, "ROGUELITE UPGRADE", {
      fontFamily: "Arial",
      fontSize: "24px",
      color: "#39ff14",
      fontStyle: "bold",
      stroke: "#050805",
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(152));

    add(this.add.text(GAME_WIDTH / 2, 112, reason.toUpperCase(), {
      fontFamily: "Arial",
      fontSize: "12px",
      color: "#9cff8a",
      fontStyle: "bold",
    }).setOrigin(0.5).setDepth(152));

    add(this.add.text(GAME_WIDTH / 2, 136, "Choose one build path for this run", {
      fontFamily: "Arial",
      fontSize: "12px",
      color: "#f5fff1",
    }).setOrigin(0.5).setDepth(152));

    const options = this.pickUpgradeOptions();
    options.forEach((option, index) => {
      const y = 192 + index * 80;
      const stroke = option.rarity === "rare" ? 0xb66cff : option.rarity === "survival" ? 0xff3355 : 0x39ff14;
      const fill = option.rarity === "rare" ? 0x130821 : option.rarity === "survival" ? 0x1a080b : 0x0d210d;

      const card = add(this.add.rectangle(GAME_WIDTH / 2, y, GAME_WIDTH - 170, 62, fill, 0.96)
        .setStrokeStyle(2, stroke, 0.62)
        .setDepth(152)
        .setInteractive({ useHandCursor: true }));

      add(this.add.text(128, y - 23, option.tag, {
        fontFamily: "Arial",
        fontSize: "10px",
        color: option.rarity === "rare" ? "#d6a8ff" : option.rarity === "survival" ? "#ff9aaa" : "#9cff8a",
        fontStyle: "bold",
      }).setDepth(153));

      add(this.add.text(128, y - 8, option.title, {
        fontFamily: "Arial",
        fontSize: "17px",
        color: "#f5fff1",
        fontStyle: "bold",
      }).setDepth(153));

      add(this.add.text(128, y + 12, option.description, {
        fontFamily: "Arial",
        fontSize: "12px",
        color: "#9cff8a",
      }).setDepth(153));

      card.on("pointerdown", () => {
        const message = this.player.applyUpgrade(option.id);
        this.upgradeChoicesTaken += 1;
        this.nextUpgradeDefeatedTarget += 7 + Math.min(5, this.upgradeChoicesTaken * 2);

        if (option.id === "heart") {
          this.hp = Math.min(this.hp + 2, 5 + this.player.getMaxHpBonus());
        }

        overlayObjects.forEach((obj) => obj.destroy());
        this.physics.resume();
        this.upgradeOverlayActive = false;
        this.fightPaused = false;
        this.showUpgradeToast(option.title, message);
        this.hud.update(this.getHudState());
      });
    });
  }

  private pickUpgradeOptions(): UpgradeOption[] {
    const pool = [...UPGRADE_POOL];
    const rareCount = this.upgradeChoicesTaken >= 1 ? 1 : 0;
    const rareOptions = Phaser.Utils.Array.Shuffle(pool.filter((option) => option.rarity === "rare")).slice(0, rareCount);
    const remaining = Phaser.Utils.Array.Shuffle(pool.filter((option) => !rareOptions.includes(option)));
    return Phaser.Utils.Array.Shuffle([...rareOptions, ...remaining]).slice(0, 3);
  }

  private showUpgradeToast(title: string, message: string): void {
    const panel = this.add.rectangle(GAME_WIDTH / 2, 92, 360, 56, 0x071107, 0.94)
      .setStrokeStyle(2, 0x39ff14, 0.45)
      .setDepth(155);
    const titleText = this.add.text(GAME_WIDTH / 2, 81, title.toUpperCase(), {
      fontFamily: "Arial",
      fontSize: "14px",
      color: "#39ff14",
      fontStyle: "bold",
    }).setOrigin(0.5).setDepth(156);
    const bodyText = this.add.text(GAME_WIDTH / 2, 100, message, {
      fontFamily: "Arial",
      fontSize: "11px",
      color: "#f5fff1",
      align: "center",
    }).setOrigin(0.5).setDepth(156);

    this.tweens.add({
      targets: [panel, titleText, bodyText],
      y: "-=18",
      alpha: 0,
      delay: 1050,
      duration: 520,
      onComplete: () => {
        panel.destroy();
        titleText.destroy();
        bodyText.destroy();
      },
    });
  }

  private showFloatingText(text: string, x: number, y: number, color: string): void {
    const label = this.add.text(x, y, text, {
      fontFamily: "Arial",
      fontSize: "14px",
      color,
      fontStyle: "bold",
      stroke: "#050805",
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(160);

    this.tweens.add({
      targets: label,
      y: y - 28,
      alpha: 0,
      duration: 760,
      onComplete: () => label.destroy(),
    });
  }

  private finishRun(): void {
    if (this.runFinished) return;
    this.runFinished = true;
    this.pauseOverlay?.destroy(true);
    this.waves.clearAll();
    this.physics.pause();

    const result: RunResult = {
      score: this.score,
      leaksDefeated: this.waves.defeatedCount,
      survivedSeconds: Math.floor(this.activeElapsedMs / 1000),
      bossDamage: Math.floor(this.score * 0.14),
      safePoints: Math.floor(this.score * 0.08),
      upgradesChosen: this.upgradeChoicesTaken,
    };

    this.scene.start(SCENE_KEYS.result, result);
  }
}
