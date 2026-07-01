import {
  createEmptyWallet,
  sumRewardAmounts,
  type CurrencyWalletV2,
  type RewardAmount,
} from "../types/EconomyTypes";
import type {
  UpgradeCostAffordability,
  UpgradeCostCard,
  UpgradeCostCardMap,
  UpgradeCostCatalogDefinition,
  UpgradeCostCatalogId,
  UpgradeCostCatalogSummary,
  UpgradeCostPreviewRow,
  UpgradeCostRowDefinition,
  UpgradeCostRowMap,
  UpgradeCostSystemDefinition,
} from "../types/UpgradeCostTypes";

export const UPGRADE_COST_SYSTEM_VERSION = "0.12.6-upgrade-costs";

export const UPGRADE_COST_CATALOGS: readonly UpgradeCostCatalogDefinition[] = [
  {
    id: "skill_upgrade_costs",
    label: "Skill Upgrade Costs",
    scope: "skills",
    purpose: "Preview capped skill level costs before real skill spending is enabled.",
    spendMode: "preview_only",
    backendValidationRequired: false,
    displayOrder: 10,
  },
  {
    id: "evolution_unlock_costs",
    label: "Evolution Unlock Costs",
    scope: "evolution",
    purpose: "Set long-term mascot evolution unlock costs without uncapped stat growth.",
    spendMode: "preview_only",
    backendValidationRequired: true,
    displayOrder: 20,
  },
  {
    id: "mastery_unlock_costs",
    label: "Mastery Costs",
    scope: "mastery",
    purpose: "Prepare mastery branch spending and keep style growth capped.",
    spendMode: "preview_only",
    backendValidationRequired: false,
    displayOrder: 30,
  },
  {
    id: "charm_costs",
    label: "Charm Costs",
    scope: "charms",
    purpose: "Reserve cost bands for future build-changing charms.",
    spendMode: "preview_only",
    backendValidationRequired: false,
    displayOrder: 40,
  },
  {
    id: "cosmetic_costs",
    label: "Cosmetic Costs",
    scope: "cosmetics",
    purpose: "Reserve safe pricing for skins, titles and seasonal visuals.",
    spendMode: "backend_locked",
    backendValidationRequired: true,
    displayOrder: 50,
  },
];

export const UPGRADE_COST_SYSTEM_DEFINITION: UpgradeCostSystemDefinition = {
  version: UPGRADE_COST_SYSTEM_VERSION,
  goal: "Centralize upgrade prices for skills, evolution, mastery, future charms and cosmetics before spending buttons, soft caps or backend validation are enabled.",
  spendEnabled: false,
  combatScalingEnabled: false,
  backendSubmitEnabled: false,
  rules: [
    "Upgrade Costs v1 is a preview layer; it must not mutate the wallet or skill levels.",
    "Skill costs can become local-safe later, but ranked/tournament state must not trust local upgrades until validation exists.",
    "Evolution, ranked cosmetics and any Leak Point spend remain backend-sensitive.",
    "Costs are intentionally progressive so early upgrades feel reachable and later upgrades cannot be rushed in one day.",
    "This patch prepares Soft Caps v1; it does not apply any new power to combat.",
  ],
  requiredBeforeLiveUpgrades: [
    "Soft Caps v1",
    "Upgrade Claim/Spend Flow",
    "Cloud Save Adapter",
    "Run Validation Payload",
    "Anti-Cheat Skeleton",
    "Remote Upgrade Validation Endpoint",
  ],
};

