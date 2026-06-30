import type { PlayerProfile } from "../data/playerProfile";
import { getXpProgress } from "../data/progression";
import { getMascotEvolutionSummary } from "./EvolutionSystem";
import { getMasterySummary } from "./MasterySystem";
import { getPlayerProfileV2Summary } from "./ProfileSystem";
import { getSkillUpgradeSummary } from "./SkillUpgradeSystem";
import { DEFAULT_POWER_CAPS, type PowerBreakdown, type PowerSourceId } from "../types/ProgressionTypes";
import type {
  EvolutionUiRow,
  MasteryProgressionUiRow,
  PowerBreakdownUiRow,
  ProgressionDashboardUiModel,
  ProgressionGoalUiRow,
  ProgressionMeterRow,
  ProgressionUiRowTone,
  ProgressionUiSystemDefinition,
  SkillProgressionUiRow,
} from "../types/ProgressionUiTypes";

export const PROGRESSION_UI_SYSTEM_VERSION = "0.9.6-progression-ui";

export const PROGRESSION_UI_SYSTEM_DEFINITION: ProgressionUiSystemDefinition = {
  version: PROGRESSION_UI_SYSTEM_VERSION,
  goal: "Present level, PowerScore, evolution, skill levels and mastery as one readable long-term progression dashboard without enabling new spending or combat scaling.",
  panels: [
    { id: "power", title: "Power Breakdown", purpose: "Show capped power sources used later for recommended power, matchmaking and leaderboard categories." },
    { id: "xp", title: "Level Progress", purpose: "Show next level progress and avoid hiding long-term growth behind raw XP numbers." },
    { id: "evolution", title: "Mascot Evolution", purpose: "Show current form, unlocked forms and the next locked form." },
    { id: "skills", title: "Skill Path", purpose: "Show active loadout levels and future upgrade candidates without changing combat values yet." },
    { id: "mastery", title: "Mastery Path", purpose: "Show guard, dash, skill, boss, control and survival branches as future horizontal growth." },
    { id: "goals", title: "Next Goals", purpose: "Give the player clear next steps before task, leaderboard and tournament systems become active." },
  ],
  rules: [
    "Progression UI is presentation-only in this patch.",
    "Upgrade, mastery spending and evolution combat bonuses remain locked until later economy and validation patches.",
    "PowerScore bars show capped balance inputs, not direct damage multipliers.",
    "Future multiplayer systems may reuse this dashboard for recommended power, leaderboard brackets and Leak Duel matching.",
  ],
};

const POWER_LABELS: Record<PowerSourceId, string> = {
  level: "LEVEL",
  skills: "SKILLS",
  evolution: "EVOLUTION",
  mastery: "MASTERY",
  charms: "CHARMS",
};

const POWER_ORDER: readonly PowerSourceId[] = ["level", "skills", "evolution", "mastery", "charms"];

function clampPercent(value: number, maxValue: number): number {
  if (maxValue <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((value / maxValue) * 100)));
}

function getPowerTone(value: number, maxValue: number): ProgressionUiRowTone {
  if (maxValue > 0 && value >= maxValue) return "capped";
  if (value > 0) return "active";
  return "future";
}

function getPowerRows(breakdown: PowerBreakdown): PowerBreakdownUiRow[] {
  return POWER_ORDER.map((sourceId) => {
    const value = Math.max(0, Math.floor(breakdown[sourceId] || 0));
    const maxValue = DEFAULT_POWER_CAPS[sourceId];
    return {
      id: `power_${sourceId}`,
      sourceId,
      label: POWER_LABELS[sourceId],
      value,
      maxValue,
      percent: clampPercent(value, maxValue),
      detail: `${value}/${maxValue}`,
      tone: getPowerTone(value, maxValue),
    };
  });
}

function formatSkillCost(row: { costToNext?: { coins: number; skillCards: number; leakPoints: number }; status: string }): string {
  if (row.status === "locked") return "LOCKED";
  if (row.status === "maxed") return "MAXED";
  if (!row.costToNext) return "NO COST";

  const parts = [`${row.costToNext.coins} COINS`, `${row.costToNext.skillCards} CARDS`];
  if (row.costToNext.leakPoints > 0) parts.push(`${row.costToNext.leakPoints} LEAK`);
  return parts.join(" · ");
}

function toSkillRow(row: ReturnType<typeof getSkillUpgradeSummary>["activeLoadout"][number]): SkillProgressionUiRow {
  return {
    skillId: row.skillId,
    name: row.name,
    role: row.role,
    level: row.level,
    maxLevel: row.maxLevel,
    status: row.status,
    powerValue: row.powerValue,
    nextPowerValue: row.nextPowerValue,
    costLabel: formatSkillCost(row),
  };
}

