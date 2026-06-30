import { ARENA_BOSSES, getArenaBossById, type ArenaBossDefinition } from "./bosses";

export interface CampaignProfileState {
  level: number;
  selectedCampaignId?: string;
  selectedBossId?: string;
  bossProgress: Record<string, boolean>;
  campaignProgress: Record<string, number>;
}

export interface CampaignChapterDefinition {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  unlockLevel: number;
  requiredChapterId?: string;
  requiredClears?: number;
  bossIds: string[];
  color: number;
  uiColor: string;
  rewardLabel: string;
}

export const CAMPAIGN_CHAPTERS: CampaignChapterDefinition[] = [
  {
    id: "daily_leaks",
    name: "Chapter 1 — Daily Leaks",
    subtitle: "Break the first bad spending loops.",
    description: "Readable fights against everyday leaks: impulse buys, subscriptions, and food cravings.",
    unlockLevel: 1,
    bossIds: ["impulse_buy_beast", "subscription_leech", "fast_food_ogre"],
    color: 0x72ff57,
    uiColor: "#72ff57",
    rewardLabel: "Starter rewards",
  },
  {
    id: "risk_leaks",
    name: "Chapter 2 — Risk Leaks",
    subtitle: "Control FOMO, gambling, and rug-pull pressure.",
    description: "Faster opponents, burst windows, and heavier punish mechanics.",
    unlockLevel: 3,
    requiredChapterId: "daily_leaks",
    requiredClears: 2,
    bossIds: ["emotional_trading_beast", "gambling_demon", "rug_pull_beast"],
    color: 0xa45cff,
    uiColor: "#d9a7ff",
    rewardLabel: "Skill cards",
  },
  {
    id: "lifestyle_leaks",
    name: "Chapter 3 — Lifestyle Leaks",
    subtitle: "Fight shopping pressure and status spending.",
    description: "Map control, hazard zones, and bosses that punish careless movement.",
    unlockLevel: 5,
    requiredChapterId: "risk_leaks",
    requiredClears: 2,
    bossIds: ["shopping_goblin", "lifestyle_dragon"],
    color: 0x4de8ff,
    uiColor: "#4de8ff",
    rewardLabel: "Skin shards",
  },
  {
    id: "final_wallet_war",
    name: "Chapter 4 — Final Wallet War",
    subtitle: "Defeat the boss that tries to destroy the wallet.",
    description: "Final boss pressure, phase changes, and the strongest punishment windows.",
    unlockLevel: 7,
    requiredChapterId: "lifestyle_leaks",
    requiredClears: 2,
    bossIds: ["wallet_destroyer_boss"],
    color: 0xff4866,
    uiColor: "#ff9aaa",
    rewardLabel: "Boss trophy",
  },
]

export const DEFAULT_CAMPAIGN_ID = "daily_leaks";
export const DEFAULT_CAMPAIGN_BOSS_ID = "impulse_buy_beast";

export function getCampaignChapterById(chapterId: string): CampaignChapterDefinition {
  return CAMPAIGN_CHAPTERS.find((chapter) => chapter.id === chapterId) ?? CAMPAIGN_CHAPTERS[0];
}

export function getCampaignChapterForBoss(bossId: string): CampaignChapterDefinition {
  return CAMPAIGN_CHAPTERS.find((chapter) => chapter.bossIds.includes(bossId)) ?? CAMPAIGN_CHAPTERS[0];
}

export function getCampaignBosses(chapterId: string): ArenaBossDefinition[] {
  const chapter = getCampaignChapterById(chapterId);
  return chapter.bossIds.map(getArenaBossById).filter(Boolean);
}

export function getCampaignProgress(profile: Pick<CampaignProfileState, "bossProgress">): Record<string, number> {
  const progress: Record<string, number> = {};
  for (const chapter of CAMPAIGN_CHAPTERS) {
    progress[chapter.id] = chapter.bossIds.filter((bossId) => profile.bossProgress[bossId]).length;
  }
  return progress;
}

export function isCampaignChapterComplete(profile: Pick<CampaignProfileState, "bossProgress">, chapterId: string): boolean {
  const chapter = getCampaignChapterById(chapterId);
  if (chapter.bossIds.length === 0) return false;
  return chapter.bossIds.every((bossId) => profile.bossProgress[bossId]);
}

export function isCampaignChapterUnlocked(profile: CampaignProfileState, chapterId: string): boolean {
  const chapter = getCampaignChapterById(chapterId);
  if (profile.level < chapter.unlockLevel) return false;
  if (!chapter.requiredChapterId) return true;
  const requiredClears = chapter.requiredClears ?? 1;
  const progress = getCampaignProgress(profile);
  return (progress[chapter.requiredChapterId] ?? 0) >= requiredClears;
}