const UPGRADE_COST_ROWS: readonly UpgradeCostRowDefinition[] = [
  {
    id: "skill_green_slash_1_to_2",
    catalogId: "skill_upgrade_costs",
    kind: "skill_level",
    tier: "starter",
    targetId: "green_slash",
    targetLabel: "Green Slash",
    levelFrom: 1,
    levelTo: 2,
    requiredPlayerLevel: 1,
    powerDeltaPreview: 2,
    costs: [
      { currencyId: "coins", amount: 60 },
      { currencyId: "skill_cards", amount: 1 },
    ],
    spendMode: "preview_only",
    riskTier: "safe_local",
    backendValidationRequired: false,
    notes: ["Starter upgrade band for the basic attack skill."],
  },
  {
    id: "skill_cashback_heal_1_to_2",
    catalogId: "skill_upgrade_costs",
    kind: "skill_level",
    tier: "standard",
    targetId: "cashback_heal",
    targetLabel: "Cashback Heal",
    levelFrom: 1,
    levelTo: 2,
    requiredPlayerLevel: 3,
    powerDeltaPreview: 3,
    costs: [
      { currencyId: "coins", amount: 90 },
      { currencyId: "skill_cards", amount: 2 },
    ],
    spendMode: "preview_only",
    riskTier: "safe_local",
    backendValidationRequired: false,
    notes: ["Sustain upgrades should cost more than basic attack upgrades."],
  },
  {
    id: "skill_debt_breaker_2_to_3",
    catalogId: "skill_upgrade_costs",
    kind: "skill_level",
    tier: "advanced",
    targetId: "debt_breaker",
    targetLabel: "Debt Breaker",
    levelFrom: 2,
    levelTo: 3,
    requiredPlayerLevel: 8,
    powerDeltaPreview: 4,
    costs: [
      { currencyId: "coins", amount: 180 },
      { currencyId: "skill_cards", amount: 4 },
      { currencyId: "leak_points", amount: 4 },
    ],
    spendMode: "backend_locked",
    riskTier: "progression_sensitive",
    backendValidationRequired: true,
    notes: ["Boss-killer skill costs touch Leak Points, so this remains backend-locked."],
  },
  {
    id: "evolution_leak_fighter_unlock",
    catalogId: "evolution_unlock_costs",
    kind: "evolution_unlock",
    tier: "starter",
    targetId: "leak_fighter",
    targetLabel: "Leak Fighter Evolution",
    requiredPlayerLevel: 10,
    powerDeltaPreview: 5,
    costs: [
      { currencyId: "coins", amount: 150 },
      { currencyId: "skin_shards", amount: 3 },
    ],
    spendMode: "preview_only",
    riskTier: "progression_sensitive",
    backendValidationRequired: false,
    notes: ["First evolution should be reachable through early campaign and daily play."],
  },
  {
    id: "evolution_wallet_guard_unlock",
    catalogId: "evolution_unlock_costs",
    kind: "evolution_unlock",
    tier: "standard",
    targetId: "wallet_guard",
    targetLabel: "Wallet Guard Evolution",
    requiredPlayerLevel: 25,
    powerDeltaPreview: 8,
    costs: [
      { currencyId: "coins", amount: 420 },
      { currencyId: "skin_shards", amount: 8 },
      { currencyId: "leak_points", amount: 10 },
    ],
    spendMode: "backend_locked",
    riskTier: "progression_sensitive",
    backendValidationRequired: true,
    notes: ["Leak Point evolution gates need cloud save before live spend."],
  },
  {
    id: "mastery_first_branch_level",
    catalogId: "mastery_unlock_costs",
    kind: "mastery_level",
    tier: "starter",
    targetId: "guard_mastery",
    targetLabel: "Wallet Guard Mastery",
    levelFrom: 0,
    levelTo: 1,
    requiredPlayerLevel: 3,
    powerDeltaPreview: 3,
    costs: [
      { currencyId: "coins", amount: 120 },
    ],
    spendMode: "preview_only",
    riskTier: "safe_local",
    backendValidationRequired: false,
    notes: ["First mastery point is cheap enough to introduce build direction."],
  },
  {
    id: "mastery_boss_hunter_mid_level",
    catalogId: "mastery_unlock_costs",
    kind: "mastery_level",
    tier: "advanced",
    targetId: "boss_hunter",
    targetLabel: "Boss Hunter Mastery",
    levelFrom: 2,
    levelTo: 3,
    requiredPlayerLevel: 14,
    powerDeltaPreview: 3,
    costs: [
      { currencyId: "coins", amount: 340 },
      { currencyId: "leak_points", amount: 6 },
    ],
    spendMode: "backend_locked",
    riskTier: "progression_sensitive",
    backendValidationRequired: true,
    notes: ["Boss mastery affects competitive boss modes later, so Leak Point spend stays locked."],
  },
  {
    id: "charm_receipt_charm_unlock",
    catalogId: "charm_costs",
    kind: "charm_unlock",
    tier: "standard",
    targetId: "receipt_charm",
    targetLabel: "Receipt Charm",
    requiredPlayerLevel: 12,
    powerDeltaPreview: 4,
    costs: [
      { currencyId: "coins", amount: 260 },
      { currencyId: "skin_shards", amount: 4 },
    ],
    spendMode: "preview_only",
    riskTier: "safe_local",
    backendValidationRequired: false,
    notes: ["Future charms should change builds, not create uncapped raw power."],
  },
  {
    id: "cosmetic_no_leak_title",
    catalogId: "cosmetic_costs",
    kind: "cosmetic_unlock",
    tier: "seasonal",
    targetId: "no_leak_title",
    targetLabel: "No-Leak Title",
    requiredPlayerLevel: 1,
    powerDeltaPreview: 0,
    costs: [
      { currencyId: "cosmetic_tokens", amount: 2 },
    ],
    spendMode: "backend_locked",
    riskTier: "ranked_or_seasonal",
    backendValidationRequired: true,
    notes: ["Seasonal cosmetics must remain backend-authoritative."],
  },
];

