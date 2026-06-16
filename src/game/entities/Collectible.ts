import Phaser from "phaser";

export function createSafePoint(scene: Phaser.Scene, x: number, y: number): Phaser.Physics.Arcade.Sprite {
  const collectible = scene.physics.add.sprite(x, y, "leak-beast-placeholder");
  collectible.setScale(0.28);
  collectible.setData("type", "safe_point");
  return collectible;
}
