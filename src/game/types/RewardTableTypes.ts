import type { CurrencyWalletV2, EconomyValidationTier, RewardAmount, RewardSourceId } from "./EconomyTypes";
import type { LeaderboardId } from "./LeaderboardTypes";

export const REWARD_TABLE_IDS = [
  "arena_rewards",
  "campaign_rewards",
  "task_rewards",
  "tournament_rewards",
  "duel_rewards",
  "weekly_boss_rewards",
] as const;

export type RewardTableId = (typeof REWARD_TABLE_IDS)[number];

export type RewardTableScope = "pve" | "campaign" | "tasks" | "tournament" | "duel" | "community";
export type RewardTableRiskTier = "safe_local" | "leaderboard_sensitive" | "backend_authoritative";
export type RewardTableClaimMode = "local_claim_enabled" | "preview_only" | "backend_locked";
export type RewardTableRowTier = "starter" | "standard" | "advanced" | "ranked" | "milestone";

export interface RewardTableDefinition {
  id: RewardTableId;
  label: string;
  scope: RewardTableScope;
  purpose: string;
  claimMode: RewardTableClaimMode;
  backendValidationRequired: boolean;
  displayOrder: number;
}

export interface RewardTableRowDefinition {
  id: string;
  tableId: RewardTableId;
  label: string;
  sourceId: RewardSourceId;
  tier: RewardTableRowTier;
  activityLabel: string;
  requirements: readonly string[];
  rewards: readonly RewardAmount[];
  taskPoints?: number;
  scorePoints?: number;
  leaderboardId?: LeaderboardId;
  claimMode: RewardTableClaimMode;
  riskTier: RewardTableRiskTier;
  backendValidationRequired: boolean;
  notes: readonly string[];
}

export interface RewardTablePreviewRow extends RewardTableRowDefinition {
  normalizedRewards: readonly RewardAmount[];
  walletDelta: CurrencyWalletV2;
  economyValidationTier: EconomyValidationTier;
  effectiveBackendValidationRequired: boolean;
  claimEnabled: boolean;
  localPreviewOnly: boolean;
  displayLine: string;
  lockReason: string;
}

export interface RewardTableCard {
  tableId: RewardTableId;
  label: string;
  scope: RewardTableScope;
  claimMode: RewardTableClaimMode;
  backendValidationRequired: boolean;
  rowCount: number;
  localClaimableRowCount: number;
  previewOnlyRowCount: number;
  backendLockedRowCount: number;
  totalWalletPreview: CurrencyWalletV2;
  displayLine: string;
}

export interface RewardTableCatalogSummary {
  version: string;
  tableCount: number;
  rowCount: number;
  localClaimableRowCount: number;
  previewOnlyRowCount: number;
  backendLockedRowCount: number;
  rankedSensitiveRowCount: number;
  localWalletPreview: CurrencyWalletV2;
  backendLockedWalletPreview: CurrencyWalletV2;
  nextPatch: string;
}

export interface RewardTableSystemDefinition {
  version: string;
  goal: string;
  claimEnabled: boolean;
  backendSubmitEnabled: boolean;
  leaderboardSubmissionEnabled: boolean;
  rules: readonly string[];
  requiredBeforeLiveRewardTables: readonly string[];
}

export type RewardTableRowMap = Record<string, RewardTablePreviewRow>;
export type RewardTableCardMap = Record<RewardTableId, RewardTableCard>;
