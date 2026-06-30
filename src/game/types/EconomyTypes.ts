export const CURRENCY_IDS = [
  "xp",
  "coins",
  "leak_points",
  "rank_points",
  "tournament_points",
  "skill_cards",
  "skin_shards",
  "cosmetic_tokens",
] as const;

export type CurrencyId = (typeof CURRENCY_IDS)[number];

export const REWARD_SOURCE_IDS = [
  "arena_run",
  "campaign_boss",
  "daily_task",
  "weekly_task",
  "tournament_participation",
  "tournament_rank",
  "duel_participation",
  "duel_win",
  "weekly_boss_damage",
  "season_mission",
  "season_reward",
  "backend_sync_adjustment",
] as const;

export type RewardSourceId = (typeof REWARD_SOURCE_IDS)[number];

export type CurrencyCategory = "progression" | "soft" | "ranked" | "event" | "upgrade" | "cosmetic";
export type EconomyEventType = "earn" | "spend" | "claim" | "convert" | "sync_adjustment";
export type EconomyValidationTier = "local_ok" | "backend_required" | "backend_authoritative";

export interface CurrencyDefinition {
  id: CurrencyId;
  label: string;
  shortLabel: string;
  category: CurrencyCategory;
  purpose: string;
  multiplayerSensitive: boolean;
  backendValidationRequired: boolean;
  maxLocalDeltaPerEvent: number;
  displayOrder: number;
}

export interface RewardAmount {
  currencyId: CurrencyId;
  amount: number;
}

export interface RewardBundleV2 {
  sourceId: RewardSourceId;
  rewards: RewardAmount[];
  notes?: string;
  requiresBackendValidation?: boolean;
}

export interface RewardSourceDefinition {
  id: RewardSourceId;
  label: string;
  validationTier: EconomyValidationTier;
  leaderboardSensitive: boolean;
  grantsRankedValue: boolean;
  participationOnly: boolean;
  allowedCurrencies: readonly CurrencyId[];
  description: string;
}

export type CurrencyWalletV2 = Record<CurrencyId, number>;

export interface EconomyTransactionPreview {
  eventType: EconomyEventType;
  sourceId: RewardSourceId;
  normalizedRewards: RewardAmount[];
  walletDelta: CurrencyWalletV2;
  validationTier: EconomyValidationTier;
  backendValidationRequired: boolean;
  createdAtIso: string;
  notes?: string;
}

export interface EconomySystemDefinition {
  version: string;
  localOnlyCurrencies: readonly CurrencyId[];
  backendValidatedCurrencies: readonly CurrencyId[];
  rankedCurrencies: readonly CurrencyId[];
  eventCurrencies: readonly CurrencyId[];
  notes: readonly string[];
}

export const CURRENCY_DEFINITIONS: readonly CurrencyDefinition[] = [
  {
    id: "xp",
    label: "XP",
    shortLabel: "XP",
    category: "progression",
    purpose: "Mascot level growth and long-term progression.",
    multiplayerSensitive: false,
    backendValidationRequired: false,
    maxLocalDeltaPerEvent: 500,
    displayOrder: 10,
  },
  {
    id: "coins",
    label: "Coins",
    shortLabel: "COIN",
    category: "soft",
    purpose: "Upgrade costs, skill growth, charms and non-ranked purchases.",
    multiplayerSensitive: false,
    backendValidationRequired: false,
    maxLocalDeltaPerEvent: 1000,
    displayOrder: 20,
  },
  {
    id: "leak_points",
    label: "Leak Points",
    shortLabel: "LEAK",
    category: "ranked",
    purpose: "Core SmokeIsBroke themed progression and anti-leak status.",
    multiplayerSensitive: true,
    backendValidationRequired: true,
    maxLocalDeltaPerEvent: 50,
    displayOrder: 30,
  },
  {
    id: "rank_points",
    label: "Rank Points",
    shortLabel: "RP",
    category: "ranked",
    purpose: "Leaderboard and ranked competitive placement.",
    multiplayerSensitive: true,
    backendValidationRequired: true,
    maxLocalDeltaPerEvent: 40,
    displayOrder: 40,
  },
  {
    id: "tournament_points",
    label: "Tournament Points",
    shortLabel: "TP",
    category: "event",
    purpose: "Time-boxed event scoring, participation and reward brackets.",
    multiplayerSensitive: true,
    backendValidationRequired: true,
    maxLocalDeltaPerEvent: 750,
    displayOrder: 50,
  },
  {
    id: "skill_cards",
    label: "Skill Cards",
    shortLabel: "CARD",
    category: "upgrade",
    purpose: "Skill upgrades without infinite raw power scaling.",
    multiplayerSensitive: false,
    backendValidationRequired: false,
    maxLocalDeltaPerEvent: 30,
    displayOrder: 60,
  },
  {
    id: "skin_shards",
    label: "Skin Shards",
    shortLabel: "SHARD",
    category: "cosmetic",
    purpose: "Cosmetic and evolution unlock progress.",
    multiplayerSensitive: false,
    backendValidationRequired: false,
    maxLocalDeltaPerEvent: 30,
    displayOrder: 70,
  },
  {
    id: "cosmetic_tokens",
    label: "Cosmetic Tokens",
    shortLabel: "COS",
    category: "cosmetic",
    purpose: "Seasonal skins, titles, banners and visual prestige.",
    multiplayerSensitive: true,
    backendValidationRequired: true,
    maxLocalDeltaPerEvent: 25,
    displayOrder: 80,
  },
];

