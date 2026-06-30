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
import { calculatePowerScore, type PowerBreakdown } from "../types/ProgressionTypes";
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
import {
  CURRENT_SAVE_SCHEMA_VERSION,
  createDefaultSaveSystemsState,
  type DuelSaveStateV2,
  type LeaderboardSaveStateV2,
  type MultiplayerSaveStateV2,
  type PlayerIdentityV2,
  type ProgressionSaveStateV2,
  type SaveSyncStateV2,
  type SeasonSaveStateV2,
  type TaskSaveStateV2,
  type TournamentSaveStateV2,
} from "../types/SaveSchemaTypes";
import type { CurrencyWalletV2 } from "../types/EconomyTypes";

export interface PlayerProfile {
  version: number;
  schemaVersion: number;
  identity: PlayerIdentityV2;
  wallet: CurrencyWalletV2;
  progressionV2: ProgressionSaveStateV2;
  multiplayer: MultiplayerSaveStateV2;
  tasksV2: TaskSaveStateV2;
  leaderboards: LeaderboardSaveStateV2;
  tournaments: TournamentSaveStateV2;
  duels: DuelSaveStateV2;
  seasons: SeasonSaveStateV2;
  sync: SaveSyncStateV2;
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
  rankPoints: number;
  tournamentPoints: number;
  taskPoints: number;
  cosmeticTokens: number;
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
  processedFightResultIds: string[];
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
  resultId?: string;
}

export interface FightRewardApplication {
  profile: PlayerProfile;
  baseRewards: RewardBundle;
  oldLevel: number;
  newLevel: number;
  levelCoinReward: number;
  unlocks: string[];
  completedMissionIds: string[];
  duplicateResult?: boolean;
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

const DEFAULT_SAVE_SYSTEMS_STATE = createDefaultSaveSystemsState("2026-01-01T00:00:00.000Z");

export const DEFAULT_PLAYER_PROFILE: PlayerProfile = {
  version: CURRENT_SAVE_SCHEMA_VERSION,
  schemaVersion: CURRENT_SAVE_SCHEMA_VERSION,
  identity: DEFAULT_SAVE_SYSTEMS_STATE.identity,
  wallet: DEFAULT_SAVE_SYSTEMS_STATE.wallet,
  progressionV2: DEFAULT_SAVE_SYSTEMS_STATE.progression,
  multiplayer: DEFAULT_SAVE_SYSTEMS_STATE.multiplayer,
  tasksV2: DEFAULT_SAVE_SYSTEMS_STATE.tasks,
  leaderboards: DEFAULT_SAVE_SYSTEMS_STATE.leaderboards,
  tournaments: DEFAULT_SAVE_SYSTEMS_STATE.tournaments,
  duels: DEFAULT_SAVE_SYSTEMS_STATE.duels,
  seasons: DEFAULT_SAVE_SYSTEMS_STATE.seasons,
  sync: DEFAULT_SAVE_SYSTEMS_STATE.sync,
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
  rankPoints: 0,
  tournamentPoints: 0,
  taskPoints: 0,
  cosmeticTokens: 0,
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
  processedFightResultIds: [],
  settings: {
    soundEnabled: true,
    vibrationEnabled: true,
  },
};

export function createDefaultProfile(): PlayerProfile {
  const systems = createDefaultSaveSystemsState();
  return {
    ...structuredClone(DEFAULT_PLAYER_PROFILE),
    version: CURRENT_SAVE_SCHEMA_VERSION,
    schemaVersion: CURRENT_SAVE_SCHEMA_VERSION,
    identity: systems.identity,
    wallet: systems.wallet,
    progressionV2: systems.progression,
    multiplayer: systems.multiplayer,
    tasksV2: systems.tasks,
    leaderboards: systems.leaderboards,
    tournaments: systems.tournaments,
    duels: systems.duels,
    seasons: systems.seasons,
    sync: systems.sync,
  };
}

function safeInteger(value: unknown): number {
  return Math.max(0, Math.floor(Number(value) || 0));
}

function uniqueStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)));
}

