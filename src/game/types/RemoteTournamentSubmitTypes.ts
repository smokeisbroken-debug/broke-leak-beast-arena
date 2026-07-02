import type { AuthLinkEnvelope } from "./AuthLinkTypes";
import type { BackendConfigRouteKey } from "./BackendConfigTypes";
import type { LeaderboardId, LeaderboardPeriodKey } from "./LeaderboardTypes";
import type { MultiplayerAdapterEnvelope } from "./MultiplayerAdapterTypes";
import type { TournamentLeaderboardSubmitPreview } from "./TournamentLeaderboardLinkTypes";
import type { TournamentRunResultPreview } from "./TournamentRunResultTypes";
import type { TournamentId } from "./TournamentTypes";

export type RemoteTournamentSubmitOperationId = "fetch_event" | "submit_run" | "reconcile_rewards";
export type RemoteTournamentSubmitTransport = "local_preview" | "http_json_future";
export type RemoteTournamentSubmitStatus = "local_preview" | "remote_read_locked" | "remote_submit_locked" | "blocked_backend_required";
export type RemoteTournamentSubmitLockId =
  | "remote_config_required"
  | "backend_identity_required"
  | "cloud_save_required"
  | "run_validation_required"
  | "anti_cheat_required"
  | "server_clock_required"
  | "server_seed_required"
  | "event_window_validation_required"
  | "duplicate_submit_protection_required"
  | "reward_reconciliation_required"
  | "public_submit_disabled";

export interface RemoteTournamentSubmitRouteDefinition {
  operationId: RemoteTournamentSubmitOperationId;
  label: string;
  routeKey: BackendConfigRouteKey;
  method: "GET" | "POST";
  remotePath: string;
  transport: RemoteTournamentSubmitTransport;
  backendLocked: boolean;
  publicWriteEnabled: boolean;
  localPreviewOnly: boolean;
  locks: readonly RemoteTournamentSubmitLockId[];
  description: string;
}

export interface RemoteTournamentSubmitReadinessRow {
  tournamentId: TournamentId;
  title: string;
  leaderboardId: LeaderboardId;
  periodKey: LeaderboardPeriodKey;
  fetchStatus: RemoteTournamentSubmitStatus;
  submitStatus: RemoteTournamentSubmitStatus;
  remoteReadEnabled: boolean;
  remoteSubmitEnabled: boolean;
  requiresAntiCheat: boolean;
  requiresBackendValidation: boolean;
  locks: readonly RemoteTournamentSubmitLockId[];
  requiredBeforeRemote: readonly string[];
}

export interface RemoteTournamentFetchPreview {
  id: string;
  tournamentId: TournamentId;
  operationId: "fetch_event";
  routeKey: "tournament.fetch";
  remotePath: string;
  method: "GET";
  periodKey: LeaderboardPeriodKey;
  generatedAtIso: string;
  status: RemoteTournamentSubmitStatus;
  remoteReadEnabled: boolean;
  localPreviewOnly: boolean;
  locks: readonly RemoteTournamentSubmitLockId[];
  queryPreview: {
    tournamentId: TournamentId;
    periodKey: LeaderboardPeriodKey;
  };
}

export interface RemoteTournamentSubmitPreview {
  id: string;
  tournamentId: TournamentId;
  leaderboardId: LeaderboardId;
  operationId: "submit_run";
  routeKey: "tournament.submit";
  remotePath: string;
  method: "POST";
  playerId: string;
  displayName: string;
  periodKey: LeaderboardPeriodKey;
  runId: string;
  tournamentPoints: number;
  participationPoints: number;
  totalValue: number;
  payloadHash: string;
  generatedAtIso: string;
  status: RemoteTournamentSubmitStatus;
  remoteSubmitEnabled: boolean;
  localPreviewOnly: boolean;
  locks: readonly RemoteTournamentSubmitLockId[];
  requiredBeforeRemote: readonly string[];
  authEnvelope: AuthLinkEnvelope;
  cloudProfileHash: string;
  runResultPreview: TournamentRunResultPreview;
  leaderboardSubmitPreview: TournamentLeaderboardSubmitPreview;
  multiplayerEnvelope: MultiplayerAdapterEnvelope;
  payloadPreview: {
    tournamentId: TournamentId;
    leaderboardId: LeaderboardId;
    periodKey: LeaderboardPeriodKey;
    runId: string;
    tournamentPoints: number;
    participationPoints: number;
    totalValue: number;
    validationTier: string;
    backendValidationRequired: boolean;
    antiCheatRequired: boolean;
    eventWindowValidationRequired: boolean;
    duplicateSubmitProtectionRequired: boolean;
    rewardReconciliationRequired: boolean;
    cloudProfileHash: string;
  };
}

export type RemoteTournamentSubmitPreviewMap = Record<TournamentId, RemoteTournamentSubmitPreview>;

export interface RemoteTournamentSubmitSummary {
  version: string;
  tournamentCount: number;
  backendLockedCount: number;
  remoteReadEnabled: boolean;
  remoteSubmitEnabled: boolean;
  publicSubmitEnabled: boolean;
  requiredBeforeLive: readonly string[];
}

export interface RemoteTournamentSubmitSystemDefinition {
  version: string;
  goal: string;
  remoteReadEnabled: boolean;
  remoteSubmitEnabled: boolean;
  publicSubmitEnabled: boolean;
  supportedTournamentIds: readonly TournamentId[];
  routes: readonly RemoteTournamentSubmitRouteDefinition[];
  locks: readonly RemoteTournamentSubmitLockId[];
  rules: readonly string[];
  requiredBeforeLive: readonly string[];
}
