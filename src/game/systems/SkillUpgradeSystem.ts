import { DEFAULT_LOADOUT, SKILLS, getSkillById } from "../data/skills";
import type { PlayerProfile } from "../data/playerProfile";
import {
  SKILL_UPGRADE_SYSTEM_DEFINITION,
  SKILL_UPGRADE_SYSTEM_VERSION,
  getSkillUpgradePower,
  getSkillUpgradeState,
  normalizeSkillLevel,
  type SkillUpgradeState,
  type SkillUpgradeSummary,
} from "../types/SkillUpgradeTypes";

export { SKILL_UPGRADE_SYSTEM_DEFINITION, SKILL_UPGRADE_SYSTEM_VERSION };
export type { SkillUpgradeState, SkillUpgradeSummary };

export function normalizeSkillLevelsForProfile(profile: PlayerProfile): Record<string, number> {
  const normalizedLevels: Record<string, number> = {};
  const unlockedSkillIds = new Set(profile.unlockedSkillIds);

  for (const skill of SKILLS) {
    if (!unlockedSkillIds.has(skill.id)) continue;
    normalizedLevels[skill.id] = normalizeSkillLevel(skill, profile.progressionV2.skillLevels[skill.id], true);
  }

  return normalizedLevels;
}

export function getSkillLevelForProfile(profile: PlayerProfile, skillId: string): number {
  const skill = getSkillById(skillId);
  const unlocked = profile.unlockedSkillIds.includes(skill.id);
  return normalizeSkillLevel(skill, profile.progressionV2.skillLevels[skill.id], unlocked);
}

export function getSkillUpgradePowerForProfile(profile: PlayerProfile): number {
  return SKILLS.reduce((total, skill) => {
    const level = getSkillLevelForProfile(profile, skill.id);
    return total + getSkillUpgradePower(skill, level);
  }, 0);
}

export function getSkillUpgradeStateForProfile(profile: PlayerProfile, skillId: string): SkillUpgradeState {
  const skill = getSkillById(skillId);
  const unlocked = profile.unlockedSkillIds.includes(skill.id);
  const level = getSkillLevelForProfile(profile, skill.id);
  return getSkillUpgradeState(skill, level, unlocked, {
    coins: profile.coins,
    skillCards: profile.skillCards,
    leakPoints: profile.leakPoints,
  });
}

export function getActiveLoadoutSkillUpgradeStates(profile: PlayerProfile): SkillUpgradeState[] {
  const loadout = {
    ...DEFAULT_LOADOUT,
    ...profile.selectedSkillIds,
  };

  return [
    loadout.basic,
    loadout.heavy,
    loadout.defense,
    loadout.mobility,
    loadout.skill1,
    loadout.skill2,
    loadout.ultimate,
  ].map((skillId) => getSkillUpgradeStateForProfile(profile, skillId));
}

export function getSkillUpgradeSummary(profile: PlayerProfile): SkillUpgradeSummary {
  const states = SKILLS.map((skill) => getSkillUpgradeStateForProfile(profile, skill.id));
  const unlockedStates = states.filter((state) => state.unlocked);
  const readyStates = unlockedStates.filter((state) => state.status === "ready");
  const maxedStates = unlockedStates.filter((state) => state.status === "maxed");

  return {
    version: SKILL_UPGRADE_SYSTEM_VERSION,
    unlockedCount: unlockedStates.length,
    totalSkillLevels: unlockedStates.reduce((total, state) => total + state.level, 0),
    totalSkillPower: unlockedStates.reduce((total, state) => total + state.powerValue, 0),
    maxedCount: maxedStates.length,
    readyToUpgradeCount: readyStates.length,
    activeLoadout: getActiveLoadoutSkillUpgradeStates(profile),
    topUpgradeCandidates: readyStates
      .sort((a, b) => b.nextPowerValue - a.nextPowerValue || b.level - a.level)
      .slice(0, 3),
  };
}
