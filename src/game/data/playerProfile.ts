import { DEFAULT_HERO_ID } from "./heroes";
import { DEFAULT_LOADOUT, SKILLS, STARTER_SKILL_IDS, getSkillById, type ActiveSkillSlot } from "./skills";
import { DEFAULT_SKIN_ID, SKINS, STARTER_SKIN_IDS } from "./skins";
import { DEFAULT_STAGE_ID, STARTER_STAGE_IDS, STAGES, getStageById } from "./stages";
import {
  DEFAULT_CAMPAIGN_BOSS_ID,
  DEFAULT_CAMPAIGN_ID,
  getCampaignBattleRounds,
  getCampaignChapterForBoss,
  getCampaignProgress,
  getRecommendedCampaignBoss,
  isCampaignBossUnlocked,
} from "./campaigns";
import {
  DAILY_MISSIONS,
  formatMissionReward,
  getDailyMissionDateKey,
  getDailyMissionIncrement,
  type DailyMissionDefinition,
  type DailyMissionFightStats,
  type DailyMissionState,
  type MissionRewardBundle,
} from "./missions";
import {
  DEFAULT_REWARD_CHOICES,
  LEVELS,
  calculateFightReward,
  getLevelForXp,
  type RewardBundle,
  type RewardChoiceDefinition,
} from "./progression";
import {
  PROFILE_BACKUP_STORAGE_KEY,
  createSaveExport,
  getLocalSaveStatus,
  parseSaveImport,
  readProfileBackup,
  writeProfileBackup,
  type SaveParseResult,
  type SaveStatus,
} from "./saveSystem";

export interface PlayerProfile {
  version: number;
  heroId: string;
  selectedSkinId: string;
  unlockedSkinIds: string[];
  selectedSkillIds: typeof DEFAULT_LOADOUT;
  unlockedSkillIds: string[];
  selectedStageId: string;
  unlockedStageIds: string[];
  selectedCampaignId: string;
  selectedBossId: string;
  coins: number;
  xp: number;
  level: number;
  leakPoints: number;
  skinShards: number;
  skillCards: number;
  campaignProgress: Record<string, number>;
  bossProgress: Record<string, boolean>;
  dailyMissionDate: string;
  dailyMissionProgress: Record<string, number>;
  claimedDailyMissionIds: string[];
  totalMissionClaims: number;
  bestScore: number;
  totalWins: number;
  totalLosses: number;
  settings: {
    soundEnabled: boolean;
    vibrationEnabled: boolean;
  };
}

export interface FightRewardInput {
  victory: boolean;
  score: number;
  bossesBroken: number;
  leaksDefeated: number;
  survivedSeconds: number;
  defeatedBossIds?: string[];
  blocks?: number;
  dodges?: number;
  skillsUsed?: number;
  ultimatesUsed?: number;
  damageTaken?: number;
  usedUltimate?: boolean;
}

export interface FightRewardApplication {
  profile: PlayerProfile;
  baseRewards: RewardBundle;
  oldLevel: number;
  newLevel: number;
  levelCoinReward: number;
  unlocks: string[];
  completedMissionIds: string[];
}

export interface RewardChoiceApplication {
  profile: PlayerProfile;
  choice: RewardChoiceDefinition;
  oldLevel: number;
  newLevel: number;
  levelCoinReward: number;
  unlocks: string[];
}

export interface MissionClaimApplication {
  profile: PlayerProfile;
  missionId: string;
  reward: MissionRewardBundle;
  rewardLabel: string;
  oldLevel: number;
  newLevel: number;
  levelCoinReward: number;
  unlocks: string[];
  claimed: boolean;
}

export const PROFILE_STORAGE_KEY = "broke_leak_fighter_profile_v1";

export const DEFAULT_PLAYER_PROFILE: PlayerProfile = {
  version: 1,
  heroId: DEFAULT_HERO_ID,
  selectedSkinId: DEFAULT_SKIN_ID,
  unlockedSkinIds: STARTER_SKIN_IDS,
  selectedSkillIds: DEFAULT_LOADOUT,
  unlockedSkillIds: STARTER_SKILL_IDS,
  selectedStageId: DEFAULT_STAGE_ID,
  unlockedStageIds: STARTER_STAGE_IDS,
  selectedCampaignId: DEFAULT_CAMPAIGN_ID,
  selectedBossId: DEFAULT_CAMPAIGN_BOSS_ID,
  coins: 0,
  xp: 0,
  level: 1,
  leakPoints: 0,
  skinShards: 0,
  skillCards: 0,
  campaignProgress: { daily_leaks: 0 },
  bossProgress: {},
  dailyMissionDate: getDailyMissionDateKey(),
  dailyMissionProgress: {},
  claimedDailyMissionIds: [],
  totalMissionClaims: 0,
  bestScore: 0,
  totalWins: 0,
  totalLosses: 0,
  settings: {
    soundEnabled: true,
    vibrationEnabled: true,
  },
};

