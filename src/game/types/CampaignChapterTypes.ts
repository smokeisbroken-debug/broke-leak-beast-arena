import type { LeaderboardId } from "./LeaderboardTypes";
import type { TaskCategory } from "./TaskTypes";

export type CampaignChapterId = "daily_leaks" | "risk_leaks" | "lifestyle_leaks" | "final_wallet_war";
export type CampaignChapterLaneId = "onboarding" | "risk_control" | "status_pressure" | "endgame_wallet";
export type CampaignChapterNodeType = "intro" | "boss" | "reward" | "gate";
export type CampaignChapterStatus = "complete" | "available" | "locked";
export type CampaignChapterRewardPreviewId = "xp" | "coins" | "leak_points" | "skill_cards" | "skin_shards" | "trophy";
export type CampaignChapterGateId = "level" | "previous_chapter" | "boss_sequence" | "recommended_power";

export interface CampaignChapterRewardPreview {
  id: CampaignChapterRewardPreviewId;
  label: string;
  amountLabel: string;
  backendLocked: boolean;
}

export interface CampaignChapterGateRule {
  id: CampaignChapterGateId;
  label: string;
  blocking: boolean;
}

export interface CampaignChapterNodeDefinition {
  id: string;
  chapterId: CampaignChapterId;
  order: number;
  type: CampaignChapterNodeType;
  title: string;
  bossId?: string;
  recommendedPower: number;
  rewardPreview: readonly CampaignChapterRewardPreview[];
}

export interface CampaignChapterContract {
  id: CampaignChapterId;
  laneId: CampaignChapterLaneId;
  title: string;
  shortTitle: string;
  theme: string;
  unlockLevel: number;
  recommendedPowerMin: number;
  recommendedPowerMax: number;
  bossIds: readonly string[];
  nodes: readonly CampaignChapterNodeDefinition[];
  taskCategories: readonly TaskCategory[];
  leaderboardLinks: readonly LeaderboardId[];
  gateRules: readonly CampaignChapterGateRule[];
  rewardPreview: readonly CampaignChapterRewardPreview[];
  backendSubmitEnabled: boolean;
  localPreviewOnly: boolean;
}

export interface CampaignChapterCard {
  id: CampaignChapterId;
  title: string;
  shortTitle: string;
  theme: string;
  status: CampaignChapterStatus;
  progressLabel: string;
  unlockLabel: string;
  recommendedPowerLabel: string;
  bossCount: number;
  clearedBossCount: number;
  nextBossId?: string;
  taskCategories: readonly TaskCategory[];
  leaderboardLinks: readonly LeaderboardId[];
  rewardPreview: readonly CampaignChapterRewardPreview[];
  ctaLabel: string;
}

export interface CampaignChapterSnapshot {
  version: string;
  activeChapterId: CampaignChapterId;
  cards: readonly CampaignChapterCard[];
  contracts: readonly CampaignChapterContract[];
  totalBosses: number;
  clearedBosses: number;
  completionPercent: number;
  backendSubmitEnabled: boolean;
  localPreviewOnly: boolean;
  nextPatch: string;
}

export interface CampaignChapterSystemDefinition {
  version: string;
  goal: string;
  defaultChapterId: CampaignChapterId;
  backendSubmitEnabled: boolean;
  localPreviewOnly: boolean;
  rules: readonly string[];
  requiredBeforeChapterRewards: readonly string[];
}
