import type {
  LeaderboardAdapterSubmitLock,
} from "./LeaderboardAdapterTypes";
import type {
  LeaderboardId,
  LeaderboardMetric,
  LeaderboardScoreBreakdownRow,
  LeaderboardSubmissionStatus,
  LeaderboardSubmitPayload,
  LeaderboardValidationTier,
} from "./LeaderboardTypes";
import type { DuelModeId, DuelOutcome } from "./DuelTypes";
import type { DuelResultPreview } from "./DuelResultTypes";

export type DuelLeaderboardLinkSource = "duel_result_preview" | "arena_result_payload" | "backend_verified_future";
export type DuelLeaderboardLinkStatus = "local_payload_preview" | "backend_locked" | "validated_ready";
export type DuelLeaderboardLinkLockId =
  | "public_submit_disabled"
  | "leaderboard_adapter_locked"
  | "duel_seed_validation_required"
  | "opponent_result_required"
  | "anti_cheat_required"
  | "reward_reconciliation_required";

export interface DuelLeaderboardLinkLock {
  id: DuelLeaderboardLinkLockId;
  label: string;
  blocking: boolean;
}

export interface DuelLeaderboardPointFormulaInput {
  duelScore: number;
  opponentScore: number;
  outcome: DuelOutcome;
  scoreMargin: number;
  participated: boolean;
}

export interface DuelLeaderboardPointFormulaResult {
  baseParticipationPoints: number;
  outcomePoints: number;
  performancePoints: number;
  marginPoints: number;
  totalRankPoints: number;
  rows: readonly string[];
}

export interface DuelLeaderboardLinkInput {
  duelId: DuelModeId;
  playerId: string;
  displayName?: string;
  matchId?: string;
  source: DuelLeaderboardLinkSource;
  duelScore: number;
  opponentScore: number;
  outcome: DuelOutcome;
  scoreMargin: number;
  periodKey?: string;
  completedAtIso?: string;
}

export interface DuelLeaderboardSubmitPreview {
  duelId: DuelModeId;
  leaderboardId: LeaderboardId;
  providerId: string;
  periodKey: string;
  matchId: string;
  playerId: string;
  displayName: string;
  source: DuelLeaderboardLinkSource;
  outcome: DuelOutcome;
  value: number;
  metric: LeaderboardMetric;
  pointFormula: DuelLeaderboardPointFormulaResult;
  scoreBreakdown: LeaderboardScoreBreakdownRow[];
  payload: LeaderboardSubmitPayload;
  validationTier: LeaderboardValidationTier;
  submissionStatus: LeaderboardSubmissionStatus;
  adapterSubmitLock: LeaderboardAdapterSubmitLock;
  linkStatus: DuelLeaderboardLinkStatus;
  publicSubmitEnabled: boolean;
  localPreviewOnly: boolean;
  backendValidationRequired: boolean;
  locks: readonly DuelLeaderboardLinkLock[];
  summaryRows: readonly string[];
}

export interface DuelLeaderboardLinkSummary {
  version: string;
  leaderboardId: LeaderboardId;
  publicSubmitEnabled: boolean;
  localPreviewOnly: boolean;
  backendValidationRequired: boolean;
  locks: readonly DuelLeaderboardLinkLockId[];
}

export interface DuelLeaderboardLinkSystemDefinition {
  version: string;
  goal: string;
  sourceLeaderboardId: LeaderboardId;
  publicSubmitEnabled: boolean;
  localPreviewOnly: boolean;
  linkRules: readonly string[];
  requiredBeforeLiveSubmit: readonly string[];
}

export interface DuelLeaderboardResultBridge {
  result: DuelResultPreview;
  submitPreview: DuelLeaderboardSubmitPreview;
}
