import type { PlayerProfile } from "../data/playerProfile";
import {
  MASTERY_BRANCHES,
  MASTERY_SYSTEM_DEFINITION,
  MASTERY_SYSTEM_VERSION,
  getMasteryBranchPower,
  getMasteryBranchUnlockLabel,
  normalizeMasteryBranchLevel,
  type MasteryBranchId,
  type MasteryBranchState,
} from "../types/MasteryTypes";

export interface MasterySummary {
  version: typeof MASTERY_SYSTEM_VERSION;
  totalPoints: number;
  spentPoints: number;
  availablePoints: number;
  unlockedBranchCount: number;
  activeBranchCount: number;
  maxedBranchCount: number;
  totalBranchLevels: number;
  totalMaxBranchLevels: number;
  totalMasteryPower: number;
  branches: MasteryBranchState[];
  topActiveBranch?: MasteryBranchState;
  nextUnlockBranch?: MasteryBranchState;
}

function safeInteger(value: unknown): number {
  return Math.max(0, Math.floor(Number(value) || 0));
}

export function normalizeMasteryBranchLevelsForProfile(profile: Pick<PlayerProfile, "progressionV2">): Record<MasteryBranchId, number> {
  return MASTERY_BRANCHES.reduce<Record<MasteryBranchId, number>>((levels, branch) => {
    levels[branch.id] = normalizeMasteryBranchLevel(branch.id, profile.progressionV2.masteryBranchLevels?.[branch.id] ?? 0);
    return levels;
  }, {} as Record<MasteryBranchId, number>);
}

export function getMasterySpentPointsForProfile(profile: Pick<PlayerProfile, "progressionV2">): number {
  const levels = normalizeMasteryBranchLevelsForProfile(profile);
  return MASTERY_BRANCHES.reduce((total, branch) => total + levels[branch.id] * branch.pointCostPerLevel, 0);
}

export function getMasteryPowerForProfile(profile: Pick<PlayerProfile, "progressionV2">): number {
  const levels = normalizeMasteryBranchLevelsForProfile(profile);
  return MASTERY_BRANCHES.reduce((total, branch) => total + getMasteryBranchPower(branch.id, levels[branch.id]), 0);
}

export function getMasteryBranchStatesForProfile(profile: Pick<PlayerProfile, "level" | "progressionV2">): MasteryBranchState[] {
  const playerLevel = Math.max(1, Math.floor(profile.level || 1));
  const levels = normalizeMasteryBranchLevelsForProfile(profile);

  return MASTERY_BRANCHES.map((branch) => {
    const level = levels[branch.id];
    const unlocked = playerLevel >= branch.unlockLevel;
    const maxed = level >= branch.maxLevel;
    const status = !unlocked ? "locked" : maxed ? "maxed" : level > 0 ? "active" : "available";
    const powerValue = getMasteryBranchPower(branch.id, level);
    const nextLevel = Math.min(branch.maxLevel, level + 1);

    return {
      id: branch.id,
      name: branch.name,
      shortName: branch.shortName,
      role: branch.role,
      level,
      maxLevel: branch.maxLevel,
      unlocked,
      status,
      powerValue,
      nextPowerValue: getMasteryBranchPower(branch.id, nextLevel),
      pointCostToNext: maxed ? 0 : branch.pointCostPerLevel,
      unlockLabel: getMasteryBranchUnlockLabel(branch, playerLevel),
      futureCombatRule: branch.description,
    };
  });
}

export function getMasterySummary(profile: Pick<PlayerProfile, "level" | "progressionV2">): MasterySummary {
  const branches = getMasteryBranchStatesForProfile(profile);
  const totalPoints = safeInteger(profile.progressionV2.masteryPoints);
  const spentPoints = getMasterySpentPointsForProfile(profile);
  const availablePoints = Math.max(0, totalPoints - spentPoints);
  const activeBranches = branches.filter((branch) => branch.level > 0);
  const unlockedBranches = branches.filter((branch) => branch.unlocked);
  const maxedBranches = branches.filter((branch) => branch.status === "maxed");
  const nextUnlockBranch = branches.find((branch) => !branch.unlocked);

  return {
    version: MASTERY_SYSTEM_VERSION,
    totalPoints,
    spentPoints,
    availablePoints,
    unlockedBranchCount: unlockedBranches.length,
    activeBranchCount: activeBranches.length,
    maxedBranchCount: maxedBranches.length,
    totalBranchLevels: branches.reduce((total, branch) => total + branch.level, 0),
    totalMaxBranchLevels: MASTERY_SYSTEM_DEFINITION.maxTotalBranchLevels,
    totalMasteryPower: getMasteryPowerForProfile(profile),
    branches,
    topActiveBranch: activeBranches.sort((a, b) => b.powerValue - a.powerValue || b.level - a.level)[0],
    nextUnlockBranch,
  };
}