export function createDefaultProfile(): PlayerProfile {
  return structuredClone(DEFAULT_PLAYER_PROFILE);
}

export function normalizeProfile(profile: Partial<PlayerProfile> | null | undefined): PlayerProfile {
  const normalized = {
    ...createDefaultProfile(),
    ...(profile ?? {}),
    settings: {
      ...DEFAULT_PLAYER_PROFILE.settings,
      ...(profile?.settings ?? {}),
    },
    campaignProgress: {
      ...DEFAULT_PLAYER_PROFILE.campaignProgress,
      ...(profile?.campaignProgress ?? {}),
    },
    bossProgress: {
      ...DEFAULT_PLAYER_PROFILE.bossProgress,
      ...(profile?.bossProgress ?? {}),
    },
    dailyMissionProgress: {
      ...(profile?.dailyMissionProgress ?? {}),
    },
    claimedDailyMissionIds: Array.isArray(profile?.claimedDailyMissionIds) ? profile.claimedDailyMissionIds : [],
  };

  normalized.xp = Math.max(0, Math.floor(normalized.xp || 0));
  normalized.coins = Math.max(0, Math.floor(normalized.coins || 0));
  normalized.leakPoints = Math.max(0, Math.floor(normalized.leakPoints || 0));
  normalized.skinShards = Math.max(0, Math.floor(normalized.skinShards || 0));
  normalized.skillCards = Math.max(0, Math.floor(normalized.skillCards || 0));
  normalized.level = getLevelForXp(normalized.xp).level;

  const todayKey = getDailyMissionDateKey();
  if (normalized.dailyMissionDate !== todayKey) {
    normalized.dailyMissionDate = todayKey;
    normalized.dailyMissionProgress = {};
    normalized.claimedDailyMissionIds = [];
  }
  normalized.totalMissionClaims = Math.max(0, Math.floor(normalized.totalMissionClaims || 0));
  for (const mission of DAILY_MISSIONS) {
    normalized.dailyMissionProgress[mission.id] = PhaserSafeClampProgress(normalized.dailyMissionProgress[mission.id] ?? 0, mission.target);
  }

  const unlockedSkinIds = Array.from(new Set([...STARTER_SKIN_IDS, ...(profile?.unlockedSkinIds ?? [])]));
  normalized.unlockedSkinIds = unlockedSkinIds;
  if (!unlockedSkinIds.includes(normalized.selectedSkinId)) {
    normalized.selectedSkinId = DEFAULT_SKIN_ID;
  }

  const levelUnlockedSkillIds = SKILLS.filter((skill) => skill.unlockLevel <= normalized.level).map((skill) => skill.id);
  const unlockedSkillIds = Array.from(new Set([...STARTER_SKILL_IDS, ...levelUnlockedSkillIds, ...(profile?.unlockedSkillIds ?? [])]));
  normalized.unlockedSkillIds = unlockedSkillIds;
  normalized.selectedSkillIds = {
    ...DEFAULT_LOADOUT,
    ...(profile?.selectedSkillIds ?? {}),
  };

  if (!unlockedSkillIds.includes(normalized.selectedSkillIds.skill1)) {
    normalized.selectedSkillIds.skill1 = DEFAULT_LOADOUT.skill1;
  }
  if (!unlockedSkillIds.includes(normalized.selectedSkillIds.skill2)) {
    normalized.selectedSkillIds.skill2 = DEFAULT_LOADOUT.skill2;
  }
  if (!unlockedSkillIds.includes(normalized.selectedSkillIds.ultimate)) {
    normalized.selectedSkillIds.ultimate = DEFAULT_LOADOUT.ultimate;
  }

  const profileStageIds = profile?.unlockedStageIds ?? [];
  const levelUnlockedStageIds = STAGES.filter((stage) => stage.unlockLevel <= normalized.level).map((stage) => stage.id);
  normalized.unlockedStageIds = Array.from(new Set([DEFAULT_STAGE_ID, ...STARTER_STAGE_IDS, ...levelUnlockedStageIds, ...profileStageIds]));
  const selectedStage = getStageById(normalized.selectedStageId);
  if (!normalized.unlockedStageIds.includes(selectedStage.id) && normalized.level < selectedStage.unlockLevel) {
    normalized.selectedStageId = DEFAULT_STAGE_ID;
  }

  normalized.campaignProgress = {
    ...normalized.campaignProgress,
    ...getCampaignProgress(normalized),
  };

  if (!isCampaignBossUnlocked(normalized, normalized.selectedBossId)) {
    const recommendedBoss = getRecommendedCampaignBoss(normalized);
    normalized.selectedBossId = recommendedBoss.id;
    normalized.selectedCampaignId = getCampaignChapterForBoss(recommendedBoss.id).id;
  } else {
    normalized.selectedCampaignId = getCampaignChapterForBoss(normalized.selectedBossId).id;
  }

  return normalized;
}


