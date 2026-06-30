import {
  TOURNAMENT_DEFINITIONS,
  getTournamentDefinition,
  getTournamentPeriodKey,
  getTournamentReadiness,
  type TournamentId,
  type TournamentRunResult,
  type TournamentScoreInput,
} from "../types/TournamentTypes";
import { calculateTournamentScoreSnapshot } from "./TournamentScoringSystem";
import type {
  TournamentRunResultInput,
  TournamentRunResultLock,
  TournamentRunResultPreview,
  TournamentRunResultPreviewMap,
  TournamentRunResultSummary,
  TournamentRunResultSystemDefinition,
  TournamentRunResultTone,
} from "../types/TournamentRunResultTypes";

export const TOURNAMENT_RUN_RESULT_SYSTEM_VERSION = "0.11.1-tournament-run-result";
export const LOCAL_TOURNAMENT_PLAYER_ID = "local-player-preview";
export const LOCAL_TOURNAMENT_RESULT_TIMESTAMP = "2026-01-01T00:00:00.000Z";

export const TOURNAMENT_RUN_RESULT_SYSTEM_DEFINITION: TournamentRunResultSystemDefinition = {
  version: TOURNAMENT_RUN_RESULT_SYSTEM_VERSION,
  goal: "Define a tournament run result payload and local result preview before leaderboard submit, reward claim or backend validation are enabled.",
  resultRules: [
    "Tournament run results are preview-only in this patch and must not mutate leaderboard, tournament points or public rewards.",
    "Every result carries tournament id, period key, run id, player id, normalized score snapshot and submit locks.",
    "Participation rewards can be displayed as pending, but they cannot be claimed until backend validation exists.",
    "Public submit remains disabled even for local-preview tournaments.",
    "The result payload is shaped so the future leaderboard adapter can submit the same contract after validation.",
  ],
  requiredBeforeLiveSubmit: [
    "Arena run result payload capture",
    "Leaderboard adapter submit link",
    "Backend identity binding",
    "Anti-cheat validation for seed, duration, damage, HP and score",
    "Tournament event window validation",
    "Reward reconciliation and duplicate submit protection",
  ],
};

function safeInteger(value: unknown): number {
  return Math.max(0, Math.floor(Number(value) || 0));
}

function safePlayerId(playerId?: string): string {
  const normalized = String(playerId || LOCAL_TOURNAMENT_PLAYER_ID).trim();
  return normalized.length > 0 ? normalized : LOCAL_TOURNAMENT_PLAYER_ID;
}

function makeRunId(tournamentId: TournamentId, playerId: string, periodKey: string): string {
  const stable = `${tournamentId}:${playerId}:${periodKey}`.replace(/[^a-z0-9:_-]+/gi, "-").toLowerCase();
  return `local-run:${stable}`;
}

function getTone(tournamentId: TournamentId): TournamentRunResultTone {
  const tournament = getTournamentDefinition(tournamentId);
  if (tournament.backendStatus === "local_preview") return "local_preview";
  if (tournament.backendStatus === "adapter_ready") return "backend_locked";
  return "backend_locked";
}

function getSampleInputForTournament(tournamentId: TournamentId): TournamentScoreInput {
  const tournament = getTournamentDefinition(tournamentId);
  if (tournament.modeId === "boss_damage") {
    return {
      score: 900,
      leaksDefeated: 8,
      bossDamage: 7200,
      survivedSeconds: 150,
      hpRemaining: 48,
      guards: 3,
      damageTaken: 145,
      participated: true,
    };
  }
  if (tournament.modeId === "survival_gauntlet") {
    return {
      score: 1250,
      leaksDefeated: 18,
      bossDamage: 1800,
      survivedSeconds: 210,
      hpRemaining: 54,
      guards: 7,
      damageTaken: 110,
      participated: true,
    };
  }
  return {
    score: 1400,
    leaksDefeated: 16,
    bossDamage: 2600,
    survivedSeconds: 135,
    hpRemaining: 72,
    guards: 4,
    damageTaken: 65,
    participated: true,
  };
}

function mergeScoreInput(tournamentId: TournamentId, input: TournamentRunResultInput): TournamentScoreInput {
  const fallback = getSampleInputForTournament(tournamentId);
  return {
    score: safeInteger(input.score ?? fallback.score),
    leaksDefeated: safeInteger(input.leaksDefeated ?? fallback.leaksDefeated),
    bossDamage: safeInteger(input.bossDamage ?? fallback.bossDamage),
    survivedSeconds: safeInteger(input.survivedSeconds ?? fallback.survivedSeconds),
    hpRemaining: safeInteger(input.hpRemaining ?? fallback.hpRemaining),
    guards: safeInteger(input.guards ?? fallback.guards),
    damageTaken: safeInteger(input.damageTaken ?? fallback.damageTaken),
    participated: input.participated ?? fallback.participated,
  };
}

