import { getArenaBossById } from "../data/bosses";
import {
  createEconomyTransactionPreview,
  createEmptyWallet,
  getRewardSourceDefinition,
  type CurrencyWalletV2,
  type RewardAmount,
} from "../types/EconomyTypes";
import type { BossRegistryEntry, BossRegistryEntryId } from "../types/BossRegistryTypes";
import type {
  BossRewardBreakdownRow,
  BossRewardFormulaInput,
  BossRewardPolicyDefinition,
  BossRewardPolicyId,
  BossRewardPreviewCard,
  BossRewardSummary,
  BossRewardSystemDefinition,
  BossRewardUnlockKind,
} from "../types/BossRewardTypes";
import { getBossRegistryEntries, getBossRegistryEntry } from "./BossRegistrySystem";

export const BOSS_REWARD_SYSTEM_VERSION = "0.12.2-boss-rewards";

export const BOSS_REWARD_POLICIES: readonly BossRewardPolicyDefinition[] = [
  {
    id: "campaign_local_preview",
    label: "Campaign First Clear Preview",
    riskTier: "leaderboard_sensitive",
    rewardSourceId: "campaign_boss",
    claimEnabled: false,
    leaderboardSubmissionEnabled: false,
    backendValidationRequired: false,
    description: "Solo campaign first-clear XP, coins, skill cards and skin shards can be previewed locally; actual claim remains off until campaign completion flow is patched.",
  },
  {
    id: "campaign_replay_preview",
    label: "Campaign Replay Preview",
    riskTier: "safe_local",
    rewardSourceId: "campaign_boss",
    claimEnabled: false,
    leaderboardSubmissionEnabled: false,
    backendValidationRequired: false,
    description: "Replay rewards are intentionally smaller so campaign farming cannot outgrow the planned economy curve.",
  },
  {
    id: "weekly_backend_locked",
    label: "Weekly Boss Backend Locked",
    riskTier: "backend_authoritative",
    rewardSourceId: "weekly_boss_damage",
    claimEnabled: false,
    leaderboardSubmissionEnabled: false,
    backendValidationRequired: true,
    description: "Weekly boss rewards are ranked and must remain backend-authoritative.",
  },
  {
    id: "community_backend_locked",
    label: "Community Milestone Backend Locked",
    riskTier: "backend_authoritative",
    rewardSourceId: "weekly_boss_damage",
    claimEnabled: false,
    leaderboardSubmissionEnabled: false,
    backendValidationRequired: true,
    description: "Community boss milestone payouts require remote damage aggregation and anti-cheat.",
  },
];

export const BOSS_REWARD_SYSTEM_DEFINITION: BossRewardSystemDefinition = {
  version: BOSS_REWARD_SYSTEM_VERSION,
  goal: "Define boss reward tables for campaign clears, replays and weekly/community bosses without enabling real claims, leaderboard submission or backend payouts.",
  backendSubmitEnabled: false,
  localClaimEnabled: false,
  leaderboardSubmissionEnabled: false,
  policies: BOSS_REWARD_POLICIES,
  rules: [
    "Boss Reward v1 is a preview layer only; it must not grant wallet rewards, trophies or leaderboard points yet.",
    "Campaign first-clear rewards can include local-safe XP, coins, skill cards and skin shards; Leak Points stay preview-only until campaign validation exists.",
    "Replay rewards stay smaller than first-clear rewards to protect the economy from repeat farming.",
    "Weekly/community boss rewards remain backend-locked because they are multiplayer and leaderboard-sensitive.",
  ],
  requiredBeforeLiveBossRewards: [
    "Campaign completion result flow that knows first clear versus replay",
    "Run validation payload for boss clear, duration, HP and selected boss",
    "Anti-cheat checks for impossible boss clear times and damage",
    "Cloud save/profile adapter",
    "Remote boss reward claim endpoint",
  ],
};

function addWallets(base: CurrencyWalletV2, rewards: readonly RewardAmount[]): CurrencyWalletV2 {
  const nextWallet = { ...base };
  for (const reward of rewards) {
    nextWallet[reward.currencyId] = Math.max(0, Math.floor((nextWallet[reward.currencyId] || 0) + reward.amount));
  }
  return nextWallet;
}

function getPolicy(policyId: BossRewardPolicyId): BossRewardPolicyDefinition {
  const policy = BOSS_REWARD_POLICIES.find((candidate) => candidate.id === policyId);
  if (!policy) throw new Error(`Unknown boss reward policy: ${policyId}`);
  return policy;
}

