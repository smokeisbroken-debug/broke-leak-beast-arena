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

  constructor() {
    super(SCENE_KEYS.arena);
  }

  create(): void {
    this.runStartedAt = Date.now();

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.bg);
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

    this.hud.update({ hp: this.hp, score: this.score, wave: 1 });

    this.physics.add.overlap(
      this.player.sprite,
      this.waves.group,
      (_, enemy) => this.onEnemyHit(enemy as Phaser.Physics.Arcade.Sprite),
    );
  }

  update(time: number, delta: number): void {
    const input = this.controls.getInputState();
    this.player.update(input, delta);
    this.waves.update(time, delta, this.player.sprite.x, this.player.sprite.y);

    this.score += Math.floor(delta / 100);
    this.hud.update({ hp: this.hp, score: this.score, wave: this.waves.currentWave });
  }

  private onEnemyHit(enemy: Phaser.Physics.Arcade.Sprite): void {
    enemy.destroy();

    if (this.player.isDodging) {
      this.score += 25;
      return;
    }

    if (this.player.isAttacking) {
      this.score += 50;
      return;
    }

    this.hp -= 1;
    this.cameras.main.shake(120, 0.008);

    if (this.hp <= 0) {
      this.finishRun();
    }
  }

  private finishRun(): void {
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