function addCosts(base: CurrencyWalletV2, costs: readonly RewardAmount[]): CurrencyWalletV2 {
  const nextWallet = { ...base };
  for (const cost of costs) {
    nextWallet[cost.currencyId] = Math.max(0, Math.floor((nextWallet[cost.currencyId] || 0) + cost.amount));
  }
  return nextWallet;
}

function normalizeCosts(costs: readonly RewardAmount[]): RewardAmount[] {
  return sumRewardAmounts(costs).filter((cost) => cost.amount > 0);
}

function formatCostDisplay(costs: readonly RewardAmount[]): string {
  return costs
    .filter((cost) => cost.amount > 0)
    .slice(0, 4)
    .map((cost) => `${cost.amount} ${cost.currencyId.replace(/_/g, " ").toUpperCase()}`)
    .join(" · ");
}

function createCostPreviewRow(row: UpgradeCostRowDefinition): UpgradeCostPreviewRow {
  const normalizedCosts = normalizeCosts(row.costs);
  const effectiveBackendValidationRequired = row.backendValidationRequired || row.spendMode === "backend_locked";
  const spendEnabled = row.spendMode === "local_spend_ready" && !effectiveBackendValidationRequired;

  return {
    ...row,
    normalizedCosts,
    costWallet: addCosts(createEmptyWallet(), normalizedCosts),
    spendEnabled,
    localPreviewOnly: row.spendMode !== "backend_locked",
    effectiveBackendValidationRequired,
    displayLine: formatCostDisplay(normalizedCosts) || "Free preview",
    lockReason: effectiveBackendValidationRequired
      ? "Backend validation required before this cost can become live."
      : row.spendMode === "preview_only"
        ? "Preview only until the upgrade spend flow is enabled."
        : "Local-safe spend band.",
  };
}

function getRowsForCatalog(catalogId: UpgradeCostCatalogId): UpgradeCostPreviewRow[] {
  return UPGRADE_COST_ROWS.filter((row) => row.catalogId === catalogId).map(createCostPreviewRow);
}

export function getUpgradeCostCatalogs(): UpgradeCostCatalogDefinition[] {
  return [...UPGRADE_COST_CATALOGS].sort((a, b) => a.displayOrder - b.displayOrder);
}

export function getUpgradeCostRows(catalogId?: UpgradeCostCatalogId): UpgradeCostPreviewRow[] {
  if (catalogId) return getRowsForCatalog(catalogId);
  return UPGRADE_COST_ROWS.map(createCostPreviewRow);
}

export function getUpgradeCostRowMap(): UpgradeCostRowMap {
  return getUpgradeCostRows().reduce<UpgradeCostRowMap>((map, row) => {
    map[row.id] = row;
    return map;
  }, {});
}

