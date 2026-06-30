import {
  TOURNAMENT_DEFINITIONS,
  getTournamentDefinition,
  getTournamentPeriodKey,
  type TournamentId,
} from "../types/TournamentTypes";
import {
  getLeaderboardDefinition,
  type LeaderboardId,
  type LeaderboardScoreBreakdownRow,
  type LeaderboardSubmissionStatus,
  type LeaderboardSubmitPayload,
  type LeaderboardValidationTier,
} from "../types/LeaderboardTypes";
import { getLeaderboardAdapterProvider, getLeaderboardAdapterReadiness } from "./LeaderboardAdapterSystem";
import { createSampleTournamentRunResultPreview, createTournamentRunResultPreview } from "./TournamentRunResultSystem";
import type {
  TournamentLeaderboardLinkInput,
  TournamentLeaderboardLinkLock,
  TournamentLeaderboardLinkSource,
  TournamentLeaderboardLinkStatus,
  TournamentLeaderboardLinkSummary,
  TournamentLeaderboardLinkSystemDefinition,
  TournamentLeaderboardSubmitPreview,
} from "../types/TournamentLeaderboardLinkTypes";
import type { TournamentRunResultInput, TournamentRunResultPreview } from "../types/TournamentRunResultTypes";

export const TOURNAMENT_LEADERBOARD_LINK_SYSTEM_VERSION = "0.11.2-tournament-leaderboard-link";
export const LOCAL_TOURNAMENT_DISPLAY_NAME = "Local Broke Player";

export const TOURNAMENT_LEADERBOARD_LINK_SYSTEM_DEFINITION: TournamentLeaderboardLinkSystemDefinition = {
  version: TOURNAMENT_LEADERBOARD_LINK_SYSTEM_VERSION,
  goal: "Link tournament run result previews to a typed leaderboard submit payload without enabling public submit, rewards or backend writes.",
  sourceLeaderboardId: "tournament",
  publicSubmitEnabled: false,
  linkRules: [
    "Tournament results can create leaderboard submit payload previews only.",
    "The linked payload uses the tournament leaderboard period key and event score buckets.",
    "Participation points are included as a separate backend-validated leaderboard bucket.",
    "Public submit stays disabled until remote identity, anti-cheat and event window validation exist.",
    "The same payload shape can be reused later by the remote leaderboard adapter after validation.",
  ],
  requiredBeforeLiveSubmit: [
    "Remote leaderboard endpoint",
    "Backend player identity binding",
    "Tournament event window validation",
    "Run payload anti-cheat validation",
    "Tournament ruleset hash validation",
    "Duplicate submit protection",
    "Reward reconciliation after accepted submit",
  ],
};

function safeInteger(value: unknown): number {
  return Math.max(0, Math.floor(Number(value) || 0));
}

function safeDisplayName(displayName?: string): string {
  const normalized = String(displayName || LOCAL_TOURNAMENT_DISPLAY_NAME).trim();
  return normalized.length > 0 ? normalized : LOCAL_TOURNAMENT_DISPLAY_NAME;
}

function getSubmissionStatus(leaderboardId: LeaderboardId): LeaderboardSubmissionStatus {
  const readiness = getLeaderboardAdapterReadiness(leaderboardId);
  if (readiness.submitLock === "remote_adapter_missing") return "blocked_adapter_missing";
  if (readiness.submitLock === "anti_cheat_required") return "blocked_anticheat_required";
  if (readiness.submitLock === "backend_required") return "blocked_backend_required";
  return "local_preview";
}

function getLinkStatus(publicSubmitEnabled: boolean): TournamentLeaderboardLinkStatus {
  return publicSubmitEnabled ? "validated_ready" : "backend_locked";
}

function createScoreBreakdown(score: number, participationPoints: number): LeaderboardScoreBreakdownRow[] {
  return [
    {
      bucketId: "tournament",
      label: "Tournament run score",
      value: safeInteger(score),
      backendValidationRequired: true,
    },
    {
      bucketId: "participation",
      label: "Participation points",
      value: safeInteger(participationPoints),
      backendValidationRequired: true,
    },
  ];
}

function createLocks(leaderboardId: LeaderboardId): TournamentLeaderboardLinkLock[] {
  const readiness = getLeaderboardAdapterReadiness(leaderboardId);
  return [
    {
      id: "public_submit_disabled",
      label: "Public tournament leaderboard submit is disabled in this local preview.",
      blocking: true,
    },
    {
      id: "leaderboard_adapter_locked",
      label: `Leaderboard adapter lock: ${readiness.submitLock.replace(/_/g, " ")}.`,
      blocking: true,
    },
    {
      id: "tournament_validation_required",
      label: "Tournament run must be validated before ranked points become public.",
      blocking: true,
    },
    {
      id: "anti_cheat_required",
      label: "Anti-cheat must verify seed, duration, damage, HP and score.",
      blocking: true,
    },
    {
      id: "event_window_validation_required",
      label: "Backend must verify the tournament period is active and eligible.",
      blocking: true,
    },
    {
      id: "duplicate_submit_protection_required",
      label: "Backend must prevent duplicate submits for the same run id.",
      blocking: true,
    },
  ];
}

