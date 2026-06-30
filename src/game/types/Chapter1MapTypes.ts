import type { LeaderboardId } from "./LeaderboardTypes";
import type { TaskCategory } from "./TaskTypes";

export type Chapter1MapId = "daily_leaks_map";
export type Chapter1MapNodeId = "daily_intro" | "impulse_buy_beast" | "subscription_leech" | "fast_food_ogre" | "daily_clear_reward";
export type Chapter1MapNodeType = "intro" | "boss" | "checkpoint" | "reward";
export type Chapter1MapNodeStatus = "complete" | "available" | "locked";
export type Chapter1MapThemeTag = "impulse_control" | "recurring_costs" | "food_craving" | "wallet_recovery";

export interface Chapter1MapSystemDefinition {
  version: string;
  mapId: Chapter1MapId;
  title: string;
  goal: string;
  backendSubmitEnabled: boolean;
  localPreviewOnly: boolean;
  rules: readonly string[];
  requiredBeforeLiveCampaignRewards: readonly string[];
}

export interface Chapter1MapRewardPreview {
  id: "xp" | "coins" | "leak_points" | "starter_trophy";
  label: string;
  amountLabel: string;
  backendLocked: boolean;
}

export interface Chapter1MapNodeDefinition {
  id: Chapter1MapNodeId;
  type: Chapter1MapNodeType;
  order: number;
  title: string;
  shortLabel: string;
  objective: string;
  bossId?: string;
  recommendedPower: number;
  themeTags: readonly Chapter1MapThemeTag[];
  taskCategories: readonly TaskCategory[];
  leaderboardLinks: readonly LeaderboardId[];
  rewardPreview: readonly Chapter1MapRewardPreview[];
  tacticalHint: string;
  mapX: number;
  mapY: number;
}

export interface Chapter1MapNodeCard extends Chapter1MapNodeDefinition {
  status: Chapter1MapNodeStatus;
  unlockLabel: string;
  ctaLabel: string;
}

export interface Chapter1MapConnector {
  fromNodeId: Chapter1MapNodeId;
  toNodeId: Chapter1MapNodeId;
  label: string;
  active: boolean;
}

export interface Chapter1MapSnapshot {
  version: string;
  mapId: Chapter1MapId;
  chapterId: "daily_leaks";
  title: string;
  subtitle: string;
  progressLabel: string;
  recommendedPowerMin: number;
  recommendedPowerMax: number;
  nodes: readonly Chapter1MapNodeCard[];
  connectors: readonly Chapter1MapConnector[];
  currentNodeId: Chapter1MapNodeId;
  backendSubmitEnabled: boolean;
  localPreviewOnly: boolean;
  nextPatch: string;
}
