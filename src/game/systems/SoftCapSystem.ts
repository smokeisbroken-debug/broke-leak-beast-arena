import { CURRENCY_DEFINITIONS } from "../types/EconomyTypes";
import { DEFAULT_POWER_CAPS } from "../types/ProgressionTypes";
import { SOFT_CAP_SCOPE_IDS } from "../types/SoftCapTypes";
import type {
  SoftCapCatalogSummary,
  SoftCapDefinition,
  SoftCapEvaluation,
  SoftCapPreviewRow,
  SoftCapRowMap,
  SoftCapScopeCard,
  SoftCapScopeCardMap,
  SoftCapScopeId,
  SoftCapSystemDefinition,
} from "../types/SoftCapTypes";

export const SOFT_CAP_SYSTEM_VERSION = "0.12.7-soft-caps";

export const SOFT_CAP_SYSTEM_DEFINITION: SoftCapSystemDefinition = {
  version: SOFT_CAP_SYSTEM_VERSION,
  goal: "Centralize soft caps for power sources, reward deltas, upgrade growth and ranked submit rules before catch-up mechanics, live upgrade spend or backend validation are enabled.",
  liveCombatScalingEnabled: false,
  liveRewardMutationEnabled: false,
  backendSubmitEnabled: false,
  rules: [
    "Soft Caps v1 is a planning and preview layer; it must not change live damage, enemy HP, wallets or rewards.",
    "Power can grow for years, but vertical raw power must stay capped by source.",
    "Future growth should move into builds, mastery choices, prestige visuals, tournament rules and seasons instead of endless stat multipliers.",
    "Ranked, tournament, duel and community boss values remain backend-sensitive until validation exists.",
    "Over-cap previews should warn the UI and future backend, not silently grant extra competitive value.",
  ],
  requiredBeforeHardCaps: [
    "Catch-up Mechanics",
    "Balance Debug Panel",
    "Cloud Save Adapter",
    "Run Validation Payload",
    "Anti-Cheat Skeleton",
    "Remote Upgrade Validation Endpoint",
  ],
};

const currencyCap = (currencyId: string): number => CURRENCY_DEFINITIONS.find((currency) => currency.id === currencyId)?.maxLocalDeltaPerEvent ?? 0;

