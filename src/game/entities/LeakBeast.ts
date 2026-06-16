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
  bad_habit: 2,
  fomo: 2,
  scam: 3,
  smoke_brute: 5,
};

const KIND_SPEED: Record<EnemyKind, number> = {
  bad_habit: 72,
  fomo: 96,
  scam: 70,
  smoke_brute: 54,
};

const KIND_SCORE: Record<EnemyKind, number> = {
  bad_habit: 35,
  fomo: 50,
  scam: 75,
  smoke_brute: 105,
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
  const waveHpBonus = Math.floor(wave / 3);

  const sprite = scene.physics.add.sprite(x, y, texture);
  const hp = isBoss ? 18 + wave * 3 : KIND_HP[kind] + waveHpBonus;
  sprite.setData("kind", kind);
  sprite.setData("boss", isBoss);
  sprite.setData("hp", hp);
  sprite.setData("maxHp", hp);
  sprite.setData("speed", isBoss ? 50 + wave * 2 : KIND_SPEED[kind] + wave * 4);
  sprite.setData("score", isBoss ? 520 + wave * 55 : KIND_SCORE[kind] + wave * 7);
  sprite.setData("lastContactAt", -9999);
  sprite.setData("hitStunUntil", -9999);
  sprite.setData("nextShotAt", Date.now() + Phaser.Math.Between(1000, 2200));
  sprite.setData("nextSmokeAt", Date.now() + Phaser.Math.Between(1400, 2800));
  sprite.setData("nextChargeAt", Date.now() + Phaser.Math.Between(500, 1800));
  sprite.setSize(isBoss ? 76 : 42, isBoss ? 76 : 42);
  sprite.setDepth(isBoss ? 18 : 12);
  sprite.setScale(isBoss ? 1.08 : 0.92);

  return sprite;
}
