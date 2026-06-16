import type { RunResult } from "../types/game";

export function calculateBaseRewards(score: number): RunResult {
  return {
    score,
    leaksDefeated: 0,
    survivedSeconds: 0,
    safePoints: Math.floor(score * 0.08),
    bossDamage: Math.floor(score * 0.12),
    upgradesChosen: 0,
  };
}
