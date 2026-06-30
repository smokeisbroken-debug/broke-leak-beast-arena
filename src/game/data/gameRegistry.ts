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
export { SAVE_FORMAT, SAVE_FORMAT_VERSION, SAVE_MIN_SUPPORTED_FORMAT_VERSION } from "./saveSystem";
export type { ExportedSaveFile, SaveParseResult, SaveStatus } from "./saveSystem";
export { CURRENT_SAVE_SCHEMA_VERSION, SAVE_SCHEMA_DEFINITION_V2, SAVE_SCHEMA_VERSION_LABEL, createDefaultSaveSystemsState } from "../types/SaveSchemaTypes";
export type { DuelSaveStateV2, LeaderboardSaveStateV2, MultiplayerSaveStateV2, PlayerIdentityV2, ProgressionSaveStateV2, SaveSyncStateV2, SaveSystemsStateV2, SeasonSaveStateV2, TaskSaveStateV2, TournamentSaveStateV2 } from "../types/SaveSchemaTypes";

export { CONTENT_EXPANSION_NOTES, CONTENT_EXPANSION_VERSION, getContentExpansionSummary } from "./contentExpansion";
export type { ContentExpansionSummary } from "./contentExpansion";
export {
  PLAYER_PROFILE_V2_DEFINITION,
  PLAYER_PROFILE_V2_SYSTEM_VERSION,
  getCampaignBossesCleared,
  getPlayerProfileV2Summary,
  getProfileCurrencyRows,
  getProfileDisplayName,
} from "../systems/ProfileSystem";
export type {
  PlayerProfileV2Summary,
  PlayerProfileV2SystemDefinition,
  ProfileCurrencyRow,
  ProfileV2BlockDefinition,
  ProfileV2BlockId,
  ProfileV2MultiplayerSummary,
  ProfileV2ProgressSummary,
  ProfileV2UnlockSummary,
} from "../types/PlayerProfileTypes";
export {
  EVOLUTION_SYSTEM_DEFINITION,
  EVOLUTION_SYSTEM_VERSION,
  MASCOT_EVOLUTIONS,
  formatEvolutionRequirement,
  getEvolutionDefinition,
  getEvolutionPower,
  getEvolutionUnlockStatus,
  getMissingEvolutionRequirement,
  getNextEvolution,
  getUnlockedEvolutionForProgress,
  isEvolutionUnlocked,
} from "../types/EvolutionTypes";
export type {
  EvolutionBonus,
  EvolutionBonusId,
  EvolutionId,
  EvolutionProgressInput,
  EvolutionRequirement,
  EvolutionSystemDefinition,
  EvolutionUnlockStatus,
  MascotEvolutionDefinition,
} from "../types/EvolutionTypes";
export { getEvolutionProgressInput, getMascotEvolutionSummary } from "../systems/EvolutionSystem";
export type { MascotEvolutionSummary } from "../systems/EvolutionSystem";
export {
  SKILL_UPGRADE_SYSTEM_DEFINITION,
  SKILL_UPGRADE_SYSTEM_VERSION,
  getActiveLoadoutSkillUpgradeStates,
  getSkillLevelForProfile,
  getSkillUpgradePowerForProfile,
  getSkillUpgradeStateForProfile,
  getSkillUpgradeSummary,
  normalizeSkillLevelsForProfile,
} from "../systems/SkillUpgradeSystem";
export type { SkillUpgradeState, SkillUpgradeSummary } from "../systems/SkillUpgradeSystem";
export {
  MAX_SKILL_UPGRADE_LEVEL,
  getSkillLevelCap,
  getSkillUpgradeCost,
  getSkillUpgradePower,
  getSkillUpgradeRole,
  normalizeSkillLevel,
} from "../types/SkillUpgradeTypes";
export type {
  SkillUpgradeCost,
  SkillUpgradeResourceId,
  SkillUpgradeRole,
  SkillUpgradeStatus,
  SkillUpgradeSystemDefinition,
} from "../types/SkillUpgradeTypes";

export {
  MASTERY_SYSTEM_DEFINITION,
  MASTERY_SYSTEM_VERSION,
  MASTERY_BRANCHES,
  getMasteryBranchDefinition,
  getMasteryBranchPower,
  getMasteryBranchUnlockLabel,
  normalizeMasteryBranchLevel,
} from "../types/MasteryTypes";
export type {
  MasteryBranchBonus,
  MasteryBranchDefinition,
  MasteryBranchId,
  MasteryBranchRole,
  MasteryBranchState,
  MasterySystemDefinition,
  MasteryUnlockStatus,
} from "../types/MasteryTypes";
export {
  getMasteryBranchStatesForProfile,
  getMasteryPowerForProfile,
  getMasterySpentPointsForProfile,
  getMasterySummary,
  normalizeMasteryBranchLevelsForProfile,
} from "../systems/MasterySystem";
export type { MasterySummary } from "../systems/MasterySystem";

export {
  PROGRESSION_UI_SYSTEM_DEFINITION,
  PROGRESSION_UI_SYSTEM_VERSION,
  getProgressionDashboard,
} from "../systems/ProgressionUiSystem";
export type {
  EvolutionUiRow,
  MasteryProgressionUiRow,
  PowerBreakdownUiRow,
  ProgressionDashboardUiModel,
  ProgressionGoalUiRow,
  ProgressionMeterRow,
  ProgressionUiPanelId,
  ProgressionUiRowTone,
  ProgressionUiSystemDefinition,
  SkillProgressionUiRow,
} from "../types/ProgressionUiTypes";
