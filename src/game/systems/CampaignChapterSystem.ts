import {
  CAMPAIGN_CHAPTERS,
  DEFAULT_CAMPAIGN_ID,
  getCampaignBossState,
  getCampaignChapterById,
  getCampaignProgress,
  getCampaignProgressSummary,
  getCampaignUnlockLabel,
  getRecommendedCampaignBoss,
  isCampaignChapterComplete,
  isCampaignChapterUnlocked,
  type CampaignChapterDefinition,
  type CampaignProfileState,
} from "../data/campaigns";
import type {
  CampaignChapterCard,
  CampaignChapterContract,
  CampaignChapterGateRule,
  CampaignChapterId,
  CampaignChapterNodeDefinition,
  CampaignChapterRewardPreview,
  CampaignChapterSnapshot,
  CampaignChapterStatus,
  CampaignChapterSystemDefinition,
} from "../types/CampaignChapterTypes";

export const CAMPAIGN_CHAPTER_SYSTEM_VERSION = "0.11.9-campaign-chapter-skeleton";

const DEFAULT_CAMPAIGN_PROFILE: CampaignProfileState = {
  level: 1,
  selectedCampaignId: DEFAULT_CAMPAIGN_ID,
  selectedBossId: undefined,
  bossProgress: {},
  campaignProgress: {},
};

const CHAPTER_RECOMMENDED_POWER: Record<CampaignChapterId, { min: number; max: number }> = {
  daily_leaks: { min: 20, max: 80 },
  risk_leaks: { min: 80, max: 150 },
  lifestyle_leaks: { min: 150, max: 230 },
  final_wallet_war: { min: 230, max: 330 },
};

const CHAPTER_THEME: Record<CampaignChapterId, string> = {
  daily_leaks: "Everyday leak control",
  risk_leaks: "FOMO and scam resistance",
  lifestyle_leaks: "Status spending pressure",
  final_wallet_war: "Endgame wallet defense",
};

const CHAPTER_LANE: Record<CampaignChapterId, CampaignChapterContract["laneId"]> = {
  daily_leaks: "onboarding",
  risk_leaks: "risk_control",
  lifestyle_leaks: "status_pressure",
  final_wallet_war: "endgame_wallet",
};

const CHAPTER_TASK_CATEGORIES: Record<CampaignChapterId, CampaignChapterContract["taskCategories"]> = {
  daily_leaks: ["combat", "skill"],
  risk_leaks: ["combat", "anti_leak"],
  lifestyle_leaks: ["boss", "anti_leak"],
  final_wallet_war: ["boss", "tournament"],
};

const CHAPTER_LEADERBOARDS: Record<CampaignChapterId, CampaignChapterContract["leaderboardLinks"]> = {
  daily_leaks: ["weekly_arena", "task_points"],
  risk_leaks: ["weekly_arena", "boss_damage"],
  lifestyle_leaks: ["weekly_arena", "boss_damage"],
  final_wallet_war: ["boss_damage", "global_power"],
};

export const CAMPAIGN_CHAPTER_SYSTEM_DEFINITION: CampaignChapterSystemDefinition = {
  version: CAMPAIGN_CHAPTER_SYSTEM_VERSION,
  goal: "Normalize campaign chapters into a backend-ready contract with chapter cards, boss nodes, gate rules, rewards preview and leaderboard/task links before boss registry v2 expands PvE content.",
  defaultChapterId: DEFAULT_CAMPAIGN_ID as CampaignChapterId,
  backendSubmitEnabled: false,
  localPreviewOnly: true,
  rules: [
    "Campaign chapter skeleton may describe rewards and leaderboard links, but it must not submit ranked scores yet.",
    "Boss sequence remains deterministic: a player must clear previous bosses before the next boss opens.",
    "Recommended Power is a guidance layer only in this patch; it does not change enemy HP, damage or rewards.",
    "Chapter reward previews stay local until backend validation and anti-cheat exist.",
  ],
  requiredBeforeChapterRewards: [
    "Boss Registry v2 with difficultyScore per boss",
    "Recommended Power UI on boss cards",
    "Reward tables and upgrade cost balance",
    "Run validation payload and anti-cheat checks",
    "Cloud save / backend profile adapter",
  ],
};

