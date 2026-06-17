import Phaser from "phaser";
import type { EnemyKind } from "../types/game";

interface LeakBeastOptions {
  kind?: EnemyKind;
  boss?: boolean;
  wave?: number;
}

const KIND_TEXTURE: Record<EnemyKind, string> = {
  bad_habit: "enemy-imp-01",
  fomo: "enemy-runner-01",
  scam: "enemy-beast-01",
  smoke_brute: "enemy-brute-01",
};

const KIND_ANIMATION: Record<EnemyKind, string> = {
  bad_habit: "enemy-bad-habit-move",
  fomo: "enemy-fomo-move",
  scam: "enemy-scam-move",
  smoke_brute: "enemy-smoke-brute-move",
};

const KIND_HP: Record<EnemyKind, number> = {
  bad_habit: 2,
  fomo: 2,
  scam: 3,
  smoke_brute: 5,
};

const KIND_SPEED: Record<EnemyKind, number> = {
  bad_habit: 72,
  fomo: 100,
  scam: 72,
  smoke_brute: 54,
};

const KIND_SCORE: Record<EnemyKind, number> = {
  bad_habit: 35,
  fomo: 50,
  scam: 75,
  smoke_brute: 105,
};

const KIND_DISPLAY_SIZE: Record<EnemyKind, { width: number; height: number; bodyW: number; bodyH: number }> = {
  bad_habit: { width: 54, height: 54, bodyW: 30, bodyH: 30 },
  fomo: { width: 58, height: 54, bodyW: 32, bodyH: 28 },
  scam: { width: 62, height: 60, bodyW: 34, bodyH: 32 },
  smoke_brute: { width: 74, height: 72, bodyW: 42, bodyH: 40 },
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
  const bossStyle = wave % 2 === 0 ? "smoke" : "thorn";
  const texture = isBoss ? `boss-${bossStyle}-01` : KIND_TEXTURE[kind];
  const waveHpBonus = Math.floor(wave / 3);

  const sprite = scene.physics.add.sprite(x, y, texture);
  const hp = isBoss ? 24 + wave * 4 : KIND_HP[kind] + waveHpBonus;
  sprite.setData("kind", kind);
  sprite.setData("boss", isBoss);
  sprite.setData("bossStyle", isBoss ? bossStyle : undefined);
  sprite.setData("hp", hp);
  sprite.setData("maxHp", hp);
  sprite.setData("speed", isBoss ? 48 + wave * 2 : KIND_SPEED[kind] + wave * 4);
  sprite.setData("score", isBoss ? 620 + wave * 65 : KIND_SCORE[kind] + wave * 7);
  sprite.setData("lastContactAt", -9999);
  sprite.setData("hitStunUntil", -9999);
  sprite.setData("nextShotAt", Date.now() + Phaser.Math.Between(1000, 2200));
  sprite.setData("nextSmokeAt", Date.now() + Phaser.Math.Between(1400, 2800));
  sprite.setData("nextChargeAt", Date.now() + Phaser.Math.Between(500, 1800));

  const size = isBoss
    ? { width: bossStyle === "smoke" ? 118 : 126, height: bossStyle === "smoke" ? 112 : 122, bodyW: 72, bodyH: 68 }
    : KIND_DISPLAY_SIZE[kind];

  sprite.setDisplaySize(size.width, size.height);
  const body = sprite.body as Phaser.Physics.Arcade.Body;
  body.setSize(size.bodyW, size.bodyH, true);
  sprite.setDepth(isBoss ? 18 : 13);

  const animationKey = isBoss ? `boss-${bossStyle}-move` : KIND_ANIMATION[kind];
  if (scene.anims.exists(animationKey)) {
    sprite.play(animationKey, true);
  }

  return sprite;
}
