import type { LeaderboardBackendStatus, LeaderboardId, LeaderboardPeriodKey } from "./LeaderboardTypes";

export type WeeklyLeaderboardId = "weekly_arena" | "task_points" | "boss_damage";
export type WeeklyLeaderboardResetTimezone = "UTC";
export type WeeklyLeaderboardSubmitLock = "local_preview" | "backend_required" | "anti_cheat_required";

export interface WeeklyLeaderboardResetPolicy {
  weekStartsOn: "monday";
  timezone: WeeklyLeaderboardResetTimezone;
  resetHourUtc: number;
  resetMinuteUtc: number;
  periodKeyFormat: string;
  rules: readonly string[];
}

export interface WeeklyLeaderboardPeriodState {
  periodKey: LeaderboardPeriodKey;
  startsAtIso: string;
  endsAtIso: string;
  nextResetAtIso: string;
  resetTimezone: WeeklyLeaderboardResetTimezone;
  daysRemaining: number;
  hoursRemaining: number;
  minutesRemaining: number;
  isActive: boolean;
}

export interface WeeklyLeaderboardPreview {
  leaderboardId: WeeklyLeaderboardId;
  period: WeeklyLeaderboardPeriodState;
  backendStatus: LeaderboardBackendStatus;
  playerRank: number;
  playerValue: number;
  entriesShown: number;
  submitLock: WeeklyLeaderboardSubmitLock;
  localPreviewOnly: boolean;
  backendLocked: boolean;
  resetNotice: string;
}

export interface WeeklyLeaderboardSystemDefinition {
  version: string;
  goal: string;
  weeklyLeaderboards: readonly WeeklyLeaderboardId[];
  resetPolicy: WeeklyLeaderboardResetPolicy;
  backendLockedLeaderboards: readonly WeeklyLeaderboardId[];
  rules: readonly string[];
}

export const WEEKLY_LEADERBOARD_IDS: readonly WeeklyLeaderboardId[] = ["weekly_arena", "task_points", "boss_damage"];

export const WEEKLY_LEADERBOARD_RESET_POLICY: WeeklyLeaderboardResetPolicy = {
  weekStartsOn: "monday",
  timezone: "UTC",
  resetHourUtc: 0,
  resetMinuteUtc: 0,
  periodKeyFormat: "YYYY-Www",
  rules: [
    "Weekly periods are calculated in UTC so every player sees the same reset window.",
    "Local mock rows may be displayed inside the current period, but public submission stays disabled.",
    "Weekly Arena, Task Points and Boss Damage must be reconciled by backend validation before rewards or public rank become authoritative.",
  ],
};

export function isWeeklyLeaderboardId(leaderboardId: LeaderboardId): leaderboardId is WeeklyLeaderboardId {
  return WEEKLY_LEADERBOARD_IDS.includes(leaderboardId as WeeklyLeaderboardId);
}
