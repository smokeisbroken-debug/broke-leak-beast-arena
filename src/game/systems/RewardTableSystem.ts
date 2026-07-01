import {
  createEconomyTransactionPreview,
  createEmptyWallet,
  sumRewardAmounts,
  type CurrencyWalletV2,
  type RewardAmount,
} from "../types/EconomyTypes";
import type {
  RewardTableCard,
  RewardTableCardMap,
  RewardTableCatalogSummary,
  RewardTableDefinition,
  RewardTableId,
  RewardTablePreviewRow,
  RewardTableRowDefinition,
  RewardTableRowMap,
  RewardTableSystemDefinition,
} from "../types/RewardTableTypes";

export const REWARD_TABLE_SYSTEM_VERSION = "0.12.5-reward-tables";

export const REWARD_TABLE_DEFINITIONS: readonly RewardTableDefinition[] = [
  {
    id: "arena_rewards",
    label: "Arena Rewards",
    scope: "pve",
    purpose: "Normal PvE run rewards for XP, coins and small upgrade material flow.",
    claimMode: "local_claim_enabled",
    backendValidationRequired: false,
    displayOrder: 10,
  },
  {
    id: "campaign_rewards",
    label: "Campaign Rewards",
    scope: "campaign",
    purpose: "Boss first clears, replays and chapter completion reward preview.",
    claimMode: "preview_only",
    backendValidationRequired: true,
    displayOrder: 20,
  },
  {
    id: "task_rewards",
    label: "Task Rewards",
    scope: "tasks",
    purpose: "Daily/weekly task activity rewards and task point preparation.",
    claimMode: "preview_only",
    backendValidationRequired: true,
    displayOrder: 30,
  },
  {
    id: "tournament_rewards",
    label: "Tournament Rewards",
    scope: "tournament",
    purpose: "Participation and ranked event rewards for future tournaments.",
    claimMode: "backend_locked",
    backendValidationRequired: true,
    displayOrder: 40,
  },
  {
    id: "duel_rewards",
    label: "Leak Duel Rewards",
    scope: "duel",
    purpose: "1v1 participation, win and clean-run rewards tied to same-seed validation.",
    claimMode: "backend_locked",
    backendValidationRequired: true,
    displayOrder: 50,
  },
  {
    id: "weekly_boss_rewards",
    label: "Weekly Boss Rewards",
    scope: "community",
    purpose: "Community boss contribution, damage and milestone reward preview.",
    claimMode: "backend_locked",
    backendValidationRequired: true,
    displayOrder: 60,
  },
];

export const REWARD_TABLE_SYSTEM_DEFINITION: RewardTableSystemDefinition = {
  version: REWARD_TABLE_SYSTEM_VERSION,
  goal: "Centralize reward tables for arena, campaign, tasks, tournaments, Leak Duel and weekly bosses before upgrade costs, soft caps or real backend payouts are enabled.",
  claimEnabled: false,
  backendSubmitEnabled: false,
  leaderboardSubmissionEnabled: false,
  rules: [
    "Reward Tables v1 is a planning and preview layer; it must not mutate the wallet outside already-safe local systems.",
    "Arena rows can remain local-safe, but ranked currencies, tournament points, duel wins and community boss values stay backend-locked.",
    "Each reward source has a clear claim mode so future UI cannot accidentally enable multiplayer-sensitive rewards.",
    "Tables use capped reward bands to prepare the next patch: upgrade costs.",
    "No token reward or public leaderboard payout can become live before run validation, cloud save and anti-cheat exist.",
  ],
  requiredBeforeLiveRewardTables: [
    "Upgrade Costs v1",
    "Soft Caps v1",
    "Run Validation Payload",
    "Anti-Cheat Skeleton",
    "Cloud Save Adapter",
    "Remote Reward Claim Endpoint",
  ],
};

