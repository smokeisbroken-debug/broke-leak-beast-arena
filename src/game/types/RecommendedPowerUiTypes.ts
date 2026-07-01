import type { BossDifficultyBand } from "./BossRegistryTypes";
import type { MatchupStatus } from "./BalanceTypes";

export type RecommendedPowerContentKind = "campaign_boss" | "chapter_node" | "weekly_boss" | "tournament" | "duel";
export type RecommendedPowerStatusId = "easy" | "fair" | "hard" | "dangerous";
export type RecommendedPowerTone = "green" | "yellow" | "orange" | "red";

export interface RecommendedPowerUiSystemDefinition {
  version: string;
  goal: string;
  backendSubmitEnabled: boolean;
  localPreviewOnly: boolean;
  rules: readonly string[];
  requiredBeforePowerGates: readonly string[];
}

export interface RecommendedPowerUiCard {
  contentId: string;
  contentKind: RecommendedPowerContentKind;
  contentName: string;
  playerPower: number;
  recommendedPower: number;
  difficultyScore: number;
  difficultyBand: BossDifficultyBand | "custom";
  difficultyLabel: string;
  delta: number;
  rawMatchupStatus: MatchupStatus;
  status: RecommendedPowerStatusId;
  statusLabel: "EASY" | "FAIR" | "HARD" | "DANGEROUS";
  tone: RecommendedPowerTone;
  color: string;
  colorValue: number;
  shortLine: string;
  detailLine: string;
  tacticalHint: string;
  rankedEligiblePreview: boolean;
  rewardMultiplierPreview: number;
  backendValidationRequired: boolean;
}

export interface RecommendedPowerChapterSummary {
  chapterId: string;
  playerPower: number;
  minRecommendedPower: number;
  maxRecommendedPower: number;
  easiestStatus: RecommendedPowerStatusId;
  hardestStatus: RecommendedPowerStatusId;
  readyCount: number;
  hardCount: number;
  dangerousCount: number;
  displayLine: string;
}

export interface RecommendedPowerUiSnapshot {
  version: string;
  playerPower: number;
  cards: readonly RecommendedPowerUiCard[];
  chapterSummaries: readonly RecommendedPowerChapterSummary[];
  backendSubmitEnabled: boolean;
  localPreviewOnly: boolean;
  nextPatch: string;
}