function asCampaignChapterId(chapterId: string): CampaignChapterId {
  return chapterId as CampaignChapterId;
}

function getShortTitle(chapter: CampaignChapterDefinition): string {
  return chapter.name.replace(/^Chapter \d+ — /, "");
}

function getRewardPreviewForChapter(chapterId: CampaignChapterId): CampaignChapterRewardPreview[] {
  const commonRewards: CampaignChapterRewardPreview[] = [
    { id: "xp", label: "Mascot XP", amountLabel: "+progress", backendLocked: false },
    { id: "coins", label: "Coins", amountLabel: "+upgrade budget", backendLocked: false },
    { id: "leak_points", label: "Leak Points", amountLabel: "+anti-leak score", backendLocked: true },
  ];

  if (chapterId === "risk_leaks") {
    return [...commonRewards, { id: "skill_cards", label: "Skill Cards", amountLabel: "+future upgrades", backendLocked: true }];
  }
  if (chapterId === "lifestyle_leaks") {
    return [...commonRewards, { id: "skin_shards", label: "Skin Shards", amountLabel: "+cosmetic progress", backendLocked: true }];
  }
  if (chapterId === "final_wallet_war") {
    return [...commonRewards, { id: "trophy", label: "Boss Trophy", amountLabel: "chapter clear", backendLocked: true }];
  }
  return commonRewards;
}

function getGateRules(chapter: CampaignChapterDefinition): CampaignChapterGateRule[] {
  const rules: CampaignChapterGateRule[] = [
    { id: "level", label: `Requires level ${chapter.unlockLevel}`, blocking: chapter.unlockLevel > 1 },
    { id: "boss_sequence", label: "Bosses unlock in chapter order", blocking: true },
    { id: "recommended_power", label: "Recommended Power is guidance only", blocking: false },
  ];

  if (chapter.requiredChapterId) {
    rules.push({
      id: "previous_chapter",
      label: `Requires ${chapter.requiredClears ?? 1} clear(s) in ${getShortTitle(getCampaignChapterById(chapter.requiredChapterId))}`,
      blocking: true,
    });
  }

  return rules;
}

function createChapterNodes(chapter: CampaignChapterDefinition): CampaignChapterNodeDefinition[] {
  const chapterId = asCampaignChapterId(chapter.id);
  const recommended = CHAPTER_RECOMMENDED_POWER[chapterId];
  const nodeStep = Math.max(1, Math.floor((recommended.max - recommended.min) / Math.max(1, chapter.bossIds.length)));
  const bossNodes = chapter.bossIds.map((bossId, index) => ({
    id: `${chapter.id}-boss-${index + 1}`,
    chapterId,
    order: index + 2,
    type: "boss" as const,
    title: `Boss ${index + 1}`,
    bossId,
    recommendedPower: recommended.min + nodeStep * index,
    rewardPreview: getRewardPreviewForChapter(chapterId).slice(0, 3),
  } satisfies CampaignChapterNodeDefinition));

  return [
    {
      id: `${chapter.id}-intro`,
      chapterId,
      order: 1,
      type: "intro",
      title: `${getShortTitle(chapter)} intro`,
      recommendedPower: recommended.min,
      rewardPreview: [],
    },
    ...bossNodes,
    {
      id: `${chapter.id}-reward`,
      chapterId,
      order: bossNodes.length + 2,
      type: "reward",
      title: `${getShortTitle(chapter)} clear reward`,
      recommendedPower: recommended.max,
      rewardPreview: getRewardPreviewForChapter(chapterId),
    },
  ];
}

