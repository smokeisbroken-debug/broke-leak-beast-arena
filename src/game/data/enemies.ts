import type { EnemyDefinition } from "../types/game";

export const ENEMIES: EnemyDefinition[] = [
  {
    id: "bad_habit",
    name: "Bad Habit Beast",
    hp: 1,
    speed: 70,
    behavior: "slow_chaser",
  },
  {
    id: "fomo",
    name: "FOMO Beast",
    hp: 1,
    speed: 120,
    behavior: "fast_chaser",
  },
  {
    id: "scam",
    name: "Scam Beast",
    hp: 2,
    speed: 55,
    behavior: "projectile",
  },
  {
    id: "smoke_brute",
    name: "Smoke Brute",
    hp: 3,
    speed: 45,
    behavior: "tank",
  },
];
