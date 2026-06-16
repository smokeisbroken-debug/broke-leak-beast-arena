import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../../config/game";
import { createLeakBeast } from "../entities/LeakBeast";

export class WaveSystem {
  public readonly group: Phaser.Physics.Arcade.Group;
  public currentWave = 1;
  public defeatedCount = 0;

  private spawnTimer = 0;
  private spawnEveryMs = 1150;

  constructor(private scene: Phaser.Scene) {
    this.group = scene.physics.add.group();
  }

  update(time: number, delta: number, targetX: number, targetY: number): void {
    this.spawnTimer += delta;

    if (this.spawnTimer >= this.spawnEveryMs) {
      this.spawnTimer = 0;
      this.spawn(targetX, targetY);
    }

    this.group.children.iterate((child) => {
      const beast = child as Phaser.Physics.Arcade.Sprite;
      this.scene.physics.moveTo(beast, targetX, targetY, 70 + this.currentWave * 10);
      return true;
    });

    this.currentWave = Math.max(1, Math.floor(time / 20000) + 1);
  }

  private spawn(targetX: number, targetY: number): void {
    const side = Phaser.Math.Between(0, 3);
    const margin = 32;

    const positions = [
      { x: Phaser.Math.Between(0, GAME_WIDTH), y: -margin },
      { x: GAME_WIDTH + margin, y: Phaser.Math.Between(80, GAME_HEIGHT - 120) },
      { x: Phaser.Math.Between(0, GAME_WIDTH), y: GAME_HEIGHT + margin },
      { x: -margin, y: Phaser.Math.Between(80, GAME_HEIGHT - 120) },
    ];

    const position = positions[side];
    const beast = createLeakBeast(this.scene, position.x, position.y);
    this.scene.physics.moveTo(beast, targetX, targetY, 90);
    this.group.add(beast);
  }
}
