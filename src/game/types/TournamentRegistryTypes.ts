import type { LeaderboardId } from "./LeaderboardTypes";
import type { TournamentBackendStatus, TournamentId, TournamentModeId, TournamentRuleId, TournamentStatus, TournamentThemeId } from "./TournamentTypes";

export type TournamentRegistryFilterId = "featured" | "local_preview" | "weekly" | "backend_locked" | "all";
export type TournamentRegistryCardTone = "playable_preview" | "locked_backend" | "weekly_event" | "draft_event";

export interface TournamentRegistryCard {
  id: TournamentId;
  title: string;
  shortTitle: string;
  theme: string;
  themeId: TournamentThemeId;
  modeId: TournamentModeId;
  status: TournamentStatus;
  backendStatus: TournamentBackendStatus;
  tone: TournamentRegistryCardTone;
  leaderboardId: LeaderboardId;
  periodKey: string;
  resetLabel: string;
  ruleLabels: TournamentRuleId[];
  participationPoints: number;
  previewScore: number;
  localPreviewEnabled: boolean;
  publicSubmitEnabled: boolean;
  backendValidationRequired: boolean;
  antiCheatRequired: boolean;
  ctaLabel: string;
  lockLabel: string;
}

export interface TournamentRegistryGroupSummary {
  filterId: TournamentRegistryFilterId;
  label: string;
  count: number;
  tournamentIds: TournamentId[];
}

export interface TournamentRegistrySnapshot {
  version: string;
  featuredTournamentId: TournamentId;
  cards: TournamentRegistryCard[];
  groups: TournamentRegistryGroupSummary[];
  localPreviewCount: number;
  backendLockedCount: number;
  weeklyCount: number;
  publicSubmitEnabled: boolean;
  nextPatch: string;
}

export interface TournamentRegistrySystemDefinition {
  version: string;
  goal: string;
  featuredTournamentId: TournamentId;
  defaultFilterId: TournamentRegistryFilterId;
  rules: readonly string[];
  requiredBeforeTournamentScene: readonly string[];
}