export function getCampaignChapterContract(chapterId: CampaignChapterId): CampaignChapterContract {
  const chapter = getCampaignChapterById(chapterId);
  const id = asCampaignChapterId(chapter.id);
  const recommended = CHAPTER_RECOMMENDED_POWER[id];

  return {
    id,
    laneId: CHAPTER_LANE[id],
    title: chapter.name,
    shortTitle: getShortTitle(chapter),
    theme: CHAPTER_THEME[id],
    unlockLevel: chapter.unlockLevel,
    recommendedPowerMin: recommended.min,
    recommendedPowerMax: recommended.max,
    bossIds: chapter.bossIds,
    nodes: createChapterNodes(chapter),
    taskCategories: CHAPTER_TASK_CATEGORIES[id],
    leaderboardLinks: CHAPTER_LEADERBOARDS[id],
    gateRules: getGateRules(chapter),
    rewardPreview: getRewardPreviewForChapter(id),
    backendSubmitEnabled: false,
    localPreviewOnly: true,
  };
}

export function getCampaignChapterContracts(): CampaignChapterContract[] {
  return CAMPAIGN_CHAPTERS.map((chapter) => getCampaignChapterContract(asCampaignChapterId(chapter.id)));
}

function getCampaignChapterStatus(profile: CampaignProfileState, chapter: CampaignChapterDefinition): CampaignChapterStatus {
  if (isCampaignChapterComplete(profile, chapter.id)) return "complete";
  return isCampaignChapterUnlocked(profile, chapter.id) ? "available" : "locked";
}

function getNextBossIdForChapter(profile: CampaignProfileState, chapter: CampaignChapterDefinition): string | undefined {
  return chapter.bossIds.find((bossId) => getCampaignBossState(profile, bossId) === "unlocked") ?? chapter.bossIds[0];
}

function createCampaignChapterCard(profile: CampaignProfileState, chapter: CampaignChapterDefinition): CampaignChapterCard {
  const chapterId = asCampaignChapterId(chapter.id);
  const contract = getCampaignChapterContract(chapterId);
  const progress = getCampaignProgress(profile)[chapter.id] ?? 0;
  const status = getCampaignChapterStatus(profile, chapter);
  const nextBossId = getNextBossIdForChapter(profile, chapter);

  return {
    id: chapterId,
    title: chapter.name,
    shortTitle: contract.shortTitle,
    theme: contract.theme,
    status,
    progressLabel: `${progress}/${chapter.bossIds.length} bosses cleared`,
    unlockLabel: getCampaignUnlockLabel(profile, chapter),
    recommendedPowerLabel: `Recommended Power ${contract.recommendedPowerMin}-${contract.recommendedPowerMax}`,
    bossCount: chapter.bossIds.length,
    clearedBossCount: progress,
    nextBossId,
    taskCategories: contract.taskCategories,
    leaderboardLinks: contract.leaderboardLinks,
    rewardPreview: contract.rewardPreview,
    ctaLabel: status === "locked" ? "LOCKED" : status === "complete" ? "REPLAY" : "CONTINUE",
  };
}

export function createCampaignChapterSnapshot(profile: CampaignProfileState = DEFAULT_CAMPAIGN_PROFILE): CampaignChapterSnapshot {
  const summary = getCampaignProgressSummary(profile);
  const recommendedBoss = getRecommendedCampaignBoss(profile);
  const activeChapterId = asCampaignChapterId(profile.selectedCampaignId ?? summary.currentChapterId);
  const cards = CAMPAIGN_CHAPTERS.map((chapter) => createCampaignChapterCard(profile, chapter));
  const recommendedCard = cards.find((card) => card.nextBossId === recommendedBoss.id);

  return {
    version: CAMPAIGN_CHAPTER_SYSTEM_VERSION,
    activeChapterId: recommendedCard?.id ?? activeChapterId,
    cards,
    contracts: getCampaignChapterContracts(),
    totalBosses: summary.total,
    clearedBosses: summary.cleared,
    completionPercent: summary.percent,
    backendSubmitEnabled: false,
    localPreviewOnly: true,
    nextPatch: "v0.12.5-reward-tables",
  };
}

export function getCampaignChapterCard(chapterId: CampaignChapterId, profile: CampaignProfileState = DEFAULT_CAMPAIGN_PROFILE): CampaignChapterCard {
  const card = createCampaignChapterSnapshot(profile).cards.find((candidate) => candidate.id === chapterId);
  if (!card) {
    throw new Error(`Unknown campaign chapter card: ${chapterId}`);
  }
  return card;
}