function buildXpRows(profile: PlayerProfile): ProgressionMeterRow[] {
  const xp = getXpProgress(profile.xp);
  return [
    {
      id: "level_xp",
      label: `LV ${profile.level}${xp.nextLevel ? ` → LV ${xp.nextLevel.level}` : " · MAX"}`,
      value: Math.max(0, Math.round(xp.progress * 100)),
      maxValue: 100,
      percent: Math.max(0, Math.min(100, Math.round(xp.progress * 100))),
      detail: xp.nextLevel ? `${xp.remaining} XP LEFT` : "LEVEL CAP READY",
      tone: xp.nextLevel ? "active" : "capped",
    },
  ];
}

function buildEvolutionRows(profile: PlayerProfile): EvolutionUiRow[] {
  const evolution = getMascotEvolutionSummary(profile);
  return evolution.all.map((row) => ({
    id: row.evolution.id,
    tier: row.evolution.tier,
    name: row.evolution.name,
    title: row.evolution.title,
    status: row.evolution.id === evolution.current.id ? "current" : row.unlocked ? "unlocked" : "locked",
    requirement: row.requirementLabel,
    powerValue: row.evolution.powerValue,
    uiColor: row.evolution.uiColor,
  }));
}

function buildMasteryRows(profile: PlayerProfile): MasteryProgressionUiRow[] {
  const mastery = getMasterySummary(profile);
  return mastery.branches.map((row) => ({
    branchId: row.id,
    shortName: row.shortName,
    level: row.level,
    maxLevel: row.maxLevel,
    status: row.status,
    powerValue: row.powerValue,
    unlockLabel: row.unlockLabel,
  }));
}

function buildGoals(profile: PlayerProfile): ProgressionGoalUiRow[] {
  const profileSummary = getPlayerProfileV2Summary(profile);
  const skillSummary = getSkillUpgradeSummary(profile);
  const mastery = getMasterySummary(profile);
  const goals: ProgressionGoalUiRow[] = [];

  if (profileSummary.progress.nextLevel) {
    goals.push({
      id: "next_level",
      label: `REACH LV ${profileSummary.progress.nextLevel}`,
      detail: `${profileSummary.progress.xpRemaining} XP LEFT`,
      tone: "active",
    });
  }

  if (profileSummary.progress.nextEvolutionName) {
    goals.push({
      id: "next_evolution",
      label: `UNLOCK ${profileSummary.progress.nextEvolutionName}`,
      detail: profileSummary.progress.nextEvolutionRequirement ?? "PROGRESS REQUIRED",
      tone: "locked",
    });
  }

  const upgradeCandidate = skillSummary.topUpgradeCandidates[0];
  if (upgradeCandidate) {
    goals.push({
      id: "skill_upgrade_preview",
      label: `NEXT SKILL: ${upgradeCandidate.name}`,
      detail: `LV ${upgradeCandidate.level}/${upgradeCandidate.maxLevel} · ${formatSkillCost(upgradeCandidate)}`,
      tone: upgradeCandidate.status === "ready" ? "ready" : "active",
    });
  }

  if (mastery.nextUnlockBranch) {
    goals.push({
      id: "next_mastery",
      label: `MASTERY: ${mastery.nextUnlockBranch.shortName}`,
      detail: mastery.nextUnlockBranch.unlockLabel,
      tone: "locked",
    });
  }

  goals.push({
    id: "task_points_next",
    label: "NEXT PATCH: TASK POINTS",
    detail: "DAILY/WEEKLY TASKS WILL FEED LEADERBOARDS",
    tone: "future",
  });

  return goals.slice(0, 5);
}

export function getProgressionDashboard(profile: PlayerProfile): ProgressionDashboardUiModel {
  const profileSummary = getPlayerProfileV2Summary(profile);
  const skillSummary = getSkillUpgradeSummary(profile);

  return {
    version: PROGRESSION_UI_SYSTEM_VERSION,
    title: "PROGRESSION DASHBOARD",
    subtitle: `POWER ${profileSummary.progress.powerScore} · ${profileSummary.progress.evolutionName} · LOCAL SKELETON`,
    powerScore: profileSummary.progress.powerScore,
    powerRows: getPowerRows(profileSummary.progress.powerBreakdown),
    xpRows: buildXpRows(profile),
    evolutionRows: buildEvolutionRows(profile),
    activeSkillRows: skillSummary.activeLoadout.map(toSkillRow),
    upgradeCandidateRows: skillSummary.topUpgradeCandidates.map(toSkillRow),
    masteryRows: buildMasteryRows(profile),
    nextGoals: buildGoals(profile),
  };
}
