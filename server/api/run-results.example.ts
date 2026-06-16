// Example only. Not active code.

export interface SubmitRunRequest {
  telegramInitData: string;
  runStartedAt: string;
  runFinishedAt: string;
  score: number;
  leaksDefeated: number;
  survivedSeconds: number;
}

export interface SubmitRunResponse {
  accepted: boolean;
  safePoints: number;
  bossDamage: number;
  leaderboardEligible: boolean;
  reason?: string;
}
