import type { CurrencyId } from "./EconomyTypes";
import type { PowerSourceId } from "./ProgressionTypes";

export const SOFT_CAP_SCOPE_IDS = [
  "power",
  "economy",
  "reward_multiplier",
  "upgrade_growth",
  "ranked_submit",
] as const;

export type SoftCapScopeId = (typeof SOFT_CAP_SCOPE_IDS)[number];
export type SoftCapTargetKind = "power_source" | "currency_delta" | "multiplier" | "upgrade_delta" | "ranked_delta";
export type SoftCapEnforcementMode = "ui_warning_only" | "local_clamp_ready" | "backend_locked";
export type SoftCapRiskTier = "safe_local" | "progression_sensitive" | "ranked_sensitive";
export type SoftCapTargetId = PowerSourceId | CurrencyId | "reward_multiplier" | "ranked_power_delta" | "upgrade_power_delta";

export interface SoftCapDefinition {
  id: string;
  label: string;
  scope: SoftCapScopeId;
  targetKind: SoftCapTargetKind;
  targetId: SoftCapTargetId;
  capValue: number;
  warningValue: number;
  currentPreviewValue: number;
  unitLabel: string;
  enforcementMode: SoftCapEnforcementMode;
  riskTier: SoftCapRiskTier;
  backendValidationRequired: boolean;
  reason: string;
  futureBehavior: string;
}

export interface SoftCapPreviewRow extends SoftCapDefinition {
  cappedPreviewValue: number;
  warningActive: boolean;
  overCap: boolean;
  usagePercent: number;
  displayLine: string;
  lockReason: string;
}

export interface SoftCapScopeCard {
  scope: SoftCapScopeId;
  label: string;
  rowCount: number;
  localClampReadyCount: number;
  backendLockedCount: number;
  warningOnlyCount: number;
  overCapCount: number;
  highestUsagePercent: number;
  displayLine: string;
}

export interface SoftCapCatalogSummary {
  version: string;
  rowCount: number;
  scopeCount: number;
  localClampReadyCount: number;
  backendLockedCount: number;
  warningOnlyCount: number;
  overCapCount: number;
  rankedSensitiveCount: number;
  nextPatch: string;
}

export interface SoftCapSystemDefinition {
  version: string;
  goal: string;
  liveCombatScalingEnabled: boolean;
  liveRewardMutationEnabled: boolean;
  backendSubmitEnabled: boolean;
  rules: readonly string[];
  requiredBeforeHardCaps: readonly string[];
}

export interface SoftCapEvaluation {
  capId: string;
  inputValue: number;
  capValue: number;
  cappedValue: number;
  overCapAmount: number;
  warningActive: boolean;
  overCap: boolean;
  enforcementMode: SoftCapEnforcementMode;
  backendValidationRequired: boolean;
}

export type SoftCapRowMap = Record<string, SoftCapPreviewRow>;
export type SoftCapScopeCardMap = Record<SoftCapScopeId, SoftCapScopeCard>;