function safeNumberRecord(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => key.trim().length > 0)
      .map(([key, amount]) => [key, safeInteger(amount)]),
  );
}

const EVOLUTION_POWER_BY_ID: Record<string, number> = {
  broke_rookie: 0,
  leak_fighter: 8,
  wallet_guard: 16,
  beast_breaker: 24,
  anti_leak_champion: 32,
  broke_legend: 40,
};

function sumRecordValues(value: Record<string, number>): number {
  return Object.values(value).reduce((total, amount) => total + safeInteger(amount), 0);
}

function calculateProfilePowerBreakdown(profile: PlayerProfile): PowerBreakdown {
  const skillLevelPower = sumRecordValues(profile.progressionV2.skillLevels) * 3;
  const masteryBranchPower = sumRecordValues(profile.progressionV2.masteryBranchLevels) * 3;
  const savedEvolutionPower = safeInteger(profile.progressionV2.powerBreakdown.evolution);

  return {
    level: (Math.max(1, profile.level) - 1) * 10 + Math.floor(Math.max(0, profile.xp) / 1000),
    skills: profile.unlockedSkillIds.length * 4 + skillLevelPower,
    evolution: EVOLUTION_POWER_BY_ID[profile.progressionV2.evolutionId] ?? savedEvolutionPower,
    mastery: profile.progressionV2.masteryPoints * 2 + masteryBranchPower,
    charms: profile.progressionV2.equippedCharmIds.length * 8,
  };
}