const REWARD_TABLE_ROWS: readonly RewardTableRowDefinition[] = [
  {
    id: "arena_starter_clear",
    tableId: "arena_rewards",
    label: "Starter Arena Clear",
    sourceId: "arena_run",
    tier: "starter",
    activityLabel: "Clear an early arena run",
    requirements: ["Complete a normal arena run", "No leaderboard submission"],
    rewards: [
      { currencyId: "xp", amount: 45 },
      { currencyId: "coins", amount: 35 },
    ],
    claimMode: "local_claim_enabled",
    riskTier: "safe_local",
    backendValidationRequired: false,
    notes: ["Designed for early progression and first upgrade preparation."],
  },
  {
    id: "arena_standard_clear",
    tableId: "arena_rewards",
    label: "Standard Arena Clear",
    sourceId: "arena_run",
    tier: "standard",
    activityLabel: "Clear a normal arena run with stable performance",
    requirements: ["Complete run", "Survive the boss wave"],
    rewards: [
      { currencyId: "xp", amount: 80 },
      { currencyId: "coins", amount: 60 },
      { currencyId: "skill_cards", amount: 1 },
    ],
    claimMode: "local_claim_enabled",
    riskTier: "safe_local",
    backendValidationRequired: false,
    notes: ["Main repeatable local PvE reward band."],
  },
  {
    id: "arena_clean_clear",
    tableId: "arena_rewards",
    label: "Clean Arena Clear",
    sourceId: "arena_run",
    tier: "advanced",
    activityLabel: "Clear with low damage taken",
    requirements: ["Complete run", "Good HP result", "No ranked submit"],
    rewards: [
      { currencyId: "xp", amount: 115 },
      { currencyId: "coins", amount: 90 },
      { currencyId: "skill_cards", amount: 2 },
      { currencyId: "skin_shards", amount: 1 },
    ],
    claimMode: "local_claim_enabled",
    riskTier: "safe_local",
    backendValidationRequired: false,
    notes: ["Skillful PvE should feel better, but it remains below boss and chapter rewards."],
  },
  {
    id: "campaign_boss_first_clear",
    tableId: "campaign_rewards",
    label: "Campaign Boss First Clear",
    sourceId: "campaign_boss",
    tier: "standard",
    activityLabel: "Defeat a campaign leak boss for the first time",
    requirements: ["Boss cleared", "First clear marker", "Run validation later"],
    rewards: [
      { currencyId: "xp", amount: 140 },
      { currencyId: "coins", amount: 110 },
      { currencyId: "leak_points", amount: 10 },
      { currencyId: "skill_cards", amount: 2 },
    ],
    claimMode: "preview_only",
    riskTier: "leaderboard_sensitive",
    backendValidationRequired: true,
    notes: ["Leak Points stay preview-only until cloud save and validation exist."],
  },
  {
    id: "campaign_boss_replay",
    tableId: "campaign_rewards",
    label: "Campaign Boss Replay",
    sourceId: "campaign_boss",
    tier: "starter",
    activityLabel: "Replay an already-cleared campaign boss",
    requirements: ["Boss already cleared", "Replay reward reduced"],
    rewards: [
      { currencyId: "xp", amount: 55 },
      { currencyId: "coins", amount: 40 },
    ],
    claimMode: "preview_only",
    riskTier: "safe_local",
    backendValidationRequired: false,
    notes: ["Replay rewards are intentionally smaller to prevent boss farming from breaking the economy."],
  },
  {
    id: "campaign_chapter_clear",
    tableId: "campaign_rewards",
    label: "Chapter Completion",
    sourceId: "campaign_boss",
    tier: "milestone",
    activityLabel: "Clear every boss in a campaign chapter",
    requirements: ["All chapter bosses cleared", "Completion reward validation later"],
    rewards: [
      { currencyId: "xp", amount: 220 },
      { currencyId: "coins", amount: 160 },
      { currencyId: "leak_points", amount: 12 },
      { currencyId: "skin_shards", amount: 3 },
    ],
    claimMode: "preview_only",
    riskTier: "leaderboard_sensitive",
    backendValidationRequired: true,
    notes: ["Chapter reward becomes live only after reward claim and cloud save are ready."],
  },
  {
    id: "daily_task_claim",
    tableId: "task_rewards",
    label: "Daily Task Claim",
    sourceId: "daily_task",
    tier: "starter",
    activityLabel: "Complete a daily task",
    requirements: ["Task completed", "Local daily claim only"],
    rewards: [
      { currencyId: "xp", amount: 35 },
      { currencyId: "coins", amount: 30 },
      { currencyId: "leak_points", amount: 2 },
    ],
    taskPoints: 10,
    claimMode: "local_claim_enabled",
    riskTier: "leaderboard_sensitive",
    backendValidationRequired: true,
    notes: ["Daily task claims can preview local activity, but task-point leaderboard submit stays disabled."],
  },
  {
    id: "weekly_task_claim",
    tableId: "task_rewards",
    label: "Weekly Task Claim",
    sourceId: "weekly_task",
    tier: "advanced",
    activityLabel: "Complete a weekly task chain",
    requirements: ["Weekly task completed", "Backend validation required"],
    rewards: [
      { currencyId: "xp", amount: 160 },
      { currencyId: "coins", amount: 120 },
      { currencyId: "leak_points", amount: 12 },
      { currencyId: "rank_points", amount: 8 },
    ],
    taskPoints: 60,
    leaderboardId: "task_points",
    claimMode: "backend_locked",
    riskTier: "backend_authoritative",
    backendValidationRequired: true,
    notes: ["Weekly rewards are multiplayer-sensitive and must be validated remotely."],
  },
  {
    id: "tournament_participation",
    tableId: "tournament_rewards",
    label: "Tournament Participation",
    sourceId: "tournament_participation",
    tier: "standard",
    activityLabel: "Submit a valid tournament run",
    requirements: ["Tournament active", "Valid run payload", "No duplicate abuse"],
    rewards: [
      { currencyId: "xp", amount: 100 },
      { currencyId: "coins", amount: 80 },
      { currencyId: "tournament_points", amount: 250 },
    ],
    scorePoints: 250,
    leaderboardId: "tournament",
    claimMode: "backend_locked",
    riskTier: "backend_authoritative",
    backendValidationRequired: true,
    notes: ["Participation gives value, but final rank still comes from validated scoring."],
  },
  {
    id: "tournament_rank_reward",
    tableId: "tournament_rewards",
    label: "Tournament Rank Bracket",
    sourceId: "tournament_rank",
    tier: "ranked",
    activityLabel: "Finish in a ranked tournament bracket",
    requirements: ["Event ended", "Remote leaderboard finalized", "Rank bracket calculated"],
    rewards: [
      { currencyId: "rank_points", amount: 25 },
      { currencyId: "tournament_points", amount: 1000 },
      { currencyId: "leak_points", amount: 18 },
      { currencyId: "cosmetic_tokens", amount: 2 },
    ],
    scorePoints: 1000,
    leaderboardId: "tournament",
    claimMode: "backend_locked",
    riskTier: "backend_authoritative",
    backendValidationRequired: true,
    notes: ["Rank rewards are server-authoritative and cannot be claimed locally."],
  },
  {
    id: "duel_participation",
    tableId: "duel_rewards",
    label: "Leak Duel Participation",
    sourceId: "duel_participation",
    tier: "standard",
    activityLabel: "Complete a same-seed 1v1 duel run",
    requirements: ["Duel seed matched", "Run completed", "Backend validation later"],
    rewards: [
      { currencyId: "xp", amount: 70 },
      { currencyId: "coins", amount: 45 },
      { currencyId: "leak_points", amount: 4 },
    ],
    scorePoints: 100,
    leaderboardId: "duel_ranked",
    claimMode: "backend_locked",
    riskTier: "backend_authoritative",
    backendValidationRequired: true,
    notes: ["Duel participation is rewarded, but ranked payout remains locked."],
  },
  {
    id: "duel_win",
    tableId: "duel_rewards",
    label: "Leak Duel Win",
    sourceId: "duel_win",
    tier: "ranked",
    activityLabel: "Win a validated Leak Duel",
    requirements: ["Both scores validated", "Winner calculated remotely", "No seed mismatch"],
    rewards: [
      { currencyId: "rank_points", amount: 12 },
      { currencyId: "leak_points", amount: 10 },
      { currencyId: "cosmetic_tokens", amount: 1 },
    ],
    scorePoints: 350,
    leaderboardId: "duel_ranked",
    claimMode: "backend_locked",
    riskTier: "backend_authoritative",
    backendValidationRequired: true,
    notes: ["1v1 wins are ranked and must be backend-authoritative."],
  },
  {
    id: "weekly_boss_contribution",
    tableId: "weekly_boss_rewards",
    label: "Weekly Boss Contribution",
    sourceId: "weekly_boss_damage",
    tier: "standard",
    activityLabel: "Contribute valid damage to the weekly community boss",
    requirements: ["Weekly boss active", "Damage payload validated", "Contribution threshold reached"],
    rewards: [
      { currencyId: "xp", amount: 140 },
      { currencyId: "leak_points", amount: 14 },
      { currencyId: "rank_points", amount: 6 },
    ],
    scorePoints: 500,
    leaderboardId: "boss_damage",
    claimMode: "backend_locked",
    riskTier: "backend_authoritative",
    backendValidationRequired: true,
    notes: ["Community boss rewards require aggregated backend state."],
  },
  {
    id: "weekly_boss_milestone",
    tableId: "weekly_boss_rewards",
    label: "Community Boss Milestone",
    sourceId: "weekly_boss_damage",
    tier: "milestone",
    activityLabel: "Community reaches a boss HP milestone",
    requirements: ["Milestone reached", "Backend aggregate confirmed", "Player contribution eligible"],
    rewards: [
      { currencyId: "xp", amount: 180 },
      { currencyId: "leak_points", amount: 22 },
      { currencyId: "rank_points", amount: 10 },
      { currencyId: "cosmetic_tokens", amount: 2 },
    ],
    scorePoints: 750,
    leaderboardId: "boss_damage",
    claimMode: "backend_locked",
    riskTier: "backend_authoritative",
    backendValidationRequired: true,
    notes: ["Milestone payouts must be distributed by backend, not local client state."],
  },
];

