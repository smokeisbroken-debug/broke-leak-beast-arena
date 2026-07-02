import type { PlayerIdentityV2, SaveSyncProvider, SaveValidationStatus } from "./SaveSchemaTypes";

export type CloudSaveAdapterProviderId = "local_snapshot_adapter" | "remote_cloud_placeholder";
export type CloudSaveAdapterMode = "local_preview" | "remote_placeholder";
export type CloudSaveAdapterTransport = "local_storage" | "http_json_future";
export type CloudSaveAdapterCapability =
  | "create_snapshot"
  | "read_local_profile"
  | "export_payload"
  | "queue_future_push"
  | "remote_pull_future"
  | "remote_push_future"
  | "conflict_resolve_future";

export type CloudSaveBlockId =
  | "identity"
  | "wallet"
  | "progression"
  | "multiplayer"
  | "tasks"
  | "leaderboards"
  | "tournaments"
  | "duels"
  | "seasons"
  | "sync";

export type CloudSaveOperationId = "local_snapshot" | "future_pull" | "future_push" | "future_merge" | "future_restore";
export type CloudSaveLockId =
  | "remote_adapter_missing"
  | "auth_required"
  | "backend_link_required"
  | "server_timestamp_required"
  | "conflict_resolution_required"
  | "anti_cheat_required_for_ranked_blocks"
  | "public_sync_disabled";

export type CloudSaveBlockSyncMode = "local_only" | "remote_locked" | "remote_future";
export type CloudSaveConflictPolicy = "local_wins_preview" | "server_wins_future" | "manual_merge_future";

export interface CloudSaveAdapterProviderDefinition {
  id: CloudSaveAdapterProviderId;
  label: string;
  mode: CloudSaveAdapterMode;
  transport: CloudSaveAdapterTransport;
  provider: SaveSyncProvider;
  publicSyncEnabled: boolean;
  capabilities: readonly CloudSaveAdapterCapability[];
  description: string;
}

export interface CloudSaveBlockDefinition {
  id: CloudSaveBlockId;
  label: string;
  syncMode: CloudSaveBlockSyncMode;
  rankedImpact: boolean;
  economyImpact: boolean;
  conflictPolicy: CloudSaveConflictPolicy;
  requiredBeforeRemote: readonly string[];
}

export interface CloudSaveBlockSnapshotRow {
  blockId: CloudSaveBlockId;
  label: string;
  syncMode: CloudSaveBlockSyncMode;
  rankedImpact: boolean;
  economyImpact: boolean;
  localHash: string;
  approxBytes: number;
  canPushRemote: boolean;
  requiredBeforeRemote: readonly string[];
}

export interface CloudSaveSnapshotEnvelope {
  id: string;
  version: string;
  schemaVersion: number;
  providerId: CloudSaveAdapterProviderId;
  operationId: CloudSaveOperationId;
  playerIdentity: PlayerIdentityV2;
  generatedAtIso: string;
  localPreviewOnly: boolean;
  publicSyncEnabled: boolean;
  backendLinked: boolean;
  validationStatus: SaveValidationStatus;
  pendingRunResultIds: readonly string[];
  pendingEconomyEventIds: readonly string[];
  blockRows: readonly CloudSaveBlockSnapshotRow[];
  locks: readonly CloudSaveLockId[];
  payloadPreview: {
    routeKey: string;
    remotePath: string;
    profileHash: string;
    blockCount: number;
    rankedBlockCount: number;
    economyBlockCount: number;
  };
}

export interface CloudSaveAdapterSummary {
  version: string;
  defaultProviderId: CloudSaveAdapterProviderId;
  blockCount: number;
  remoteLockedBlockCount: number;
  rankedBlockCount: number;
  economyBlockCount: number;
  publicSyncEnabled: boolean;
  requiredBeforeLive: readonly string[];
}

export interface CloudSaveAdapterSystemDefinition {
  version: string;
  goal: string;
  defaultProviderId: CloudSaveAdapterProviderId;
  remotePath: string;
  routeKey: string;
  publicSyncEnabled: boolean;
  providers: readonly CloudSaveAdapterProviderDefinition[];
  blocks: readonly CloudSaveBlockDefinition[];
  locks: readonly CloudSaveLockId[];
  rules: readonly string[];
  requiredBeforeLive: readonly string[];
}
