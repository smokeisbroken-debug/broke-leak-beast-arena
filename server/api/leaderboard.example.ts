// Example only. Not active code.

export interface LeaderboardEntry {
  rank: number;
  displayName: string;
  score: number;
  bossDamage: number;
}

export interface LeaderboardResponse {
  period: "daily" | "weekly" | "seasonal";
  entries: LeaderboardEntry[];
}
