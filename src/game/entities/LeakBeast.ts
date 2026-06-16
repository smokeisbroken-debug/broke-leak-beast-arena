import Phaser from "phaser";
import type { EnemyKind } from "../types/game";

interface LeakBeastOptions {
  kind?: EnemyKind;
  boss?: boolean;
  wave?: number;
}

const KIND_TEXTURE: Record<EnemyKind, string> = {
  bad_habit: "beast-bad-habit",
  fomo: "beast-fomo",
  scam: "beast-scam",
  smoke_brute: "beast-smoke-brute",
};

const KIND_HP: Record<EnemyKind, number> = {
  bad_habit: 1,
  fomo: 1,
  scam: 2,
  smoke_brute: 3,
};

const KIND_SPEED: Record<EnemyKind, number> = {
  bad_habit: 76,
  fomo: 116,
  scam: 88,
  smoke_brute: 62,
};

const KIND_SCORE: Record<EnemyKind, number> = {
  bad_habit: 30,
  fomo: 45,
  scam: 60,
  smoke_brute: 90,
};

export function createLeakBeast(
  scene: Phaser.Scene,
  x: number,
  y: number,
  options: LeakBeastOptions = {},
): Phaser.Physics.Arcade.Sprite {
  const kind = options.kind ?? "bad_habit";
  const isBoss = Boolean(options.boss);
  const wave = options.wave ?? 1;
  const texture = isBoss ? "mini-boss-placeholder" : KIND_TEXTURE[kind];

  const sprite = scene.physics.add.sprite(x, y, texture);
  sprite.setData("kind", kind);
  sprite.setData("boss", isBoss);
  sprite.setData("hp", isBoss ? 7 + wave : KIND_HP[kind]);
  sprite.setData("maxHp", isBoss ? 7 + wave : KIND_HP[kind]);
  sprite.setData("speed", isBoss ? 58 + wave * 2 : KIND_SPEED[kind] + wave * 6);
  sprite.setData("score", isBoss ? 350 + wave * 40 : KIND_SCORE[kind] + wave * 5);
  sprite.setData("lastContactAt", -9999);
  sprite.setSize(isBoss ? 72 : 42, isBoss ? 72 : 42);
  sprite.setDepth(isBoss ? 18 : 12);

  if (isBoss) {
    sprite.setScale(1.15);
  }

  return sprite;
}