export function isCampaignBossUnlocked(profile: CampaignProfileState, bossId: string): boolean {
  const boss = getArenaBossById(bossId);
  const chapter = getCampaignChapterForBoss(boss.id);
  if (!isCampaignChapterUnlocked(profile, chapter.id)) return false;
  if (profile.level < boss.unlockLevel) return false;
  const bossIndex = chapter.bossIds.indexOf(boss.id);
  if (bossIndex <= 0) return true;
  const previousBossId = chapter.bossIds[bossIndex - 1];
  return Boolean(profile.bossProgress[previousBossId]);
}

export function getCampaignBossState(profile: CampaignProfileState, bossId: string): "complete" | "unlocked" | "locked" {
  if (profile.bossProgress[bossId]) return "complete";
  return isCampaignBossUnlocked(profile, bossId) ? "unlocked" : "locked";
}

export function getRecommendedCampaignBoss(profile: CampaignProfileState): ArenaBossDefinition {
  for (const chapter of CAMPAIGN_CHAPTERS) {
    if (!isCampaignChapterUnlocked(profile, chapter.id)) continue;
    for (const bossId of chapter.bossIds) {
      if (isCampaignBossUnlocked(profile, bossId) && !profile.bossProgress[bossId]) return getArenaBossById(bossId);
    }
  }

  const replayBossId = [...ARENA_BOSSES].reverse().find((boss) => isCampaignBossUnlocked(profile, boss.id))?.id ?? DEFAULT_CAMPAIGN_BOSS_ID;
  return getArenaBossById(replayBossId);
}

export function getSelectedCampaignBoss(profile: CampaignProfileState): ArenaBossDefinition {
  const selectedBossId = profile.selectedBossId || DEFAULT_CAMPAIGN_BOSS_ID;
  if (isCampaignBossUnlocked(profile, selectedBossId)) return getArenaBossById(selectedBossId);
  return getRecommendedCampaignBoss(profile);
}

export function getCampaignBattleRounds(profile: CampaignProfileState): ArenaBossDefinition[] {
  return [getSelectedCampaignBoss(profile)];
}

export function getCampaignUnlockLabel(profile: CampaignProfileState, chapter: CampaignChapterDefinition): string {
  if (isCampaignChapterUnlocked(profile, chapter.id)) return "Unlocked";
  if (profile.level < chapter.unlockLevel) return `Requires level ${chapter.unlockLevel}`;
  if (chapter.requiredChapterId) {
    const required = chapter.requiredClears ?? 1;
    const progress = getCampaignProgress(profile)[chapter.requiredChapterId] ?? 0;
    return `Clear ${progress}/${required} in ${getCampaignChapterById(chapter.requiredChapterId).name.replace(/^Chapter \d+ — /, "")}`;
  }
  return "Locked";
}


export function getCampaignBossUnlockLabel(profile: CampaignProfileState, bossId: string): string {
  const boss = getArenaBossById(bossId);
  const chapter = getCampaignChapterForBoss(boss.id);
  if (!isCampaignChapterUnlocked(profile, chapter.id)) return getCampaignUnlockLabel(profile, chapter);
  if (profile.level < boss.unlockLevel) return `Requires level ${boss.unlockLevel}`;
  const bossIndex = chapter.bossIds.indexOf(boss.id);
  if (bossIndex > 0) {
    const previousBossId = chapter.bossIds[bossIndex - 1];
    if (!profile.bossProgress[previousBossId]) return `Clear ${getArenaBossById(previousBossId).name}`;
  }
  return profile.bossProgress[boss.id] ? "Cleared · replay available" : "Ready";
}

export function getCampaignProgressSummary(profile: CampaignProfileState): { cleared: number; total: number; percent: number; currentChapterId: string; recommendedBossId: string } {
  const total = CAMPAIGN_CHAPTERS.reduce((sum, chapter) => sum + chapter.bossIds.length, 0);
  const cleared = CAMPAIGN_CHAPTERS.reduce((sum, chapter) => sum + chapter.bossIds.filter((bossId) => profile.bossProgress[bossId]).length, 0);
  const recommended = getRecommendedCampaignBoss(profile);
  return {
    cleared,
    total,
    percent: total > 0 ? cleared / total : 0,
    currentChapterId: getCampaignChapterForBoss(recommended.id).id,
    recommendedBossId: recommended.id,
  };
}

export function getNextCampaignBossAfter(profile: CampaignProfileState, bossId: string): ArenaBossDefinition {
  const previewProfile: CampaignProfileState = {
    ...profile,
    bossProgress: {
      ...profile.bossProgress,
      [bossId]: true,
    },
  };
  return getRecommendedCampaignBoss(previewProfile);
}
