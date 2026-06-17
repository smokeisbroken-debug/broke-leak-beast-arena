import Phaser from "phaser";
import type { EnemyKind } from "../types/game";

interface LeakBeastOptions {
  kind?: EnemyKind;
  boss?: boolean;
  wave?: number;
}

interface VisualTuning {
  texture: string;
  animation: string;
  hp: number;
  speed: number;
  score: number;
  width: number;
  height: number;
  bodyW: number;
  bodyH: number;
  bodyOffsetY: number;
  shadowW: number;
  shadowH: number;
}

const KIND_TUNING: Record<EnemyKind, VisualTuning> = {
  bad_habit: {
    texture: "enemy-imp-01",
    animation: "enemy-bad-habit-move",
    hp: 2,
    speed: 78,
    score: 35,
    width: 46,
    height: 46,
    bodyW: 25,
    bodyH: 27,
    bodyOffsetY: 5,
    shadowW: 34,
    shadowH: 10,
  },
  fomo: {
    texture: "enemy-runner-01",
    animation: "enemy-fomo-move",
    hp: 2,
    speed: 108,
    score: 50,
    width: 58,
    height: 48,
    bodyW: 30,
    bodyH: 24,
    bodyOffsetY: 7,
    shadowW: 42,
    shadowH: 11,
  },
  scam: {
    texture: "enemy-beast-01",
    animation: "enemy-scam-move",
    hp: 3,
    speed: 74,
    score: 75,
    width: 58,
    height: 54,
    bodyW: 31,
    bodyH: 28,
    bodyOffsetY: 8,
    shadowW: 42,
    shadowH: 12,
  },
  smoke_brute: {
    texture: "enemy-brute-01",
    animation: "enemy-smoke-brute-move",
    hp: 5,
    speed: 54,
    score: 105,
    width: 66,
    height: 64,
    bodyW: 38,
    bodyH: 36,
    bodyOffsetY: 10,
    shadowW: 50,
    shadowH: 14,
  },
};

const BOSS_TUNING: Record<"thorn" | "smoke", Omit<VisualTuning, "hp" | "speed" | "score">> = {
  thorn: {
    texture: "boss-thorn-01",
    animation: "boss-thorn-move",
    width: 112,
    height: 106,
    bodyW: 62,
    bodyH: 58,
    bodyOffsetY: 16,
    shadowW: 84,
    shadowH: 20,
  },
  smoke: {
    texture: "boss-smoke-01",
    animation: "boss-smoke-move",
    width: 104,
    height: 96,
    bodyW: 58,
    bodyH: 54,
    bodyOffsetY: 15,
    shadowW: 80,
    shadowH: 20,
  },
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
  const normalTuning = KIND_TUNING[kind];
  const tuning = isBoss ? BOSS_TUNING[bossStyle] : normalTuning;
  const waveHpBonus = Math.floor(wave / 3);

  const sprite = scene.physics.add.sprite(x, y, tuning.texture);
  const hp = isBoss ? 22 + wave * 4 : normalTuning.hp + waveHpBonus;
  const speed = isBoss ? 44 + wave * 2 : normalTuning.speed + wave * 3;
  const score = isBoss ? 640 + wave * 65 : normalTuning.score + wave * 7;

  sprite.setData("kind", kind);
  sprite.setData("boss", isBoss);
  sprite.setData("bossStyle", isBoss ? bossStyle : undefined);
  sprite.setData("hp", hp);
  sprite.setData("maxHp", hp);
  sprite.setData("speed", speed);
  sprite.setData("score", score);
  sprite.setData("lastContactAt", -9999);
  sprite.setData("hitStunUntil", -9999);
  sprite.setData("nextShotAt", Date.now() + Phaser.Math.Between(1100, 2300));
  sprite.setData("nextSmokeAt", Date.now() + Phaser.Math.Between(1500, 3000));
  sprite.setData("nextChargeAt", Date.now() + Phaser.Math.Between(700, 1900));
  sprite.setData("displayW", tuning.width);
  sprite.setData("displayH", tuning.height);
  sprite.setData("bodyW", tuning.bodyW);
  sprite.setData("bodyH", tuning.bodyH);
  sprite.setData("bodyOffsetY", tuning.bodyOffsetY);
  sprite.setData("shadowW", tuning.shadowW);
  sprite.setData("shadowH", tuning.shadowH);

  sprite.setDisplaySize(tuning.width, tuning.height);
  applyLeakBeastBody(sprite);
  sprite.setDepth(isBoss ? 19 : 13);

  const animationKey = isBoss ? tuning.animation : normalTuning.animation;
  if (scene.anims.exists(animationKey)) {
    sprite.play(animationKey, true);
  }

  return sprite;
}

export function applyLeakBeastBody(sprite: Phaser.Physics.Arcade.Sprite): void {
  const body = sprite.body as Phaser.Physics.Arcade.Body | null;
  if (!body) return;

  const displayW = Number(sprite.getData("displayW") ?? sprite.displayWidth);
  const displayH = Number(sprite.getData("displayH") ?? sprite.displayHeight);
  const bodyW = Number(sprite.getData("bodyW") ?? displayW * 0.55);
  const bodyH = Number(sprite.getData("bodyH") ?? displayH * 0.55);
  const offsetY = Number(sprite.getData("bodyOffsetY") ?? 0);

  sprite.setDisplaySize(displayW, displayH);
  body.setSize(bodyW, bodyH, true);
  body.setOffset((sprite.width - bodyW) / 2, (sprite.height - bodyH) / 2 + offsetY);
}
