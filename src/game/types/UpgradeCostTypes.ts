import type { CurrencyId, CurrencyWalletV2, RewardAmount } from "./EconomyTypes";

export const UPGRADE_COST_CATALOG_IDS = [
  "skill_upgrade_costs",
  "evolution_unlock_costs",
  "mastery_unlock_costs",
  "charm_costs",
  "cosmetic_costs",
] as const;

export type UpgradeCostCatalogId = (typeof UPGRADE_COST_CATALOG_IDS)[number];

export type UpgradeCostScope = "skills" | "evolution" | "mastery" | "charms" | "cosmetics";
export type UpgradeCostKind = "skill_level" | "evolution_unlock" | "mastery_level" | "charm_unlock" | "cosmetic_unlock";
export type UpgradeCostTier = "starter" | "standard" | "advanced" | "milestone" | "seasonal";
export type UpgradeCostSpendMode = "local_spend_ready" | "preview_only" | "backend_locked";
export type UpgradeCostRiskTier = "safe_local" | "progression_sensitive" | "ranked_or_seasonal";

export interface UpgradeCostCatalogDefinition {
  id: UpgradeCostCatalogId;
  label: string;
  scope: UpgradeCostScope;
  purpose: string;
  spendMode: UpgradeCostSpendMode;
  backendValidationRequired: boolean;
  displayOrder: number;
}

export interface UpgradeCostRowDefinition {
  id: string;
  catalogId: UpgradeCostCatalogId;
  kind: UpgradeCostKind;
  tier: UpgradeCostTier;
  targetId: string;
  targetLabel: string;
  levelFrom?: number;
  levelTo?: number;
  requiredPlayerLevel: number;
  powerDeltaPreview: number;
  costs: readonly RewardAmount[];
  spendMode: UpgradeCostSpendMode;
  riskTier: UpgradeCostRiskTier;
  backendValidationRequired: boolean;
  notes: readonly string[];
}

export interface UpgradeCostPreviewRow extends UpgradeCostRowDefinition {
  normalizedCosts: readonly RewardAmount[];
  costWallet: CurrencyWalletV2;
  spendEnabled: boolean;
  localPreviewOnly: boolean;
  effectiveBackendValidationRequired: boolean;
  displayLine: string;
  lockReason: string;
}

export interface UpgradeCostAffordability {
  rowId: string;
  canAfford: boolean;
  missingCosts: readonly RewardAmount[];
  spendEnabled: boolean;
  backendLocked: boolean;
  displayLine: string;
}

export interface UpgradeCostCard {
  catalogId: UpgradeCostCatalogId;
  label: string;
  scope: UpgradeCostScope;
  spendMode: UpgradeCostSpendMode;
  backendValidationRequired: boolean;
  rowCount: number;
  localSpendReadyRowCount: number;
  previewOnlyRowCount: number;
  backendLockedRowCount: number;
  totalCostPreview: CurrencyWalletV2;
  totalPowerDeltaPreview: number;
  displayLine: string;
}

export interface UpgradeCostCatalogSummary {
  version: string;
  catalogCount: number;
  rowCount: number;
  localSpendReadyRowCount: number;
  previewOnlyRowCount: number;
  backendLockedRowCount: number;
  rankedOrSeasonalRowCount: number;
  totalLocalCostPreview: CurrencyWalletV2;
  totalBackendLockedCostPreview: CurrencyWalletV2;
  nextPatch: string;
}

export interface UpgradeCostSystemDefinition {
  version: string;
  goal: string;
  spendEnabled: boolean;
  combatScalingEnabled: boolean;
  backendSubmitEnabled: boolean;
  rules: readonly string[];
  requiredBeforeLiveUpgrades: readonly string[];
}

export type UpgradeCostRowMap = Record<string, UpgradeCostPreviewRow>;
export type UpgradeCostCardMap = Record<UpgradeCostCatalogId, UpgradeCostCard>;
export type UpgradeCostCurrencyCaps = Partial<Record<CurrencyId, number>>;