function getParticipationPoints(tournamentId: TournamentId): number {
  const tournament = getTournamentDefinition(tournamentId);
  const reward = tournament.participationRewards.find((item) => item.currencyId === "tournament_points");
  return safeInteger(reward?.amount ?? 0);
}

function createLocks(tournamentId: TournamentId): TournamentRunResultLock[] {
  const readiness = getTournamentReadiness(tournamentId);
  return [
    {
      id: "public_submit_disabled",
      label: "Public leaderboard submit is disabled in local preview.",
      blocking: true,
    },
    {
      id: "backend_identity_required",
      label: "Backend player identity is required before ranked submission.",
      blocking: readiness.backendValidationRequired,
    },
    {
      id: "run_validation_required",
      label: "Run payload validation is required before tournament points become real.",
      blocking: true,
    },
    {
      id: "anti_cheat_required",
      label: "Anti-cheat must verify seed, duration, damage, HP and score.",
      blocking: readiness.antiCheatRequired,
    },
    {
      id: "reward_claim_locked",
      label: "Participation and bracket rewards stay locked until backend validation.",
      blocking: true,
    },
  ];
}

export function createTournamentRunResultPreview(input: TournamentRunResultInput): TournamentRunResultPreview {
  const tournament = getTournamentDefinition(input.tournamentId);
  const periodKey = getTournamentPeriodKey(input.tournamentId);
  const playerId = safePlayerId(input.playerId);
  const runId = input.runId || makeRunId(input.tournamentId, playerId, periodKey);
  const scoreInput = mergeScoreInput(input.tournamentId, input);
  const scoreSnapshot = calculateTournamentScoreSnapshot(input.tournamentId, scoreInput, "local_run_preview");
  const participationPoints = getParticipationPoints(input.tournamentId);
  const locks = createLocks(input.tournamentId);
  const result: TournamentRunResult = {
    tournamentId: input.tournamentId,
    playerId,
    runId,
    points: scoreSnapshot.points,
    participationPoints,
    submittedAtIso: input.completedAtIso || LOCAL_TOURNAMENT_RESULT_TIMESTAMP,
    validationStatus: "local",
  };

  return {
    tournamentId: input.tournamentId,
    leaderboardId: tournament.leaderboardId,
    periodKey,
    runId,
    playerId,
    source: input.source,
    tone: getTone(input.tournamentId),
    result,
    scoreSnapshot,
    validationTier: scoreSnapshot.validationTier,
    submissionStatus: scoreSnapshot.submissionStatus,
    locks,
    rewardPreview: {
      rewards: tournament.participationRewards,
      backendValidationRequired: true,
      claimEnabled: false,
    },
    leaderboardSubmitEnabled: false,
    publicRewardClaimEnabled: false,
    summaryRows: [
      `RESULT: ${scoreSnapshot.points.toLocaleString("en-US")} tournament points`,
      `PARTICIPATION: ${participationPoints.toLocaleString("en-US")} pending points`,
      `VALIDATION: local preview only`,
      `SUBMIT: disabled until backend validation`,
    ],
  };
}

export function createSampleTournamentRunResultPreview(tournamentId: TournamentId): TournamentRunResultPreview {
  return createTournamentRunResultPreview({
    tournamentId,
    playerId: LOCAL_TOURNAMENT_PLAYER_ID,
    source: "local_preview_button",
    ...getSampleInputForTournament(tournamentId),
  });
}

export function createTournamentRunResultPreviewMap(): TournamentRunResultPreviewMap {
  return TOURNAMENT_DEFINITIONS.reduce<TournamentRunResultPreviewMap>((map, tournament) => {
    map[tournament.id] = createSampleTournamentRunResultPreview(tournament.id);
    return map;
  }, {} as TournamentRunResultPreviewMap);
}

export function getTournamentRunResultSummary(): TournamentRunResultSummary {
  const previews = TOURNAMENT_DEFINITIONS.map((tournament) => createSampleTournamentRunResultPreview(tournament.id));
  return {
    version: TOURNAMENT_RUN_RESULT_SYSTEM_VERSION,
    tournamentCount: previews.length,
    localPreviewCount: previews.filter((preview) => preview.tone === "local_preview").length,
    backendLockedCount: previews.filter((preview) => preview.locks.some((lock) => lock.blocking)).length,
    leaderboardSubmitEnabled: false,
    publicRewardClaimEnabled: false,
  };
}