export function createTournamentLeaderboardSubmitPreview(input: TournamentLeaderboardLinkInput): TournamentLeaderboardSubmitPreview {
  const tournament = getTournamentDefinition(input.tournamentId);
  const leaderboard = getLeaderboardDefinition(tournament.leaderboardId);
  const provider = getLeaderboardAdapterProvider(tournament.leaderboardId);
  const periodKey = getTournamentPeriodKey(input.tournamentId);
  const score = safeInteger(input.score);
  const participationPoints = safeInteger(input.participationPoints);
  const value = score + participationPoints;
  const scoreBreakdown = createScoreBreakdown(score, participationPoints);
  const validationTier: LeaderboardValidationTier = leaderboard.scorePolicy.validationTier;
  const submissionStatus = getSubmissionStatus(tournament.leaderboardId);
  const adapterReadiness = getLeaderboardAdapterReadiness(tournament.leaderboardId);
  const displayName = safeDisplayName(input.displayName);
  const publicSubmitEnabled = false;

  const payload: LeaderboardSubmitPayload = {
    leaderboardId: tournament.leaderboardId,
    playerId: input.playerId,
    displayName,
    periodKey,
    value,
    metric: leaderboard.metric,
    scoreBreakdown,
    validationTier,
    submissionStatus,
    backendValidationRequired: true,
    antiCheatRequired: true,
    submissionEnabled: false,
    createdAtIso: input.completedAtIso || new Date(0).toISOString(),
  };

  return {
    tournamentId: input.tournamentId,
    leaderboardId: tournament.leaderboardId,
    providerId: provider.id,
    periodKey,
    runId: input.runId || `leaderboard-link:${input.tournamentId}:${input.playerId}:${periodKey}`,
    playerId: input.playerId,
    displayName,
    source: input.source,
    value,
    metric: leaderboard.metric,
    scoreBreakdown,
    payload,
    validationTier,
    submissionStatus,
    adapterSubmitLock: adapterReadiness.submitLock,
    linkStatus: getLinkStatus(publicSubmitEnabled),
    publicSubmitEnabled,
    localPreviewOnly: true,
    locks: createLocks(tournament.leaderboardId),
    summaryRows: [
      `LEADERBOARD: ${leaderboard.shortTitle}`,
      `VALUE: ${value.toLocaleString("en-US")} ${leaderboard.metric.replace(/_/g, " ")}`,
      `PAYLOAD: preview only`,
      `SUBMIT: disabled until backend validation`,
    ],
  };
}

export function createTournamentLeaderboardSubmitPreviewFromRunResult(
  preview: TournamentRunResultPreview,
  displayName?: string,
  source: TournamentLeaderboardLinkSource = "local_result_preview",
): TournamentLeaderboardSubmitPreview {
  return createTournamentLeaderboardSubmitPreview({
    tournamentId: preview.tournamentId,
    playerId: preview.playerId,
    runId: preview.runId,
    displayName,
    source,
    score: preview.result.points,
    participationPoints: preview.result.participationPoints,
    completedAtIso: preview.result.submittedAtIso,
  });
}

export function createTournamentLeaderboardSubmitPreviewFromRunInput(
  input: TournamentRunResultInput,
  displayName?: string,
): TournamentLeaderboardSubmitPreview {
  const preview = createTournamentRunResultPreview(input);
  return createTournamentLeaderboardSubmitPreviewFromRunResult(preview, displayName, "arena_result_payload");
}

export function createSampleTournamentLeaderboardSubmitPreview(tournamentId: TournamentId): TournamentLeaderboardSubmitPreview {
  const preview = createSampleTournamentRunResultPreview(tournamentId);
  return createTournamentLeaderboardSubmitPreviewFromRunResult(preview, LOCAL_TOURNAMENT_DISPLAY_NAME, "local_result_preview");
}

export function createTournamentLeaderboardSubmitPreviewMap(): Record<TournamentId, TournamentLeaderboardSubmitPreview> {
  return TOURNAMENT_DEFINITIONS.reduce<Record<TournamentId, TournamentLeaderboardSubmitPreview>>((map, tournament) => {
    map[tournament.id] = createSampleTournamentLeaderboardSubmitPreview(tournament.id);
    return map;
  }, {} as Record<TournamentId, TournamentLeaderboardSubmitPreview>);
}

export function getTournamentLeaderboardLinkSummary(): TournamentLeaderboardLinkSummary {
  const previews = TOURNAMENT_DEFINITIONS.map((tournament) => createSampleTournamentLeaderboardSubmitPreview(tournament.id));
  const linkedLeaderboardIds = Array.from(new Set(previews.map((preview) => preview.leaderboardId)));
  return {
    version: TOURNAMENT_LEADERBOARD_LINK_SYSTEM_VERSION,
    previewCount: previews.length,
    publicSubmitEnabled: false,
    backendLockedCount: previews.filter((preview) => preview.locks.some((lock) => lock.blocking)).length,
    linkedLeaderboardIds,
  };
}