export const SOFT_CAP_DEFINITIONS: readonly SoftCapDefinition[] = [
  {
    id: "power_level_cap",
    label: "Level Power Cap",
    scope: "power",
    targetKind: "power_source",
    targetId: "level",
    capValue: DEFAULT_POWER_CAPS.level,
    warningValue: Math.floor(DEFAULT_POWER_CAPS.level * 0.85),
    currentPreviewValue: 24,
    unitLabel: "PWR",
    enforcementMode: "local_clamp_ready",
    riskTier: "safe_local",
    backendValidationRequired: false,
    reason: "Level growth should be strong early but must not become infinite raw damage.",
    futureBehavior: "After the cap, progression should shift into prestige, titles, cosmetics and mastery choices.",
  },
  {
    id: "power_skill_cap",
    label: "Skill Power Cap",
    scope: "power",
    targetKind: "power_source",
    targetId: "skills",
    capValue: DEFAULT_POWER_CAPS.skills,
    warningValue: Math.floor(DEFAULT_POWER_CAPS.skills * 0.85),
    currentPreviewValue: 18,
    unitLabel: "PWR",
    enforcementMode: "local_clamp_ready",
    riskTier: "safe_local",
    backendValidationRequired: false,
    reason: "Skill levels should support builds without creating one permanent best skill.",
    futureBehavior: "Extra skill investment should unlock utility, variants and loadout choices instead of uncapped damage.",
  },
  {
    id: "power_evolution_cap",
    label: "Evolution Power Cap",
    scope: "power",
    targetKind: "power_source",
    targetId: "evolution",
    capValue: DEFAULT_POWER_CAPS.evolution,
    warningValue: Math.floor(DEFAULT_POWER_CAPS.evolution * 0.8),
    currentPreviewValue: 5,
    unitLabel: "PWR",
    enforcementMode: "backend_locked",
    riskTier: "progression_sensitive",
    backendValidationRequired: true,
    reason: "Mascot evolution is long-term identity and should not become paid or uncapped power.",
    futureBehavior: "Later evolution tiers should mostly grant visuals, titles, small capped bonuses and access gates.",
  },
  {
    id: "power_mastery_cap",
    label: "Mastery Power Cap",
    scope: "power",
    targetKind: "power_source",
    targetId: "mastery",
    capValue: DEFAULT_POWER_CAPS.mastery,
    warningValue: Math.floor(DEFAULT_POWER_CAPS.mastery * 0.8),
    currentPreviewValue: 0,
    unitLabel: "PWR",
    enforcementMode: "local_clamp_ready",
    riskTier: "safe_local",
    backendValidationRequired: false,
    reason: "Mastery must be horizontal build direction, not infinite generic stat growth.",
    futureBehavior: "Branch choices should improve guard, dash, boss play and leak control with capped contribution.",
  },
  {
    id: "power_charm_cap",
    label: "Charm Power Cap",
    scope: "power",
    targetKind: "power_source",
    targetId: "charms",
    capValue: DEFAULT_POWER_CAPS.charms,
    warningValue: Math.floor(DEFAULT_POWER_CAPS.charms * 0.8),
    currentPreviewValue: 0,
    unitLabel: "PWR",
    enforcementMode: "backend_locked",
    riskTier: "progression_sensitive",
    backendValidationRequired: true,
    reason: "Charms should change play style and not stack into unlimited power.",
    futureBehavior: "Future charm slots should stay limited and backend-validated for ranked content.",
  },
  {
    id: "economy_xp_local_delta_cap",
    label: "XP Event Delta Cap",
    scope: "economy",
    targetKind: "currency_delta",
    targetId: "xp",
    capValue: currencyCap("xp"),
    warningValue: Math.floor(currencyCap("xp") * 0.75),
    currentPreviewValue: 120,
    unitLabel: "XP",
    enforcementMode: "local_clamp_ready",
    riskTier: "safe_local",
    backendValidationRequired: false,
    reason: "Normal local rewards need an event delta guard before cloud save exists.",
    futureBehavior: "Backend can later accept larger event deltas only for validated boss, tournament or season events.",
  },
  {
    id: "economy_coin_local_delta_cap",
    label: "Coin Event Delta Cap",
    scope: "economy",
    targetKind: "currency_delta",
    targetId: "coins",
    capValue: currencyCap("coins"),
    warningValue: Math.floor(currencyCap("coins") * 0.75),
    currentPreviewValue: 180,
    unitLabel: "COINS",
    enforcementMode: "local_clamp_ready",
    riskTier: "safe_local",
    backendValidationRequired: false,
    reason: "Coins can be local-safe, but upgrade prices still need delta limits.",
    futureBehavior: "Economy events above this band should be split into validated reward sources.",
  },
  {
    id: "economy_leak_point_delta_cap",
    label: "Leak Point Delta Cap",
    scope: "economy",
    targetKind: "currency_delta",
    targetId: "leak_points",
    capValue: currencyCap("leak_points"),
    warningValue: Math.floor(currencyCap("leak_points") * 0.7),
    currentPreviewValue: 8,
    unitLabel: "LEAK",
    enforcementMode: "backend_locked",
    riskTier: "ranked_sensitive",
    backendValidationRequired: true,
    reason: "Leak Points represent core anti-leak status and must not be trusted from local-only multiplayer flows.",
    futureBehavior: "Only validated tasks, bosses, tournaments and duels should grant larger Leak Point bands.",
  },
  {
    id: "economy_rank_point_delta_cap",
    label: "Rank Point Delta Cap",
    scope: "ranked_submit",
    targetKind: "currency_delta",
    targetId: "rank_points",
    capValue: currencyCap("rank_points"),
    warningValue: Math.floor(currencyCap("rank_points") * 0.7),
    currentPreviewValue: 12,
    unitLabel: "RP",
    enforcementMode: "backend_locked",
    riskTier: "ranked_sensitive",
    backendValidationRequired: true,
    reason: "Rank Points directly affect leaderboard position and must be backend-authoritative.",
    futureBehavior: "Ranked submit payloads should reject values outside the validated cap window.",
  },
  {
    id: "economy_tournament_point_delta_cap",
    label: "Tournament Point Delta Cap",
    scope: "ranked_submit",
    targetKind: "currency_delta",
    targetId: "tournament_points",
    capValue: currencyCap("tournament_points"),
    warningValue: Math.floor(currencyCap("tournament_points") * 0.75),
    currentPreviewValue: 320,
    unitLabel: "TP",
    enforcementMode: "backend_locked",
    riskTier: "ranked_sensitive",
    backendValidationRequired: true,
    reason: "Tournament scoring needs a per-run cap before public event rankings go live.",
    futureBehavior: "Tournament leaderboards should store capped, signed and season-scoped score deltas.",
  },
  {
    id: "reward_multiplier_upper_cap",
    label: "Reward Multiplier Cap",
    scope: "reward_multiplier",
    targetKind: "multiplier",
    targetId: "reward_multiplier",
    capValue: 1.15,
    warningValue: 1,
    currentPreviewValue: 1.15,
    unitLabel: "X",
    enforcementMode: "backend_locked",
    riskTier: "ranked_sensitive",
    backendValidationRequired: true,
    reason: "Hard content can reward more, but multipliers must not inflate economy or ranked rewards forever.",
    futureBehavior: "Backend validation should clamp ranked reward multipliers and ignore local over-cap values.",
  },
  {
    id: "upgrade_power_delta_cap",
    label: "Upgrade Power Delta Cap",
    scope: "upgrade_growth",
    targetKind: "upgrade_delta",
    targetId: "upgrade_power_delta",
    capValue: 8,
    warningValue: 5,
    currentPreviewValue: 4,
    unitLabel: "PWR",
    enforcementMode: "local_clamp_ready",
    riskTier: "progression_sensitive",
    backendValidationRequired: false,
    reason: "One upgrade should never create a huge jump that invalidates campaign and duel balance.",
    futureBehavior: "High-tier upgrades should cost more, unlock utility or require validation instead of exceeding this band.",
  },
  {
    id: "ranked_power_delta_cap",
    label: "Ranked Power Delta Cap",
    scope: "ranked_submit",
    targetKind: "ranked_delta",
    targetId: "ranked_power_delta",
    capValue: 80,
    warningValue: 30,
    currentPreviewValue: 0,
    unitLabel: "DELTA",
    enforcementMode: "backend_locked",
    riskTier: "ranked_sensitive",
    backendValidationRequired: true,
    reason: "Overpowered ranked runs should be playable but reduced or blocked from full competitive value.",
    futureBehavior: "Leaderboard submit should compare player power against recommended power before accepting score value.",
  },
];