export function getUpgradeCostCard(catalogId: UpgradeCostCatalogId): UpgradeCostCard {
  const catalog = UPGRADE_COST_CATALOGS.find((candidate) => candidate.id === catalogId);
  if (!catalog) throw new Error(`Unknown upgrade cost catalog: ${catalogId}`);

  const rows = getRowsForCatalog(catalogId);
  const totalCostPreview = rows.reduce<CurrencyWalletV2>((wallet, row) => addCosts(wallet, row.normalizedCosts), createEmptyWallet());

  return {
    catalogId,
    label: catalog.label,
    scope: catalog.scope,
    spendMode: catalog.spendMode,
    backendValidationRequired: catalog.backendValidationRequired || rows.some((row) => row.effectiveBackendValidationRequired),
    rowCount: rows.length,
    localSpendReadyRowCount: rows.filter((row) => row.spendEnabled).length,
    previewOnlyRowCount: rows.filter((row) => row.spendMode === "preview_only").length,
    backendLockedRowCount: rows.filter((row) => row.effectiveBackendValidationRequired || row.spendMode === "backend_locked").length,
    totalCostPreview,
    totalPowerDeltaPreview: rows.reduce((total, row) => total + row.powerDeltaPreview, 0),
    displayLine: formatCostDisplay(sumRewardAmounts(rows.flatMap((row) => row.normalizedCosts))) || "Cost table pending",
  };
}

export function getUpgradeCostCardMap(): UpgradeCostCardMap {
  return getUpgradeCostCatalogs().reduce<UpgradeCostCardMap>((map, catalog) => {
    map[catalog.id] = getUpgradeCostCard(catalog.id);
    return map;
  }, {} as UpgradeCostCardMap);
}

export function getUpgradeCostCards(): UpgradeCostCard[] {
  return getUpgradeCostCatalogs().map((catalog) => getUpgradeCostCard(catalog.id));
}

export function getUpgradeCostCatalogSummary(rows = getUpgradeCostRows()): UpgradeCostCatalogSummary {
  let totalLocalCostPreview = createEmptyWallet();
  let totalBackendLockedCostPreview = createEmptyWallet();

  for (const row of rows) {
    if (row.effectiveBackendValidationRequired || row.spendMode === "backend_locked") {
      totalBackendLockedCostPreview = addCosts(totalBackendLockedCostPreview, row.normalizedCosts);
    } else {
      totalLocalCostPreview = addCosts(totalLocalCostPreview, row.normalizedCosts);
    }
  }

  return {
    version: UPGRADE_COST_SYSTEM_VERSION,
    catalogCount: UPGRADE_COST_CATALOGS.length,
    rowCount: rows.length,
    localSpendReadyRowCount: rows.filter((row) => row.spendEnabled).length,
    previewOnlyRowCount: rows.filter((row) => row.spendMode === "preview_only").length,
    backendLockedRowCount: rows.filter((row) => row.effectiveBackendValidationRequired || row.spendMode === "backend_locked").length,
    rankedOrSeasonalRowCount: rows.filter((row) => row.riskTier === "ranked_or_seasonal").length,
    totalLocalCostPreview,
    totalBackendLockedCostPreview,
    nextPatch: "v0.12.7-soft-caps",
  };
}

export function getUpgradeCostAffordability(rowId: string, wallet: CurrencyWalletV2): UpgradeCostAffordability {
  const row = getUpgradeCostRowMap()[rowId];
  if (!row) throw new Error(`Unknown upgrade cost row: ${rowId}`);

  const missingCosts = row.normalizedCosts
    .map<RewardAmount>((cost) => ({
      currencyId: cost.currencyId,
      amount: Math.max(0, cost.amount - Math.max(0, Math.floor(wallet[cost.currencyId] || 0))),
    }))
    .filter((cost) => cost.amount > 0);

  return {
    rowId,
    canAfford: missingCosts.length === 0,
    missingCosts,
    spendEnabled: row.spendEnabled,
    backendLocked: row.effectiveBackendValidationRequired,
    displayLine: missingCosts.length ? `Missing ${formatCostDisplay(missingCosts)}` : "Cost covered",
  };
}
