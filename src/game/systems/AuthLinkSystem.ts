import type { PlayerProfile } from "../data/playerProfile";
import type {
  AuthLinkEnvelope,
  AuthLinkEnvelopeInput,
  AuthLinkIdentitySnapshot,
  AuthLinkLockId,
  AuthLinkStatus,
  AuthLinkSummary,
  AuthLinkSystemDefinition,
  AuthProviderDefinition,
  AuthProviderId,
  AuthRequirementRow,
} from "../types/AuthLinkTypes";
import type { PlayerIdentityV2, SaveValidationStatus } from "../types/SaveSchemaTypes";

export const AUTH_LINK_SYSTEM_VERSION = "0.13.5-auth-link-prep";

export const AUTH_LINK_PROVIDER_DEFINITIONS: readonly AuthProviderDefinition[] = [
  {
    id: "local_device",
    label: "Local Device Identity",
    mode: "local_preview",
    transport: "none",
    backendLocked: false,
    publicLinkEnabled: true,
    capabilities: ["read_local_identity", "create_link_envelope", "display_name_preview"],
    description: "Uses the existing local player id and display name as a safe offline identity preview.",
  },
  {
    id: "telegram_placeholder",
    label: "Telegram Identity Placeholder",
    mode: "remote_placeholder",
    transport: "telegram_future",
    backendLocked: true,
    publicLinkEnabled: false,
    capabilities: ["read_local_identity", "create_link_envelope", "telegram_identity_future"],
    description: "Reserved for future Telegram Mini App identity binding before leaderboards, tournaments and Leak Duels go live.",
  },
  {
    id: "wallet_placeholder",
    label: "Wallet Signature Placeholder",
    mode: "remote_placeholder",
    transport: "wallet_signature_future",
    backendLocked: true,
    publicLinkEnabled: false,
    capabilities: ["read_local_identity", "create_link_envelope", "wallet_signature_future"],
    description: "Reserved for future verified wallet ownership if token-gated tournaments or wallet-bound rewards are enabled later.",
  },
  {
    id: "backend_session_placeholder",
    label: "Backend Session Placeholder",
    mode: "remote_placeholder",
    transport: "http_json_future",
    backendLocked: true,
    publicLinkEnabled: false,
    capabilities: ["read_local_identity", "create_link_envelope", "server_session_future"],
    description: "Reserved for future server session creation, identity merge and account restore.",
  },
];

export const AUTH_LINK_SYSTEM_DEFINITION: AuthLinkSystemDefinition = {
  version: AUTH_LINK_SYSTEM_VERSION,
  goal: "Prepare one identity-link boundary for local player identity, future Telegram identity, future wallet signature and backend session linking without enabling remote auth yet.",
  defaultProviderId: "local_device",
  publicLinkEnabled: false,
  providers: AUTH_LINK_PROVIDER_DEFINITIONS,
  requirements: [
    "local_player_id",
    "display_name",
    "provider_candidate",
    "telegram_identity",
    "wallet_signature",
    "server_session",
    "cloud_save_ready",
    "public_submit_enabled",
  ],
  locks: [
    "remote_auth_missing",
    "server_session_missing",
    "telegram_identity_missing",
    "wallet_signature_missing",
    "cloud_save_locked",
    "public_submit_disabled",
  ],
  rules: [
    "Local identity may be previewed and attached to typed envelopes, but it is not trusted for ranked multiplayer rewards.",
    "Telegram, wallet and backend session providers remain placeholders until backend routes and signed verification exist.",
    "Leaderboard, tournament, Duel and boss-damage submissions must require a linked backend identity before public writes are enabled.",
    "Wallet identity can be used only as a future proof-of-ownership input; it must not directly grant combat power or unvalidated rewards.",
  ],
  requiredBeforeLive: [
    "backend /api/game/auth/link implementation",
    "server session id",
    "Telegram init data validation or wallet signature validation",
    "cloud save account binding",
    "remote player merge rules",
  ],
};

