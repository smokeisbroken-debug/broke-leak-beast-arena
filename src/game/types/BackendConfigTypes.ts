import type { MultiplayerAdapterChannelId, MultiplayerAdapterPayloadKind } from "./MultiplayerAdapterTypes";

export type BackendConfigEnvironmentId = "local_preview" | "staging_placeholder" | "production_locked";
export type BackendConfigReleaseLane = "dev" | "qa" | "staging" | "production";
export type BackendConfigTransport = "none" | "http_json_future";
export type BackendConfigHttpMethod = "GET" | "POST";
export type BackendConfigRouteKey =
  | "auth.link"
  | "config.fetch"
  | "save.sync"
  | "run.validation.submit"
  | "leaderboard.fetch"
  | "leaderboard.submit"
  | "tournament.fetch"
  | "tournament.submit"
  | "duel.fetch"
  | "duel.submit"
  | "boss.damage.submit"
  | "economy.reconcile"
  | "season.sync";

export type BackendFeatureGateId =
  | "auth_link"
  | "remote_config"
  | "cloud_save"
  | "run_validation"
  | "anti_cheat"
  | "leaderboard_fetch"
  | "leaderboard_submit"
  | "tournament_fetch"
  | "tournament_submit"
  | "duel_fetch"
  | "duel_submit"
  | "boss_damage_submit"
  | "economy_reconcile"
  | "season_sync";

export type BackendFeatureGateState = "local_preview" | "remote_read_preview" | "remote_locked" | "planned";
export type BackendConfigLockId =
  | "backend_url_missing"
  | "auth_missing"
  | "cloud_save_missing"
  | "server_clock_missing"
  | "server_seed_missing"
  | "anti_cheat_missing"
  | "reward_ledger_missing"
  | "remote_config_missing"
  | "public_writes_disabled"
  | "season_backend_missing";

export interface BackendConfigEnvironmentDefinition {
  id: BackendConfigEnvironmentId;
  label: string;
  releaseLane: BackendConfigReleaseLane;
  transport: BackendConfigTransport;
  baseUrl: string;
  remoteReadsEnabled: boolean;
  publicWritesEnabled: boolean;
  remoteConfigEnabled: boolean;
  description: string;
}

export interface BackendFeatureGateDefinition {
  id: BackendFeatureGateId;
  label: string;
  state: BackendFeatureGateState;
  localPreviewAllowed: boolean;
  remoteReadAllowed: boolean;
  remoteWriteAllowed: boolean;
  locks: readonly BackendConfigLockId[];
  description: string;
}

export interface BackendConfigRouteDefinition {
  routeKey: BackendConfigRouteKey;
  label: string;
  method: BackendConfigHttpMethod;
  path: string;
  channelId?: MultiplayerAdapterChannelId;
  payloadKind?: MultiplayerAdapterPayloadKind;
  featureGateId: BackendFeatureGateId;
  requiresAuth: boolean;
  requiresCloudSave: boolean;
  requiresServerClock: boolean;
  requiresServerSeed: boolean;
  requiresAntiCheat: boolean;
  requiresRewardLedger: boolean;
  backendLocked: boolean;
  publicWriteEnabled: boolean;
  localPreviewOnly: boolean;
}

export interface BackendConfigReadinessRow {
  id: BackendFeatureGateId;
  label: string;
  state: BackendFeatureGateState;
  remoteReady: boolean;
  localPreviewAllowed: boolean;
  routeCount: number;
  locks: readonly BackendConfigLockId[];
  statusLabel: string;
}

export interface BackendConfigRouteSnapshotRow {
  routeKey: BackendConfigRouteKey;
  label: string;
  method: BackendConfigHttpMethod;
  path: string;
  featureGateId: BackendFeatureGateId;
  backendLocked: boolean;
  publicWriteEnabled: boolean;
  localPreviewOnly: boolean;
  requiredBeforeLive: readonly string[];
}

export interface BackendConfigSnapshot {
  version: string;
  environmentId: BackendConfigEnvironmentId;
  releaseLane: BackendConfigReleaseLane;
  generatedAtIso: string;
  baseUrl: string;
  transport: BackendConfigTransport;
  remoteReadsEnabled: boolean;
  publicWritesEnabled: boolean;
  remoteConfigEnabled: boolean;
  featureGateCount: number;
  remoteLockedGateCount: number;
  publicWriteRouteCount: number;
  lockedRouteCount: number;
  readinessRows: readonly BackendConfigReadinessRow[];
  routeRows: readonly BackendConfigRouteSnapshotRow[];
  requiredBeforeLive: readonly string[];
}

export interface BackendConfigSummary {
  version: string;
  environmentId: BackendConfigEnvironmentId;
  releaseLane: BackendConfigReleaseLane;
  remoteReadsEnabled: boolean;
  publicWritesEnabled: boolean;
  remoteConfigEnabled: boolean;
  featureGateCount: number;
  remoteLockedGateCount: number;
  routeCount: number;
  lockedRouteCount: number;
  requiredBeforeLive: readonly string[];
}

export interface BackendConfigSystemDefinition {
  version: string;
  goal: string;
  activeEnvironmentId: BackendConfigEnvironmentId;
  publicWritesEnabled: boolean;
  remoteReadsEnabled: boolean;
  remoteConfigEnabled: boolean;
  environments: readonly BackendConfigEnvironmentDefinition[];
  featureGates: readonly BackendFeatureGateDefinition[];
  routes: readonly BackendConfigRouteDefinition[];
  requiredBeforeLive: readonly string[];
  rules: readonly string[];
}
