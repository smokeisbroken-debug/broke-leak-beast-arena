import type { LeaderboardSubmissionStatus, LeaderboardValidationTier } from "../types/LeaderboardTypes";
import {
  TOURNAMENT_DEFINITIONS,
  TOURNAMENT_SCORE_COMPONENT_LABELS,
  getTournamentDefinition,
  getTournamentPeriodKey,
  getTournamentReadiness,
  isTournamentBackendLocked,
  type TournamentId,
  type TournamentScoreBreakdownRow,
  type TournamentScoreComponentId,
  type TournamentScoreInput,
} from "../types/TournamentTypes";
import type {
  TournamentNormalizedScoreInput,
  TournamentScoreCaps,
  TournamentScorePenaltyRow,
  TournamentScorePreviewCard,
  TournamentScorePreviewCardMap,
  TournamentScoreSafetyTier,
  TournamentScoreSource,
  TournamentScoreVerdict,
  TournamentScoringSnapshot,
  TournamentScoringSummary,
  TournamentScoringSystemDefinition,
} from "../types/TournamentScoringTypes";

export const TOURNAMENT_SCORING_SYSTEM_VERSION = "0.10.9-tournament-scoring";

export const TOURNAMENT_SCORE_CAPS: TournamentScoreCaps = {
  score: 50000,
  leaksDefeated: 500,
  bossDamage: 200000,
  survivedSeconds: 600,
  hpRemaining: 100,
  guards: 999,
  damageTaken: 9999,
  finalPoints: 250000,
};

export const TOURNAMENT_SCORING_SAMPLE_INPUT: TournamentScoreInput = {
  score: 1000,
  leaksDefeated: 12,
  bossDamage: 2500,
  survivedSeconds: 120,
  hpRemaining: 65,
  guards: 4,
  damageTaken: 80,
  participated: true,
};

export const TOURNAMENT_SCORING_SYSTEM_DEFINITION: TournamentScoringSystemDefinition = {
  version: TOURNAMENT_SCORING_SYSTEM_VERSION,
  goal: "Create a deterministic tournament scoring layer for points, component breakdowns, caps and backend locks before Tournament Scene or public submission is enabled.",
  defaultCaps: TOURNAMENT_SCORE_CAPS,
  safetyRules: [
    "Tournament scoring is preview-only until run payload validation and leaderboard adapter submit are implemented.",
    "All raw inputs are normalized and capped before points are calculated.",
    "Damage taken is always a penalty; participation is a small fixed activity signal, not a win condition.",
    "Public submit remains disabled for every tournament in this patch.",
    "Tournament Points and ranked rewards remain backend-locked.",
  ],
  requiredBeforeRealSubmit: [
    "Tournament Scene and run entry flow",
    "Verified run result payload",
    "Leaderboard adapter submit implementation",
    "Backend identity binding",
    "Anti-cheat checks for seed, duration, damage, HP and score",
    "Reward bracket reconciliation service",
  ],
};

function clampInteger(value: unknown, max: number): number {
  const numeric = Math.floor(Number(value) || 0);
  return Math.max(0, Math.min(max, numeric));
}

function component(
  componentId: TournamentScoreComponentId,
  rawValue: number,
  weight: number,
  backendValidationRequired: boolean,
): TournamentScoreBreakdownRow {
  return {
    componentId,
    label: TOURNAMENT_SCORE_COMPONENT_LABELS[componentId],
    rawValue,
    weight,
    points: Math.floor(rawValue * weight),
    backendValidationRequired,
  };
}

function getSafetyTier(tournamentId: TournamentId): TournamentScoreSafetyTier {
  const tournament = getTournamentDefinition(tournamentId);
  if (tournament.backendStatus === "local_preview") return "backend_locked";
  if (tournament.backendStatus === "adapter_ready") return "backend_locked";
  return "backend_authoritative";
}

function getValidationTier(tournamentId: TournamentId): LeaderboardValidationTier {
  const tournament = getTournamentDefinition(tournamentId);
  return tournament.backendStatus === "local_preview" ? "backend_required" : "backend_authoritative";
}

function getVerdict(tournamentId: TournamentId): TournamentScoreVerdict {
  const readiness = getTournamentReadiness(tournamentId);
  if (readiness.antiCheatRequired) return "blocked_anticheat";
  if (readiness.backendValidationRequired) return "blocked_backend_validation";
  return "preview_only";
}

function getSubmissionStatus(tournamentId: TournamentId): LeaderboardSubmissionStatus {
  const readiness = getTournamentReadiness(tournamentId);
  if (readiness.antiCheatRequired) return "blocked_anticheat_required";
  if (readiness.backendValidationRequired) return "blocked_backend_required";
  return "local_preview";
}

export function normalizeTournamentScoreInput(
  input: Partial<TournamentScoreInput>,
  source: TournamentScoreSource = "local_run_preview",
): TournamentNormalizedScoreInput {
  return {
    source,
    score: clampInteger(input.score, TOURNAMENT_SCORE_CAPS.score),
    leaksDefeated: clampInteger(input.leaksDefeated, TOURNAMENT_SCORE_CAPS.leaksDefeated),
    bossDamage: clampInteger(input.bossDamage, TOURNAMENT_SCORE_CAPS.bossDamage),
    survivedSeconds: clampInteger(input.survivedSeconds, TOURNAMENT_SCORE_CAPS.survivedSeconds),
    hpRemaining: clampInteger(input.hpRemaining, TOURNAMENT_SCORE_CAPS.hpRemaining),
    guards: clampInteger(input.guards, TOURNAMENT_SCORE_CAPS.guards),
    damageTaken: clampInteger(input.damageTaken, TOURNAMENT_SCORE_CAPS.damageTaken),
    participated: Boolean(input.participated),
  };
}

