import {
  CAMPAIGN_CHAPTERS,
  getCampaignChapterById,
  getCampaignProgress,
  isCampaignChapterComplete,
  isCampaignChapterUnlocked,
  type CampaignProfileState,
} from "../data/campaigns";
import {
  createEconomyTransactionPreview,
  createEmptyWallet,
  sumRewardAmounts,
  type CurrencyWalletV2,
  type RewardAmount,
} from "../types/EconomyTypes";
import type { CampaignChapterId } from "../types/CampaignChapterTypes";
import type {
  CampaignCompletionRewardCard,
  CampaignCompletionRewardLine,
  CampaignCompletionRewardSummary,
  CampaignCompletionRewardSystemDefinition,
} from "../types/CampaignCompletionRewardTypes";
import { getBossRewardPreviewCard } from "./BossRewardSystem";

export const CAMPAIGN_COMPLETION_REWARD_SYSTEM_VERSION = "0.12.4-campaign-completion-rewards";

const DEFAULT_CAMPAIGN_PROFILE: CampaignProfileState = {
  level: 1,
  selectedCampaignId: "daily_leaks",
  selectedBossId: undefined,
  bossProgress: {},
  campaignProgress: {},
};

const CHAPTER_COMPLETION_BONUS: Record<CampaignChapterId, readonly RewardAmount[]> = {
  daily_leaks: [
    { currencyId: "xp", amount: 180 },
    { currencyId: "coins", amount: 140 },
    { currencyId: "skill_cards", amount: 2 },
    { currencyId: "leak_points", amount: 8 },
  ],
  risk_leaks: [
    { currencyId: "xp", amount: 260 },
    { currencyId: "coins", amount: 180 },
    { currencyId: "skill_cards", amount: 4 },
    { currencyId: "leak_points", amount: 14 },
  ],
  lifestyle_leaks: [
    { currencyId: "xp", amount: 340 },
    { currencyId: "coins", amount: 230 },
    { currencyId: "skin_shards", amount: 6 },
    { currencyId: "leak_points", amount: 18 },
  ],
  final_wallet_war: [
    { currencyId: "xp", amount: 460 },
    { currencyId: "coins", amount: 300 },
    { currencyId: "skin_shards", amount: 8 },
    { currencyId: "cosmetic_tokens", amount: 3 },
    { currencyId: "leak_points", amount: 24 },
  ],
};

export const CAMPAIGN_COMPLETION_REWARD_SYSTEM_DEFINITION: CampaignCompletionRewardSystemDefinition = {
  version: CAMPAIGN_COMPLETION_REWARD_SYSTEM_VERSION,
  goal: "Preview full chapter completion rewards after boss rewards and Recommended Power UI are visible, without enabling real wallet claims, leaderboard submit or backend payouts.",
  localClaimEnabled: false,
  backendSubmitEnabled: false,
  leaderboardSubmissionEnabled: false,
  rules: [
    "Chapter completion rewards are preview-only in this patch; no wallet mutation is enabled.",
    "A chapter is complete only when every boss in that chapter is cleared.",
    "XP, coins, cards and shards can be planned locally, but Leak Points and cosmetic tokens remain backend-sensitive before multiplayer launch.",
    "Completion rewards must not submit leaderboard, tournament or duel values until run validation and anti-cheat exist.",
  ],
  requiredBeforeLiveChapterRewards: [
    "Reward Tables v1",
    "Upgrade Costs v1",
    "Run Validation Payload",
    "Anti-Cheat Skeleton",
    "Cloud Save Adapter",
  ],
};

function asCampaignChapterId(chapterId: string): CampaignChapterId {
  return chapterId as CampaignChapterId;
}

function addWallets(base: CurrencyWalletV2, rewards: readonly RewardAmount[]): CurrencyWalletV2 {
  const nextWallet = { ...base };
  for (const reward of rewards) {
    nextWallet[reward.currencyId] = Math.max(0, Math.floor((nextWallet[reward.currencyId] || 0) + reward.amount));
  }
  return nextWallet;
}

function formatRewardDisplay(rewards: readonly RewardAmount[]): string {
  return sumRewardAmounts(rewards)
    .slice(0, 5)
    .map((reward) => `${reward.amount} ${reward.currencyId.replace(/_/g, " ").toUpperCase()}`)
    .join(" · ");
}

function getNextChapterLabel(chapterId: CampaignChapterId): string {
  const index = CAMPAIGN_CHAPTERS.findIndex((chapter) => chapter.id === chapterId);
  const nextChapter = CAMPAIGN_CHAPTERS[index + 1];
  if (!nextChapter) return "Endgame loop preview stays locked until seasons.";
  return `Next unlock target: ${nextChapter.name.replace(/^Chapter \d+ — /, "")}`;
}

function getBossClearRewards(chapterId: CampaignChapterId): RewardAmount[] {
  const chapter = getCampaignChapterById(chapterId);
  return sumRewardAmounts(
    chapter.bossIds.flatMap((bossId) => getBossRewardPreviewCard(bossId, { alreadyCleared: false }).rewards),
  );
}

