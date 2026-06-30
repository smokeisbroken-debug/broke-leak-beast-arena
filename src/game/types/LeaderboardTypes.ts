export type LeaderboardId =
  | "global_power"
  | "weekly_arena"
  | "task_points"
  | "tournament"
  | "duel_ranked"
  | "boss_damage";

export type LeaderboardScope = "global" | "weekly" | "seasonal" | "tournament";
export type LeaderboardMetric = "power_score" | "score" | "task_points" | "tournament_points" | "rank_points" | "boss_damage";
export type LeaderboardBackendStatus = "local_mock" | "adapter_ready" | "remote_required";

export interface LeaderboardDefinition {
  id: LeaderboardId;
  title: string;
  scope: LeaderboardScope;
  metric: LeaderboardMetric;
  backendStatus: LeaderboardBackendStatus;
  resetRule: "never" | "weekly" | "season" | "event";
  antiCheatRequired: boolean;
}

export interface LeaderboardEntry {
  playerId: string;
  displayName: string;
  rank: number;
  value: number;
  updatedAtIso: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface LeaderboardSnapshot {
  leaderboardId: LeaderboardId;
  generatedAtIso: string;
  entries: LeaderboardEntry[];
  playerEntry?: LeaderboardEntry;
}

export const LEADERBOARD_DEFINITIONS: readonly LeaderboardDefinition[] = [
  {
    id: "global_power",
    title: "Global Power",
    scope: "global",
    metric: "power_score",
    backendStatus: "local_mock",
    resetRule: "never",
    antiCheatRequired: true,
  },
  {
    id: "weekly_arena",
    title: "Weekly Arena",
    scope: "weekly",
    metric: "score",
    backendStatus: "local_mock",
    resetRule: "weekly",
    antiCheatRequired: true,
  },
  {
    id: "task_points",
    title: "Task Points",
    scope: "weekly",
    metric: "task_points",
    backendStatus: "local_mock",
    resetRule: "weekly",
    antiCheatRequired: true,
  },
  {
    id: "tournament",
    title: "Tournament",
    scope: "tournament",
    metric: "tournament_points",
    backendStatus: "remote_required",
    resetRule: "event",
    antiCheatRequired: true,
  },
  {
    id: "duel_ranked",
    title: "1v1 Leak Duel",
    scope: "seasonal",
    metric: "rank_points",
    backendStatus: "remote_required",
    resetRule: "season",
    antiCheatRequired: true,
  },
  {
    id: "boss_damage",
    title: "Boss Damage",
    scope: "weekly",
    metric: "boss_damage",
    backendStatus: "remote_required",
    resetRule: "weekly",
    antiCheatRequired: true,
  },
];

export function getLeaderboardDefinition(leaderboardId: LeaderboardId): LeaderboardDefinition {
  const leaderboard = LEADERBOARD_DEFINITIONS.find((candidate) => candidate.id === leaderboardId);
  if (!leaderboard) {
    throw new Error(`Unknown leaderboard: ${leaderboardId}`);
  }
  return leaderboard;
}

export function getBackendRequiredLeaderboards(): LeaderboardDefinition[] {
  return LEADERBOARD_DEFINITIONS.filter((leaderboard) => leaderboard.backendStatus === "remote_required");
}