function hashText(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

function getProvider(providerId: AuthProviderId): AuthProviderDefinition {
  return AUTH_LINK_PROVIDER_DEFINITIONS.find((provider) => provider.id === providerId) ?? AUTH_LINK_PROVIDER_DEFINITIONS[0];
}

function normalizeProviderId(value: string | undefined, fallback: AuthProviderId): AuthProviderId {
  return AUTH_LINK_PROVIDER_DEFINITIONS.some((provider) => provider.id === value) ? (value as AuthProviderId) : fallback;
}

function getAuthStatus(identity: PlayerIdentityV2, backendLinked: boolean, providerId?: AuthProviderId): AuthLinkStatus {
  if (backendLinked) return "linked_preview";
  if (providerId && providerId !== "local_device") return "backend_locked";
  if (identity.localPlayerId && identity.displayName) return "ready_for_link_preview";
  return "local_only";
}

function getIdentityLocks(providerId: AuthProviderId, backendLinked: boolean): readonly AuthLinkLockId[] {
  if (backendLinked) return [];
  if (providerId === "local_device") return ["server_session_missing", "cloud_save_locked", "public_submit_disabled"];
  if (providerId === "telegram_placeholder") {
    return ["remote_auth_missing", "server_session_missing", "telegram_identity_missing", "cloud_save_locked", "public_submit_disabled"];
  }
  if (providerId === "wallet_placeholder") {
    return ["remote_auth_missing", "server_session_missing", "wallet_signature_missing", "cloud_save_locked", "public_submit_disabled"];
  }
  return ["remote_auth_missing", "server_session_missing", "cloud_save_locked", "public_submit_disabled"];
}

export function createAuthLinkIdentitySnapshot(
  identity: PlayerIdentityV2,
  backendLinked: boolean,
  validationStatus: SaveValidationStatus,
  providerId: AuthProviderId = AUTH_LINK_SYSTEM_DEFINITION.defaultProviderId,
): AuthLinkIdentitySnapshot {
  const provider = getProvider(providerId);
  const status = provider.backendLocked ? "backend_locked" : getAuthStatus(identity, backendLinked, providerId);

  return {
    localPlayerId: identity.localPlayerId,
    displayName: identity.displayName,
    handle: identity.handle,
    walletAddress: identity.walletAddress,
    authProviderId: normalizeProviderId(identity.authProviderId, providerId),
    authSubjectId: identity.authSubjectId,
    createdAtIso: identity.createdAtIso,
    lastSeenAtIso: identity.lastSeenAtIso,
    backendLinked,
    validationStatus,
    status,
    locks: getIdentityLocks(providerId, backendLinked),
  };
}

export function createAuthLinkIdentitySnapshotFromProfile(
  profile: PlayerProfile,
  providerId: AuthProviderId = AUTH_LINK_SYSTEM_DEFINITION.defaultProviderId,
): AuthLinkIdentitySnapshot {
  return createAuthLinkIdentitySnapshot(profile.identity, profile.sync.backendLinked, profile.sync.validationStatus, providerId);
}

export function createAuthLinkRequirementRows(profile: PlayerProfile): AuthRequirementRow[] {
  return [
    {
      id: "local_player_id",
      label: "Local Player ID",
      status: profile.identity.localPlayerId ? "ready" : "missing",
      readyForLocalPreview: Boolean(profile.identity.localPlayerId),
      requiredBeforeRemote: [],
    },
    {
      id: "display_name",
      label: "Display Name",
      status: profile.identity.displayName ? "ready" : "missing",
      readyForLocalPreview: Boolean(profile.identity.displayName),
      requiredBeforeRemote: [],
    },
    {
      id: "provider_candidate",
      label: "Provider Candidate",
      status: "ready",
      readyForLocalPreview: true,
      requiredBeforeRemote: ["Choose Telegram, wallet or backend session provider"],
    },
    {
      id: "telegram_identity",
      label: "Telegram Identity",
      status: "backend_locked",
      readyForLocalPreview: false,
      requiredBeforeRemote: ["Telegram Mini App init data validation", "server-side auth link route"],
    },
    {
      id: "wallet_signature",
      label: "Wallet Signature",
      status: profile.identity.walletAddress ? "optional" : "backend_locked",
      readyForLocalPreview: Boolean(profile.identity.walletAddress),
      requiredBeforeRemote: ["Wallet signature challenge", "verified public key binding"],
    },
    {
      id: "server_session",
      label: "Server Session",
      status: profile.sync.backendLinked ? "ready" : "backend_locked",
      readyForLocalPreview: false,
      requiredBeforeRemote: ["Backend session issue", "account restore token"],
    },
    {
      id: "cloud_save_ready",
      label: "Cloud Save Ready",
      status: profile.sync.backendLinked && profile.sync.provider === "future_backend" ? "ready" : "backend_locked",
      readyForLocalPreview: false,
      requiredBeforeRemote: ["Cloud save account binding", "server conflict policy"],
    },
    {
      id: "public_submit_enabled",
      label: "Public Submit Enabled",
      status: "backend_locked",
      readyForLocalPreview: false,
      requiredBeforeRemote: ["Backend config enables public writes after anti-cheat and reward ledger are active"],
    },
  ];
}

export function createAuthLinkEnvelope(input: AuthLinkEnvelopeInput): AuthLinkEnvelope {
  const createdAtIso = input.createdAtIso ?? new Date().toISOString();
  const provider = getProvider(input.providerId);
  const identity = createAuthLinkIdentitySnapshot(input.identity, input.backendLinked, input.validationStatus, input.providerId);
  const id = `auth-link-${hashText(`${input.providerId}:${identity.localPlayerId}:${createdAtIso.slice(0, 10)}`)}`;

  return {
    id,
    version: AUTH_LINK_SYSTEM_VERSION,
    providerId: input.providerId,
    routeKey: "auth.link",
    remotePath: "/api/game/auth/link",
    localPreviewOnly: true,
    publicLinkEnabled: false,
    backendLocked: provider.backendLocked || !input.backendLinked,
    identity,
    payloadPreview: {
      localPlayerId: identity.localPlayerId,
      displayName: identity.displayName,
      handle: identity.handle,
      walletAttached: Boolean(identity.walletAddress),
      backendLinked: input.backendLinked,
      validationStatus: input.validationStatus,
    },
    createdAtIso,
  };
}

export function createAuthLinkEnvelopeFromProfile(
  profile: PlayerProfile,
  providerId: AuthProviderId = AUTH_LINK_SYSTEM_DEFINITION.defaultProviderId,
): AuthLinkEnvelope {
  return createAuthLinkEnvelope({
    providerId,
    identity: profile.identity,
    backendLinked: profile.sync.backendLinked,
    validationStatus: profile.sync.validationStatus,
  });
}

export function getAuthLinkSummary(): AuthLinkSummary {
  return {
    version: AUTH_LINK_SYSTEM_VERSION,
    providerCount: AUTH_LINK_PROVIDER_DEFINITIONS.length,
    backendLockedProviderCount: AUTH_LINK_PROVIDER_DEFINITIONS.filter((provider) => provider.backendLocked).length,
    publicLinkEnabled: AUTH_LINK_SYSTEM_DEFINITION.publicLinkEnabled,
    requiredBeforeLive: AUTH_LINK_SYSTEM_DEFINITION.requiredBeforeLive,
  };
}