function addWallets(base: CurrencyWalletV2, rewards: readonly RewardAmount[]): CurrencyWalletV2 {
  const nextWallet = { ...base };
  for (const reward of rewards) {
    nextWallet[reward.currencyId] = Math.max(0, Math.floor((nextWallet[reward.currencyId] || 0) + reward.amount));
  }
  return nextWallet;
}

function formatRewardDisplay(rewards: readonly RewardAmount[]): string {
  return rewards
    .filter((reward) => reward.amount > 0)
    .slice(0, 4)
    .map((reward) => `${reward.amount} ${reward.currencyId.replace(/_/g, " ").toUpperCase()}`)
    .join(" · ");
}

function createPreviewRow(row: RewardTableRowDefinition): RewardTablePreviewRow {
  const transaction = createEconomyTransactionPreview(
    {
      sourceId: row.sourceId,
      rewards: [...row.rewards],
      notes: `${row.label}: reward table preview only.`,
      requiresBackendValidation: row.backendValidationRequired || row.claimMode === "backend_locked",
    },
    row.claimMode === "local_claim_enabled" ? "earn" : "claim",
  );
  const effectiveBackendValidationRequired = row.backendValidationRequired || transaction.backendValidationRequired || row.claimMode === "backend_locked";
  const claimEnabled = row.claimMode === "local_claim_enabled" && !effectiveBackendValidationRequired;

  return {
    ...row,
    normalizedRewards: transaction.normalizedRewards,
    walletDelta: transaction.walletDelta,
    economyValidationTier: transaction.validationTier,
    effectiveBackendValidationRequired,
    claimEnabled,
    localPreviewOnly: row.claimMode !== "backend_locked",
    displayLine: formatRewardDisplay(transaction.normalizedRewards) || "Reward preview pending",
    lockReason: effectiveBackendValidationRequired
      ? "Backend validation required before this reward can become live."
      : row.claimMode === "preview_only"
        ? "Preview only until the claim flow is explicitly enabled."
        : "Local-safe reward band.",
  };
}

