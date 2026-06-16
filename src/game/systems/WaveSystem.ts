import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../../config/game";
import { createLeakBeast } from "../entities/LeakBeast";
import type { EnemyKind } from "../types/game";

const ENEMY_ROTATION: EnemyKind[] = ["bad_habit", "bad_habit", "fomo", "scam", "smoke_brute"];

export class WaveSystem {
  public readonly group: Phaser.Physics.Arcade.Group;
  public currentWave = 1;
  public defeatedCount = 0;

  private spawnTimer = 0;
  private miniBossWavesSpawned = new Set<number>();

  constructor(private scene: Phaser.Scene) {
    this.group = scene.physics.add.group();
  }

  update(elapsedMs: number, delta: number, targetX: number, targetY: number): void {
    this.currentWave = Math.max(1, Math.floor(elapsedMs / 18_000) + 1);
    this.spawnTimer += delta;

    const spawnEveryMs = Math.max(520, 1180 - this.currentWave * 70);
    if (this.spawnTimer >= spawnEveryMs) {
      this.spawnTimer = 0;
      this.spawn(targetX, targetY);
    }

    if (this.currentWave >= 3 && this.currentWave % 3 === 0 && !this.miniBossWavesSpawned.has(this.currentWave)) {
      this.miniBossWavesSpawned.add(this.currentWave);
      this.spawn(targetX, targetY, true);
    }

    this.group.children.iterate((child) => {
      const beast = child as Phaser.Physics.Arcade.Sprite;
      const speed = beast.getData("speed") as number;
      this.scene.physics.moveTo(beast, targetX, targetY, speed);

      if (beast.x < -120 || beast.x > GAME_WIDTH + 120 || beast.y < -120 || beast.y > GAME_HEIGHT + 120) {
        beast.destroy();
      }

      return true;
    });
  }

  recordDefeat(amount = 1): void {
    this.defeatedCount += amount;
  }

  private spawn(targetX: number, targetY: number, boss = false): void {
    const side = Phaser.Math.Between(0, 3);
    const margin = boss ? 72 : 42;

    const positions = [
      { x: Phaser.Math.Between(30, GAME_WIDTH - 30), y: -margin },
      { x: GAME_WIDTH + margin, y: Phaser.Math.Between(100, GAME_HEIGHT - 155) },
      { x: Phaser.Math.Between(30, GAME_WIDTH - 30), y: GAME_HEIGHT + margin },
      { x: -margin, y: Phaser.Math.Between(100, GAME_HEIGHT - 155) },
    ];

    const position = positions[side];
    const kind = boss ? "smoke_brute" : ENEMY_ROTATION[Phaser.Math.Between(0, Math.min(ENEMY_ROTATION.length - 1, this.currentWave + 1))];
    const beast = createLeakBeast(this.scene, position.x, position.y, {
      kind,
      boss,
      wave: this.currentWave,
    });

    this.scene.physics.moveTo(beast, targetX, targetY, beast.getData("speed") as number);
    this.group.add(beast);
  }
}
