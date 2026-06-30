import type { LeaderboardSubmissionStatus } from "./LeaderboardTypes";
import type { RewardAmount } from "./ProgressionTypes";
import type { DuelModeId, DuelOutcome, DuelSeedDefinition } from "./DuelTypes";
import type { DuelScoreFormulaSnapshot, DuelScoreVersusPreview } from "./DuelScoreTypes";

export type DuelResultTone = "win" | "loss" | "draw" | "locked";
export type DuelResultSource = "local_preview" | "arena_result_future" | "backend_verified_future";
export type DuelResultLockId =
  | "backend_validation_required"
  | "leaderboard_submit_locked"
  | "reward_claim_locked"
  | "anti_cheat_required"
  | "remote_opponent_required";

export interface DuelResultLock {
  id: DuelResultLockId;
  label: string;
  severity: "info" | "warning" | "backend_blocker";
}

export interface DuelResultRewardPreview {
  participationRewards: readonly RewardAmount[];
  winRewards: readonly RewardAmount[];
  visibleRewards: readonly RewardAmount[];
  claimEnabled: boolean;
  backendValidationRequired: boolean;
}

export interface DuelResultPreview {
  version: string;
  duelId: DuelModeId;
  title: string;
  source: DuelResultSource;
  seed: DuelSeedDefinition;
  versus: DuelScoreVersusPreview;
  localPlayer: DuelScoreFormulaSnapshot;
  opponent: DuelScoreFormulaSnapshot;
  outcome: DuelOutcome;
  outcomeLabel: string;
  tone: DuelResultTone;
  scoreMargin: number;
  leaderboardSubmissionStatus: LeaderboardSubmissionStatus;
  rewardPreview: DuelResultRewardPreview;
  locks: readonly DuelResultLock[];
  nextSteps: readonly string[];
  rows: readonly string[];
  shareLines: readonly string[];
}

export interface DuelResultSystemDefinition {
  version: string;
  goal: string;
  source: DuelResultSource;
  publicSubmitEnabled: boolean;
  claimEnabled: boolean;
  backendValidationRequired: boolean;
  locks: readonly DuelResultLockId[];
}
