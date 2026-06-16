import type { RunResult } from "../types/game";

export function formatRunResult(result: RunResult): string[] {
  return [
    `Score: ${result.score}`,
    `Leaks defeated: ${result.leaksDefeated}`,
    `Survived: ${result.survivedSeconds}s`,
    `Safe Points: +${result.safePoints}`,
    `Boss Damage: +${result.bossDamage}`,
  ];
}