function syncProfilePower(profile: PlayerProfile): void {
  const power = calculatePowerScore(calculateProfilePowerBreakdown(profile));
  profile.progressionV2 = {
    ...profile.progressionV2,
    powerScore: power.score,
    powerBreakdown: power.cappedBreakdown,
  };
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
    processedFightResultIds: Array.isArray(profile?.processedFightResultIds) ? profile.processedFightResultIds : [],
  };

  const systems = createDefaultSaveSystemsState();
  const incomingIdentity = profile?.identity;
  normalized.version = CURRENT_SAVE_SCHEMA_VERSION;
  normalized.schemaVersion = CURRENT_SAVE_SCHEMA_VERSION;
  normalized.identity = {
    ...systems.identity,
    ...(incomingIdentity ?? {}),
    localPlayerId: incomingIdentity?.localPlayerId || systems.identity.localPlayerId,
    displayName: incomingIdentity?.displayName || systems.identity.displayName,
    createdAtIso: incomingIdentity?.createdAtIso || systems.identity.createdAtIso,
    lastSeenAtIso: new Date().toISOString(),
  };
  normalized.wallet = {
    ...systems.wallet,
    ...(profile?.wallet ?? {}),
  };
  normalized.progressionV2 = {
    ...systems.progression,
    ...(profile?.progressionV2 ?? {}),
    powerBreakdown: {
      ...systems.progression.powerBreakdown,
      ...(profile?.progressionV2?.powerBreakdown ?? {}),
    },
    masteryBranchLevels: safeNumberRecord(profile?.progressionV2?.masteryBranchLevels),
    skillLevels: safeNumberRecord(profile?.progressionV2?.skillLevels),
    equippedCharmIds: uniqueStrings(profile?.progressionV2?.equippedCharmIds),
  };
  normalized.multiplayer = {
    ...systems.multiplayer,
    ...(profile?.multiplayer ?? {}),
  };
  normalized.tasksV2 = {
    ...systems.tasks,
    ...(profile?.tasksV2 ?? {}),
    activeDailyTaskIds: uniqueStrings(profile?.tasksV2?.activeDailyTaskIds),
    activeWeeklyTaskIds: uniqueStrings(profile?.tasksV2?.activeWeeklyTaskIds),
    claimedTaskIds: uniqueStrings(profile?.tasksV2?.claimedTaskIds),
    taskPointsByPeriod: safeNumberRecord(profile?.tasksV2?.taskPointsByPeriod),
  };
  normalized.leaderboards = {
    ...systems.leaderboards,
    ...(profile?.leaderboards ?? {}),
    lastKnownRanks: safeNumberRecord(profile?.leaderboards?.lastKnownRanks),
    bestValues: safeNumberRecord(profile?.leaderboards?.bestValues),
  };
  normalized.tournaments = {
    ...systems.tournaments,
    ...(profile?.tournaments ?? {}),
    participationCount: safeInteger(profile?.tournaments?.participationCount),
    bestTournamentPoints: safeInteger(profile?.tournaments?.bestTournamentPoints),
    completedTournamentIds: uniqueStrings(profile?.tournaments?.completedTournamentIds),
    pendingRunIds: uniqueStrings(profile?.tournaments?.pendingRunIds),
  };
  normalized.duels = {
    ...systems.duels,
    ...(profile?.duels ?? {}),
    activeDuelIds: uniqueStrings(profile?.duels?.activeDuelIds),
    completedDuelIds: uniqueStrings(profile?.duels?.completedDuelIds),
  };
  normalized.seasons = {
    ...systems.seasons,
    ...(profile?.seasons ?? {}),
    claimedRewardIds: uniqueStrings(profile?.seasons?.claimedRewardIds),
    completedMissionIds: uniqueStrings(profile?.seasons?.completedMissionIds),
  };
  normalized.sync = {
    ...systems.sync,
    ...(profile?.sync ?? {}),
    pendingRunResultIds: uniqueStrings(profile?.sync?.pendingRunResultIds),
    pendingEconomyEventIds: uniqueStrings(profile?.sync?.pendingEconomyEventIds),
  };

  normalized.xp = Math.max(0, Math.floor(normalized.xp || 0));
  normalized.coins = Math.max(0, Math.floor(normalized.coins || 0));
  normalized.leakPoints = Math.max(0, Math.floor(normalized.leakPoints || 0));
  normalized.rankPoints = Math.max(0, Math.floor(normalized.rankPoints || normalized.multiplayer.rankPoints || 0));
  normalized.tournamentPoints = Math.max(0, Math.floor(normalized.tournamentPoints || normalized.multiplayer.tournamentPoints || 0));
  normalized.taskPoints = Math.max(0, Math.floor(normalized.taskPoints || normalized.multiplayer.taskPoints || 0));
  normalized.cosmeticTokens = Math.max(0, Math.floor(normalized.cosmeticTokens || normalized.multiplayer.cosmeticTokens || 0));
  normalized.skinShards = Math.max(0, Math.floor(normalized.skinShards || 0));
  normalized.skillCards = Math.max(0, Math.floor(normalized.skillCards || 0));
  normalized.wallet = {
    ...normalized.wallet,
    xp: normalized.xp,
    coins: normalized.coins,
    leak_points: normalized.leakPoints,
    rank_points: normalized.rankPoints,
    tournament_points: normalized.tournamentPoints,
    skill_cards: normalized.skillCards,
    skin_shards: normalized.skinShards,
    cosmetic_tokens: normalized.cosmeticTokens,
  };
  normalized.multiplayer = {
    ...normalized.multiplayer,
    rankPoints: normalized.rankPoints,
    tournamentPoints: normalized.tournamentPoints,
    taskPoints: normalized.taskPoints,
    cosmeticTokens: normalized.cosmeticTokens,
    duelWins: safeInteger(normalized.multiplayer.duelWins),
    duelLosses: safeInteger(normalized.multiplayer.duelLosses),
    weeklyBossDamage: safeInteger(normalized.multiplayer.weeklyBossDamage),
    verifiedRunCount: safeInteger(normalized.multiplayer.verifiedRunCount),
    pendingSubmissionCount: safeInteger(normalized.multiplayer.pendingSubmissionCount),
  };
  normalized.level = getLevelForXp(normalized.xp).level;
  normalized.progressionV2 = {
    ...normalized.progressionV2,
    powerScore: safeInteger(normalized.progressionV2.powerScore),
    powerBreakdown: {
      level: safeInteger(normalized.progressionV2.powerBreakdown.level),
      skills: safeInteger(normalized.progressionV2.powerBreakdown.skills),
      evolution: safeInteger(normalized.progressionV2.powerBreakdown.evolution),
      mastery: safeInteger(normalized.progressionV2.powerBreakdown.mastery),
      charms: safeInteger(normalized.progressionV2.powerBreakdown.charms),
    },
    masteryPoints: safeInteger(normalized.progressionV2.masteryPoints),
  };

  const todayKey = getDailyMissionDateKey();
  if (normalized.dailyMissionDate !== todayKey) {
    normalized.dailyMissionDate = todayKey;
    normalized.dailyMissionProgress = {};
    normalized.claimedDailyMissionIds = [];
  }
  normalized.totalMissionClaims = Math.max(0, Math.floor(normalized.totalMissionClaims || 0));
  normalized.processedFightResultIds = Array.from(new Set(normalized.processedFightResultIds.filter(Boolean))).slice(-30);
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

  syncProfilePower(normalized);

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

