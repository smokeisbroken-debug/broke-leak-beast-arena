import type { PlayerProfile } from "../data/playerProfile";
import {
  LEADERBOARD_DEFINITIONS,
  LEADERBOARD_SCORE_BUCKETS,
  getLeaderboardDefinition,
  getLeaderboardPeriodKey,
  getLeaderboardReadiness,
  getLeaderboardScoreBucket,
  isLeaderboardBackendLocked,
  type LeaderboardDefinition,
  type LeaderboardEntry,
  type LeaderboardId,
  type LeaderboardScoreBreakdownRow,
  type LeaderboardSnapshot,
  type LeaderboardSubmitPayload,
  type LeaderboardSystemDefinition,
} from "../types/LeaderboardTypes";

export const LEADERBOARD_SYSTEM_VERSION = "0.10.5-weekly-leaderboard";

export const LEADERBOARD_SYSTEM_DEFINITION: LeaderboardSystemDefinition = {
  version: LEADERBOARD_SYSTEM_VERSION,
  goal: "Define multiplayer-ready leaderboard contracts and feed local mock snapshots before real remote adapters, tournament scoring and Leak Duel ranked submission are enabled.",
  leaderboardIds: LEADERBOARD_DEFINITIONS.map((leaderboard) => leaderboard.id),
  localPreviewLeaderboards: LEADERBOARD_DEFINITIONS.filter((leaderboard) => leaderboard.backendStatus === "local_mock").map(
    (leaderboard) => leaderboard.id,
  ),
  backendLockedLeaderboards: LEADERBOARD_DEFINITIONS.filter((leaderboard) => isLeaderboardBackendLocked(leaderboard.id)).map(
    (leaderboard) => leaderboard.id,
  ),
  scoreBuckets: LEADERBOARD_SCORE_BUCKETS,
  rules: [
    "Leaderboard definitions, local mock snapshots and weekly period keys are available to UI and systems, but public submission remains disabled.",
    "Global Power can be displayed locally because it uses capped profile progression data and deterministic mock rivals.",
    "Weekly Arena, Task Points and Boss Damage use the UTC weekly reset skeleton before backend reset jobs exist.",
    "Tournament participation points and Leak Duel rank points must be verified against event windows, duel seeds and anti-cheat payloads before rewards become real.",
  ],
};

function safeInteger(value: unknown): number {
  return Math.max(0, Math.floor(Number(value) || 0));
}

function getDisplayName(profile: PlayerProfile): string {
  return profile.identity.displayName || "Broke Fighter";
}

function getProfilePowerScore(profile: PlayerProfile): number {
  return safeInteger(profile.progressionV2.powerScore || profile.level * 10);
}

export function getLeaderboardValueForProfile(leaderboardId: LeaderboardId, profile: PlayerProfile): number {
  if (leaderboardId === "global_power") return getProfilePowerScore(profile);
  if (leaderboardId === "weekly_arena") return safeInteger(profile.bestScore);
  if (leaderboardId === "task_points") return safeInteger(profile.taskPoints || profile.multiplayer.taskPoints);
  if (leaderboardId === "tournament") return safeInteger(profile.tournamentPoints || profile.tournaments.bestTournamentPoints);
  if (leaderboardId === "duel_ranked") return safeInteger(profile.rankPoints || profile.duels.rating);
  return safeInteger(profile.multiplayer.weeklyBossDamage);
}

export function getLeaderboardScoreBreakdownForProfile(
  leaderboardId: LeaderboardId,
  profile: PlayerProfile,
): LeaderboardScoreBreakdownRow[] {
  const leaderboard = getLeaderboardDefinition(leaderboardId);
  return leaderboard.scorePolicy.sourceBuckets.map((bucketId) => {
    const bucket = getLeaderboardScoreBucket(bucketId);
    const rawValue = getLeaderboardValueForProfile(leaderboardId, profile);
    const cappedValue = leaderboard.scorePolicy.maxPublicValue
      ? Math.min(rawValue, leaderboard.scorePolicy.maxPublicValue)
      : leaderboard.scorePolicy.maxLocalPreviewValue
        ? Math.min(rawValue, leaderboard.scorePolicy.maxLocalPreviewValue)
        : rawValue;

    return {
      bucketId,
      label: bucket.label,
      value: rawValue,
      cappedValue,
      backendValidationRequired: bucket.backendValidationRequired || isLeaderboardBackendLocked(leaderboardId),
    };
  });
}

export function createLeaderboardEntryFromProfile(
  leaderboardId: LeaderboardId,
  profile: PlayerProfile,
  rank = 1,
  date = new Date(),
): LeaderboardEntry {
  const leaderboard = getLeaderboardDefinition(leaderboardId);
  const periodKey = getLeaderboardPeriodKey(leaderboardId, date);
  const value = getLeaderboardValueForProfile(leaderboardId, profile);

  return {
    playerId: profile.identity.localPlayerId,
    displayName: getDisplayName(profile),
    rank,
    value,
    periodKey,
    validationTier: leaderboard.scorePolicy.validationTier,
    updatedAtIso: date.toISOString(),
    metadata: {
      backendLocked: isLeaderboardBackendLocked(leaderboardId),
      metric: leaderboard.metric,
      scope: leaderboard.scope,
    },
  };
}

export function createLocalLeaderboardSnapshot(
  leaderboardId: LeaderboardId,
  profile: PlayerProfile,
  date = new Date(),
): LeaderboardSnapshot {
  const leaderboard = getLeaderboardDefinition(leaderboardId);
  const playerEntry = createLeaderboardEntryFromProfile(leaderboardId, profile, 1, date);

  return {
    leaderboardId,
    periodKey: playerEntry.periodKey,
    generatedAtIso: date.toISOString(),
    entries: [playerEntry],
    playerEntry,
    backendStatus: leaderboard.backendStatus,
    submissionEnabled: false,
  };
}

export function createLeaderboardSubmitPayload(
  leaderboardId: LeaderboardId,
  profile: PlayerProfile,
  date = new Date(),
): LeaderboardSubmitPayload {
  const leaderboard = getLeaderboardDefinition(leaderboardId);
  const readiness = getLeaderboardReadiness(leaderboardId);
  const backendValidationRequired = readiness.backendValidationRequired;
  const submissionStatus = backendValidationRequired
    ? leaderboard.antiCheatRequired
      ? "blocked_anticheat_required"
      : "blocked_backend_required"
    : "local_preview";

  return {
    leaderboardId,
    playerId: profile.identity.localPlayerId,
    displayName: getDisplayName(profile),
    periodKey: getLeaderboardPeriodKey(leaderboardId, date),
    value: getLeaderboardValueForProfile(leaderboardId, profile),
    metric: leaderboard.metric,
    scoreBreakdown: getLeaderboardScoreBreakdownForProfile(leaderboardId, profile),
    validationTier: leaderboard.scorePolicy.validationTier,
    submissionStatus,
    backendValidationRequired,
    antiCheatRequired: leaderboard.antiCheatRequired,
    submissionEnabled: false,
    createdAtIso: date.toISOString(),
  };
}

export function getLeaderboardDefinitionsByBackendStatus(
  backendStatus: LeaderboardDefinition["backendStatus"],
): LeaderboardDefinition[] {
  return LEADERBOARD_DEFINITIONS.filter((leaderboard) => leaderboard.backendStatus === backendStatus);
}
