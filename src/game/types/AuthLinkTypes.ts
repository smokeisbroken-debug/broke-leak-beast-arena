import type { PlayerIdentityV2, SaveValidationStatus } from "./SaveSchemaTypes";

export type AuthProviderId = "local_device" | "telegram_placeholder" | "wallet_placeholder" | "backend_session_placeholder";
export type AuthProviderMode = "local_preview" | "remote_placeholder";
export type AuthProviderTransport = "none" | "telegram_future" | "wallet_signature_future" | "http_json_future";
export type AuthProviderCapability =
  | "read_local_identity"
  | "create_link_envelope"
  | "display_name_preview"
  | "telegram_identity_future"
  | "wallet_signature_future"
  | "server_session_future";

export type AuthLinkStatus = "local_only" | "ready_for_link_preview" | "linked_preview" | "backend_locked";
export type AuthRequirementId =
  | "local_player_id"
  | "display_name"
  | "provider_candidate"
  | "telegram_identity"
  | "wallet_signature"
  | "server_session"
  | "cloud_save_ready"
  | "public_submit_enabled";
export type AuthRequirementStatus = "ready" | "optional" | "missing" | "backend_locked";
export type AuthLinkLockId =
  | "remote_auth_missing"
  | "server_session_missing"
  | "telegram_identity_missing"
  | "wallet_signature_missing"
  | "cloud_save_locked"
  | "public_submit_disabled";

export interface AuthProviderDefinition {
  id: AuthProviderId;
  label: string;
  mode: AuthProviderMode;
  transport: AuthProviderTransport;
  backendLocked: boolean;
  publicLinkEnabled: boolean;
  capabilities: readonly AuthProviderCapability[];
  description: string;
}

export interface AuthRequirementRow {
  id: AuthRequirementId;
  label: string;
  status: AuthRequirementStatus;
  readyForLocalPreview: boolean;
  requiredBeforeRemote: readonly string[];
}

export interface AuthLinkIdentitySnapshot {
  localPlayerId: string;
  displayName: string;
  handle?: string;
  walletAddress?: string;
  authProviderId?: AuthProviderId;
  authSubjectId?: string;
  createdAtIso: string;
  lastSeenAtIso: string;
  backendLinked: boolean;
  validationStatus: SaveValidationStatus;
  status: AuthLinkStatus;
  locks: readonly AuthLinkLockId[];
}

export interface AuthLinkEnvelopeInput {
  providerId: AuthProviderId;
  identity: PlayerIdentityV2;
  backendLinked: boolean;
  validationStatus: SaveValidationStatus;
  createdAtIso?: string;
}

export interface AuthLinkEnvelope {
  id: string;
  version: string;
  providerId: AuthProviderId;
  routeKey: "auth.link";
  remotePath: "/api/game/auth/link";
  localPreviewOnly: boolean;
  publicLinkEnabled: boolean;
  backendLocked: boolean;
  identity: AuthLinkIdentitySnapshot;
  payloadPreview: {
    localPlayerId: string;
    displayName: string;
    handle?: string;
    walletAttached: boolean;
    backendLinked: boolean;
    validationStatus: SaveValidationStatus;
  };
  createdAtIso: string;
}

export interface AuthLinkSummary {
  version: string;
  providerCount: number;
  backendLockedProviderCount: number;
  publicLinkEnabled: boolean;
  requiredBeforeLive: readonly string[];
}

export interface AuthLinkSystemDefinition {
  version: string;
  goal: string;
  defaultProviderId: AuthProviderId;
  publicLinkEnabled: boolean;
  providers: readonly AuthProviderDefinition[];
  requirements: readonly AuthRequirementId[];
  locks: readonly AuthLinkLockId[];
  rules: readonly string[];
  requiredBeforeLive: readonly string[];
}
