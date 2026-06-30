import type { CampaignChapterId } from "./CampaignChapterTypes";
import type { LeaderboardId } from "./LeaderboardTypes";
import type { TaskCategory } from "./TaskTypes";
import type { BossMechanicProfileId, BossSpecialEffect } from "../data/bossMechanics";

export type BossRegistryEntryId = string;
export type BossRegistryScope = "campaign" | "weekly" | "community" | "duel_seed" | "tournament";
export type BossDifficultyBand = "tutorial" | "early" | "mid" | "late" | "endgame" | "community";
export type BossRegistryStatus = "available" | "locked" | "preview";
export type BossThreatTag =
  | "fast_jabs"
  | "heavy_hits"
  | "energy_drain"
  | "fomo_burst"
  | "guard_break"
  | "hazard_zone"
  | "summon_pressure"
  | "phase_shift"
  | "community_hp";
export type BossRegistryRewardPreviewId = "xp" | "coins" | "leak_points" | "boss_trophy" | "rank_points" | "skill_cards";

export interface BossDifficultyScoreBreakdown {
  hp: number;
  damage: number;
  speed: number;
  range: number;
  mechanics: number;
  unlockGate: number;
  communityScale: number;
}

export interface BossDifficultyScore {
  total: number;
  band: BossDifficultyBand;
  recommendedPower: number;
  breakdown: BossDifficultyScoreBreakdown;
}

export interface BossRegistryRewardPreview {
  id: BossRegistryRewardPreviewId;
  label: string;
  amountLabel: string;
  backendLocked: boolean;
}

export interface BossRegistryEntry {
  id: BossRegistryEntryId;
  name: string;
  leakLabel: string;
  scopes: readonly BossRegistryScope[];
  chapterId?: CampaignChapterId;
  stageId?: string;
  unlockLevel: number;
  status: BossRegistryStatus;
  mechanicProfileId?: BossMechanicProfileId;
  mechanicRole: string;
  specialEffect: BossSpecialEffect | "community_damage";
  difficulty: BossDifficultyScore;
  threatTags: readonly BossThreatTag[];
  leaderboardLinks: readonly LeaderboardId[];
  taskCategories: readonly TaskCategory[];
  rewardPreview: readonly BossRegistryRewardPreview[];
  backendLocked: boolean;
  localPreviewOnly: boolean;
}

export interface BossRegistryChapterGroup {
  chapterId: CampaignChapterId | "weekly_community";
  title: string;
  bossIds: readonly BossRegistryEntryId[];
  minRecommendedPower: number;
  maxRecommendedPower: number;
  leaderboardLinks: readonly LeaderboardId[];
}

export interface BossRegistrySummary {
  version: string;
  totalBossCount: number;
  campaignBossCount: number;
  weeklyBossCount: number;
  backendLockedCount: number;
  localPreviewCount: number;
  minRecommendedPower: number;
  maxRecommendedPower: number;
  difficultyBands: Record<BossDifficultyBand, number>;
  nextPatch: string;
}

export interface BossRegistrySnapshot {
  version: string;
  entries: readonly BossRegistryEntry[];
  chapterGroups: readonly BossRegistryChapterGroup[];
  summary: BossRegistrySummary;
  backendSubmitEnabled: boolean;
  localPreviewOnly: boolean;
  nextPatch: string;
}

export interface BossRegistrySystemDefinition {
  version: string;
  goal: string;
  backendSubmitEnabled: boolean;
  localPreviewOnly: boolean;
  rules: readonly string[];
  requiredBeforeLiveBossRewards: readonly string[];
}
