import { ARENA_BOSSES, WEEKLY_BOSSES, type ArenaBossBehavior, type ArenaBossDefinition } from "../data/bosses";
import { getBossMechanicProfile, type BossMechanicProfile } from "../data/bossMechanics";
import type { CampaignChapterId } from "../types/CampaignChapterTypes";
import type { LeaderboardId } from "../types/LeaderboardTypes";
import type { TaskCategory } from "../types/TaskTypes";
import type {
  BossDifficultyBand,
  BossDifficultyScore,
  BossRegistryChapterGroup,
  BossRegistryEntry,
  BossRegistryEntryId,
  BossRegistryRewardPreview,
  BossRegistrySnapshot,
  BossRegistrySummary,
  BossRegistrySystemDefinition,
  BossThreatTag,
} from "../types/BossRegistryTypes";

export const BOSS_REGISTRY_SYSTEM_VERSION = "0.12.0-boss-registry-v2";

export const BOSS_REGISTRY_SYSTEM_DEFINITION: BossRegistrySystemDefinition = {
  version: BOSS_REGISTRY_SYSTEM_VERSION,
  goal: "Normalize campaign bosses and weekly community bosses into one backend-ready registry with difficultyScore, recommendedPower, threat tags, leaderboard links and reward previews before Chapter 1 map polish.",
  backendSubmitEnabled: false,
  localPreviewOnly: true,
  rules: [
    "Boss Registry v2 may calculate difficulty and recommended power, but it must not change current boss HP, damage, AI or rewards.",
    "Campaign boss clears remain local preview until run validation, anti-cheat and cloud save exist.",
    "Weekly/community boss rewards and Boss Damage leaderboard are backend-locked.",
    "Boss difficulty is guidance for UI and balancing only in this patch.",
  ],
  requiredBeforeLiveBossRewards: [
    "Recommended Power UI on campaign boss cards",
    "Boss reward tables and upgrade cost balance",
    "Run validation payload for arena, campaign and boss damage",
    "Anti-cheat checks for impossible boss damage, duration, HP and score",
    "Backend profile/cloud save adapter",
    "Remote leaderboard submit for boss_damage",
  ],
};

const CHAPTER_TITLES: Record<CampaignChapterId | "weekly_community", string> = {
  daily_leaks: "Chapter 1 — Daily Leaks",
  risk_leaks: "Chapter 2 — Risk Leaks",
  lifestyle_leaks: "Chapter 3 — Lifestyle Leaks",
  final_wallet_war: "Chapter 4 — Final Wallet War",
  weekly_community: "Weekly Community Bosses",
};

const CHAPTER_LEADERBOARDS: Record<CampaignChapterId, readonly LeaderboardId[]> = {
  daily_leaks: ["weekly_arena", "task_points"],
  risk_leaks: ["weekly_arena", "boss_damage"],
  lifestyle_leaks: ["weekly_arena", "boss_damage"],
  final_wallet_war: ["boss_damage", "global_power"],
};

const CHAPTER_TASK_CATEGORIES: Record<CampaignChapterId, readonly TaskCategory[]> = {
  daily_leaks: ["combat", "skill"],
  risk_leaks: ["combat", "anti_leak"],
  lifestyle_leaks: ["boss", "anti_leak"],
  final_wallet_war: ["boss", "tournament"],
};

function getDifficultyBand(total: number, communityScale = 0): BossDifficultyBand {
  if (communityScale > 0) return "community";
  if (total < 70) return "tutorial";
  if (total < 105) return "early";
  if (total < 150) return "mid";
  if (total < 210) return "late";
  return "endgame";
}

function clampRecommendedPower(total: number, min = 20, max = 360): number {
  return Math.max(min, Math.min(max, Math.round(total / 5) * 5));
}

function getMechanicPressure(profile: BossMechanicProfile, mechanicCount: number): number {
  const specialPressure = profile.special.effect === "none" ? 0 : 10;
  const phasePressure = profile.phases.length * 12;
  return Math.round(mechanicCount * 4 + specialPressure + phasePressure + profile.guardChance * 20);
}

export function calculateBossDifficultyScore(boss: ArenaBossDefinition): BossDifficultyScore {
  const profile = getBossMechanicProfile(boss.mechanicProfileId);
  const breakdown = {
    hp: Math.round(boss.hp * 0.18),
    damage: boss.damage * 4,
    speed: Math.max(0, Math.round((boss.speed - 70) * 0.22)),
    range: Math.round(boss.attackRange * 0.06),
    mechanics: getMechanicPressure(profile, boss.mechanics.length),
    unlockGate: boss.unlockLevel * 13,
    communityScale: 0,
  };
  const total = Object.values(breakdown).reduce((sum, value) => sum + value, 0);

  return {
    total,
    band: getDifficultyBand(total),
    recommendedPower: clampRecommendedPower(total),
    breakdown,
  };
}