export const REWARD_SOURCE_DEFINITIONS: readonly RewardSourceDefinition[] = [
  {
    id: "arena_run",
    label: "Arena Run",
    validationTier: "local_ok",
    leaderboardSensitive: false,
    grantsRankedValue: false,
    participationOnly: false,
    allowedCurrencies: ["xp", "coins", "skill_cards", "skin_shards"],
    description: "Normal PvE arena rewards that can remain local until cloud save exists.",
  },
  {
    id: "campaign_boss",
    label: "Campaign Boss",
    validationTier: "local_ok",
    leaderboardSensitive: false,
    grantsRankedValue: false,
    participationOnly: false,
    allowedCurrencies: ["xp", "coins", "leak_points", "skill_cards", "skin_shards"],
    description: "Solo boss progression rewards. Leak Points require remote validation later.",
  },
  {
    id: "daily_task",
    label: "Daily Task",
    validationTier: "local_ok",
    leaderboardSensitive: true,
    grantsRankedValue: false,
    participationOnly: false,
    allowedCurrencies: ["xp", "coins", "leak_points", "skill_cards", "skin_shards"],
    description: "Daily habit loop rewards and task point preparation.",
  },
  {
    id: "weekly_task",
    label: "Weekly Task",
    validationTier: "backend_required",
    leaderboardSensitive: true,
    grantsRankedValue: true,
    participationOnly: false,
    allowedCurrencies: ["xp", "coins", "leak_points", "rank_points", "tournament_points"],
    description: "Weekly goals that can affect leaderboards and must be validated before live rewards.",
  },
  {
    id: "tournament_participation",
    label: "Tournament Participation",
    validationTier: "backend_required",
    leaderboardSensitive: true,
    grantsRankedValue: true,
    participationOnly: true,
    allowedCurrencies: ["xp", "coins", "leak_points", "tournament_points"],
    description: "Entry/participation score for time-boxed events.",
  },
  {
    id: "tournament_rank",
    label: "Tournament Rank",
    validationTier: "backend_authoritative",
    leaderboardSensitive: true,
    grantsRankedValue: true,
    participationOnly: false,
    allowedCurrencies: ["rank_points", "tournament_points", "cosmetic_tokens", "leak_points"],
    description: "Ranked event rewards. Remote backend must be authoritative.",
  },
  {
    id: "duel_participation",
    label: "Duel Participation",
    validationTier: "backend_required",
    leaderboardSensitive: true,
    grantsRankedValue: false,
    participationOnly: true,
    allowedCurrencies: ["xp", "coins", "leak_points"],
    description: "Base reward for completing a 1v1 Leak Duel seed.",
  },
  {
    id: "duel_win",
    label: "Duel Win",
    validationTier: "backend_authoritative",
    leaderboardSensitive: true,
    grantsRankedValue: true,
    participationOnly: false,
    allowedCurrencies: ["rank_points", "leak_points", "cosmetic_tokens"],
    description: "Winner reward for 1v1 Leak Duel. Must be server verified.",
  },
  {
    id: "weekly_boss_damage",
    label: "Weekly Boss Damage",
    validationTier: "backend_authoritative",
    leaderboardSensitive: true,
    grantsRankedValue: true,
    participationOnly: false,
    allowedCurrencies: ["xp", "leak_points", "rank_points", "cosmetic_tokens"],
    description: "Community boss contribution rewards and boss damage leaderboard value.",
  },
  {
    id: "season_mission",
    label: "Season Mission",
    validationTier: "backend_required",
    leaderboardSensitive: true,
    grantsRankedValue: true,
    participationOnly: false,
    allowedCurrencies: ["xp", "coins", "leak_points", "tournament_points", "cosmetic_tokens"],
    description: "Future season task rewards tied to long-term retention.",
  },
  {
    id: "season_reward",
    label: "Season Reward",
    validationTier: "backend_authoritative",
    leaderboardSensitive: true,
    grantsRankedValue: true,
    participationOnly: false,
    allowedCurrencies: ["rank_points", "cosmetic_tokens", "leak_points", "skin_shards"],
    description: "End-of-season reward distribution.",
  },
  {
    id: "backend_sync_adjustment",
    label: "Backend Sync Adjustment",
    validationTier: "backend_authoritative",
    leaderboardSensitive: true,
    grantsRankedValue: true,
    participationOnly: false,
    allowedCurrencies: CURRENCY_IDS,
    description: "Future reconciliation event when cloud save becomes authoritative.",
  },
];

