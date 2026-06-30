import {
  DUEL_DEFINITIONS,
  getDuelDefinition,
  type DuelModeId,
  type DuelOutcome,
} from "../types/DuelTypes";
import {
  getLeaderboardDefinition,
  type LeaderboardId,
  type LeaderboardScoreBreakdownRow,
  type LeaderboardSubmissionStatus,
  type LeaderboardSubmitPayload,
  type LeaderboardValidationTier,
} from "../types/LeaderboardTypes";
import { getLeaderboardAdapterProvider, getLeaderboardAdapterReadiness } from "./LeaderboardAdapterSystem";
import { createDuelResultPreview } from "./DuelResultSystem";
import type { DuelResultPreview } from "../types/DuelResultTypes";
import type {
  DuelLeaderboardLinkInput,
  DuelLeaderboardLinkLock,
  DuelLeaderboardLinkLockId,
  DuelLeaderboardLinkSource,
  DuelLeaderboardLinkStatus,
  DuelLeaderboardLinkSummary,
  DuelLeaderboardLinkSystemDefinition,
  DuelLeaderboardPointFormulaInput,
  DuelLeaderboardPointFormulaResult,
  DuelLeaderboardSubmitPreview,
} from "../types/DuelLeaderboardLinkTypes";

export const DUEL_LEADERBOARD_LINK_SYSTEM_VERSION = "0.11.8-duel-leaderboard-link";
export const LOCAL_DUEL_PLAYER_ID = "local-duel-player";
export const LOCAL_DUEL_DISPLAY_NAME = "Local Broke Duelist";

const DUEL_LEADERBOARD_LOCK_IDS: readonly DuelLeaderboardLinkLockId[] = [
  "public_submit_disabled",
  "leaderboard_adapter_locked",
  "duel_seed_validation_required",
  "opponent_result_required",
  "anti_cheat_required",
  "reward_reconciliation_required",
];

export const DUEL_LEADERBOARD_LINK_SYSTEM_DEFINITION: DuelLeaderboardLinkSystemDefinition = {
  version: DUEL_LEADERBOARD_LINK_SYSTEM_VERSION,
  goal: "Convert a Leak Duel result preview into a typed duel_ranked leaderboard submit payload while keeping ranked submission, Rank Points and rewards backend locked.",
  sourceLeaderboardId: "duel_ranked",
  publicSubmitEnabled: false,
  localPreviewOnly: true,
  linkRules: [
    "Leak Duel results create leaderboard submit payload previews only.",
    "Rank Points are calculated from participation, outcome, clean performance and score margin, then locked until backend validation.",
    "The payload must preserve duel id, match id, period key, same-seed score breakdown and validation tier.",
    "Public submit stays disabled until seed, opponent result, anti-cheat and reward reconciliation exist remotely.",
    "Local previews must never grant real Rank Points, Leak Points, XP or tournament participation rewards.",
  ],
  requiredBeforeLiveSubmit: [
    "Remote duel matchmaking or invite identity",
    "Backend seed issuance and seed hash verification",
    "Opponent result reconciliation",
    "Run payload anti-cheat validation",
    "Duplicate submit protection per match id",
    "Rank Point and reward reconciliation after accepted submit",
  ],
};

function safeInteger(value: unknown): number {
  return Math.max(0, Math.floor(Number(value) || 0));
}

function safeDisplayName(displayName?: string): string {
  const normalized = String(displayName || LOCAL_DUEL_DISPLAY_NAME).trim();
  return normalized.length > 0 ? normalized : LOCAL_DUEL_DISPLAY_NAME;
}

function getOutcomePoints(outcome: DuelOutcome): number {
  if (outcome === "player_a_win") return 80;
  if (outcome === "draw") return 35;
  return 0;
}

function getLinkStatus(publicSubmitEnabled: boolean): DuelLeaderboardLinkStatus {
  return publicSubmitEnabled ? "validated_ready" : "backend_locked";
}