function getRowsForTable(tableId: RewardTableId): RewardTablePreviewRow[] {
  return REWARD_TABLE_ROWS.filter((row) => row.tableId === tableId).map(createPreviewRow);
}

export function getRewardTableDefinitions(): RewardTableDefinition[] {
  return [...REWARD_TABLE_DEFINITIONS].sort((a, b) => a.displayOrder - b.displayOrder);
}

export function getRewardTableRows(tableId?: RewardTableId): RewardTablePreviewRow[] {
  if (tableId) return getRowsForTable(tableId);
  return REWARD_TABLE_ROWS.map(createPreviewRow);
}

export function getRewardTableRowMap(): RewardTableRowMap {
  return getRewardTableRows().reduce<RewardTableRowMap>((map, row) => {
    map[row.id] = row;
    return map;
  }, {});
}

export function getRewardTableCard(tableId: RewardTableId): RewardTableCard {
  const definition = REWARD_TABLE_DEFINITIONS.find((candidate) => candidate.id === tableId);
  if (!definition) throw new Error(`Unknown reward table: ${tableId}`);
  const rows = getRowsForTable(tableId);
  const totalWalletPreview = rows.reduce<CurrencyWalletV2>((wallet, row) => addWallets(wallet, row.normalizedRewards), createEmptyWallet());

  return {
    tableId,
    label: definition.label,
    scope: definition.scope,
    claimMode: definition.claimMode,
    backendValidationRequired: definition.backendValidationRequired || rows.some((row) => row.effectiveBackendValidationRequired),
    rowCount: rows.length,
    localClaimableRowCount: rows.filter((row) => row.claimEnabled).length,
    previewOnlyRowCount: rows.filter((row) => row.claimMode === "preview_only").length,
    backendLockedRowCount: rows.filter((row) => row.effectiveBackendValidationRequired || row.claimMode === "backend_locked").length,
    totalWalletPreview,
    displayLine: formatRewardDisplay(sumRewardAmounts(rows.flatMap((row) => row.normalizedRewards))) || "Reward table pending",
  };
}

