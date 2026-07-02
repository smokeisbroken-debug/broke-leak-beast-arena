import type { AuthLinkEnvelope } from "./AuthLinkTypes";
import type { BackendConfigRouteKey } from "./BackendConfigTypes";
import type { LeaderboardId, LeaderboardMetric, LeaderboardPeriodKey, LeaderboardSubmissionStatus } from "./LeaderboardTypes";
import type { LeaderboardAdapterSnapshot, LeaderboardAdapterSubmitPreview } from "./LeaderboardAdapterTypes";
import type { MultiplayerAdapterEnvelope } from "./MultiplayerAdapterTypes";

export type RemoteLeaderboardOperationId = "fetch_snapshot" | "submit_score" | "reconcile_entry";
export type RemoteLeaderboardTransport = "local_preview" | "http_json_future";
export type RemoteLeaderboardStatus = "local_preview" | "remote_read_locked" | "remote_submit_locked" | "blocked_backend_required";
export type RemoteLeaderboardLockId =
  | "remote_config_required"
  | "backend_identity_required"
  | "cloud_save_required"
  | "run_validation_required"
  | "anti_cheat_required"
  | "server_clock_required"
  | "server_seed_required"
  | "public_submit_disabled";

export interface RemoteLeaderboardRouteDefinition {
  operationId: RemoteLeaderboardOperationId;
  label: string;
  routeKey: BackendConfigRouteKey;
  method: "GET" | "POST";
  remotePath: string;
  transport: RemoteLeaderboardTransport;
  backendLocked: boolean;
  publicWriteEnabled: boolean;
  localPreviewOnly: boolean;
  locks: readonly RemoteLeaderboardLockId[];
  description: string;
}

export interface RemoteLeaderboardReadinessRow {
  leaderboardId: LeaderboardId;
  title: string;
  metric: LeaderboardMetric;
  periodKey: LeaderboardPeriodKey;
  fetchStatus: RemoteLeaderboardStatus;
  submitStatus: RemoteLeaderboardStatus;
  remoteReadEnabled: boolean;
  remoteSubmitEnabled: boolean;
  requiresAntiCheat: boolean;
  requiresBackendValidation: boolean;
  locks: readonly RemoteLeaderboardLockId[];
  requiredBeforeRemote: readonly string[];
}

export interface RemoteLeaderboardFetchPreview {
  id: string;
  leaderboardId: LeaderboardId;
  operationId: "fetch_snapshot";
  routeKey: "leaderboard.fetch";
  remotePath: string;
  method: "GET";
  periodKey: LeaderboardPeriodKey;
  limit: number;
  offset: number;
  generatedAtIso: string;
  status: RemoteLeaderboardStatus;
  remoteReadEnabled: boolean;
  localPreviewOnly: boolean;
  locks: readonly RemoteLeaderboardLockId[];
  queryPreview: {
    leaderboardId: LeaderboardId;
    periodKey: LeaderboardPeriodKey;
    limit: number;
    offset: number;
  };
  adapterSnapshot: LeaderboardAdapterSnapshot;
}

export interface RemoteLeaderboardSubmitPreview {
  id: string;
  leaderboardId: LeaderboardId;
  operationId: "submit_score";
  routeKey: "leaderboard.submit";
  remotePath: string;
  method: "POST";
  playerId: string;
  displayName: string;
  periodKey: LeaderboardPeriodKey;
  value: number;
  metric: LeaderboardMetric;
  payloadHash: string;
  generatedAtIso: string;
  submissionStatus: LeaderboardSubmissionStatus;
  status: RemoteLeaderboardStatus;
  remoteSubmitEnabled: boolean;
  localPreviewOnly: boolean;
  locks: readonly RemoteLeaderboardLockId[];
  requiredBeforeRemote: readonly string[];
  authEnvelope: AuthLinkEnvelope;
  cloudProfileHash: string;
  adapterSubmitPreview: LeaderboardAdapterSubmitPreview;
  multiplayerEnvelope: MultiplayerAdapterEnvelope;
  payloadPreview: {
    leaderboardId: LeaderboardId;
    periodKey: LeaderboardPeriodKey;
    metric: LeaderboardMetric;
    value: number;
    validationTier: string;
    backendValidationRequired: boolean;
    antiCheatRequired: boolean;
    cloudProfileHash: string;
  };
}

export type RemoteLeaderboardPreviewMap = Record<LeaderboardId, RemoteLeaderboardSubmitPreview>;

export interface RemoteLeaderboardSummary {
  version: string;
  leaderboardCount: number;
  backendLockedCount: number;
  remoteReadEnabled: boolean;
  remoteSubmitEnabled: boolean;
  publicSubmitEnabled: boolean;
  requiredBeforeLive: readonly string[];
}

export interface RemoteLeaderboardSystemDefinition {
  version: string;
  goal: string;
  remoteReadEnabled: boolean;
  remoteSubmitEnabled: boolean;
  publicSubmitEnabled: boolean;
  supportedLeaderboards: readonly LeaderboardId[];
  routes: readonly RemoteLeaderboardRouteDefinition[];
  locks: readonly RemoteLeaderboardLockId[];
  rules: readonly string[];
  requiredBeforeLive: readonly string[];
}