function PhaserSafeClampProgress(value: number, target: number): number {
  return Math.max(0, Math.min(target, Math.floor(value || 0)));
}

function buildMissionStatsFromFight(input: FightRewardInput): DailyMissionFightStats {
  return {
    victory: input.victory,
    score: input.score,
    leaksDefeated: input.leaksDefeated,
    survivedSeconds: input.survivedSeconds,
    bossesBroken: input.bossesBroken,
    blocks: Math.max(0, Math.floor(input.blocks ?? 0)),
    dodges: Math.max(0, Math.floor(input.dodges ?? 0)),
    skillsUsed: Math.max(0, Math.floor(input.skillsUsed ?? 0)),
    ultimatesUsed: Math.max(0, Math.floor(input.ultimatesUsed ?? 0)),
    damageTaken: Math.max(0, Math.floor(input.damageTaken ?? 0)),
    usedUltimate: Boolean(input.usedUltimate || (input.ultimatesUsed ?? 0) > 0),
  };
}

function applyDailyMissionFightProgress(profile: PlayerProfile, stats: DailyMissionFightStats): { profile: PlayerProfile; completedMissionIds: string[] } {
  const normalized = normalizeProfile(profile);
  const completedMissionIds: string[] = [];

  for (const mission of DAILY_MISSIONS) {
    const before = PhaserSafeClampProgress(normalized.dailyMissionProgress[mission.id] ?? 0, mission.target);
    const increment = getDailyMissionIncrement(mission, stats);
    const after = PhaserSafeClampProgress(before + increment, mission.target);
    normalized.dailyMissionProgress[mission.id] = after;
    if (before < mission.target && after >= mission.target) completedMissionIds.push(mission.id);
  }

  return { profile: normalizeProfile(normalized), completedMissionIds };
}

function syncLevelUnlocks(profile: PlayerProfile, oldLevel: number): { profile: PlayerProfile; unlocks: string[]; levelCoinReward: number; oldLevel: number; newLevel: number } {
  const normalized = normalizeProfile(profile);
  const newLevel = getLevelForXp(normalized.xp).level;
  const unlocks: string[] = [];
  let levelCoinReward = 0;

  for (const level of LEVELS) {
    if (level.level <= oldLevel || level.level > newLevel) continue;
    if (level.coinReward > 0) {
      normalized.coins += level.coinReward;
      levelCoinReward += level.coinReward;
    }

    for (const unlockId of level.unlocks) {
      if (SKILLS.some((skill) => skill.id === unlockId) && !normalized.unlockedSkillIds.includes(unlockId)) {
        normalized.unlockedSkillIds = [...normalized.unlockedSkillIds, unlockId];
        unlocks.push(unlockId);
      }
      if (STAGES.some((stage) => stage.id === unlockId) && !normalized.unlockedStageIds.includes(unlockId)) {
        normalized.unlockedStageIds = [...normalized.unlockedStageIds, unlockId];
        unlocks.push(unlockId);
      }
      if (SKINS.some((skin) => skin.id === unlockId) && !normalized.unlockedSkinIds.includes(unlockId)) {
        normalized.unlockedSkinIds = [...normalized.unlockedSkinIds, unlockId];
        unlocks.push(unlockId);
      }
    }
  }

  normalized.level = newLevel;
  return { profile: normalizeProfile(normalized), unlocks, levelCoinReward, oldLevel, newLevel };
}