export function getRewardTableCardMap(): RewardTableCardMap {
  return getRewardTableDefinitions().reduce<RewardTableCardMap>((map, table) => {
    map[table.id] = getRewardTableCard(table.id);
    return map;
  }, {} as RewardTableCardMap);
}

export function getRewardTableCards(): RewardTableCard[] {
  return getRewardTableDefinitions().map((table) => getRewardTableCard(table.id));
}

export function getRewardTableCatalogSummary(rows = getRewardTableRows()): RewardTableCatalogSummary {
  let localWalletPreview = createEmptyWallet();
  let backendLockedWalletPreview = createEmptyWallet();

  for (const row of rows) {
    if (row.effectiveBackendValidationRequired || row.claimMode === "backend_locked") {
      backendLockedWalletPreview = addWallets(backendLockedWalletPreview, row.normalizedRewards);
    } else {
      localWalletPreview = addWallets(localWalletPreview, row.normalizedRewards);
    }
  }

  return {
    version: REWARD_TABLE_SYSTEM_VERSION,
    tableCount: REWARD_TABLE_DEFINITIONS.length,
    rowCount: rows.length,
    localClaimableRowCount: rows.filter((row) => row.claimEnabled).length,
    previewOnlyRowCount: rows.filter((row) => row.claimMode === "preview_only").length,
    backendLockedRowCount: rows.filter((row) => row.effectiveBackendValidationRequired || row.claimMode === "backend_locked").length,
    rankedSensitiveRowCount: rows.filter((row) => row.riskTier !== "safe_local" || Boolean(row.leaderboardId)).length,
    localWalletPreview,
    backendLockedWalletPreview,
    nextPatch: "v0.12.6-upgrade-costs",
  };
}
