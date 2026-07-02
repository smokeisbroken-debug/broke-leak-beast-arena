import type { BackendConfigRouteKey } from "./BackendConfigTypes";
import type { AuthLinkEnvelope } from "./AuthLinkTypes";
import type { LeaderboardId } from "./LeaderboardTypes";
import type { SeasonSaveStateV2 } from "./SaveSchemaTypes";

export type SeasonBackendOperationId = "fetch_active_season" | "sync_progress" | "finalize_rewards";
export type SeasonBackendTransport = "local_preview" | "http_json_future";
export type SeasonBackendStatus = "local_preview" | "remote_read_locked" | "remote_write_locked" | "blocked_backend_required";
export type SeasonBackendPhase = "preseason" | "active" | "reward_claim" | "closed";
export type SeasonBackendTrackId = "free_progression" | "tournament" | "duel" | "boss" | "missions";
export type SeasonBackendLockId =
  | "remote_config_required"
  | "backend_identity_required"
  | "cloud_save_required"
  | "server_clock_required"
  | "season_backend_required"
  | "season_catalog_required"
  | "season_mission_registry_required"
  | "season_reward_ledger_required"
  | "leaderboard_snapshot_required"
  | "anti_cheat_required"
  | "public_sync_disabled";

export interface SeasonBackendRouteDefinition {
  operationId: SeasonBackendOperationId;
  label: string;
  routeKey: BackendConfigRouteKey;
  method: "GET" | "POST";
  remotePath: string;
  transport: SeasonBackendTransport;
  backendLocked: boolean;
  publicWriteEnabled: boolean;
  localPreviewOnly: boolean;
  locks: readonly SeasonBackendLockId[];
  description: string;
}

export interface SeasonBackendTrackDefinition {
  id: SeasonBackendTrackId;
  label: string;
  scoreSource: "tasks" | "tournament" | "duel" | "boss_damage" | "campaign";
  leaderboardId?: LeaderboardId;
  backendLocked: boolean;
  rewardLedgerRequired: boolean;
  description: string;
}

export interface SeasonBackendReadinessRow {
  trackId: SeasonBackendTrackId;
  label: string;
  status: SeasonBackendStatus;
  scoreSource: SeasonBackendTrackDefinition["scoreSource"];
  leaderboardId?: LeaderboardId;
  requiresServerClock: boolean;
  requiresRewardLedger: boolean;
  locks: readonly SeasonBackendLockId[];
  requiredBeforeRemote: readonly string[];
}

export interface SeasonBackendPreviewSeason {
  seasonId: string;
  label: string;
  phase: SeasonBackendPhase;
  startsAtIso: string;
  endsAtIso: string;
  claimEndsAtIso: string;
  durationDays: number;
  localPreviewOnly: boolean;
  theme: string;
}

export interface SeasonBackendSyncPayloadPreview {
  operationId: "sync_progress";
  seasonId: string;
  generatedAtIso: string;
  playerId: string;
  displayName: string;
  cloudProfileHash: string;
  seasonState: SeasonSaveStateV2;
  activeTrackIds: readonly SeasonBackendTrackId[];
  localSeasonPoints: number;
  completedMissionCount: number;
  claimedRewardCount: number;
  publicSyncEnabled: boolean;
  rewardLedgerRequired: boolean;
  serverClockRequired: boolean;
}

export interface SeasonBackendSyncPreview {
  id: string;
  operationId: "sync_progress";
  routeKey: "season.sync";
  remotePath: string;
  method: "POST";
  status: SeasonBackendStatus;
  generatedAtIso: string;
  remoteWriteEnabled: boolean;
  localPreviewOnly: boolean;
  playerId: string;
  displayName: string;
  cloudProfileHash: string;
  payloadHash: string;
  locks: readonly SeasonBackendLockId[];
  requiredBeforeRemote: readonly string[];
  authEnvelope: AuthLinkEnvelope;
  season: SeasonBackendPreviewSeason;
  payloadPreview: SeasonBackendSyncPayloadPreview;
}

export interface SeasonBackendSnapshot {
  version: string;
  generatedAtIso: string;
  remoteReadEnabled: boolean;
  remoteWriteEnabled: boolean;
  publicSyncEnabled: boolean;
  activeSeason: SeasonBackendPreviewSeason;
  routeCount: number;
  lockedRouteCount: number;
  trackCount: number;
  readinessRows: readonly SeasonBackendReadinessRow[];
  syncPreview: SeasonBackendSyncPreview;
  routes: readonly SeasonBackendRouteDefinition[];
  tracks: readonly SeasonBackendTrackDefinition[];
  requiredBeforeLive: readonly string[];
}

export interface SeasonBackendSummary {
  version: string;
  activeSeasonId: string;
  phase: SeasonBackendPhase;
  trackCount: number;
  routeCount: number;
  backendLockedCount: number;
  remoteReadEnabled: boolean;
  remoteWriteEnabled: boolean;
  publicSyncEnabled: boolean;
  requiredBeforeLive: readonly string[];
}

export interface SeasonBackendSystemDefinition {
  version: string;
  goal: string;
  remoteReadEnabled: boolean;
  remoteWriteEnabled: boolean;
  publicSyncEnabled: boolean;
  routes: readonly SeasonBackendRouteDefinition[];
  tracks: readonly SeasonBackendTrackDefinition[];
  locks: readonly SeasonBackendLockId[];
  rules: readonly string[];
  requiredBeforeLive: readonly string[];
}
