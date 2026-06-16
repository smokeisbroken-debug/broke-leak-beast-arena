import { BALANCE } from "../../game/data/balance";
import type { RunResult } from "../../game/types/game";

export interface RunValidationResult {
  ok: boolean;
  reason?: string;
}

export function validateRunResultClientSide(result: RunResult): RunValidationResult {
  // This is only a first local sanity check. Real validation must happen server-side.
  if (result.survivedSeconds > BALANCE.run.maxSoftDurationSeconds * 2) {
    return { ok: false, reason: "Run duration is outside expected range." };
  }

  if (result.score < 0 || result.safePoints < 0 || result.bossDamage < 0) {
    return { ok: false, reason: "Negative values are not allowed." };
  }

  return { ok: true };
}