function safeNumber(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

function normalizePercent(value: number, cap: number): number {
  if (cap <= 0) return 0;
  return Math.max(0, Math.min(999, Math.round((safeNumber(value) / cap) * 100)));
}

export function evaluateSoftCap(definition: SoftCapDefinition, inputValue = definition.currentPreviewValue): SoftCapEvaluation {
  const safeInput = safeNumber(inputValue);
  const cappedValue = definition.capValue > 0 ? Math.min(safeInput, definition.capValue) : safeInput;
  return {
    capId: definition.id,
    inputValue: safeInput,
    capValue: definition.capValue,
    cappedValue,
    overCapAmount: Math.max(0, safeInput - definition.capValue),
    warningActive: safeInput >= definition.warningValue,
    overCap: definition.capValue > 0 && safeInput > definition.capValue,
    enforcementMode: definition.enforcementMode,
    backendValidationRequired: definition.backendValidationRequired,
  };
}

export function createSoftCapPreviewRow(definition: SoftCapDefinition): SoftCapPreviewRow {
  const evaluation = evaluateSoftCap(definition);
  const usagePercent = normalizePercent(definition.currentPreviewValue, definition.capValue);
  const cappedSuffix = evaluation.overCap ? ` · CLAMP ${evaluation.cappedValue}` : "";
  return {
    ...definition,
    cappedPreviewValue: evaluation.cappedValue,
    warningActive: evaluation.warningActive,
    overCap: evaluation.overCap,
    usagePercent,
    displayLine: `${definition.currentPreviewValue}/${definition.capValue} ${definition.unitLabel} · ${usagePercent}%${cappedSuffix}`,
    lockReason: definition.backendValidationRequired
      ? "BACKEND VALIDATION REQUIRED"
      : definition.enforcementMode === "local_clamp_ready"
        ? "LOCAL CLAMP READY"
        : "UI WARNING ONLY",
  };
}

export function getSoftCapDefinitions(): readonly SoftCapDefinition[] {
  return SOFT_CAP_DEFINITIONS;
}

export function getSoftCapRows(): SoftCapPreviewRow[] {
  return SOFT_CAP_DEFINITIONS.map(createSoftCapPreviewRow);
}

export function getSoftCapRowMap(): SoftCapRowMap {
  return getSoftCapRows().reduce<SoftCapRowMap>((map, row) => {
    map[row.id] = row;
    return map;
  }, {});
}

function getScopeLabel(scope: SoftCapScopeId): string {
  if (scope === "power") return "Power Caps";
  if (scope === "economy") return "Economy Delta Caps";
  if (scope === "reward_multiplier") return "Reward Multiplier Caps";
  if (scope === "upgrade_growth") return "Upgrade Growth Caps";
  return "Ranked Submit Caps";
}

export function getSoftCapScopeCards(): SoftCapScopeCard[] {
  return SOFT_CAP_SCOPE_IDS.map((scope) => {
    const rows = getSoftCapRows().filter((row) => row.scope === scope);
    const highestUsagePercent = rows.reduce((max, row) => Math.max(max, row.usagePercent), 0);
    const backendLockedCount = rows.filter((row) => row.enforcementMode === "backend_locked").length;
    const localClampReadyCount = rows.filter((row) => row.enforcementMode === "local_clamp_ready").length;
    const warningOnlyCount = rows.filter((row) => row.enforcementMode === "ui_warning_only").length;
    const overCapCount = rows.filter((row) => row.overCap).length;
    return {
      scope,
      label: getScopeLabel(scope),
      rowCount: rows.length,
      localClampReadyCount,
      backendLockedCount,
      warningOnlyCount,
      overCapCount,
      highestUsagePercent,
      displayLine: `${rows.length} caps · ${backendLockedCount} backend locked · max usage ${highestUsagePercent}%`,
    };
  });
}

export function getSoftCapScopeCardMap(): SoftCapScopeCardMap {
  return getSoftCapScopeCards().reduce<SoftCapScopeCardMap>((map, card) => {
    map[card.scope] = card;
    return map;
  }, {} as SoftCapScopeCardMap);
}

export function getSoftCapCatalogSummary(): SoftCapCatalogSummary {
  const rows = getSoftCapRows();
  return {
    version: SOFT_CAP_SYSTEM_VERSION,
    rowCount: rows.length,
    scopeCount: SOFT_CAP_SCOPE_IDS.length,
    localClampReadyCount: rows.filter((row) => row.enforcementMode === "local_clamp_ready").length,
    backendLockedCount: rows.filter((row) => row.enforcementMode === "backend_locked").length,
    warningOnlyCount: rows.filter((row) => row.enforcementMode === "ui_warning_only").length,
    overCapCount: rows.filter((row) => row.overCap).length,
    rankedSensitiveCount: rows.filter((row) => row.riskTier === "ranked_sensitive").length,
    nextPatch: "v0.12.8-catch-up-mechanics",
  };
}
