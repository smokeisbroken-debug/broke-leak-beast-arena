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

  private score = 0;
  private hp = 5;
  private runStartedAt = 0;
  private runFinished = false;
  private lastPassiveScoreAt = 0;

  constructor() {
    super(SCENE_KEYS.arena);
  }

  create(): void {
    this.score = 0;
    this.hp = 5;
    this.runFinished = false;
    this.runStartedAt = this.time.now;
    this.lastPassiveScoreAt = this.time.now;

    this.createArenaBackground();

    this.player = new PlayerMascot(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 48);
    this.waves = new WaveSystem(this);
    this.controls = new MobileControls(this);
    this.hud = new Hud(this);

    this.hud.update({
      hp: this.hp,
      score: this.score,
      wave: 1,
      defeated: 0,
      survivedSeconds: 0,
      bossActive: false,
    });

    this.physics.add.overlap(
      this.player.sprite,
      this.waves.group,
      (_, enemy) => this.onEnemyContact(enemy as Phaser.Physics.Arcade.Sprite),
    );
  }

  update(time: number, delta: number): void {
    if (this.runFinished) return;

    const elapsedMs = time - this.runStartedAt;
    const survivedSeconds = Math.floor(elapsedMs / 1000);
    const input = this.controls.getInputState();
    const playerUpdate = this.player.update(input, delta);

    if (playerUpdate.attackStarted) {
      this.resolveAttack();
    }

    if (playerUpdate.dodgeStarted) {
      this.flashText("DODGE", this.player.sprite.x, this.player.sprite.y - 54, "#b66cff");
    }

    this.waves.update(elapsedMs, delta, this.player.sprite.x, this.player.sprite.y);

    if (time - this.lastPassiveScoreAt >= 1000) {
      this.lastPassiveScoreAt = time;
      this.score += 4 + this.waves.currentWave;
    }

    this.hud.update({
      hp: this.hp,
      score: this.score,
      wave: this.waves.currentWave,
      defeated: this.waves.defeatedCount,
      survivedSeconds,
      bossActive: this.hasActiveBoss(),
    });
  }

  private createArenaBackground(): void {
    this.cameras.main.setBackgroundColor(COLORS.bg);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.bg);
    this.add.circle(70, 140, 220, 0x123b10, 0.24);
    this.add.circle(GAME_WIDTH - 30, 130, 190, 0x40106b, 0.2);

    for (let i = 0; i < 16; i += 1) {
      const x = Phaser.Math.Between(0, GAME_WIDTH);
      const y = Phaser.Math.Between(92, GAME_HEIGHT - 168);
      this.add.rectangle(x, y, Phaser.Math.Between(24, 72), 2, 0x39ff14, 0.08);
    }

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 80, GAME_WIDTH, 160, 0x020402, 0.5).setDepth(60);
    this.add.text(GAME_WIDTH / 2, 102, "Survive the leak wave", {
      fontFamily: "Arial",
      fontSize: "13px",
      color: "#9cff8a",
      fontStyle: "bold",
    }).setOrigin(0.5).setDepth(8);
  }

  private resolveAttack(): void {
    let hits = 0;
    const attackRadius = 92;

    const pulse = this.add.circle(this.player.sprite.x, this.player.sprite.y, attackRadius, 0x39ff14, 0.08)
      .setStrokeStyle(2, 0x39ff14, 0.45)
      .setDepth(10)
      .setAlpha(0.9);

    this.tweens.add({
      targets: pulse,
      scale: 1.16,
      alpha: 0,
      duration: 180,
      onComplete: () => pulse.destroy(),
    });

    this.waves.group.children.iterate((child) => {
      const beast = child as Phaser.Physics.Arcade.Sprite;
      if (!beast.active) return true;

      const distance = Phaser.Math.Distance.Between(this.player.sprite.x, this.player.sprite.y, beast.x, beast.y);
      if (distance > attackRadius) return true;

      hits += 1;
      this.damageBeast(beast, 1);
      return true;
    });

    if (hits > 0) {
      this.flashText(`HIT x${hits}`, this.player.sprite.x, this.player.sprite.y - 72, "#39ff14");
    } else {
      this.flashText("MISS", this.player.sprite.x, this.player.sprite.y - 72, "#88aa88");
    }
  }

  private damageBeast(beast: Phaser.Physics.Arcade.Sprite, damage: number): void {
    const currentHp = (beast.getData("hp") as number) - damage;
    beast.setData("hp", currentHp);
    beast.setTint(0xffffff);
    this.time.delayedCall(70, () => beast.clearTint());

    if (currentHp > 0) return;

    const isBoss = Boolean(beast.getData("boss"));
    const scoreValue = beast.getData("score") as number;
    this.score += scoreValue;
    this.waves.recordDefeat(isBoss ? 3 : 1);

    const spark = this.add.image(beast.x, beast.y, "hit-spark").setScale(isBoss ? 2.4 : 1.7).setDepth(25);
    this.tweens.add({ targets: spark, alpha: 0, scale: spark.scale * 1.8, duration: 260, onComplete: () => spark.destroy() });
    this.flashText(`+${scoreValue}`, beast.x, beast.y - 28, isBoss ? "#b66cff" : "#39ff14");
    beast.destroy();
  }

  private onEnemyContact(enemy: Phaser.Physics.Arcade.Sprite): void {
    if (!enemy.active || this.runFinished) return;

    const lastContactAt = enemy.getData("lastContactAt") as number;
    if (this.time.now - lastContactAt < 720) return;
    enemy.setData("lastContactAt", this.time.now);

    if (this.player.isDodging) {
      this.score += 20;
      this.flashText("DODGED +20", this.player.sprite.x, this.player.sprite.y - 52, "#b66cff");
      this.bumpEnemyAway(enemy);
      return;
    }

    if (this.player.isAttacking) {
      this.damageBeast(enemy, 1);
      return;
    }

    this.hp -= 1;
    this.cameras.main.shake(140, 0.009);
    this.player.sprite.setTint(0xff3355);
    this.time.delayedCall(100, () => this.player.sprite.clearTint());
    this.bumpEnemyAway(enemy);

    if (this.hp <= 0) {
      this.finishRun();
    }
  }

  private bumpEnemyAway(enemy: Phaser.Physics.Arcade.Sprite): void {
    const direction = new Phaser.Math.Vector2(enemy.x - this.player.sprite.x, enemy.y - this.player.sprite.y);
    if (direction.lengthSq() === 0) direction.set(1, 0);
    direction.normalize().scale(90);
    enemy.setPosition(
      Phaser.Math.Clamp(enemy.x + direction.x, 24, GAME_WIDTH - 24),
      Phaser.Math.Clamp(enemy.y + direction.y, 96, GAME_HEIGHT - 168),
    );
  }

  private hasActiveBoss(): boolean {
    let bossActive = false;
    this.waves.group.children.iterate((child) => {
      const beast = child as Phaser.Physics.Arcade.Sprite;
      if (beast.active && Boolean(beast.getData("boss"))) bossActive = true;
      return true;
    });
    return bossActive;
  }

  private finishRun(): void {
    if (this.runFinished) return;
    this.runFinished = true;
    this.physics.pause();

    const survivedSeconds = Math.floor((this.time.now - this.runStartedAt) / 1000);
    const result: RunResult = {
      score: this.score,
      leaksDefeated: this.waves.defeatedCount,
      survivedSeconds,
      bossDamage: Math.floor(this.score * 0.12 + this.waves.defeatedCount * 8),
      safePoints: Math.floor(this.score * 0.08 + survivedSeconds * 2),
    };

    this.time.delayedCall(280, () => this.scene.start(SCENE_KEYS.result, result));
  }

  private flashText(text: string, x: number, y: number, color: string): void {
    const label = this.add.text(x, y, text, {
      fontFamily: "Arial",
      fontSize: "16px",
      color,
      fontStyle: "bold",
    }).setOrigin(0.5).setDepth(90);

    this.tweens.add({
      targets: label,
      y: y - 28,
      alpha: 0,
      duration: 620,
      onComplete: () => label.destroy(),
    });
  }
}