function getTrophyRewards(chapterId: CampaignChapterId): RewardAmount[] {
  if (chapterId === "daily_leaks") return [{ currencyId: "skin_shards", amount: 2 }];
  if (chapterId === "risk_leaks") return [{ currencyId: "cosmetic_tokens", amount: 1 }];
  if (chapterId === "lifestyle_leaks") return [{ currencyId: "cosmetic_tokens", amount: 2 }];
  return [{ currencyId: "cosmetic_tokens", amount: 4 }];
}

function createRewardLines(chapterId: CampaignChapterId): CampaignCompletionRewardLine[] {
  return [
    {
      id: "boss_clear_total",
      label: "Boss Clear Total",
      rewards: getBossClearRewards(chapterId),
      note: "Sum of planned first-clear boss rewards in this chapter.",
      backendLocked: false,
    },
    {
      id: "chapter_bonus",
      label: "Chapter Completion Bonus",
      rewards: CHAPTER_COMPLETION_BONUS[chapterId],
      note: "Extra reward preview for clearing every boss in the chapter.",
      backendLocked: true,
    },
    {
      id: "trophy_preview",
      label: "Trophy / Cosmetic Preview",
      rewards: getTrophyRewards(chapterId),
      note: "Cosmetic chapter identity reward. It stays preview-only until cloud save exists.",
      backendLocked: true,
    },
  ];
}

export function getCampaignCompletionRewardCard(
  profile: CampaignProfileState = DEFAULT_CAMPAIGN_PROFILE,
  chapterId: CampaignChapterId = asCampaignChapterId(profile.selectedCampaignId || "daily_leaks"),
): CampaignCompletionRewardCard {
  const chapter = getCampaignChapterById(chapterId);
  const progress = getCampaignProgress(profile)[chapter.id] ?? 0;
  const total = Math.max(1, chapter.bossIds.length);
  const unlocked = isCampaignChapterUnlocked(profile, chapter.id);
  const complete = isCampaignChapterComplete(profile, chapter.id);
  const status = !unlocked ? "locked" : complete ? "complete_preview" : "in_progress";
  const statusLabel = status === "locked" ? "LOCKED" : status === "complete_preview" ? "COMPLETE · PREVIEW" : "IN PROGRESS";
  const lines = createRewardLines(asCampaignChapterId(chapter.id));
  const rewards = sumRewardAmounts(lines.flatMap((line) => line.rewards));
  const transaction = createEconomyTransactionPreview(
    {
      sourceId: "campaign_boss",
      rewards: [...rewards],
      notes: `${chapter.name}: chapter completion reward preview only.`,
      requiresBackendValidation: true,
    },
    "claim",
  );

  return {
    chapterId: asCampaignChapterId(chapter.id),
    chapterTitle: chapter.name,
    status,
    statusLabel,
    progressLabel: `${progress}/${total} bosses cleared`,
    clearRequirementLabel: complete ? "All chapter bosses cleared." : `Clear ${Math.max(0, total - progress)} more boss(es).`,
    rewardSourceId: "campaign_boss",
    riskTier: transaction.backendValidationRequired ? "backend_locked" : "safe_local",
    rewards: transaction.normalizedRewards,
    walletDelta: transaction.walletDelta,
    lines,
    displayLine: formatRewardDisplay(transaction.normalizedRewards) || "Completion reward preview pending",
    nextChapterLabel: getNextChapterLabel(asCampaignChapterId(chapter.id)),
    backendValidationRequired: true,
    claimEnabled: false,
    localPreviewOnly: true,
  };
}

export function getCampaignCompletionRewardCards(profile: CampaignProfileState = DEFAULT_CAMPAIGN_PROFILE): CampaignCompletionRewardCard[] {
  return CAMPAIGN_CHAPTERS.map((chapter) => getCampaignCompletionRewardCard(profile, asCampaignChapterId(chapter.id)));
}

export function getCampaignCompletionRewardSummary(profile: CampaignProfileState = DEFAULT_CAMPAIGN_PROFILE): CampaignCompletionRewardSummary {
  const cards = getCampaignCompletionRewardCards(profile);
  let localPreviewWallet = createEmptyWallet();
  let backendLockedWallet = createEmptyWallet();

  for (const card of cards) {
    if (card.backendValidationRequired) backendLockedWallet = addWallets(backendLockedWallet, card.rewards);
    else localPreviewWallet = addWallets(localPreviewWallet, card.rewards);
  }

  return {
    version: CAMPAIGN_COMPLETION_REWARD_SYSTEM_VERSION,
    totalChapters: cards.length,
    completedChapters: cards.filter((card) => card.status === "complete_preview").length,
    claimEnabledCards: cards.filter((card) => card.claimEnabled).length,
    backendLockedCards: cards.filter((card) => card.backendValidationRequired).length,
    localPreviewWallet,
    backendLockedWallet,
    nextPatch: "v0.12.7-soft-caps",
  };
}
