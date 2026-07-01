import type { CurrencyWalletV2, RewardAmount, RewardSourceId } from "./EconomyTypes";
import type { CampaignChapterId } from "./CampaignChapterTypes";

export type CampaignCompletionRewardStatus = "locked" | "in_progress" | "complete_preview";
export type CampaignCompletionRewardRiskTier = "safe_local" | "backend_locked";
export type CampaignCompletionRewardLineId = "boss_clear_total" | "chapter_bonus" | "trophy_preview" | "next_chapter_gate";

export interface CampaignCompletionRewardLine {
  id: CampaignCompletionRewardLineId;
  label: string;
  rewards: readonly RewardAmount[];
  note: string;
  backendLocked: boolean;
}

export interface CampaignCompletionRewardCard {
  chapterId: CampaignChapterId;
  chapterTitle: string;
  status: CampaignCompletionRewardStatus;
  statusLabel: string;
  progressLabel: string;
  clearRequirementLabel: string;
  rewardSourceId: RewardSourceId;
  riskTier: CampaignCompletionRewardRiskTier;
  rewards: readonly RewardAmount[];
  walletDelta: CurrencyWalletV2;
  lines: readonly CampaignCompletionRewardLine[];
  displayLine: string;
  nextChapterLabel: string;
  backendValidationRequired: boolean;
  claimEnabled: boolean;
  localPreviewOnly: boolean;
}

export interface CampaignCompletionRewardSummary {
  version: string;
  totalChapters: number;
  completedChapters: number;
  claimEnabledCards: number;
  backendLockedCards: number;
  localPreviewWallet: CurrencyWalletV2;
  backendLockedWallet: CurrencyWalletV2;
  nextPatch: string;
}

export interface CampaignCompletionRewardSystemDefinition {
  version: string;
  goal: string;
  localClaimEnabled: boolean;
  backendSubmitEnabled: boolean;
  leaderboardSubmissionEnabled: boolean;
  rules: readonly string[];
  requiredBeforeLiveChapterRewards: readonly string[];
}