function calculateWeeklyBossDifficultyScore(index: number, hp: number): BossDifficultyScore {
  const communityScale = 130 + index * 34 + Math.round(hp / 4000);
  const breakdown = {
    hp: Math.round(hp / 5000),
    damage: 0,
    speed: 0,
    range: 0,
    mechanics: 45 + index * 8,
    unlockGate: 0,
    communityScale,
  };
  const total = Object.values(breakdown).reduce((sum, value) => sum + value, 0);

  return {
    total,
    band: getDifficultyBand(total, communityScale),
    recommendedPower: clampRecommendedPower(260 + index * 40, 240, 420),
    breakdown,
  };
}

function getThreatTagsForBoss(boss: ArenaBossDefinition, profile: BossMechanicProfile): BossThreatTag[] {
  const tags = new Set<BossThreatTag>();
  const behaviorToTag: Partial<Record<ArenaBossBehavior, BossThreatTag>> = {
    impulse: "fast_jabs",
    emotion: "fomo_burst",
    rug: "guard_break",
    destroyer: "phase_shift",
    subscription: "energy_drain",
    gambling: "fomo_burst",
    shopping: "summon_pressure",
    lifestyle: "hazard_zone",
    food: "heavy_hits",
  };
  const mapped = behaviorToTag[boss.behavior];
  if (mapped) tags.add(mapped);
  if (profile.heavyWeight >= 0.45) tags.add("heavy_hits");
  if (profile.phases.length > 0) tags.add("phase_shift");
  if (profile.special.effect === "energy_drain") tags.add("energy_drain");
  if (profile.special.effect === "guard_break") tags.add("guard_break");
  if (profile.special.effect === "hazard_zone") tags.add("hazard_zone");
  if (profile.special.effect === "summon_pressure") tags.add("summon_pressure");
  if (profile.special.effect === "risk_burst") tags.add("fomo_burst");
  return [...tags];
}

function getCampaignRewardPreview(boss: ArenaBossDefinition): BossRegistryRewardPreview[] {
  return [
    { id: "xp", label: "Mascot XP", amountLabel: `chapter-scaled`, backendLocked: false },
    { id: "coins", label: "Coins", amountLabel: `upgrade budget`, backendLocked: false },
    { id: "leak_points", label: "Leak Points", amountLabel: `anti-leak score`, backendLocked: true },
    { id: "boss_trophy", label: "Boss Trophy", amountLabel: boss.rewardTrophyId ? boss.rewardTrophyId : "future trophy", backendLocked: true },
  ];
}

function getWeeklyRewardPreview(): BossRegistryRewardPreview[] {
  return [
    { id: "leak_points", label: "Leak Points", amountLabel: "weekly contribution", backendLocked: true },
    { id: "rank_points", label: "Rank Points", amountLabel: "Boss Damage rank", backendLocked: true },
    { id: "skill_cards", label: "Skill Cards", amountLabel: "weekly chest", backendLocked: true },
  ];
}

export function createCampaignBossRegistryEntry(boss: ArenaBossDefinition): BossRegistryEntry {
  const chapterId = boss.chapterId as CampaignChapterId;
  const mechanicProfile = getBossMechanicProfile(boss.mechanicProfileId);

  return {
    id: boss.id,
    name: boss.name,
    leakLabel: boss.leakLabel,
    scopes: ["campaign"],
    chapterId,
    stageId: boss.stageId,
    unlockLevel: boss.unlockLevel,
    status: "available",
    mechanicProfileId: boss.mechanicProfileId,
    mechanicRole: mechanicProfile.role,
    specialEffect: mechanicProfile.special.effect,
    difficulty: calculateBossDifficultyScore(boss),
    threatTags: getThreatTagsForBoss(boss, mechanicProfile),
    leaderboardLinks: CHAPTER_LEADERBOARDS[chapterId] ?? ["weekly_arena"],
    taskCategories: CHAPTER_TASK_CATEGORIES[chapterId] ?? ["boss"],
    rewardPreview: getCampaignRewardPreview(boss),
    backendLocked: false,
    localPreviewOnly: true,
  };
}

