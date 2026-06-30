import type { EvolutionId } from "./EvolutionTypes";
import type { MasteryBranchId } from "./MasteryTypes";
import type { PowerSourceId } from "./ProgressionTypes";
import type { SkillUpgradeRole, SkillUpgradeStatus } from "./SkillUpgradeTypes";

export type ProgressionUiRowTone = "ready" | "active" | "locked" | "future" | "capped";
export type ProgressionUiPanelId = "power" | "xp" | "evolution" | "skills" | "mastery" | "goals";

export interface ProgressionUiSystemDefinition {
  version: string;
  goal: string;
  panels: readonly {
    id: ProgressionUiPanelId;
    title: string;
    purpose: string;
  }[];
  rules: readonly string[];
}

export interface ProgressionMeterRow {
  id: string;
  label: string;
  value: number;
  maxValue: number;
  percent: number;
  detail: string;
  tone: ProgressionUiRowTone;
}

export interface PowerBreakdownUiRow extends ProgressionMeterRow {
  sourceId: PowerSourceId;
}

export interface EvolutionUiRow {
  id: EvolutionId;
  tier: number;
  name: string;
  title: string;
  status: "current" | "unlocked" | "locked";
  requirement: string;
  powerValue: number;
  uiColor: string;
}

export interface SkillProgressionUiRow {
  skillId: string;
  name: string;
  role: SkillUpgradeRole;
  level: number;
  maxLevel: number;
  status: SkillUpgradeStatus;
  powerValue: number;
  nextPowerValue: number;
  costLabel: string;
}

export interface MasteryProgressionUiRow {
  branchId: MasteryBranchId;
  shortName: string;
  level: number;
  maxLevel: number;
  status: "locked" | "available" | "active" | "maxed";
  powerValue: number;
  unlockLabel: string;
}

export interface ProgressionGoalUiRow {
  id: string;
  label: string;
  detail: string;
  tone: ProgressionUiRowTone;
}

export interface ProgressionDashboardUiModel {
  version: string;
  title: string;
  subtitle: string;
  powerScore: number;
  powerRows: readonly PowerBreakdownUiRow[];
  xpRows: readonly ProgressionMeterRow[];
  evolutionRows: readonly EvolutionUiRow[];
  activeSkillRows: readonly SkillProgressionUiRow[];
  upgradeCandidateRows: readonly SkillProgressionUiRow[];
  masteryRows: readonly MasteryProgressionUiRow[];
  nextGoals: readonly ProgressionGoalUiRow[];
}
