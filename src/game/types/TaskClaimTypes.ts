import type { CurrencyWalletV2, RewardAmount } from "./EconomyTypes";
import type { TaskCadence, TaskStatus, TaskValidationTier } from "./TaskTypes";

export type TaskClaimOutcome = "claimed" | "not_found" | "not_completed" | "already_claimed" | "backend_locked";

export interface TaskClaimEligibility {
  taskId: string;
  claimable: boolean;
  outcome: TaskClaimOutcome;
  status?: TaskStatus;
  cadence?: TaskCadence;
  validationTier?: TaskValidationTier;
  backendValidationRequired: boolean;
  reason: string;
}

export interface TaskClaimApplication<TProfile = unknown> {
  profile: TProfile;
  taskId: string;
  claimed: boolean;
  outcome: TaskClaimOutcome;
  message: string;
  taskPointsAwarded: number;
  rewardsApplied: RewardAmount[];
  rewardsPreview: RewardAmount[];
  walletDelta: CurrencyWalletV2;
  claimedAtIso?: string;
  backendValidationRequired: boolean;
  pendingBackendValidation: boolean;
  pendingEconomyEventId?: string;
  leaderboardSubmissionEnabled: boolean;
}

export interface TaskClaimBatchApplication<TProfile = unknown> {
  profile: TProfile;
  applications: TaskClaimApplication<TProfile>[];
  claimedCount: number;
  blockedCount: number;
  taskPointsAwarded: number;
  rewardsApplied: RewardAmount[];
  walletDelta: CurrencyWalletV2;
  pendingEconomyEventIds: string[];
  message: string;
}

export interface TaskClaimSystemDefinition {
  version: string;
  goal: string;
  localClaimCadences: readonly TaskCadence[];
  backendLockedCadences: readonly TaskCadence[];
  leaderboardSubmissionEnabled: boolean;
  rules: readonly string[];
}
