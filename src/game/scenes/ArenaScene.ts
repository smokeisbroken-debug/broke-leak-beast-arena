import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../../config/game";
import { SCENE_KEYS } from "../../config/routes";
import { COLORS } from "../../config/theme";
import { PlayerMascot } from "../entities/PlayerMascot";
import { WaveSystem } from "../systems/WaveSystem";
import { MobileControls } from "../ui/MobileControls";
import { Hud } from "../ui/Hud";
import type { AttackSpec, RunResult } from "../types/game";

interface UpgradeOption {
  id: "damage" | "speed" | "dash" | "pulse" | "heart";
  title: string;
  description: string;
}

const UPGRADE_POOL: UpgradeOption[] = [
  { id: "damage", title: "Razor Combo", description: "+1 damage on every hit" },
  { id: "speed", title: "Clean Footwork", description: "+movement speed" },
  { id: "dash", title: "Leak Step", description: "faster dodge cooldown" },
  { id: "pulse", title: "Safe Pulse+", description: "stronger pulse skill" },
  { id: "heart", title: "Wallet HP", description: "+max HP and heal" },
];

export class ArenaScene extends Phaser.Scene {
  private player!: PlayerMascot;
  private waves!: WaveSystem;
  private controls!: MobileControls;
  private hud!: Hud;
  private countdownText!: Phaser.GameObjects.Text;

  private score = 0;
  private hp = 5;
  private activeElapsedMs = 0;
  private runFinished = false;
  private fightStarted = false;
  private fightPaused = false;
  private lastShownWave = 1;
  private lastUpgradeWave = 1;
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
    this.contactDamageReadyAt = 0;
    this.hazardDamageReadyAt = 0;

    this.createArenaBackground();

    this.player = new PlayerMascot(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80);
    this.waves = new WaveSystem(this);
    this.controls = new MobileControls(this);
    this.hud = new Hud(this);

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

    if (this.player.consumeSkillStarted()) {
      this.resolveSafePulse();
    }

    this.activeElapsedMs += delta;
    this.waves.update(this.activeElapsedMs, delta, this.player.sprite.x, this.player.sprite.y, this.fightPaused);
    this.checkHazardDamage();

    if (this.waves.currentWave !== this.lastShownWave) {
      this.lastShownWave = this.waves.currentWave;
      this.showWaveBanner(this.lastShownWave);

      if (this.lastShownWave >= 2 && this.lastShownWave % 2 === 0 && this.lastUpgradeWave !== this.lastShownWave) {
        this.time.delayedCall(450, () => this.showUpgradeChoice(this.lastShownWave));
      }
    }

