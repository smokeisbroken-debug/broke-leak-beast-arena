import Phaser from "phaser";
import type { PickupType } from "../types/game";

const PICKUP_TEXTURE: Record<PickupType, string> = {
  safe_point: "pickup-safe-point",
  heart: "pickup-heart",
  shield: "pickup-shield",
  cooldown: "pickup-cooldown",
  speed: "pickup-speed",
};

const PICKUP_TINT: Record<PickupType, number> = {
  safe_point: 0x39ff14,
  heart: 0xff6688,
  shield: 0x7dffb5,
  cooldown: 0xb66cff,
  speed: 0xfff17d,
};

export function createCollectible(
  scene: Phaser.Scene,
  group: Phaser.Physics.Arcade.Group,
  x: number,
  y: number,
  type: PickupType,
  value = 1,
): Phaser.Physics.Arcade.Sprite {
  const sprite = scene.physics.add.sprite(x, y, PICKUP_TEXTURE[type]);
  sprite.setDepth(29);
  sprite.setData("type", type);
  sprite.setData("value", value);
  sprite.setData("expireAt", Date.now() + 9000);
  sprite.setData("baseY", y);
  sprite.setData("baseScale", 0.96);
  sprite.setDisplaySize(type === "safe_point" ? 26 : 30, type === "safe_point" ? 26 : 30);
  sprite.setCircle(12, 2, 2);
  sprite.setImmovable(true);
  sprite.body.allowGravity = false;
  sprite.setVelocity(Phaser.Math.Between(-28, 28), Phaser.Math.Between(-18, -8));
  group.add(sprite);

  const shadow = scene.add.ellipse(x, y + 12, 22, 8, 0x000000, 0.28).setDepth(28);
  sprite.setData("shadow", shadow);

  scene.tweens.add({
    targets: sprite,
    y: y - 8,
    duration: 650,
    yoyo: true,
    repeat: -1,
    ease: "Sine.easeInOut",
  });

  scene.tweens.add({
    targets: shadow,
    scaleX: 0.82,
    alpha: 0.18,
    duration: 650,
    yoyo: true,
    repeat: -1,
    ease: "Sine.easeInOut",
  });

  scene.time.delayedCall(7000, () => {
    if (!sprite.active) return;
    scene.tweens.add({
      targets: [sprite, shadow],
      alpha: 0.2,
      duration: 250,
      yoyo: true,
      repeat: 3,
    });
  });

  scene.time.delayedCall(9000, () => {
    if (!sprite.active) return;
    shadow.destroy();
    sprite.disableBody(true, true);
  });

  const glow = scene.add.circle(x, y, type === "safe_point" ? 12 : 14, PICKUP_TINT[type], 0.12).setDepth(27);
  scene.tweens.add({
    targets: glow,
    alpha: 0,
    scaleX: 1.5,
    scaleY: 1.5,
    duration: 420,
    onComplete: () => glow.destroy(),
  });

  return sprite;
}
