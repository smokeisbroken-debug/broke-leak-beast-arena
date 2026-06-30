import type { LeaderboardId, LeaderboardSubmissionStatus, LeaderboardValidationTier } from "./LeaderboardTypes";
import type { RewardAmount } from "./ProgressionTypes";
import type { TournamentId, TournamentRunResult, TournamentScoreInput } from "./TournamentTypes";
import type { TournamentScoringSnapshot } from "./TournamentScoringTypes";

export type TournamentRunResultSource = "local_preview_button" | "arena_result_payload" | "backend_validated_payload";
export type TournamentRunResultLockId =
  | "public_submit_disabled"
  | "backend_identity_required"
  | "run_validation_required"
  | "anti_cheat_required"
  | "reward_claim_locked";
export type TournamentRunResultTone = "local_preview" | "backend_locked" | "validated_ready";

export interface TournamentRunResultInput extends Partial<TournamentScoreInput> {
  tournamentId: TournamentId;
  playerId: string;
  runId?: string;
  source: TournamentRunResultSource;
  startedAtIso?: string;
  completedAtIso?: string;
}

export interface TournamentRunResultLock {
  id: TournamentRunResultLockId;
  label: string;
  blocking: boolean;
}

export interface TournamentRunResultRewardPreview {
  rewards: RewardAmount[];
  backendValidationRequired: boolean;
  claimEnabled: boolean;
}

export interface TournamentRunResultPreview {
  tournamentId: TournamentId;
  leaderboardId: LeaderboardId;
  periodKey: string;
  runId: string;
  playerId: string;
  source: TournamentRunResultSource;
  tone: TournamentRunResultTone;
  result: TournamentRunResult;
  scoreSnapshot: TournamentScoringSnapshot;
  validationTier: LeaderboardValidationTier;
  submissionStatus: LeaderboardSubmissionStatus;
  locks: TournamentRunResultLock[];
  rewardPreview: TournamentRunResultRewardPreview;
  leaderboardSubmitEnabled: boolean;
  publicRewardClaimEnabled: boolean;
  summaryRows: readonly string[];
}

export interface TournamentRunResultSystemDefinition {
  version: string;
  goal: string;
  resultRules: readonly string[];
  requiredBeforeLiveSubmit: readonly string[];
}

export interface TournamentRunResultSummary {
  version: string;
  tournamentCount: number;
  localPreviewCount: number;
  backendLockedCount: number;
  leaderboardSubmitEnabled: boolean;
  publicRewardClaimEnabled: boolean;
}

export type TournamentRunResultPreviewMap = Record<TournamentId, TournamentRunResultPreview>;