export const ECONOMY_SYSTEM_DEFINITION: EconomySystemDefinition = {
  version: "0.8.8-economy-types",
  localOnlyCurrencies: CURRENCY_DEFINITIONS.filter((currency) => !currency.backendValidationRequired).map((currency) => currency.id),
  backendValidatedCurrencies: CURRENCY_DEFINITIONS.filter((currency) => currency.backendValidationRequired).map((currency) => currency.id),
  rankedCurrencies: CURRENCY_DEFINITIONS.filter((currency) => currency.category === "ranked").map((currency) => currency.id),
  eventCurrencies: CURRENCY_DEFINITIONS.filter((currency) => currency.category === "event").map((currency) => currency.id),
  notes: [
    "Local rewards are allowed for early PvE progression only.",
    "Rank Points, Tournament Points, ranked Leak Points and Cosmetic Tokens require backend validation before live multiplayer rewards.",
    "Participation rewards and ranked rewards are separated so tournaments and 1v1 duels cannot become pay-to-win.",
  ],
};

export const ZERO_CURRENCY_WALLET: Readonly<CurrencyWalletV2> = Object.freeze(createEmptyWallet());

export function createEmptyWallet(): CurrencyWalletV2 {
  return CURRENCY_IDS.reduce<CurrencyWalletV2>((wallet, currencyId) => {
    wallet[currencyId] = 0;
    return wallet;
  }, {} as CurrencyWalletV2);
}

export function getCurrencyDefinition(currencyId: CurrencyId): CurrencyDefinition {
  const currency = CURRENCY_DEFINITIONS.find((candidate) => candidate.id === currencyId);
  if (!currency) {
    throw new Error(`Unknown currency: ${currencyId}`);
  }
  return currency;
}

export function getRewardSourceDefinition(sourceId: RewardSourceId): RewardSourceDefinition {
  const source = REWARD_SOURCE_DEFINITIONS.find((candidate) => candidate.id === sourceId);
  if (!source) {
    throw new Error(`Unknown reward source: ${sourceId}`);
  }
  return source;
}

export function normalizeRewardAmount(reward: RewardAmount): RewardAmount {
  return {
    currencyId: reward.currencyId,
    amount: Math.max(0, Math.floor(reward.amount || 0)),
  };
}

export function sumRewardAmounts(rewards: readonly RewardAmount[]): RewardAmount[] {
  const totals = createEmptyWallet();
  for (const reward of rewards) {
    const normalized = normalizeRewardAmount(reward);
    totals[normalized.currencyId] += normalized.amount;
  }

  return CURRENCY_IDS.map((currencyId) => ({ currencyId, amount: totals[currencyId] })).filter((reward) => reward.amount > 0);
}

export function normalizeRewardBundle(bundle: RewardBundleV2): RewardBundleV2 {
  const source = getRewardSourceDefinition(bundle.sourceId);
  const normalizedRewards = sumRewardAmounts(bundle.rewards).filter((reward) => source.allowedCurrencies.includes(reward.currencyId));

  return {
    ...bundle,
    rewards: normalizedRewards,
    requiresBackendValidation: bundle.requiresBackendValidation ?? source.validationTier !== "local_ok",
  };
}

export function buildRewardWalletDelta(rewards: readonly RewardAmount[]): CurrencyWalletV2 {
  const wallet = createEmptyWallet();
  for (const reward of sumRewardAmounts(rewards)) {
    wallet[reward.currencyId] += reward.amount;
  }
  return wallet;
}

export function createEconomyTransactionPreview(bundle: RewardBundleV2, eventType: EconomyEventType = "earn"): EconomyTransactionPreview {
  const normalizedBundle = normalizeRewardBundle(bundle);
  const source = getRewardSourceDefinition(normalizedBundle.sourceId);
  const backendValidationRequired =
    normalizedBundle.requiresBackendValidation === true ||
    source.validationTier !== "local_ok" ||
    normalizedBundle.rewards.some((reward) => getCurrencyDefinition(reward.currencyId).backendValidationRequired);

  return {
    eventType,
    sourceId: normalizedBundle.sourceId,
    normalizedRewards: normalizedBundle.rewards,
    walletDelta: buildRewardWalletDelta(normalizedBundle.rewards),
    validationTier: source.validationTier,
    backendValidationRequired,
    createdAtIso: new Date().toISOString(),
    notes: normalizedBundle.notes,
  };
}

export function getBackendValidatedCurrencies(): CurrencyDefinition[] {
  return CURRENCY_DEFINITIONS.filter((currency) => currency.backendValidationRequired);
}

export function getLocalOnlyCurrencies(): CurrencyDefinition[] {
  return CURRENCY_DEFINITIONS.filter((currency) => !currency.backendValidationRequired);
}

export function isRankedCurrency(currencyId: CurrencyId): boolean {
  const currency = getCurrencyDefinition(currencyId);
  return currency.category === "ranked" || currency.category === "event" || currency.backendValidationRequired;
}
