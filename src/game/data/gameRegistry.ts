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
export { BOSS_MECHANIC_PROFILES, getBossMechanicProfile } from "./bossMechanics";
export type { BossMechanicProfile, BossMechanicProfileId, BossPhaseDefinition, BossSpecialDefinition, BossSpecialEffect } from "./bossMechanics";

export { STAGES, DEFAULT_STAGE_ID, getStageById } from "./stages";
export type { StageDefinition, StageModifier } from "./stages";

export { BASE_FIGHT_REWARDS, LEVELS, calculateFightReward, getLevelForXp } from "./progression";
export type { LevelDefinition, RewardBundle } from "./progression";

export {
  DEFAULT_PLAYER_PROFILE,
  PROFILE_STORAGE_KEY,
  createDefaultProfile,
  loadPlayerProfile,
  normalizeProfile,
  savePlayerProfile,
  selectProfileSkill,
  selectProfileSkin,
  unlockProfileSkill,
  unlockProfileSkin,
} from "./playerProfile";
export type { PlayerProfile } from "./playerProfile";
