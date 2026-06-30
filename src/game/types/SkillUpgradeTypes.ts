import type { SkillDefinition, SkillRarity } from "../data/skills";

export const SKILL_UPGRADE_SYSTEM_VERSION = "0.9.4-skill-upgrade-skeleton";
export const MAX_SKILL_UPGRADE_LEVEL = 10;

export type SkillUpgradeResourceId = "coins" | "skill_cards" | "leak_points";
export type SkillUpgradeStatus = "locked" | "ready" | "needs_resources" | "maxed";
export type SkillUpgradeRole = "basic" | "heavy" | "defense" | "mobility" | "active" | "ultimate";

export interface SkillUpgradeCost {
  coins: number;
  skillCards: number;
  leakPoints: number;
}

export interface SkillUpgradeState {
  skillId: string;
  name: string;
  rarity: SkillRarity;
  role: SkillUpgradeRole;
  level: number;
  maxLevel: number;
  unlocked: boolean;
  status: SkillUpgradeStatus;
  powerValue: number;
  nextPowerValue: number;
  costToNext?: SkillUpgradeCost;
  combatLocked: boolean;
}

export interface SkillUpgradeSummary {
  version: typeof SKILL_UPGRADE_SYSTEM_VERSION;
  unlockedCount: number;
  totalSkillLevels: number;
  totalSkillPower: number;
  maxedCount: number;
  readyToUpgradeCount: number;
  activeLoadout: readonly SkillUpgradeState[];
  topUpgradeCandidates: readonly SkillUpgradeState[];
}

export interface SkillUpgradeSystemDefinition {
  version: typeof SKILL_UPGRADE_SYSTEM_VERSION;
  maxLevel: typeof MAX_SKILL_UPGRADE_LEVEL;
  goal: string;
  rules: readonly string[];
  powerCaps: {
    notes: string;
    combatApplied: boolean;
  };
}

export const SKILL_UPGRADE_SYSTEM_DEFINITION: SkillUpgradeSystemDefinition = {
  version: SKILL_UPGRADE_SYSTEM_VERSION,
  maxLevel: MAX_SKILL_UPGRADE_LEVEL,
  goal: "Prepare long-term skill progression with capped power, upgrade costs and backend-safe future validation before combat scaling is enabled.",
  rules: [
    "Unlocked skills normalize to level 1, but level 1 does not add extra upgrade power.",
    "Skill upgrade power feeds PowerScore only; it does not change live damage, heal amount, range, cooldown or energy cost in this patch.",
    "Upgrade spending is not active yet. Costs are preview-only until the upgrade flow and economy validation patches arrive.",
    "Ranked/tournament submissions must not trust local skill levels until backend validation exists.",
  ],
  powerCaps: {
    notes: "Skill Power remains capped by the global PowerScore formula and should stay horizontal/build-oriented over time.",
    combatApplied: false,
  },
};

const RARITY_POWER_WEIGHT: Record<SkillRarity, number> = {
  starter: 1,
  common: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
};

const RARITY_COST_WEIGHT: Record<SkillRarity, number> = {
  starter: 1,
  common: 1,
  rare: 2,
  epic: 3,
  legendary: 5,
};

const RARITY_LEVEL_CAP: Record<SkillRarity, number> = {
  starter: 5,
  common: 6,
  rare: 8,
  epic: 10,
  legendary: 10,
};

export function getSkillUpgradeRole(skill: SkillDefinition): SkillUpgradeRole {
  if (skill.slot === "basic") return "basic";
  if (skill.slot === "heavy") return "heavy";
  if (skill.slot === "defense") return "defense";
  if (skill.slot === "mobility") return "mobility";
  if (skill.slot === "ultimate") return "ultimate";
  return "active";
}

export function getSkillLevelCap(skill: SkillDefinition): number {
  return Math.min(MAX_SKILL_UPGRADE_LEVEL, RARITY_LEVEL_CAP[skill.rarity] ?? MAX_SKILL_UPGRADE_LEVEL);
}

export function normalizeSkillLevel(skill: SkillDefinition, rawLevel: unknown, unlocked: boolean): number {
  if (!unlocked) return 0;
  const level = Math.max(1, Math.floor(Number(rawLevel) || 1));
  return Math.min(getSkillLevelCap(skill), level);
}

export function getSkillUpgradePower(skill: SkillDefinition, level: number): number {
  const normalizedLevel = Math.min(getSkillLevelCap(skill), Math.max(0, Math.floor(level || 0)));
  if (normalizedLevel <= 1) return 0;
  return (normalizedLevel - 1) * RARITY_POWER_WEIGHT[skill.rarity];
}

export function getSkillUpgradeCost(skill: SkillDefinition, currentLevel: number): SkillUpgradeCost | undefined {
  const level = Math.max(0, Math.floor(currentLevel || 0));
  const maxLevel = getSkillLevelCap(skill);
  if (level <= 0 || level >= maxLevel) return undefined;

  const rarityWeight = RARITY_COST_WEIGHT[skill.rarity];
  const nextLevel = level + 1;

  return {
    coins: 60 * nextLevel * rarityWeight,
    skillCards: Math.max(1, Math.ceil(nextLevel * rarityWeight * 0.65)),
    leakPoints: skill.rarity === "starter" || skill.rarity === "common" ? 0 : 8 * nextLevel * rarityWeight,
  };
}

export function getSkillUpgradeState(skill: SkillDefinition, level: number, unlocked: boolean, wallet?: { coins?: number; skillCards?: number; leakPoints?: number }): SkillUpgradeState {
  const normalizedLevel = normalizeSkillLevel(skill, level, unlocked);
  const maxLevel = getSkillLevelCap(skill);
  const costToNext = getSkillUpgradeCost(skill, normalizedLevel);
  const hasResources = !costToNext || (
    (wallet?.coins ?? 0) >= costToNext.coins &&
    (wallet?.skillCards ?? 0) >= costToNext.skillCards &&
    (wallet?.leakPoints ?? 0) >= costToNext.leakPoints
  );

  return {
    skillId: skill.id,
    name: skill.name,
    rarity: skill.rarity,
    role: getSkillUpgradeRole(skill),
    level: normalizedLevel,
    maxLevel,
    unlocked,
    status: !unlocked ? "locked" : normalizedLevel >= maxLevel ? "maxed" : hasResources ? "ready" : "needs_resources",
    powerValue: getSkillUpgradePower(skill, normalizedLevel),
    nextPowerValue: costToNext ? getSkillUpgradePower(skill, normalizedLevel + 1) : getSkillUpgradePower(skill, normalizedLevel),
    costToNext,
    combatLocked: true,
  };
}