function getSubmissionStatus(leaderboardId: LeaderboardId): LeaderboardSubmissionStatus {
  const readiness = getLeaderboardAdapterReadiness(leaderboardId);
  if (readiness.submitLock === "remote_adapter_missing") return "blocked_adapter_missing";
  if (readiness.submitLock === "anti_cheat_required") return "blocked_anticheat_required";
  if (readiness.submitLock === "backend_required") return "blocked_backend_required";
  return "local_preview";
}

export function calculateDuelRankPointPreview(input: DuelLeaderboardPointFormulaInput): DuelLeaderboardPointFormulaResult {
  const duelScore = safeInteger(input.duelScore);
  const scoreMargin = safeInteger(input.scoreMargin);
  const baseParticipationPoints = input.participated ? 25 : 0;
  const outcomePoints = getOutcomePoints(input.outcome);
  const performancePoints = Math.min(125, Math.floor(duelScore / 25));
  const marginPoints = input.outcome === "player_a_win" ? Math.min(30, Math.floor(scoreMargin / 20)) : 0;
  const totalRankPoints = baseParticipationPoints + outcomePoints + performancePoints + marginPoints;

  return {
    baseParticipationPoints,
    outcomePoints,
    performancePoints,
    marginPoints,
    totalRankPoints,
    rows: [
      `Participation: ${baseParticipationPoints} RP`,
      `Outcome: ${outcomePoints} RP`,
      `Performance: ${performancePoints} RP`,
      `Margin: ${marginPoints} RP`,
      `Total preview: ${totalRankPoints} RP`,
    ],
  };
}

function createScoreBreakdown(pointFormula: DuelLeaderboardPointFormulaResult): LeaderboardScoreBreakdownRow[] {
  return [
    {
      bucketId: "duel",
      label: "Duel rank points preview",
      value: pointFormula.outcomePoints + pointFormula.performancePoints + pointFormula.marginPoints,
      backendValidationRequired: true,
    },
    {
      bucketId: "participation",
      label: "Duel participation points",
      value: pointFormula.baseParticipationPoints,
      backendValidationRequired: true,
    },
  ];
}

function createLocks(leaderboardId: LeaderboardId): DuelLeaderboardLinkLock[] {
  const readiness = getLeaderboardAdapterReadiness(leaderboardId);
  return [
    {
      id: "public_submit_disabled",
      label: "Public duel ranked submit is disabled in this local preview.",
      blocking: true,
    },
    {
      id: "leaderboard_adapter_locked",
      label: `Leaderboard adapter lock: ${readiness.submitLock.replace(/_/g, " ")}.`,
      blocking: true,
    },
    {
      id: "duel_seed_validation_required",
      label: "Backend must verify both players used the same duel seed and ruleset hash.",
      blocking: true,
    },
    {
      id: "opponent_result_required",
      label: "Opponent result must be reconciled before ranked outcome is public.",
      blocking: true,
    },
    {
      id: "anti_cheat_required",
      label: "Anti-cheat must validate time, HP, damage, score and impossible inputs.",
      blocking: true,
    },
    {
      id: "reward_reconciliation_required",
      label: "Rank Points and rewards require backend reconciliation after accepted submit.",
      blocking: true,
    },
  ];
}