export function selectProfileSkin(profile: PlayerProfile, skinId: string): PlayerProfile {
  const normalized = normalizeProfile(profile);
  if (!normalized.unlockedSkinIds.includes(skinId)) return normalized;
  normalized.selectedSkinId = skinId;
  return normalized;
}

export function unlockProfileSkin(profile: PlayerProfile, skinId: string): PlayerProfile {
  const normalized = normalizeProfile(profile);
  if (!normalized.unlockedSkinIds.includes(skinId)) {
    normalized.unlockedSkinIds = [...normalized.unlockedSkinIds, skinId];
  }
  normalized.selectedSkinId = skinId;
  return normalized;
}

export function selectProfileSkill(profile: PlayerProfile, slot: ActiveSkillSlot, skillId: string): PlayerProfile {
  const normalized = normalizeProfile(profile);
  const skill = getSkillById(skillId);
  if (!normalized.unlockedSkillIds.includes(skill.id)) return normalized;
  if (slot === "skill1" && skill.slot !== "skill_1") return normalized;
  if (slot === "skill2" && skill.slot !== "skill_2") return normalized;
  if (slot === "ultimate" && skill.slot !== "ultimate") return normalized;
  normalized.selectedSkillIds = { ...normalized.selectedSkillIds, [slot]: skill.id };
  return normalized;
}

export function unlockProfileSkill(profile: PlayerProfile, skillId: string): PlayerProfile {
  const normalized = normalizeProfile(profile);
  if (!normalized.unlockedSkillIds.includes(skillId)) {
    normalized.unlockedSkillIds = [...normalized.unlockedSkillIds, skillId];
  }
  return normalized;
}

export function selectProfileStage(profile: PlayerProfile, stageId: string): PlayerProfile {
  const normalized = normalizeProfile(profile);
  const stage = getStageById(stageId);
  if (!normalized.unlockedStageIds.includes(stage.id) && normalized.level < stage.unlockLevel) return normalized;
  normalized.selectedStageId = stage.id;
  return normalized;
}

export function unlockProfileStage(profile: PlayerProfile, stageId: string): PlayerProfile {
  const normalized = normalizeProfile(profile);
  const stage = getStageById(stageId);
  if (!normalized.unlockedStageIds.includes(stage.id)) {
    normalized.unlockedStageIds = [...normalized.unlockedStageIds, stage.id];
  }
  return normalized;
}

export function selectProfileCampaignBoss(profile: PlayerProfile, bossId: string): PlayerProfile {
  const normalized = normalizeProfile(profile);
  if (!isCampaignBossUnlocked(normalized, bossId)) return normalized;
  const boss = getCampaignBattleRounds({ ...normalized, selectedBossId: bossId })[0];
  const chapter = getCampaignChapterForBoss(boss.id);
  normalized.selectedCampaignId = chapter.id;
  normalized.selectedBossId = boss.id;

  const bossStage = getStageById(boss.stageId);
  if (normalized.unlockedStageIds.includes(bossStage.id) || normalized.level >= bossStage.unlockLevel) {
    normalized.selectedStageId = bossStage.id;
  }

  return normalizeProfile(normalized);
}