    this.score += Math.floor(delta / 120);
    this.hud.update(this.getHudState());
  }

  private createArenaBackground(): void {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.bg);
    this.add.circle(62, 145, 170, 0x123b10, 0.18);
    this.add.circle(GAME_WIDTH + 8, 105, 150, 0x40106b, 0.19);

    for (let x = 30; x < GAME_WIDTH; x += 48) {
      this.add.line(0, 0, x, 92, x - 22, GAME_HEIGHT - 132, 0x123b10, 0.15).setOrigin(0, 0).setDepth(1);
    }
    for (let y = 125; y < GAME_HEIGHT - 125; y += 58) {
      this.add.line(0, 0, 12, y, GAME_WIDTH - 12, y + 6, 0x123b10, 0.14).setOrigin(0, 0).setDepth(1);
    }

    this.add.text(20, 24, "LEAK BEAST ARENA", {
      fontFamily: "Arial",
      fontSize: "20px",
      color: "#39ff14",
      fontStyle: "bold",
    }).setDepth(5);
  }

  private createCountdown(): void {
    this.countdownText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 66, "3", {
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
      skillReady: true,
    };

    return {
      hp: this.hp,
      score: this.score,
      wave: this.waves?.currentWave ?? 1,
      defeated: this.waves?.defeatedCount ?? 0,
      survivedSeconds: Math.floor(this.activeElapsedMs / 1000),
      bossActive: Boolean(this.waves?.bossActive),
      comboStep: this.player?.getComboStep() ?? 0,
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
      this.showFloatingText(`COMBO ${attack.comboStep}: MISS`, this.player.sprite.x, this.player.sprite.y - 54, "#88aa88");
      return;
    }

    const points = hitResult.score + hitResult.hits * 6 + (attack.comboStep === 3 ? 28 : 0);
    this.score += points;
    this.cameras.main.flash(55, 57, 255, 20, false);
    this.showFloatingText(
      `COMBO ${attack.comboStep} +${points}`,
      this.player.sprite.x,
      this.player.sprite.y - 64,
      hitResult.bossHit ? "#b66cff" : "#39ff14",
    );
  }

  private resolveSafePulse(): void {
    this.showSafePulse();
    const damage = this.player.getSkillPower();
    const hitResult = this.waves.hitEnemiesNear(this.player.sprite.x, this.player.sprite.y, 142, damage, 12);
    const points = hitResult.score + hitResult.hits * 12 + (hitResult.bossHit ? 40 : 0);
    this.score += points;

    this.cameras.main.shake(90, 0.004);
    this.showFloatingText(hitResult.hits > 0 ? `SAFE PULSE +${points}` : "SAFE PULSE", this.player.sprite.x, this.player.sprite.y - 86, "#39ff14");
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
    this.hp -= amount;
    this.player.flashHit();
    this.cameras.main.shake(135, 0.008);
    this.showFloatingText(`-${amount} HP ${label}`, this.player.sprite.x, this.player.sprite.y - 58, "#ff3355");

    if (this.hp <= 0) {
      this.finishRun();
    }
  }

  private showAttackArc(attack: AttackSpec): void {
    const direction = attack.direction.clone().normalize();
    const centerX = this.player.sprite.x + direction.x * (attack.range * 0.46);
    const centerY = this.player.sprite.y + direction.y * (attack.range * 0.46);
    const color = attack.comboStep === 3 ? 0xb66cff : 0x39ff14;

    const arc = this.add.ellipse(centerX, centerY, attack.range * 1.05, attack.range * 0.62)
      .setStrokeStyle(4, color, 0.88)
      .setDepth(30);
    arc.rotation = direction.angle();

    this.tweens.add({
      targets: arc,
      scaleX: 1.25,
      scaleY: 1.25,
      alpha: 0,
      duration: 170,
      onComplete: () => arc.destroy(),
    });
  }

  private showSafePulse(): void {
    const ring = this.add.circle(this.player.sprite.x, this.player.sprite.y, 35)
      .setStrokeStyle(5, 0x39ff14, 0.95)
      .setDepth(35);

    this.tweens.add({
      targets: ring,
      radius: 150,
      alpha: 0,
      duration: 270,
      onComplete: () => ring.destroy(),
    });
  }

  private showWaveBanner(wave: number): void {
    const isBossWave = wave % 3 === 0;
    const text = this.add.text(GAME_WIDTH / 2, 144, isBossWave ? `WAVE ${wave}: MINI-BOSS PATTERN` : `WAVE ${wave}`, {
      fontFamily: "Arial",
      fontSize: isBossWave ? "22px" : "22px",
      color: isBossWave ? "#b66cff" : "#39ff14",
      fontStyle: "bold",
      stroke: "#050805",
      strokeThickness: 5,
    }).setOrigin(0.5).setDepth(100);

    this.tweens.add({
      targets: text,
      y: 116,
      alpha: 0,
      duration: 1150,
      ease: "Cubic.easeOut",
      onComplete: () => text.destroy(),
    });
  }

  private showUpgradeChoice(wave: number): void {
    if (this.runFinished || this.fightPaused || wave === this.lastUpgradeWave) return;
    this.lastUpgradeWave = wave;
    this.fightPaused = true;
    this.physics.pause();

    const overlayObjects: Phaser.GameObjects.GameObject[] = [];
    const add = <T extends Phaser.GameObjects.GameObject>(obj: T): T => {
      overlayObjects.push(obj);
      return obj;
    };

    add(this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.68).setDepth(150));
    add(this.add.rectangle(GAME_WIDTH / 2, 264, GAME_WIDTH - 34, 300, 0x071107, 0.96).setStrokeStyle(2, 0x39ff14, 0.55).setDepth(151));
    add(this.add.text(GAME_WIDTH / 2, 142, "CHOOSE UPGRADE", {
      fontFamily: "Arial",
      fontSize: "24px",
      color: "#39ff14",
      fontStyle: "bold",
    }).setOrigin(0.5).setDepth(152));

    const options = Phaser.Utils.Array.Shuffle([...UPGRADE_POOL]).slice(0, 3);
    options.forEach((option, index) => {
      const y = 198 + index * 76;
      const card = add(this.add.rectangle(GAME_WIDTH / 2, y, GAME_WIDTH - 72, 58, 0x123b10, 0.92)
        .setStrokeStyle(2, option.id === "heart" ? 0xff3355 : 0x39ff14, 0.36)
        .setDepth(152)
        .setInteractive({ useHandCursor: true }));

      add(this.add.text(64, y - 18, option.title, {
        fontFamily: "Arial",
        fontSize: "16px",
        color: "#f5fff1",
        fontStyle: "bold",
      }).setDepth(153));

      add(this.add.text(64, y + 5, option.description, {
        fontFamily: "Arial",
        fontSize: "13px",
        color: "#9cff8a",
      }).setDepth(153));

      card.on("pointerdown", () => {
        const message = this.player.applyUpgrade(option.id);
        if (option.id === "heart") this.hp = Math.min(this.hp + 2, 5 + this.player.getMaxHpBonus());
        overlayObjects.forEach((obj) => obj.destroy());
        this.physics.resume();
        this.fightPaused = false;
        this.showFloatingText(message, GAME_WIDTH / 2, 150, "#39ff14");
      });
    });
  }

  private showFloatingText(text: string, x: number, y: number, color: string): void {
    const label = this.add.text(x, y, text, {
      fontFamily: "Arial",
      fontSize: "16px",
      color,
      fontStyle: "bold",
      stroke: "#050805",
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(160);

    this.tweens.add({
      targets: label,
      y: y - 36,
      alpha: 0,
      duration: 760,
      onComplete: () => label.destroy(),
    });
  }

  private finishRun(): void {
    if (this.runFinished) return;
    this.runFinished = true;
    this.waves.clearAll();
    this.physics.pause();

    const result: RunResult = {
      score: this.score,
      leaksDefeated: this.waves.defeatedCount,
      survivedSeconds: Math.floor(this.activeElapsedMs / 1000),
      bossDamage: Math.floor(this.score * 0.14),
      safePoints: Math.floor(this.score * 0.08),
    };

    this.scene.start(SCENE_KEYS.result, result);
  }
}
