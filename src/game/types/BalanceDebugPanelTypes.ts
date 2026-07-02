import type { LeaderboardId } from "./LeaderboardTypes";

export type BalanceDebugMetricId =
  | "player_power"
  | "campaign_readiness"
  | "boss_difficulty"
  | "reward_tables"
  | "upgrade_costs"
  | "soft_caps"
  | "catch_up"
  | "leaderboard_preview";

export type BalanceDebugStatus = "ok" | "watch" | "locked" | "risk";
export type BalanceDebugTone = "green" | "yellow" | "orange" | "red" | "blue";

export interface BalanceDebugPanelSystemDefinition {
  version: string;
  goal: string;
  localPreviewOnly: boolean;
  backendSubmitEnabled: boolean;
  rules: readonly string[];
  requiredBeforeLiveBalance: readonly string[];
}

export interface BalanceDebugRow {
  label: string;
  value: string;
  tone: BalanceDebugTone;
}

export interface BalanceDebugMetricCard {
  id: BalanceDebugMetricId;
  title: string;
  valueLabel: string;
  detailLabel: string;
  status: BalanceDebugStatus;
  statusLabel: string;
  tone: BalanceDebugTone;
  color: string;
  colorValue: number;
  backendLocked: boolean;
  rows: readonly BalanceDebugRow[];
}

export interface BalanceDebugRiskRow {
  id: string;
  label: string;
  detail: string;
  status: BalanceDebugStatus;
  tone: BalanceDebugTone;
  action: string;
}

export interface BalanceDebugLeaderboardPreview {
  leaderboardId: LeaderboardId;
  value: number;
  displayLine: string;
  backendLocked: boolean;
}

export interface BalanceDebugPanelSnapshot {
  version: string;
  generatedAtIso: string;
  playerPower: number;
  cards: readonly BalanceDebugMetricCard[];
  riskRows: readonly BalanceDebugRiskRow[];
  leaderboardPreviews: readonly BalanceDebugLeaderboardPreview[];
  localPreviewOnly: boolean;
  backendSubmitEnabled: boolean;
  nextPatch: string;
}
