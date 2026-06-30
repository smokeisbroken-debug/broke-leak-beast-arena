import type { PlayerProfile } from "../data/playerProfile";
import {
  getLeaderboardDefinition,
  getLeaderboardPeriodKey,
  getLeaderboardReadiness,
  isLeaderboardBackendLocked,
  type LeaderboardId,
} from "../types/LeaderboardTypes";
import {
  WEEKLY_LEADERBOARD_IDS,
  WEEKLY_LEADERBOARD_RESET_POLICY,
  isWeeklyLeaderboardId,
  type WeeklyLeaderboardId,
  type WeeklyLeaderboardPeriodState,
  type WeeklyLeaderboardPreview,
  type WeeklyLeaderboardSubmitLock,
  type WeeklyLeaderboardSystemDefinition,
} from "../types/WeeklyLeaderboardTypes";
import { createLocalLeaderboardMockSnapshot } from "./LocalLeaderboardMockSystem";

export const WEEKLY_LEADERBOARD_SYSTEM_VERSION = "0.10.5-weekly-leaderboard";

export const WEEKLY_LEADERBOARD_SYSTEM_DEFINITION: WeeklyLeaderboardSystemDefinition = {
  version: WEEKLY_LEADERBOARD_SYSTEM_VERSION,
  goal: "Add deterministic weekly leaderboard periods and reset previews before real backend reset jobs, public score submission and reward payouts are enabled.",
  weeklyLeaderboards: WEEKLY_LEADERBOARD_IDS,
  resetPolicy: WEEKLY_LEADERBOARD_RESET_POLICY,
  backendLockedLeaderboards: WEEKLY_LEADERBOARD_IDS,
  rules: [
    "Weekly leaderboard previews use the same UTC Monday reset window for every player.",
    "Weekly Arena, Task Points and Boss Damage can be previewed locally but remain backend-locked for public rank and rewards.",
    "The period state is UI-safe and backend-ready: period key, start, end and next reset are all explicit ISO timestamps.",
    "Real weekly reset, leaderboard submit, tournament points, duel rank and boss rewards remain disabled until the adapter and anti-cheat phases.",
  ],
};

const MS_PER_MINUTE = 60_000;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

function getStartOfIsoWeekUtc(date: Date): Date {
  const utcMidnight = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNumber = utcMidnight.getUTCDay() || 7;
  utcMidnight.setUTCDate(utcMidnight.getUTCDate() - dayNumber + 1);
  utcMidnight.setUTCHours(
    WEEKLY_LEADERBOARD_RESET_POLICY.resetHourUtc,
    WEEKLY_LEADERBOARD_RESET_POLICY.resetMinuteUtc,
    0,
    0,
  );
  return utcMidnight;
}

function formatResetCountdown(period: WeeklyLeaderboardPeriodState): string {
  if (!period.isActive) return "Weekly window is not active.";
  if (period.daysRemaining > 0) {
    return `Resets in ${period.daysRemaining}d ${pad(period.hoursRemaining)}h UTC.`;
  }
  if (period.hoursRemaining > 0) {
    return `Resets in ${period.hoursRemaining}h ${pad(period.minutesRemaining)}m UTC.`;
  }
  return `Resets in ${period.minutesRemaining}m UTC.`;
}

function getWeeklySubmitLock(leaderboardId: WeeklyLeaderboardId): WeeklyLeaderboardSubmitLock {
  const readiness = getLeaderboardReadiness(leaderboardId);
  if (readiness.antiCheatRequired) return "anti_cheat_required";
  if (readiness.backendValidationRequired) return "backend_required";
  return "local_preview";
}

export function getWeeklyLeaderboardPeriodState(date = new Date()): WeeklyLeaderboardPeriodState {
  const startsAt = getStartOfIsoWeekUtc(date);
  const endsAt = new Date(startsAt.getTime() + 7 * MS_PER_DAY);
  const remainingMs = Math.max(0, endsAt.getTime() - date.getTime());
  const daysRemaining = Math.floor(remainingMs / MS_PER_DAY);
  const hoursRemaining = Math.floor((remainingMs % MS_PER_DAY) / MS_PER_HOUR);
  const minutesRemaining = Math.floor((remainingMs % MS_PER_HOUR) / MS_PER_MINUTE);

  return {
    periodKey: getLeaderboardPeriodKey("weekly_arena", date),
    startsAtIso: startsAt.toISOString(),
    endsAtIso: endsAt.toISOString(),
    nextResetAtIso: endsAt.toISOString(),
    resetTimezone: WEEKLY_LEADERBOARD_RESET_POLICY.timezone,
    daysRemaining,
    hoursRemaining,
    minutesRemaining,
    isActive: date.getTime() >= startsAt.getTime() && date.getTime() < endsAt.getTime(),
  };
}

export function getWeeklyLeaderboardIds(): readonly WeeklyLeaderboardId[] {
  return WEEKLY_LEADERBOARD_IDS;
}

export function getWeeklyLeaderboardPreview(
  leaderboardId: LeaderboardId,
  profile: PlayerProfile,
  date = new Date(),
): WeeklyLeaderboardPreview | undefined {
  if (!isWeeklyLeaderboardId(leaderboardId)) return undefined;

  const leaderboard = getLeaderboardDefinition(leaderboardId);
  const snapshot = createLocalLeaderboardMockSnapshot(leaderboardId, profile, date);
  const backendLocked = isLeaderboardBackendLocked(leaderboardId);
  const period = getWeeklyLeaderboardPeriodState(date);

  return {
    leaderboardId,
    period,
    backendStatus: leaderboard.backendStatus,
    playerRank: snapshot.playerEntry?.rank ?? 0,
    playerValue: snapshot.playerEntry?.value ?? 0,
    entriesShown: snapshot.entries.length,
    submitLock: getWeeklySubmitLock(leaderboardId),
    localPreviewOnly: true,
    backendLocked,
    resetNotice: formatResetCountdown(period),
  };
}

export function getAllWeeklyLeaderboardPreviews(profile: PlayerProfile, date = new Date()): WeeklyLeaderboardPreview[] {
  return WEEKLY_LEADERBOARD_IDS.map((leaderboardId) => getWeeklyLeaderboardPreview(leaderboardId, profile, date)).filter(
    (preview): preview is WeeklyLeaderboardPreview => Boolean(preview),
  );
}
