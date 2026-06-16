import Phaser from "phaser";

export function createProjectile(scene: Phaser.Scene, x: number, y: number): Phaser.Physics.Arcade.Sprite {
  const projectile = scene.physics.add.sprite(x, y, "leak-beast-placeholder");
  projectile.setScale(0.38);
  projectile.setData("type", "projectile");
  return projectile;
}
