import type { CurrencyWalletV2, RewardAmount, RewardSourceId } from "./EconomyTypes";
import type { LeaderboardId } from "./LeaderboardTypes";
import type { TaskCategory } from "./TaskTypes";
import type { BossRegistryEntryId, BossRegistryScope } from "./BossRegistryTypes";

export type BossRewardPolicyId = "campaign_local_preview" | "campaign_replay_preview" | "weekly_backend_locked" | "community_backend_locked";
export type BossRewardRiskTier = "safe_local" | "leaderboard_sensitive" | "backend_authoritative";
export type BossRewardClaimStatus = "preview" | "claimable_local" | "backend_locked";
export type BossRewardUnlockKind = "first_clear" | "replay" | "weekly_contribution" | "community_milestone";

export interface BossRewardPolicyDefinition {
  id: BossRewardPolicyId;
  label: string;
  riskTier: BossRewardRiskTier;
  rewardSourceId: RewardSourceId;
  claimEnabled: boolean;
  leaderboardSubmissionEnabled: boolean;
  backendValidationRequired: boolean;
  description: string;
}

export interface BossRewardFormulaInput {
  bossId: BossRegistryEntryId;
  bossName: string;
  scopes: readonly BossRegistryScope[];
  unlockLevel: number;
  recommendedPower: number;
  difficultyTotal: number;
  chapterId?: string;
  stageId?: string;
  rewardTrophyId?: string;
  alreadyCleared?: boolean;
}

export interface BossRewardBreakdownRow {
  id: string;
  label: string;
  value: number;
  note: string;
}

export interface BossRewardPreviewCard {
  bossId: BossRegistryEntryId;
  bossName: string;
  policyId: BossRewardPolicyId;
  rewardSourceId: RewardSourceId;
  unlockKind: BossRewardUnlockKind;
  claimStatus: BossRewardClaimStatus;
  riskTier: BossRewardRiskTier;
  recommendedPower: number;
  difficultyTotal: number;
  rewards: readonly RewardAmount[];
  walletDelta: CurrencyWalletV2;
  trophyId?: string;
  taskCategories: readonly TaskCategory[];
  leaderboardLinks: readonly LeaderboardId[];
  breakdown: readonly BossRewardBreakdownRow[];
  backendValidationRequired: boolean;
  claimEnabled: boolean;
  leaderboardSubmissionEnabled: boolean;
  localPreviewOnly: boolean;
  displayLine: string;
  lockReason: string;
}

export interface BossRewardSummary {
  version: string;
  totalBossRewardCards: number;
  campaignRewardCards: number;
  weeklyRewardCards: number;
  localClaimEnabledCards: number;
  backendLockedCards: number;
  totalLocalWalletPreview: CurrencyWalletV2;
  totalBackendLockedWalletPreview: CurrencyWalletV2;
  nextPatch: string;
}

export interface BossRewardSystemDefinition {
  version: string;
  goal: string;
  backendSubmitEnabled: boolean;
  localClaimEnabled: boolean;
  leaderboardSubmissionEnabled: boolean;
  rules: readonly string[];
  policies: readonly BossRewardPolicyDefinition[];
  requiredBeforeLiveBossRewards: readonly string[];
}
