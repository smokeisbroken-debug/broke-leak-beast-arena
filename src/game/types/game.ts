import Phaser from "phaser";

export interface InputState {
  x: number;
  y: number;
  attack: boolean;
  dodge: boolean;
  pulse: boolean;
  shield: boolean;
  slash: boolean;
  skill1: boolean;
  skill2: boolean;
  ultimate: boolean;
}

export type EnemyKind = "bad_habit" | "fomo" | "scam" | "smoke_brute" | "mega_leak";
export type PickupType = "safe_point" | "heart" | "shield" | "cooldown" | "speed";

export interface EnemyDefinition {
  id: EnemyKind;
  name: string;
  hp: number;
  speed: number;
  behavior: "slow_chaser" | "fast_chaser" | "projectile" | "tank" | "splitter" | "trap_spawner";
}

export interface BossDefinition {
  id: string;
  name: string;
  hp: number;
  intro: string;
}

export interface RunResult {
  score: number;
  leaksDefeated: number;
  survivedSeconds: number;
  safePoints: number;
  bossDamage: number;
  upgradesChosen: number;
  pickupsCollected?: number;
  bossesBroken?: number;
}

export interface AttackSpec {
  comboStep: number;
  damage: number;
  range: number;
  arcDegrees: number;
  knockback: number;
  maxTargets: number;
  direction: Phaser.Math.Vector2;
  kind?: "combo" | "dash_slash" | "pulse";
}

export type PlayerUpgradeId =
  | "damage"
  | "speed"
  | "dash"
  | "pulse"
  | "heart"
  | "attack_speed"
  | "wide_swing"
  | "shield_battery"
  | "boss_breaker";

export interface PlayerUpgradeState {
  damageBonus: number;
  speedBonus: number;
  maxHpBonus: number;
  dodgeCooldownMultiplier: number;
  skillPowerBonus: number;
  attackCooldownMultiplier: number;
  attackRangeBonus: number;
  attackArcBonus: number;
  pulseRadiusBonus: number;
  shieldChargeBonus: number;
  shieldDurationBonusMs: number;
  bossDamageBonus: number;
}
