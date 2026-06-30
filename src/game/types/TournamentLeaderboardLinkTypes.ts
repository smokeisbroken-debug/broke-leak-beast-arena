import type { LeaderboardId, LeaderboardMetric, LeaderboardScoreBreakdownRow, LeaderboardSubmissionStatus, LeaderboardSubmitPayload, LeaderboardValidationTier } from "./LeaderboardTypes";
import type { LeaderboardAdapterProviderId, LeaderboardAdapterSubmitLock } from "./LeaderboardAdapterTypes";
import type { TournamentId } from "./TournamentTypes";

export type TournamentLeaderboardLinkStatus = "local_preview" | "backend_locked" | "validated_ready";
export type TournamentLeaderboardLinkSource = "local_result_preview" | "arena_result_payload" | "backend_validated_result";
export type TournamentLeaderboardLinkLockId =
  | "public_submit_disabled"
  | "leaderboard_adapter_locked"
  | "tournament_validation_required"
  | "anti_cheat_required"
  | "event_window_validation_required"
  | "duplicate_submit_protection_required";

export interface TournamentLeaderboardLinkLock {
  id: TournamentLeaderboardLinkLockId;
  label: string;
  blocking: boolean;
}

export interface TournamentLeaderboardLinkInput {
  tournamentId: TournamentId;
  playerId: string;
  runId?: string;
  displayName?: string;
  source: TournamentLeaderboardLinkSource;
  score: number;
  participationPoints: number;
  completedAtIso?: string;
}

export interface TournamentLeaderboardSubmitPreview {
  tournamentId: TournamentId;
  leaderboardId: LeaderboardId;
  providerId: LeaderboardAdapterProviderId;
  periodKey: string;
  runId: string;
  playerId: string;
  displayName: string;
  source: TournamentLeaderboardLinkSource;
  value: number;
  metric: LeaderboardMetric;
  scoreBreakdown: LeaderboardScoreBreakdownRow[];
  payload: LeaderboardSubmitPayload;
  validationTier: LeaderboardValidationTier;
  submissionStatus: LeaderboardSubmissionStatus;
  adapterSubmitLock: LeaderboardAdapterSubmitLock;
  linkStatus: TournamentLeaderboardLinkStatus;
  publicSubmitEnabled: boolean;
  localPreviewOnly: boolean;
  locks: TournamentLeaderboardLinkLock[];
  summaryRows: string[];
}

export interface TournamentLeaderboardLinkSummary {
  version: string;
  previewCount: number;
  publicSubmitEnabled: boolean;
  backendLockedCount: number;
  linkedLeaderboardIds: LeaderboardId[];
}

export interface TournamentLeaderboardLinkSystemDefinition {
  version: string;
  goal: string;
  sourceLeaderboardId: LeaderboardId;
  publicSubmitEnabled: boolean;
  linkRules: readonly string[];
  requiredBeforeLiveSubmit: readonly string[];
}