export function calculateTournamentScoreSnapshot(
  tournamentId: TournamentId,
  input: Partial<TournamentScoreInput> = TOURNAMENT_SCORING_SAMPLE_INPUT,
  source: TournamentScoreSource = "local_run_preview",
): TournamentScoringSnapshot {
  const tournament = getTournamentDefinition(tournamentId);
  const readiness = getTournamentReadiness(tournamentId);
  const normalizedInput = normalizeTournamentScoreInput(input, source);
  const weights = tournament.scoreWeights;
  const backendValidationRequired = readiness.backendValidationRequired || isTournamentBackendLocked(tournamentId);
  const breakdown: TournamentScoreBreakdownRow[] = [
    component("base_score", normalizedInput.score, weights.score, backendValidationRequired),
    component("leaks_defeated", normalizedInput.leaksDefeated, weights.leaksDefeated, backendValidationRequired),
    component("boss_damage", normalizedInput.bossDamage, weights.bossDamage, backendValidationRequired),
    component("survival_time", normalizedInput.survivedSeconds, weights.survivedSeconds, backendValidationRequired),
    component("hp_remaining", normalizedInput.hpRemaining, weights.hpRemaining, backendValidationRequired),
    component("guard_skill", normalizedInput.guards, weights.guards, backendValidationRequired),
    component("participation", normalizedInput.participated ? 1 : 0, weights.participation, backendValidationRequired),
    component("damage_penalty", normalizedInput.damageTaken, -weights.damageTakenPenalty, backendValidationRequired),
  ];
  const uncappedPoints = Math.max(0, breakdown.reduce((total, row) => total + row.points, 0));
  const points = Math.min(uncappedPoints, TOURNAMENT_SCORE_CAPS.finalPoints);
  const validationTier = getValidationTier(tournamentId);
  const verdict = getVerdict(tournamentId);
  const penalties: TournamentScorePenaltyRow[] = [
    {
      id: "damage_taken",
      label: "Damage taken penalty",
      value: normalizedInput.damageTaken,
      points: Math.floor(normalizedInput.damageTaken * -weights.damageTakenPenalty),
      backendValidationRequired,
    },
    {
      id: "missing_participation",
      label: "No participation bonus if the run was not started",
      value: normalizedInput.participated ? 0 : 1,
      points: normalizedInput.participated ? 0 : -weights.participation,
      backendValidationRequired,
    },
    {
      id: "backend_lock",
      label: "Public tournament submit is locked until backend validation exists",
      value: backendValidationRequired ? 1 : 0,
      points: 0,
      backendValidationRequired,
    },
  ];

  return {
    tournamentId,
    leaderboardId: tournament.leaderboardId,
    periodKey: getTournamentPeriodKey(tournamentId),
    points,
    breakdown,
    validationTier,
    backendValidationRequired,
    publicSubmitEnabled: false,
    safetyTier: getSafetyTier(tournamentId),
    scoreSource: source,
    verdict,
    submissionStatus: getSubmissionStatus(tournamentId),
    normalizedInput,
    weights,
    caps: TOURNAMENT_SCORE_CAPS,
    penalties,
    localPreviewValue: points,
    backendLockedReason: backendValidationRequired
      ? "Tournament scores require backend identity, run validation and anti-cheat before public submit."
      : "Local preview only; public submit is intentionally disabled in this skeleton patch.",
  };
}

export function createTournamentScoringPreviewCard(tournamentId: TournamentId): TournamentScorePreviewCard {
  const snapshot = calculateTournamentScoreSnapshot(tournamentId, TOURNAMENT_SCORING_SAMPLE_INPUT, "sample_preview");
  const positivePointTotal = snapshot.breakdown.reduce((total, row) => total + Math.max(0, row.points), 0);
  const penaltyPointTotal = snapshot.breakdown.reduce((total, row) => total + Math.min(0, row.points), 0);

  return {
    tournamentId,
    leaderboardId: snapshot.leaderboardId,
    periodKey: snapshot.periodKey,
    points: snapshot.points,
    validationTier: snapshot.validationTier,
    verdict: snapshot.verdict,
    backendValidationRequired: snapshot.backendValidationRequired,
    publicSubmitEnabled: snapshot.publicSubmitEnabled,
    componentCount: snapshot.breakdown.length,
    positivePointTotal,
    penaltyPointTotal,
  };
}

export function createTournamentScoringPreviewCardMap(): TournamentScorePreviewCardMap {
  return TOURNAMENT_DEFINITIONS.reduce<TournamentScorePreviewCardMap>((map, tournament) => {
    map[tournament.id] = createTournamentScoringPreviewCard(tournament.id);
    return map;
  }, {} as TournamentScorePreviewCardMap);
}

export function getTournamentScoringSummary(): TournamentScoringSummary {
  const previewCards = TOURNAMENT_DEFINITIONS.map((tournament) => createTournamentScoringPreviewCard(tournament.id));
  return {
    version: TOURNAMENT_SCORING_SYSTEM_VERSION,
    tournamentCount: previewCards.length,
    previewCards,
    backendLockedCount: previewCards.filter((card) => card.backendValidationRequired).length,
    publicSubmitEnabled: false,
  };
}
