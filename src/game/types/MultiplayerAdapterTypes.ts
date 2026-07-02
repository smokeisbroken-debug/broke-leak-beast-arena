import type { PlayerIdentityV2 } from "./SaveSchemaTypes";

export type MultiplayerAdapterChannelId =
  | "cloud_save"
  | "run_validation_submit"
  | "leaderboard_submit"
  | "tournament_submit"
  | "duel_submit"
  | "boss_damage_submit"
  | "economy_reconcile"
  | "season_sync";

export type MultiplayerAdapterProviderId = "local_preview_adapter" | "remote_http_placeholder";
export type MultiplayerAdapterMode = "local_preview" | "remote_placeholder";
export type MultiplayerAdapterTransport = "none" | "http_json_future";
export type MultiplayerAdapterSyncStatus = "local_only" | "remote_not_configured" | "remote_required";
export type MultiplayerAdapterPayloadKind =
  | "save_snapshot"
  | "run_validation"
  | "leaderboard_score"
  | "tournament_run"
  | "duel_result"
  | "boss_damage"
  | "economy_event"
  | "season_progress";

export type MultiplayerAdapterCapability =
  | "create_envelope"
  | "queue_local_preview"
  | "read_local_snapshot"
  | "remote_submit_future"
  | "remote_fetch_future"
  | "remote_reconcile_future";

export type MultiplayerAdapterLockId =
  | "remote_adapter_missing"
  | "auth_required"
  | "anti_cheat_required"
  | "cloud_save_required"
  | "run_validation_required"
  | "reward_reconciliation_required"
  | "season_backend_required"
  | "public_submit_disabled";

export type MultiplayerAdapterEnvelopeStatus = "local_preview" | "blocked_backend_required" | "queued_future";

export interface MultiplayerAdapterProviderDefinition {
  id: MultiplayerAdapterProviderId;
  label: string;
  mode: MultiplayerAdapterMode;
  transport: MultiplayerAdapterTransport;
  syncStatus: MultiplayerAdapterSyncStatus;
  capabilities: readonly MultiplayerAdapterCapability[];
  publicSubmitEnabled: boolean;
  description: string;
}

export interface MultiplayerAdapterEndpointDefinition {
  channelId: MultiplayerAdapterChannelId;
  label: string;
  payloadKind: MultiplayerAdapterPayloadKind;
  providerId: MultiplayerAdapterProviderId;
  routeKey: string;
  remotePath: string;
  backendLocked: boolean;
  requiresAuth: boolean;
  requiresAntiCheat: boolean;
  requiresCloudSave: boolean;
  maxLocalPreviewQueue: number;
  locks: readonly MultiplayerAdapterLockId[];
}

export interface MultiplayerAdapterReadinessRow {
  channelId: MultiplayerAdapterChannelId;
  label: string;
  providerId: MultiplayerAdapterProviderId;
  payloadKind: MultiplayerAdapterPayloadKind;
  canCreateEnvelope: boolean;
  canQueueLocalPreview: boolean;
  canSubmitRemote: boolean;
  backendLocked: boolean;
  locks: readonly MultiplayerAdapterLockId[];
  requiredBeforeRemote: readonly string[];
  statusLabel: string;
}

export interface MultiplayerAdapterEnvelopeInput {
  channelId: MultiplayerAdapterChannelId;
  playerId: string;
  displayName: string;
  sourceId: string;
  value?: number;
  periodKey?: string;
  payloadPreview?: Record<string, string | number | boolean | undefined>;
  createdAtIso?: string;
}

export interface MultiplayerAdapterEnvelope {
  id: string;
  channelId: MultiplayerAdapterChannelId;
  payloadKind: MultiplayerAdapterPayloadKind;
  providerId: MultiplayerAdapterProviderId;
  playerId: string;
  displayName: string;
  sourceId: string;
  value?: number;
  periodKey: string;
  status: MultiplayerAdapterEnvelopeStatus;
  localPreviewOnly: boolean;
  remoteSubmitEnabled: boolean;
  backendLocked: boolean;
  locks: readonly MultiplayerAdapterLockId[];
  payloadPreview: Record<string, string | number | boolean | undefined>;
  createdAtIso: string;
}

export interface MultiplayerAdapterSnapshot {
  version: string;
  providerId: MultiplayerAdapterProviderId;
  generatedAtIso: string;
  playerIdentity: PlayerIdentityV2;
  publicSubmitEnabled: boolean;
  localPreviewOnly: boolean;
  endpointCount: number;
  backendLockedCount: number;
  readinessRows: readonly MultiplayerAdapterReadinessRow[];
  sampleEnvelopes: readonly MultiplayerAdapterEnvelope[];
  requiredBeforeLive: readonly string[];
}

export interface MultiplayerAdapterSummary {
  version: string;
  providerId: MultiplayerAdapterProviderId;
  endpointCount: number;
  backendLockedCount: number;
  publicSubmitEnabled: boolean;
  requiredBeforeLive: readonly string[];
}

export interface MultiplayerAdapterSystemDefinition {
  version: string;
  goal: string;
  defaultProviderId: MultiplayerAdapterProviderId;
  publicSubmitEnabled: boolean;
  providers: readonly MultiplayerAdapterProviderDefinition[];
  endpoints: readonly MultiplayerAdapterEndpointDefinition[];
  rules: readonly string[];
  requiredBeforeLive: readonly string[];
}