function getUnlockKind(input: BossRewardFormulaInput): BossRewardUnlockKind {
  if (input.scopes.includes("weekly")) return "weekly_contribution";
  if (input.scopes.includes("community")) return "community_milestone";
  return input.alreadyCleared ? "replay" : "first_clear";
}

function getPolicyId(input: BossRewardFormulaInput): BossRewardPolicyId {
  const unlockKind = getUnlockKind(input);
  if (unlockKind === "weekly_contribution") return "weekly_backend_locked";
  if (unlockKind === "community_milestone") return "community_backend_locked";
  if (unlockKind === "replay") return "campaign_replay_preview";
  return "campaign_local_preview";
}

function clampReward(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.floor(value)));
}

function getCampaignRewards(input: BossRewardFormulaInput, unlockKind: BossRewardUnlockKind): readonly RewardAmount[] {
  const difficultyFactor = Math.max(1, input.difficultyTotal / 85);
  const powerFactor = Math.max(1, input.recommendedPower / 70);
  const firstClearMultiplier = unlockKind === "first_clear" ? 1 : 0.42;

  const xp = clampReward((80 + input.unlockLevel * 24 + difficultyFactor * 34) * firstClearMultiplier, 30, 260);
  const coins = clampReward((55 + input.unlockLevel * 18 + powerFactor * 22) * firstClearMultiplier, 20, 210);
  const skillCards = unlockKind === "first_clear" ? clampReward(1 + Math.floor(input.unlockLevel / 3), 1, 4) : 0;
  const skinShards = unlockKind === "first_clear" && input.unlockLevel >= 4 ? clampReward(Math.floor(input.unlockLevel / 2), 1, 5) : 0;
  const leakPoints = unlockKind === "first_clear" ? clampReward(5 + input.unlockLevel * 2, 5, 24) : 0;

  const rewards: RewardAmount[] = [
    { currencyId: "xp", amount: xp },
    { currencyId: "coins", amount: coins },
    { currencyId: "skill_cards", amount: skillCards },
    { currencyId: "skin_shards", amount: skinShards },
    { currencyId: "leak_points", amount: leakPoints },
  ];
  return rewards.filter((reward) => reward.amount > 0);
}

function getWeeklyRewards(input: BossRewardFormulaInput): readonly RewardAmount[] {
  const tier = Math.max(1, Math.ceil(input.recommendedPower / 100));
  const rewards: RewardAmount[] = [
    { currencyId: "xp", amount: 120 + tier * 40 },
    { currencyId: "leak_points", amount: 20 + tier * 8 },
    { currencyId: "rank_points", amount: 12 + tier * 4 },
    { currencyId: "cosmetic_tokens", amount: Math.max(1, tier - 1) },
  ];
  return rewards;
}

function createBreakdown(input: BossRewardFormulaInput, rewards: readonly RewardAmount[], unlockKind: BossRewardUnlockKind): BossRewardBreakdownRow[] {
  return [
    {
      id: "difficulty",
      label: "Difficulty Budget",
      value: input.difficultyTotal,
      note: "Higher boss pressure increases XP/coin reward preview within capped limits.",
    },
    {
      id: "recommended_power",
      label: "Recommended Power",
      value: input.recommendedPower,
      note: "Used for reward tier guidance only; it does not change combat stats in this patch.",
    },
    {
      id: "unlock_level",
      label: "Unlock Level",
      value: input.unlockLevel,
      note: unlockKind === "replay" ? "Replay reward is reduced after first clear." : "First clear receives the full preview table.",
    },
    {
      id: "reward_lines",
      label: "Reward Lines",
      value: rewards.length,
      note: "Only preview lines are created; no wallet mutation is enabled.",
    },
  ];
}

function formatRewardDisplay(rewards: readonly RewardAmount[]): string {
  return rewards
    .filter((reward) => reward.amount > 0)
    .slice(0, 4)
    .map((reward) => `${reward.amount} ${reward.currencyId.replace(/_/g, " ").toUpperCase()}`)
    .join(" · ");
}