export function applyFightResultToProfile(profile: PlayerProfile, input: FightRewardInput): FightRewardApplication {
  const normalized = normalizeProfile(profile);
  const oldLevel = normalized.level;
  const baseRewards = calculateFightReward(input.victory, input.bossesBroken, input.leaksDefeated, input.score);

  normalized.xp += baseRewards.xp;
  normalized.coins += baseRewards.coins;
  normalized.leakPoints += baseRewards.leakPoints;
  normalized.skinShards += baseRewards.skinShards;
  normalized.skillCards += baseRewards.skillCards;
  normalized.bestScore = Math.max(normalized.bestScore, input.score);
  normalized.totalWins += input.victory ? 1 : 0;
  normalized.totalLosses += input.victory ? 0 : 1;
  const defeatedBossIds = Array.from(new Set(input.defeatedBossIds ?? []));
  for (const bossId of defeatedBossIds) {
    normalized.bossProgress[bossId] = true;
  }

  // Backward-compatible fallback for older result payloads.
  if (!defeatedBossIds.length) {
    if (input.leaksDefeated >= 1) normalized.bossProgress.impulse_buy_beast = true;
    if (input.leaksDefeated >= 2) normalized.bossProgress.emotional_trading_beast = true;
    if (input.leaksDefeated >= 3) normalized.bossProgress.rug_pull_beast = true;
    if (input.victory || input.bossesBroken > 0) normalized.bossProgress.wallet_destroyer_boss = true;
  }

  normalized.campaignProgress = {
    ...normalized.campaignProgress,
    ...getCampaignProgress(normalized),
  };

  const nextBoss = getRecommendedCampaignBoss(normalized);
  normalized.selectedBossId = nextBoss.id;
  normalized.selectedCampaignId = getCampaignChapterForBoss(nextBoss.id).id;

  const missionApplication = applyDailyMissionFightProgress(normalized, buildMissionStatsFromFight(input));
  const synced = syncLevelUnlocks(missionApplication.profile, oldLevel);
  return { ...synced, baseRewards, completedMissionIds: missionApplication.completedMissionIds };
}

export function getPostFightRewardChoices(profile: PlayerProfile): RewardChoiceDefinition[] {
  const normalized = normalizeProfile(profile);
  const choices = [...DEFAULT_REWARD_CHOICES];
  const lockedSkill = SKILLS.find((skill) => skill.unlockLevel <= normalized.level && !normalized.unlockedSkillIds.includes(skill.id) && (skill.slot === "skill_1" || skill.slot === "skill_2" || skill.slot === "ultimate"));
  if (lockedSkill) {
    choices[2] = {
      id: `unlock_skill_${lockedSkill.id}`,
      name: `Unlock ${lockedSkill.name}`,
      kind: "skill_unlock",
      rarity: lockedSkill.rarity === "legendary" ? "legendary" : lockedSkill.rarity === "epic" ? "epic" : "rare",
      amount: 1,
      unlockId: lockedSkill.id,
      color: lockedSkill.color,
      uiColor: lockedSkill.uiColor,
      description: `Add ${lockedSkill.name} to your skill pool.`,
    };
    return choices;
  }

  const lockedStage = STAGES.find((stage) => stage.unlockLevel <= normalized.level && !normalized.unlockedStageIds.includes(stage.id));
  if (lockedStage) {
    choices[2] = {
      id: `unlock_stage_${lockedStage.id}`,
      name: `Unlock ${lockedStage.name}`,
      kind: "stage_unlock",
      rarity: lockedStage.rarity === "boss" ? "legendary" : lockedStage.rarity === "epic" ? "epic" : "rare",
      amount: 1,
      unlockId: lockedStage.id,
      color: lockedStage.color,
      uiColor: lockedStage.uiColor,
      description: `Open ${lockedStage.name} for future fights.`,
    };
  }

  return choices;
}

export function applyRewardChoiceToProfile(profile: PlayerProfile, choice: RewardChoiceDefinition): RewardChoiceApplication {
  const normalized = normalizeProfile(profile);
  const oldLevel = normalized.level;
  const unlocks: string[] = [];

  if (choice.kind === "coins") normalized.coins += choice.amount;
  if (choice.kind === "xp") normalized.xp += choice.amount;
  if (choice.kind === "leak_points") normalized.leakPoints += choice.amount;
  if (choice.kind === "skill_unlock" && choice.unlockId && !normalized.unlockedSkillIds.includes(choice.unlockId)) {
    normalized.unlockedSkillIds = [...normalized.unlockedSkillIds, choice.unlockId];
    normalized.skillCards += 1;
    unlocks.push(choice.unlockId);
  }
  if (choice.kind === "stage_unlock" && choice.unlockId && !normalized.unlockedStageIds.includes(choice.unlockId)) {
    normalized.unlockedStageIds = [...normalized.unlockedStageIds, choice.unlockId];
    unlocks.push(choice.unlockId);
  }
  if (choice.kind === "skin_unlock" && choice.unlockId && !normalized.unlockedSkinIds.includes(choice.unlockId)) {
    normalized.unlockedSkinIds = [...normalized.unlockedSkinIds, choice.unlockId];
    unlocks.push(choice.unlockId);
  }

  const synced = syncLevelUnlocks(normalized, oldLevel);
  return {
    profile: synced.profile,
    choice,
    oldLevel,
    newLevel: synced.newLevel,
    levelCoinReward: synced.levelCoinReward,
    unlocks: [...unlocks, ...synced.unlocks],
  };
}


