import type {
  LeaderboardBackendStatus,
  LeaderboardId,
  LeaderboardReadiness,
  LeaderboardSubmissionStatus,
  LeaderboardSubmitPayload,
} from "./LeaderboardTypes";
import type { LocalLeaderboardMockSnapshot } from "./LocalLeaderboardMockTypes";

export type LeaderboardAdapterProviderId = "local_mock_adapter" | "remote_http_adapter";
export type LeaderboardAdapterMode = "local_preview" | "remote_placeholder";
export type LeaderboardAdapterSyncStatus = "local_only" | "remote_not_configured" | "remote_required";
export type LeaderboardAdapterCapability =
  | "fetch_snapshot"
  | "create_submit_payload"
  | "preview_weekly_period"
  | "public_submit"
  | "tournament_submit"
  | "duel_submit"
  | "boss_submit";

export type LeaderboardAdapterSubmitLock =
  | "local_preview_only"
  | "backend_required"
  | "anti_cheat_required"
  | "remote_adapter_missing"
  | "remote_submit_disabled";

export interface LeaderboardAdapterProviderDefinition {
  id: LeaderboardAdapterProviderId;
  label: string;
  mode: LeaderboardAdapterMode;
  syncStatus: LeaderboardAdapterSyncStatus;
  capabilities: readonly LeaderboardAdapterCapability[];
  publicSubmitEnabled: boolean;
  description: string;
}

export interface LeaderboardAdapterReadiness {
  leaderboardId: LeaderboardId;
  providerId: LeaderboardAdapterProviderId;
  backendStatus: LeaderboardBackendStatus;
  canReadPreview: boolean;
  canCreateSubmitPayload: boolean;
  canSubmitPublicScore: boolean;
  submitLock: LeaderboardAdapterSubmitLock;
  remoteRequired: boolean;
  requiredBeforeRemote: readonly string[];
}

export interface LeaderboardAdapterSnapshot {
  leaderboardId: LeaderboardId;
  providerId: LeaderboardAdapterProviderId;
  generatedAtIso: string;
  snapshot: LocalLeaderboardMockSnapshot;
  readiness: LeaderboardReadiness;
  adapterReadiness: LeaderboardAdapterReadiness;
  syncStatus: LeaderboardAdapterSyncStatus;
  localPreviewOnly: boolean;
  publicSubmitEnabled: boolean;
  notice: string;
}

export interface LeaderboardAdapterSubmitPreview {
  leaderboardId: LeaderboardId;
  providerId: LeaderboardAdapterProviderId;
  payload: LeaderboardSubmitPayload;
  submissionStatus: LeaderboardSubmissionStatus;
  adapterSubmitLock: LeaderboardAdapterSubmitLock;
  publicSubmitEnabled: boolean;
  localPreviewOnly: boolean;
  requiredBeforeRemote: readonly string[];
  createdAtIso: string;
}

export interface LeaderboardAdapterSystemDefinition {
  version: string;
  goal: string;
  defaultProviderId: LeaderboardAdapterProviderId;
  providers: readonly LeaderboardAdapterProviderDefinition[];
  rules: readonly string[];
}
