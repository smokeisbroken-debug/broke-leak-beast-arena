import type { CurrencyWalletV2, EconomyValidationTier, RewardAmount, RewardSourceId } from "./EconomyTypes";
import type { TaskCadence, TaskCategory, TaskProgressMetric, TaskStatus, TaskValidationTier } from "./TaskTypes";

export type TaskRewardPolicyId =
  | "daily_local_preview"
  | "weekly_backend_locked"
  | "tournament_backend_locked"
  | "duel_backend_locked"
  | "boss_backend_locked"
  | "season_backend_locked";

export type TaskRewardRiskTier = "safe_local" | "leaderboard_sensitive" | "backend_authoritative";

export interface TaskRewardPolicyDefinition {
  id: TaskRewardPolicyId;
  label: string;
  riskTier: TaskRewardRiskTier;
  claimEnabled: boolean;
  leaderboardSubmissionEnabled: boolean;
  backendValidationRequired: boolean;
  description: string;
}

export interface TaskRewardPreview {
  taskId: string;
  title: string;
  cadence: TaskCadence;
  category: TaskCategory;
  metric: TaskProgressMetric;
  target: number;
  progress: number;
  status: TaskStatus;
  taskPoints: number;
  rewardSourceId: RewardSourceId;
  validationTier: TaskValidationTier;
  economyValidationTier: EconomyValidationTier;
  policyId: TaskRewardPolicyId;
  riskTier: TaskRewardRiskTier;
  rewards: RewardAmount[];
  walletDelta: CurrencyWalletV2;
  backendValidationRequired: boolean;
  claimEnabled: boolean;
  leaderboardSubmissionEnabled: boolean;
  rewardNotes: string[];
}

export interface TaskRewardCatalogSummary {
  version: string;
  totalTaskCount: number;
  dailyTaskCount: number;
  weeklyTaskCount: number;
  backendLockedTaskCount: number;
  totalTaskPointsAvailable: number;
  localPreviewWallet: CurrencyWalletV2;
  backendLockedWallet: CurrencyWalletV2;
  claimEnabled: boolean;
  leaderboardSubmissionEnabled: boolean;
}

export interface TaskRewardProfileSummary {
  activeTaskCount: number;
  completedTaskCount: number;
  claimedTaskCount: number;
  claimablePreviewCount: number;
  backendLockedPreviewCount: number;
  completedTaskPointsPreview: number;
  completedRewardWalletPreview: CurrencyWalletV2;
  backendLockedRewardWalletPreview: CurrencyWalletV2;
}

export interface TaskRewardSystemDefinition {
  version: string;
  goal: string;
  policies: readonly TaskRewardPolicyDefinition[];
  rules: readonly string[];
}
