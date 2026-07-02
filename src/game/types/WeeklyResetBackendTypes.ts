import type { BackendConfigRouteKey } from "./BackendConfigTypes";
import type { LeaderboardId, LeaderboardPeriodKey } from "./LeaderboardTypes";
import type { AuthLinkEnvelope } from "./AuthLinkTypes";
import type { WeeklyLeaderboardId, WeeklyLeaderboardPeriodState, WeeklyLeaderboardPreview, WeeklyLeaderboardSubmitLock } from "./WeeklyLeaderboardTypes";

export type WeeklyResetBackendOperationId = "fetch_period" | "close_period" | "finalize_rewards";
export type WeeklyResetBackendTransport = "local_preview" | "http_json_future";
export type WeeklyResetBackendStatus = "local_preview" | "remote_read_locked" | "remote_write_locked" | "blocked_backend_required";
export type WeeklyResetBackendLockId =
  | "remote_config_required"
  | "backend_identity_required"
  | "cloud_save_required"
  | "server_clock_required"
  | "weekly_reset_job_required"
  | "leaderboard_snapshot_lock_required"
  | "duplicate_period_close_required"
  | "anti_cheat_required"
  | "reward_reconciliation_required"
  | "public_reset_disabled";

export interface WeeklyResetBackendRouteDefinition {
  operationId: WeeklyResetBackendOperationId;
  label: string;
  routeKey: BackendConfigRouteKey;
  method: "GET" | "POST";
  remotePath: string;
  transport: WeeklyResetBackendTransport;
  backendLocked: boolean;
  publicWriteEnabled: boolean;
  localPreviewOnly: boolean;
  locks: readonly WeeklyResetBackendLockId[];
  description: string;
}

export interface WeeklyResetBackendReadinessRow {
  leaderboardId: WeeklyLeaderboardId;
  periodKey: LeaderboardPeriodKey;
  status: WeeklyResetBackendStatus;
  submitLock: WeeklyLeaderboardSubmitLock;
  requiresServerClock: boolean;
  requiresSnapshotLock: boolean;
  requiresRewardReconciliation: boolean;
  locks: readonly WeeklyResetBackendLockId[];
  requiredBeforeRemote: readonly string[];
}

export interface WeeklyResetBackendJobPreview {
  id: string;
  operationId: "close_period";
  routeKey: "leaderboard.submit";
  remotePath: string;
  method: "POST";
  period: WeeklyLeaderboardPeriodState;
  generatedAtIso: string;
  status: WeeklyResetBackendStatus;
  remoteWriteEnabled: boolean;
  localPreviewOnly: boolean;
  playerId: string;
  displayName: string;
  cloudProfileHash: string;
  payloadHash: string;
  locks: readonly WeeklyResetBackendLockId[];
  requiredBeforeRemote: readonly string[];
  authEnvelope: AuthLinkEnvelope;
  leaderboardIds: readonly WeeklyLeaderboardId[];
  affectedLeaderboardCount: number;
  previewRows: readonly WeeklyLeaderboardPreview[];
  payloadPreview: {
    periodKey: LeaderboardPeriodKey;
    startsAtIso: string;
    endsAtIso: string;
    nextResetAtIso: string;
    leaderboardIds: readonly LeaderboardId[];
    snapshotLockRequired: boolean;
    duplicatePeriodCloseProtectionRequired: boolean;
    rewardReconciliationRequired: boolean;
    publicResetEnabled: boolean;
    cloudProfileHash: string;
  };
}

export interface WeeklyResetBackendSnapshot {
  version: string;
  generatedAtIso: string;
  period: WeeklyLeaderboardPeriodState;
  remoteReadEnabled: boolean;
  remoteWriteEnabled: boolean;
  publicResetEnabled: boolean;
  routeCount: number;
  lockedRouteCount: number;
  readinessRows: readonly WeeklyResetBackendReadinessRow[];
  closePeriodPreview: WeeklyResetBackendJobPreview;
  routes: readonly WeeklyResetBackendRouteDefinition[];
  requiredBeforeLive: readonly string[];
}

export interface WeeklyResetBackendSummary {
  version: string;
  weeklyLeaderboardCount: number;
  routeCount: number;
  backendLockedCount: number;
  remoteReadEnabled: boolean;
  remoteWriteEnabled: boolean;
  publicResetEnabled: boolean;
  requiredBeforeLive: readonly string[];
}

export interface WeeklyResetBackendSystemDefinition {
  version: string;
  goal: string;
  remoteReadEnabled: boolean;
  remoteWriteEnabled: boolean;
  publicResetEnabled: boolean;
  supportedLeaderboards: readonly WeeklyLeaderboardId[];
  routes: readonly WeeklyResetBackendRouteDefinition[];
  locks: readonly WeeklyResetBackendLockId[];
  rules: readonly string[];
  requiredBeforeLive: readonly string[];
}
