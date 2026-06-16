export interface InputState {
  x: number;
  y: number;
  attack: boolean;
  dodge: boolean;
  skill: boolean;
}

export type EnemyKind = "bad_habit" | "fomo" | "scam" | "smoke_brute";

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
}