export function createDuelLeaderboardSubmitPreview(input: DuelLeaderboardLinkInput): DuelLeaderboardSubmitPreview {
  const duel = getDuelDefinition(input.duelId);
  const leaderboard = getLeaderboardDefinition(duel.leaderboardId);
  const provider = getLeaderboardAdapterProvider(duel.leaderboardId);
  const adapterReadiness = getLeaderboardAdapterReadiness(duel.leaderboardId);
  const displayName = safeDisplayName(input.displayName);
  const periodKey = input.periodKey || duel.eventWindow.periodKey;
  const matchId = input.matchId || `duel-link:${input.duelId}:${input.playerId}:${periodKey}`;
  const pointFormula = calculateDuelRankPointPreview({
    duelScore: input.duelScore,
    opponentScore: input.opponentScore,
    outcome: input.outcome,
    scoreMargin: input.scoreMargin,
    participated: input.duelScore > 0,
  });
  const scoreBreakdown = createScoreBreakdown(pointFormula);
  const value = pointFormula.totalRankPoints;
  const validationTier: LeaderboardValidationTier = leaderboard.scorePolicy.validationTier;
  const submissionStatus = getSubmissionStatus(duel.leaderboardId);
  const publicSubmitEnabled = false;

  const payload: LeaderboardSubmitPayload = {
    leaderboardId: duel.leaderboardId,
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
    duelId: input.duelId,
    leaderboardId: duel.leaderboardId,
    providerId: provider.id,
    periodKey,
    matchId,
    playerId: input.playerId,
    displayName,
    source: input.source,
    outcome: input.outcome,
    value,
    metric: leaderboard.metric,
    pointFormula,
    scoreBreakdown,
    payload,
    validationTier,
    submissionStatus,
    adapterSubmitLock: adapterReadiness.submitLock,
    linkStatus: getLinkStatus(publicSubmitEnabled),
    publicSubmitEnabled,
    localPreviewOnly: true,
    backendValidationRequired: true,
    locks: createLocks(duel.leaderboardId),
    summaryRows: [
      `LEADERBOARD: ${leaderboard.shortTitle}`,
      `RANK POINTS PREVIEW: ${value.toLocaleString("en-US")}`,
      `OUTCOME: ${input.outcome.replace(/_/g, " ")}`,
      `PAYLOAD: preview only`,
      `SUBMIT: disabled until backend validation`,
    ],
  };
}

export function createDuelLeaderboardSubmitPreviewFromResult(
  result: DuelResultPreview,
  displayName?: string,
  source: DuelLeaderboardLinkSource = "duel_result_preview",
): DuelLeaderboardSubmitPreview {
  return createDuelLeaderboardSubmitPreview({
    duelId: result.duelId,
    playerId: LOCAL_DUEL_PLAYER_ID,
    displayName,
    matchId: `duel-result:${result.duelId}:${result.seed.seedId}:${result.versus.outcome}`,
    source,
    duelScore: result.localPlayer.score.totalScore,
    opponentScore: result.opponent.score.totalScore,
    outcome: result.outcome,
    scoreMargin: result.scoreMargin,
    periodKey: getDuelDefinition(result.duelId).eventWindow.periodKey,
    completedAtIso: new Date(0).toISOString(),
  });
}

export function createSampleDuelLeaderboardSubmitPreview(duelId: DuelModeId): DuelLeaderboardSubmitPreview {
  const result = createDuelResultPreview(duelId);
  return createDuelLeaderboardSubmitPreviewFromResult(result, LOCAL_DUEL_DISPLAY_NAME, "duel_result_preview");
}

export function createDuelLeaderboardSubmitPreviewMap(): Record<DuelModeId, DuelLeaderboardSubmitPreview> {
  return DUEL_DEFINITIONS.reduce<Record<DuelModeId, DuelLeaderboardSubmitPreview>>((map, duel) => {
    map[duel.id] = createSampleDuelLeaderboardSubmitPreview(duel.id);
    return map;
  }, {} as Record<DuelModeId, DuelLeaderboardSubmitPreview>);
}

export function getDuelLeaderboardLinkSummary(): DuelLeaderboardLinkSummary {
  return {
    version: DUEL_LEADERBOARD_LINK_SYSTEM_VERSION,
    leaderboardId: DUEL_LEADERBOARD_LINK_SYSTEM_DEFINITION.sourceLeaderboardId,
    publicSubmitEnabled: DUEL_LEADERBOARD_LINK_SYSTEM_DEFINITION.publicSubmitEnabled,
    localPreviewOnly: DUEL_LEADERBOARD_LINK_SYSTEM_DEFINITION.localPreviewOnly,
    backendValidationRequired: true,
    locks: DUEL_LEADERBOARD_LOCK_IDS,
  };
}
