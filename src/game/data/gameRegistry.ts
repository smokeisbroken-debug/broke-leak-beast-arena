export { HEROES, DEFAULT_HERO_ID, getHeroById } from "./heroes";
export type { HeroDefinition, HeroId } from "./heroes";

export {
  SKINS,
  DEFAULT_SKIN_ID,
  STARTER_SKIN_IDS,
  canUnlockSkin,
  formatSkinBonuses,
  getSkinById,
  getSkinRarityColor,
  getSkinStatMultiplier,
  getSkinUnlockLabel,
  isSkinUnlocked,
} from "./skins";
export type { SkinDefinition, SkinProfileState, SkinRarity, SkinStatBonuses, SkinUnlockRule } from "./skins";

export {
  SKILLS,
  DEFAULT_LOADOUT,
  STARTER_SKILL_IDS,
  getActiveSkills,
  getSkillById,
  getSkillRarityColor,
  getSkillsForLoadoutSlot,
  isSkillUnlocked,
} from "./skills";
export type { ActiveSkillSlot, SkillDefinition, SkillEffect, SkillLoadoutIds, SkillRarity, SkillSlot, SkillTarget } from "./skills";

export { ARENA_BOSSES, ARENA_BATTLE_ROUNDS, WEEKLY_BOSSES, getArenaBossById } from "./bosses";
export type { ArenaBossBehavior, ArenaBossDefinition } from "./bosses";

export {
  CAMPAIGN_CHAPTERS,
  DEFAULT_CAMPAIGN_BOSS_ID,
  DEFAULT_CAMPAIGN_ID,
  getCampaignBattleRounds,
  getCampaignBossState,
  getCampaignBossUnlockLabel,
  getCampaignBosses,
  getCampaignChapterById,
  getCampaignChapterForBoss,
  getCampaignProgress,
  getCampaignProgressSummary,
  getCampaignUnlockLabel,
  getNextCampaignBossAfter,
  getRecommendedCampaignBoss,
  getSelectedCampaignBoss,
  isCampaignBossUnlocked,
  isCampaignChapterComplete,
  isCampaignChapterUnlocked,
} from "./campaigns";
export type { CampaignChapterDefinition, CampaignProfileState } from "./campaigns";
export { BOSS_MECHANIC_PROFILES, getBossMechanicProfile } from "./bossMechanics";
export type { BossMechanicProfile, BossMechanicProfileId, BossPhaseDefinition, BossSpecialDefinition, BossSpecialEffect } from "./bossMechanics";

export {
  STAGES,
  DEFAULT_STAGE_ID,
  STARTER_STAGE_IDS,
  getStageById,
  getStageModifierLabel,
  getStageRarityColor,
  getStageUnlockLabel,
  isStageUnlocked,
} from "./stages";
export type { StageDefinition, StageModifier, StageProfileState, StageRarity } from "./stages";

export {
  BASE_FIGHT_REWARDS,
  DEFAULT_REWARD_CHOICES,
  LEVELS,
  calculateFightReward,
  getLevelForXp,
  getNextLevel,
  getRewardChoiceRarityLabel,
  getXpProgress,
} from "./progression";
export type { LevelDefinition, RewardBundle, RewardChoiceDefinition, RewardChoiceKind, RewardChoiceRarity } from "./progression";

export {
  DEFAULT_PLAYER_PROFILE,
  PROFILE_BACKUP_STORAGE_KEY,
  PROFILE_STORAGE_KEY,
  createDefaultProfile,
  exportPlayerSave,
  getSaveStatus,
  importPlayerSave,
  loadPlayerProfile,
  normalizeProfile,
  restoreBackupProfile,
  savePlayerProfile,
  applyFightResultToProfile,
  applyRewardChoiceToProfile,
  claimDailyMissionReward,
  formatMissionReward,
  getDailyMissionStates,
  getPostFightRewardChoices,
  selectProfileSkill,
  selectProfileSkin,
  selectProfileStage,
  selectProfileCampaignBoss,
  unlockProfileSkill,
  unlockProfileSkin,
  unlockProfileStage,
} from "./playerProfile";
export type { DailyMissionDefinition, DailyMissionFightStats, DailyMissionState, FightRewardApplication, FightRewardInput, MissionClaimApplication, MissionRewardBundle, PlayerProfile, RewardChoiceApplication } from "./playerProfile";
export { SAVE_FORMAT, SAVE_FORMAT_VERSION } from "./saveSystem";
export type { ExportedSaveFile, SaveParseResult, SaveStatus } from "./saveSystem";

export { CONTENT_EXPANSION_NOTES, CONTENT_EXPANSION_VERSION, getContentExpansionSummary } from "./contentExpansion";
export type { ContentExpansionSummary } from "./contentExpansion";