export function createWeeklyBossRegistryEntry(index: number): BossRegistryEntry {
  const boss = WEEKLY_BOSSES[index] ?? WEEKLY_BOSSES[0];
  return {
    id: boss.id,
    name: boss.name,
    leakLabel: boss.intro,
    scopes: ["weekly", "community"],
    unlockLevel: 1,
    status: "preview",
    mechanicRole: "Community HP race",
    specialEffect: "community_damage",
    difficulty: calculateWeeklyBossDifficultyScore(index, boss.hp),
    threatTags: ["community_hp"],
    leaderboardLinks: ["boss_damage"],
    taskCategories: ["boss"],
    rewardPreview: getWeeklyRewardPreview(),
    backendLocked: true,
    localPreviewOnly: true,
  };
}

export function getBossRegistryEntries(): BossRegistryEntry[] {
  return [...ARENA_BOSSES.map(createCampaignBossRegistryEntry), ...WEEKLY_BOSSES.map((_, index) => createWeeklyBossRegistryEntry(index))];
}

export function getBossRegistryEntry(bossId: BossRegistryEntryId): BossRegistryEntry {
  const entry = getBossRegistryEntries().find((candidate) => candidate.id === bossId);
  if (!entry) {
    throw new Error(`Unknown boss registry entry: ${bossId}`);
  }
  return entry;
}

export function getBossRegistryEntriesForChapter(chapterId: CampaignChapterId): BossRegistryEntry[] {
  return getBossRegistryEntries().filter((entry) => entry.chapterId === chapterId);
}

function createChapterGroup(chapterId: CampaignChapterId | "weekly_community", entries: BossRegistryEntry[]): BossRegistryChapterGroup {
  const recommendedPowers = entries.map((entry) => entry.difficulty.recommendedPower);
  const leaderboardLinks = [...new Set(entries.flatMap((entry) => entry.leaderboardLinks))];

  return {
    chapterId,
    title: CHAPTER_TITLES[chapterId],
    bossIds: entries.map((entry) => entry.id),
    minRecommendedPower: recommendedPowers.length ? Math.min(...recommendedPowers) : 0,
    maxRecommendedPower: recommendedPowers.length ? Math.max(...recommendedPowers) : 0,
    leaderboardLinks,
  };
}

export function getBossRegistryChapterGroups(entries = getBossRegistryEntries()): BossRegistryChapterGroup[] {
  const chapterIds: CampaignChapterId[] = ["daily_leaks", "risk_leaks", "lifestyle_leaks", "final_wallet_war"];
  const chapterGroups = chapterIds.map((chapterId) => createChapterGroup(chapterId, entries.filter((entry) => entry.chapterId === chapterId)));
  const weeklyGroup = createChapterGroup("weekly_community", entries.filter((entry) => entry.scopes.includes("weekly")));
  return [...chapterGroups, weeklyGroup];
}

export function getBossRegistrySummary(entries = getBossRegistryEntries()): BossRegistrySummary {
  const recommendedPowers = entries.map((entry) => entry.difficulty.recommendedPower);
  const difficultyBands = entries.reduce<Record<BossDifficultyBand, number>>(
    (totals, entry) => {
      totals[entry.difficulty.band] += 1;
      return totals;
    },
    { tutorial: 0, early: 0, mid: 0, late: 0, endgame: 0, community: 0 },
  );

  return {
    version: BOSS_REGISTRY_SYSTEM_VERSION,
    totalBossCount: entries.length,
    campaignBossCount: entries.filter((entry) => entry.scopes.includes("campaign")).length,
    weeklyBossCount: entries.filter((entry) => entry.scopes.includes("weekly")).length,
    backendLockedCount: entries.filter((entry) => entry.backendLocked).length,
    localPreviewCount: entries.filter((entry) => entry.localPreviewOnly).length,
    minRecommendedPower: recommendedPowers.length ? Math.min(...recommendedPowers) : 0,
    maxRecommendedPower: recommendedPowers.length ? Math.max(...recommendedPowers) : 0,
    difficultyBands,
    nextPatch: "v0.12.5-reward-tables",
  };
}

export function createBossRegistrySnapshot(): BossRegistrySnapshot {
  const entries = getBossRegistryEntries();
  return {
    version: BOSS_REGISTRY_SYSTEM_VERSION,
    entries,
    chapterGroups: getBossRegistryChapterGroups(entries),
    summary: getBossRegistrySummary(entries),
    backendSubmitEnabled: false,
    localPreviewOnly: true,
    nextPatch: "v0.12.5-reward-tables",
  };
}
