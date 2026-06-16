import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../../config/game";
import { SCENE_KEYS } from "../../config/routes";
import { COLORS } from "../../config/theme";
import { PlayerMascot } from "../entities/PlayerMascot";
import { WaveSystem } from "../systems/WaveSystem";
import { MobileControls } from "../ui/MobileControls";
import { Hud } from "../ui/Hud";
import type { RunResult } from "../types/game";

export class ArenaScene extends Phaser.Scene {
  private player!: PlayerMascot;
  private waves!: WaveSystem;
  private controls!: MobileControls;
  private hud!: Hud;
  private countdownText!: Phaser.GameObjects.Text;

  private score = 0;
  private hp = 5;
  private runStartedAt = 0;
  private runFinished = false;
  private fightStarted = false;
  private lastShownWave = 1;

  constructor() {
    super(SCENE_KEYS.arena);
  }

  create(): void {
    this.score = 0;
    this.hp = 5;
    this.runStartedAt = Date.now();
    this.runFinished = false;
    this.fightStarted = false;
    this.lastShownWave = 1;

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.bg);
    this.add.circle(62, 145, 170, 0x123b10, 0.18);
    this.add.circle(GAME_WIDTH + 8, 105, 150, 0x40106b, 0.19);

    this.add.text(20, 24, "LEAK BEAST ARENA", {
      fontFamily: "Arial",
      fontSize: "20px",
      color: "#39ff14",
      fontStyle: "bold",
    });

    this.player = new PlayerMascot(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80);
    this.waves = new WaveSystem(this);
    this.controls = new MobileControls(this);
    this.hud = new Hud(this);

    this.hud.update(this.getHudState(0));

    this.countdownText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 66, "3", {
      fontFamily: "Arial",
      fontSize: "72px",
      color: "#39ff14",
      fontStyle: "bold",
      stroke: "#050805",
      strokeThickness: 8,
    }).setOrigin(0.5).setDepth(120);

    this.startCountdown();

    this.physics.add.overlap(
      this.player.sprite,
      this.waves.group,
      (_, enemy) => this.onEnemyHit(enemy as Phaser.Physics.Arcade.Sprite),
    );
  }

  update(_time: number, delta: number): void {
    if (this.runFinished) return;

    const input = this.controls.getInputState();
    this.player.update(input, delta);

    if (!this.fightStarted) {
      this.hud.update(this.getHudState(0));
      return;
    }

    if (this.player.consumeAttackStarted()) {
      this.resolvePlayerAttack();
    }

    const survivedMs = Date.now() - this.runStartedAt;
    this.waves.update(survivedMs, delta, this.player.sprite.x, this.player.sprite.y);

    if (this.waves.currentWave !== this.lastShownWave) {
      this.lastShownWave = this.waves.currentWave;
      this.showWaveBanner(this.lastShownWave);
    }

    this.score += Math.floor(delta / 100);
    this.hud.update(this.getHudState(survivedMs));
  }

  private getHudState(survivedMs: number) {
    return {
      hp: this.hp,
      score: this.score,
      wave: this.waves?.currentWave ?? 1,
      defeated: this.waves?.defeatedCount ?? 0,
      survivedSeconds: Math.floor(survivedMs / 1000),
      bossActive: Boolean(this.waves?.bossActive),
      attackReady: this.player?.canAttack() ?? true,
      dodgeReady: this.player?.canDodge() ?? true,
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
      this.runStartedAt = Date.now();
      this.tweens.add({
        targets: this.countdownText,
        alpha: 0,
        duration: 260,
        onComplete: () => this.countdownText.destroy(),
      });
    });
  }

  private resolvePlayerAttack(): void {
    this.showAttackRing();

    const hitResult = this.waves.hitEnemiesNear(this.player.sprite.x, this.player.sprite.y, 104, 4);
    if (hitResult.hits <= 0) {
      this.showFloatingText("MISS", this.player.sprite.x, this.player.sprite.y - 54, "#88aa88");
      return;
    }

    const points = hitResult.defeated * 55 + hitResult.hits * 8 + (hitResult.bossHit ? 35 : 0);
    this.score += points;
    this.cameras.main.flash(65, 57, 255, 20, false);
    this.showFloatingText(`+${points}`, this.player.sprite.x, this.player.sprite.y - 64, hitResult.bossHit ? "#b66cff" : "#39ff14");
  }

  private onEnemyHit(enemy: Phaser.Physics.Arcade.Sprite): void {
    if (this.runFinished || !this.fightStarted || !enemy.active) return;

    if (this.player.isDodging) {
      if (this.waves.defeatEnemy(enemy)) this.score += 25;
      this.showFloatingText("DODGED", this.player.sprite.x, this.player.sprite.y - 58, "#b66cff");
      return;
    }

    if (this.player.isAttacking) {
      if (this.waves.defeatEnemy(enemy)) this.score += 50;
      return;
    }

    this.waves.defeatEnemy(enemy);
    this.hp -= 1;
    this.cameras.main.shake(120, 0.008);
    this.showFloatingText("-1 HP", this.player.sprite.x, this.player.sprite.y - 58, "#ff3355");

    if (this.hp <= 0) {
      this.finishRun();
    }
  }

  private showAttackRing(): void {
    const ring = this.add.circle(this.player.sprite.x, this.player.sprite.y, 28)
      .setStrokeStyle(4, 0x39ff14, 0.9)
      .setDepth(20);

    this.tweens.add({
      targets: ring,
      radius: 108,
      alpha: 0,
      duration: 180,
      onComplete: () => ring.destroy(),
    });
  }

  private showWaveBanner(wave: number): void {
    const isBossWave = wave % 3 === 0;
    const text = this.add.text(GAME_WIDTH / 2, 144, isBossWave ? `WAVE ${wave}: MINI-BOSS` : `WAVE ${wave}`, {
      fontFamily: "Arial",
      fontSize: isBossWave ? "24px" : "22px",
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

  private showFloatingText(text: string, x: number, y: number, color: string): void {
    const label = this.add.text(x, y, text, {
      fontFamily: "Arial",
      fontSize: "17px",
      color,
      fontStyle: "bold",
      stroke: "#050805",
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(100);

    this.tweens.add({
      targets: label,
      y: y - 36,
      alpha: 0,
      duration: 650,
      onComplete: () => label.destroy(),
    });
  }

  private finishRun(): void {
    if (this.runFinished) return;
    this.runFinished = true;
    this.physics.pause();

    const result: RunResult = {
      score: this.score,
      leaksDefeated: this.waves.defeatedCount,
      survivedSeconds: Math.floor((Date.now() - this.runStartedAt) / 1000),
      bossDamage: Math.floor(this.score * 0.12),
      safePoints: Math.floor(this.score * 0.08),
    };

    this.scene.start(SCENE_KEYS.result, result);
  }
}