function syncCampaignFlowSelection(profile: PlayerProfile): PlayerProfile {
  const normalized = normalizeProfile(profile);
  normalized.campaignProgress = {
    ...normalized.campaignProgress,
    ...getCampaignProgress(normalized),
  };
  const nextBoss = getRecommendedCampaignBoss(normalized);
  normalized.selectedBossId = nextBoss.id;
  normalized.selectedCampaignId = getCampaignChapterForBoss(nextBoss.id).id;
  const nextBossStage = getStageById(nextBoss.stageId);
  if (normalized.unlockedStageIds.includes(nextBossStage.id) || normalized.level >= nextBossStage.unlockLevel) {
    normalized.selectedStageId = nextBossStage.id;
  }
  return normalizeProfile(normalized);
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
  const resultId = input.resultId?.trim();
  if (resultId && normalized.processedFightResultIds.includes(resultId)) {
    return {
      profile: normalized,
      baseRewards: { xp: 0, coins: 0, leakPoints: 0, skinShards: 0, skillCards: 0, bossTrophies: [] },
      oldLevel,
      newLevel: oldLevel,
      levelCoinReward: 0,
      unlocks: [],
      completedMissionIds: [],
      duplicateResult: true,
    };
  }

  const defeatedBossIds = Array.from(new Set(input.defeatedBossIds ?? []));
  const baseRewards = calculateFightReward(input.victory, input.bossesBroken, input.leaksDefeated, input.score, defeatedBossIds);

  if (resultId) {
    normalized.processedFightResultIds = [...normalized.processedFightResultIds, resultId].slice(-30);
  }

  normalized.xp += baseRewards.xp;
  normalized.coins += baseRewards.coins;
  normalized.leakPoints += baseRewards.leakPoints;
  normalized.skinShards += baseRewards.skinShards;
  normalized.skillCards += baseRewards.skillCards;
  normalized.bestScore = Math.max(normalized.bestScore, input.score);
  normalized.totalWins += input.victory ? 1 : 0;
  normalized.totalLosses += input.victory ? 0 : 1;
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

  const missionApplication = applyDailyMissionFightProgress(normalized, buildMissionStatsFromFight(input));
  const synced = syncLevelUnlocks(missionApplication.profile, oldLevel);
  const finalProfile = syncCampaignFlowSelection(synced.profile);
  return { ...synced, profile: finalProfile, baseRewards, completedMissionIds: missionApplication.completedMissionIds };
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
    profile: syncCampaignFlowSelection(synced.profile),
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
    profile: syncCampaignFlowSelection(synced.profile),
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
  if (typeof window === "undefined") return normalizeProfile(createDefaultProfile());
  const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
  if (!raw) return normalizeProfile(createDefaultProfile());

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
