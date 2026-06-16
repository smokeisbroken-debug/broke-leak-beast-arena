import Phaser from "phaser";
import type { EnemyKind } from "../types/game";

export function createLeakBeast(
  scene: Phaser.Scene,
  x: number,
  y: number,
  kind: EnemyKind = "bad_habit",
): Phaser.Physics.Arcade.Sprite {
  const sprite = scene.physics.add.sprite(x, y, "leak-beast-placeholder");
  sprite.setData("kind", kind);
  sprite.setData("hp", kind === "smoke_brute" ? 3 : 1);
  sprite.setSize(42, 42);
  return sprite;
}