export function getDailyMissionStates(profile: PlayerProfile): DailyMissionState[] {
  const normalized = normalizeProfile(profile);
  return DAILY_MISSIONS.map((definition) => {
    const progress = PhaserSafeClampProgress(normalized.dailyMissionProgress[definition.id] ?? 0, definition.target);
    return {
      definition,
      progress,
      target: definition.target,
      completed: progress >= definition.target,
      claimed: normalized.claimedDailyMissionIds.includes(definition.id),
    };
  });
}

export function claimDailyMissionReward(profile: PlayerProfile, missionId: string): MissionClaimApplication {
  const normalized = normalizeProfile(profile);
  const mission = DAILY_MISSIONS.find((item) => item.id === missionId);
  const oldLevel = normalized.level;

  if (!mission) {
    return { profile: normalized, missionId, reward: { xp: 0, coins: 0, leakPoints: 0 }, rewardLabel: "MISSION NOT FOUND", oldLevel, newLevel: oldLevel, levelCoinReward: 0, unlocks: [], claimed: false };
  }

  const progress = PhaserSafeClampProgress(normalized.dailyMissionProgress[mission.id] ?? 0, mission.target);
  if (progress < mission.target || normalized.claimedDailyMissionIds.includes(mission.id)) {
    return { profile: normalized, missionId, reward: mission.reward, rewardLabel: formatMissionReward(mission.reward), oldLevel, newLevel: oldLevel, levelCoinReward: 0, unlocks: [], claimed: false };
  }

  normalized.xp += mission.reward.xp;
  normalized.coins += mission.reward.coins;
  normalized.leakPoints += mission.reward.leakPoints;
  normalized.skillCards += mission.reward.skillCards ?? 0;
  normalized.skinShards += mission.reward.skinShards ?? 0;
  normalized.claimedDailyMissionIds = [...normalized.claimedDailyMissionIds, mission.id];
  normalized.totalMissionClaims += 1;

  const synced = syncLevelUnlocks(normalized, oldLevel);
  return {
    profile: synced.profile,
    missionId,
    reward: mission.reward,
    rewardLabel: formatMissionReward(mission.reward),
    oldLevel,
    newLevel: synced.newLevel,
    levelCoinReward: synced.levelCoinReward,
    unlocks: synced.unlocks,
    claimed: true,
  };
}

export { DAILY_MISSIONS, formatMissionReward };
export type { DailyMissionState, DailyMissionDefinition, DailyMissionFightStats, MissionRewardBundle };

export function loadPlayerProfile(): PlayerProfile {
  if (typeof window === "undefined") return createDefaultProfile();
  const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
  if (!raw) return createDefaultProfile();

  const parsed = parseSaveImport(raw);
  if (parsed.ok) return normalizeProfile(parsed.profile);

  const backupRaw = readProfileBackup();
  if (backupRaw) {
    const backupParsed = parseSaveImport(backupRaw);
    if (backupParsed.ok) return normalizeProfile(backupParsed.profile);
  }

  return createDefaultProfile();
}

export function savePlayerProfile(profile: PlayerProfile): void {
  if (typeof window === "undefined") return;
  writeProfileBackup(PROFILE_STORAGE_KEY);
  window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(normalizeProfile(profile)));
}

export function exportPlayerSave(profile = loadPlayerProfile()): string {
  return createSaveExport(normalizeProfile(profile));
}

export function importPlayerSave(raw: string): SaveParseResult {
  const parsed = parseSaveImport(raw);
  if (!parsed.ok || !parsed.profile) return parsed;
  savePlayerProfile(normalizeProfile(parsed.profile));
  return parsed;
}

export function restoreBackupProfile(): boolean {
  const backupRaw = readProfileBackup();
  if (!backupRaw) return false;
  const parsed = parseSaveImport(backupRaw);
  if (!parsed.ok || !parsed.profile) return false;
  savePlayerProfile(normalizeProfile(parsed.profile));
  return true;
}

export function getSaveStatus(): SaveStatus {
  return getLocalSaveStatus(PROFILE_STORAGE_KEY);
}

export { PROFILE_BACKUP_STORAGE_KEY };