export function createBossRewardFormulaInput(entry: BossRegistryEntry, alreadyCleared = false): BossRewardFormulaInput {
  const arenaBoss = entry.scopes.includes("campaign") ? getArenaBossById(entry.id) : undefined;
  return {
    bossId: entry.id,
    bossName: entry.name,
    scopes: entry.scopes,
    unlockLevel: entry.unlockLevel,
    recommendedPower: entry.difficulty.recommendedPower,
    difficultyTotal: entry.difficulty.total,
    chapterId: entry.chapterId,
    stageId: entry.stageId,
    rewardTrophyId: arenaBoss?.rewardTrophyId,
    alreadyCleared,
  };
}

export function createBossRewardPreviewCard(input: BossRewardFormulaInput): BossRewardPreviewCard {
  const unlockKind = getUnlockKind(input);
  const policy = getPolicy(getPolicyId(input));
  const rewards = input.scopes.includes("weekly") || input.scopes.includes("community") ? getWeeklyRewards(input) : getCampaignRewards(input, unlockKind);
  const transaction = createEconomyTransactionPreview(
    {
      sourceId: policy.rewardSourceId,
      rewards: [...rewards],
      notes: `${input.bossName}: boss reward preview only.`,
      requiresBackendValidation: policy.backendValidationRequired,
    },
    "earn",
  );
  const source = getRewardSourceDefinition(policy.rewardSourceId);
  const backendValidationRequired =
    policy.backendValidationRequired ||
    transaction.backendValidationRequired ||
    source.validationTier !== "local_ok" ||
    policy.riskTier === "backend_authoritative";
  const claimStatus = backendValidationRequired ? "backend_locked" : policy.claimEnabled ? "claimable_local" : "preview";

  return {
    bossId: input.bossId,
    bossName: input.bossName,
    policyId: policy.id,
    rewardSourceId: policy.rewardSourceId,
    unlockKind,
    claimStatus,
    riskTier: policy.riskTier,
    recommendedPower: input.recommendedPower,
    difficultyTotal: input.difficultyTotal,
    rewards: transaction.normalizedRewards,
    walletDelta: transaction.walletDelta,
    trophyId: input.rewardTrophyId,
    taskCategories: [],
    leaderboardLinks: [],
    breakdown: createBreakdown(input, transaction.normalizedRewards, unlockKind),
    backendValidationRequired,
    claimEnabled: false,
    leaderboardSubmissionEnabled: false,
    localPreviewOnly: true,
    displayLine: formatRewardDisplay(transaction.normalizedRewards) || "Reward preview pending",
    lockReason: backendValidationRequired
      ? "Backend validation required before boss rewards become live."
      : "Preview only until campaign result claim flow is patched.",
  };
}

export function getBossRewardPreviewCard(bossId: BossRegistryEntryId, options?: { alreadyCleared?: boolean }): BossRewardPreviewCard {
  const entry = getBossRegistryEntry(bossId);
  const card = createBossRewardPreviewCard(createBossRewardFormulaInput(entry, options?.alreadyCleared));
  return {
    ...card,
    taskCategories: entry.taskCategories,
    leaderboardLinks: entry.leaderboardLinks,
  };
}

export function getBossRewardPreviewCards(): BossRewardPreviewCard[] {
  return getBossRegistryEntries().map((entry) => {
    const card = createBossRewardPreviewCard(createBossRewardFormulaInput(entry));
    return {
      ...card,
      taskCategories: entry.taskCategories,
      leaderboardLinks: entry.leaderboardLinks,
    };
  });
}

export function getBossRewardSummary(cards = getBossRewardPreviewCards()): BossRewardSummary {
  let localWallet = createEmptyWallet();
  let backendWallet = createEmptyWallet();

  for (const card of cards) {
    if (card.backendValidationRequired) backendWallet = addWallets(backendWallet, card.rewards);
    else localWallet = addWallets(localWallet, card.rewards);
  }

  return {
    version: BOSS_REWARD_SYSTEM_VERSION,
    totalBossRewardCards: cards.length,
    campaignRewardCards: cards.filter((card) => card.rewardSourceId === "campaign_boss").length,
    weeklyRewardCards: cards.filter((card) => card.rewardSourceId === "weekly_boss_damage").length,
    localClaimEnabledCards: cards.filter((card) => card.claimEnabled).length,
    backendLockedCards: cards.filter((card) => card.backendValidationRequired).length,
    totalLocalWalletPreview: localWallet,
    totalBackendLockedWalletPreview: backendWallet,
    nextPatch: "v0.12.5-reward-tables",
  };
}
