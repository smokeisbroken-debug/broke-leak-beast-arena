import type { RewardAmount } from "./EconomyTypes";
import type { GameModeId } from "./GameModeTypes";

export const CATCH_UP_MECHANIC_IDS = [
  "rookie_xp_boost",
  "early_wallet_boost",
  "underpowered_campaign_assist",
  "returning_player_reentry",
  "late_tournament_joiner",
  "duel_starter_protection",
] as const;

export type CatchUpMechanicId = (typeof CATCH_UP_MECHANIC_IDS)[number];
export type CatchUpMechanicScope = "progression" | "economy" | "campaign" | "tasks" | "tournament" | "duel";
export type CatchUpMechanicTriggerKind = "level_band" | "power_gap" | "days_inactive" | "event_late_join" | "first_runs";
export type CatchUpMechanicRiskTier = "safe_local" | "progression_sensitive" | "ranked_sensitive";
export type CatchUpMechanicClaimMode = "preview_only" | "local_safe_later" | "backend_locked";

export interface CatchUpMechanicDefinition {
  id: CatchUpMechanicId;
  label: string;
  scope: CatchUpMechanicScope;
  triggerKind: CatchUpMechanicTriggerKind;
  targetCohort: string;
  relatedModes: readonly GameModeId[];
  minLevel?: number;
  maxLevel?: number;
  minPowerGap?: number;
  minDaysInactive?: number;
  eventProgressAfterPercent?: number;
  firstRunCount?: number;
  multiplier: number;
  flatRewards: readonly RewardAmount[];
  durationLabel: string;
  claimMode: CatchUpMechanicClaimMode;
  riskTier: CatchUpMechanicRiskTier;
  backendValidationRequired: boolean;
  leaderboardValueAllowed: boolean;
  rules: readonly string[];
  displayOrder: number;
}

export interface CatchUpPreviewContext {
  playerLevel: number;
  playerPower: number;
  recommendedPower: number;
  daysInactive: number;
  eventProgressPercent: number;
  duelRunsCompleted: number;
}

export interface CatchUpMechanicPreviewCard extends CatchUpMechanicDefinition {
  eligible: boolean;
  powerGap: number;
  multiplierLabel: string;
  flatRewardLine: string;
  displayLine: string;
  lockReason: string;
}

export interface CatchUpMechanicSummary {
  version: string;
  mechanicCount: number;
  localSafeLaterCount: number;
  backendLockedCount: number;
  rankedSensitiveCount: number;
  eligiblePreviewCount: number;
  maxMultiplier: number;
  nextPatch: string;
}

export interface CatchUpMechanicSystemDefinition {
  version: string;
  goal: string;
  liveRewardMutationEnabled: boolean;
  rankedCatchUpEnabled: boolean;
  backendSubmitEnabled: boolean;
  rules: readonly string[];
  requiredBeforeLiveCatchUp: readonly string[];
}

export type CatchUpMechanicCardMap = Record<CatchUpMechanicId, CatchUpMechanicPreviewCard>;
