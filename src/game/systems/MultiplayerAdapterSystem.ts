import type { PlayerProfile } from "../data/playerProfile";
import type {
  MultiplayerAdapterChannelId,
  MultiplayerAdapterEndpointDefinition,
  MultiplayerAdapterEnvelope,
  MultiplayerAdapterEnvelopeInput,
  MultiplayerAdapterProviderDefinition,
  MultiplayerAdapterReadinessRow,
  MultiplayerAdapterSummary,
  MultiplayerAdapterSystemDefinition,
  MultiplayerAdapterPayloadKind,
  MultiplayerAdapterLockId,
  MultiplayerAdapterSnapshot,
} from "../types/MultiplayerAdapterTypes";

export const MULTIPLAYER_ADAPTER_SYSTEM_VERSION = "0.13.2-run-validation-payload";

export const MULTIPLAYER_ADAPTER_PROVIDERS: readonly MultiplayerAdapterProviderDefinition[] = [
  {
    id: "local_preview_adapter",
    label: "Local Preview Adapter",
    mode: "local_preview",
    transport: "none",
    syncStatus: "local_only",
    capabilities: ["create_envelope", "queue_local_preview", "read_local_snapshot"],
    publicSubmitEnabled: false,
    description: "Creates typed multiplayer envelopes for UI, QA and balance previews without contacting a backend.",
  },
  {
    id: "remote_http_placeholder",
    label: "Remote HTTP Placeholder",
    mode: "remote_placeholder",
    transport: "http_json_future",
    syncStatus: "remote_not_configured",
    capabilities: ["create_envelope", "remote_submit_future", "remote_fetch_future", "remote_reconcile_future"],
    publicSubmitEnabled: false,
    description: "Reserved boundary for cloud save, leaderboard submit, tournament submit, Leak Duel submit and reward reconciliation.",
  },
];

export const MULTIPLAYER_ADAPTER_ENDPOINTS: readonly MultiplayerAdapterEndpointDefinition[] = [
  {
    channelId: "cloud_save",
    label: "Cloud Save Snapshot",
    payloadKind: "save_snapshot",
    providerId: "local_preview_adapter",
    routeKey: "save.sync",
    remotePath: "/api/game/save/sync",
    backendLocked: true,
    requiresAuth: true,
    requiresAntiCheat: false,
    requiresCloudSave: false,
    maxLocalPreviewQueue: 3,
    locks: ["remote_adapter_missing", "auth_required", "public_submit_disabled"],
  },
  {
    channelId: "run_validation_submit",
    label: "Run Validation Payload",
    payloadKind: "run_validation",
    providerId: "local_preview_adapter",
    routeKey: "run.validation.submit",
    remotePath: "/api/game/runs/validate",
    backendLocked: true,
    requiresAuth: true,
    requiresAntiCheat: false,
    requiresCloudSave: true,
    maxLocalPreviewQueue: 20,
    locks: ["remote_adapter_missing", "auth_required", "cloud_save_required", "run_validation_required", "public_submit_disabled"],
  },
  {
    channelId: "leaderboard_submit",
    label: "Leaderboard Submit",
    payloadKind: "leaderboard_score",
    providerId: "local_preview_adapter",
    routeKey: "leaderboard.submit",
    remotePath: "/api/game/leaderboard/submit",
    backendLocked: true,
    requiresAuth: true,
    requiresAntiCheat: true,
    requiresCloudSave: true,
    maxLocalPreviewQueue: 10,
    locks: ["remote_adapter_missing", "auth_required", "anti_cheat_required", "cloud_save_required", "public_submit_disabled"],
  },
  {
    channelId: "tournament_submit",
    label: "Tournament Run Submit",
    payloadKind: "tournament_run",
    providerId: "local_preview_adapter",
    routeKey: "tournament.submit",
    remotePath: "/api/game/tournaments/submit",
    backendLocked: true,
    requiresAuth: true,
    requiresAntiCheat: true,
    requiresCloudSave: true,
    maxLocalPreviewQueue: 10,
    locks: ["remote_adapter_missing", "auth_required", "anti_cheat_required", "run_validation_required", "reward_reconciliation_required", "public_submit_disabled"],
  },
  {
    channelId: "duel_submit",
    label: "Leak Duel Submit",
    payloadKind: "duel_result",
    providerId: "local_preview_adapter",
    routeKey: "duel.submit",
    remotePath: "/api/game/duels/submit",
    backendLocked: true,
    requiresAuth: true,
    requiresAntiCheat: true,
    requiresCloudSave: true,
    maxLocalPreviewQueue: 10,
    locks: ["remote_adapter_missing", "auth_required", "anti_cheat_required", "run_validation_required", "reward_reconciliation_required", "public_submit_disabled"],
  },
  {
    channelId: "boss_damage_submit",
    label: "Weekly Boss Damage Submit",
    payloadKind: "boss_damage",
    providerId: "local_preview_adapter",
    routeKey: "boss.damage.submit",
    remotePath: "/api/game/bosses/damage/submit",
    backendLocked: true,
    requiresAuth: true,
    requiresAntiCheat: true,
    requiresCloudSave: true,
    maxLocalPreviewQueue: 10,
    locks: ["remote_adapter_missing", "auth_required", "anti_cheat_required", "run_validation_required", "public_submit_disabled"],
  },
  {
    channelId: "economy_reconcile",
    label: "Economy Reconcile",
    payloadKind: "economy_event",
    providerId: "local_preview_adapter",
    routeKey: "economy.reconcile",
    remotePath: "/api/game/economy/reconcile",
    backendLocked: true,
    requiresAuth: true,
    requiresAntiCheat: false,
    requiresCloudSave: true,
    maxLocalPreviewQueue: 20,
    locks: ["remote_adapter_missing", "auth_required", "cloud_save_required", "reward_reconciliation_required", "public_submit_disabled"],
  },
  {
    channelId: "season_sync",
    label: "Season Sync",
    payloadKind: "season_progress",
    providerId: "local_preview_adapter",
    routeKey: "season.sync",
    remotePath: "/api/game/seasons/sync",
    backendLocked: true,
    requiresAuth: true,
    requiresAntiCheat: false,
    requiresCloudSave: true,
    maxLocalPreviewQueue: 5,
    locks: ["remote_adapter_missing", "auth_required", "cloud_save_required", "season_backend_required", "public_submit_disabled"],
  },
];

export const MULTIPLAYER_ADAPTER_SYSTEM_DEFINITION: MultiplayerAdapterSystemDefinition = {
  version: MULTIPLAYER_ADAPTER_SYSTEM_VERSION,
  goal: "Create one backend-ready adapter boundary for cloud save, leaderboard, tournaments, Leak Duel, boss damage and economy reconciliation while every remote submit remains disabled.",
  defaultProviderId: "local_preview_adapter",
  publicSubmitEnabled: false,
  providers: MULTIPLAYER_ADAPTER_PROVIDERS,
  endpoints: MULTIPLAYER_ADAPTER_ENDPOINTS,
  rules: [
    "Gameplay systems create typed envelopes instead of calling future backend endpoints directly.",
    "Local preview envelopes are allowed for UI, QA and balance diagnostics only.",
    "Remote submit stays disabled until auth, cloud save, run validation and anti-cheat exist.",
    "Leaderboard, tournament, Duel and boss submissions must include player identity, period key, source id and typed payload preview.",
    "Economy-affecting multiplayer rewards stay locked until backend reconciliation is implemented.",
  ],
  requiredBeforeLive: [
    "Auth Link Prep",
    "Cloud Save Adapter",
    "Run Validation Payload",
    "Anti-Cheat Skeleton",
    "Backend Config Layer",
  ],
};

function getEndpoint(channelId: MultiplayerAdapterChannelId): MultiplayerAdapterEndpointDefinition {
  const endpoint = MULTIPLAYER_ADAPTER_ENDPOINTS.find((candidate) => candidate.channelId === channelId);
  if (!endpoint) {
    throw new Error(`Unknown multiplayer adapter channel: ${channelId}`);
  }
  return endpoint;
}

function payloadKindToLabel(payloadKind: MultiplayerAdapterPayloadKind): string {
  return payloadKind.replace(/_/g, " ").toUpperCase();
}

function lockToRequirement(lock: MultiplayerAdapterLockId): string {
  if (lock === "remote_adapter_missing") return "Remote adapter implementation";
  if (lock === "auth_required") return "Player auth / identity link";
  if (lock === "anti_cheat_required") return "Anti-cheat validation";
  if (lock === "cloud_save_required") return "Cloud save adapter";
  if (lock === "run_validation_required") return "Run validation payload";
  if (lock === "reward_reconciliation_required") return "Backend reward reconciliation";
  if (lock === "season_backend_required") return "Season backend";
  return "Public submit enable switch";
}

function getProvider(providerId: MultiplayerAdapterProviderDefinition["id"]): MultiplayerAdapterProviderDefinition {
  const provider = MULTIPLAYER_ADAPTER_PROVIDERS.find((candidate) => candidate.id === providerId);
  if (!provider) {
    throw new Error(`Unknown multiplayer adapter provider: ${providerId}`);
  }
  return provider;
}

export function getMultiplayerAdapterEndpoint(channelId: MultiplayerAdapterChannelId): MultiplayerAdapterEndpointDefinition {
  return getEndpoint(channelId);
}

export function getMultiplayerAdapterReadinessRows(): MultiplayerAdapterReadinessRow[] {
  return MULTIPLAYER_ADAPTER_ENDPOINTS.map((endpoint) => {
    const provider = getProvider(endpoint.providerId);
    const canCreateEnvelope = provider.capabilities.includes("create_envelope");
    const canQueueLocalPreview = provider.capabilities.includes("queue_local_preview");
    const canSubmitRemote = false;
    return {
      channelId: endpoint.channelId,
      label: endpoint.label,
      providerId: endpoint.providerId,
      payloadKind: endpoint.payloadKind,
      canCreateEnvelope,
      canQueueLocalPreview,
      canSubmitRemote,
      backendLocked: endpoint.backendLocked,
      locks: endpoint.locks,
      requiredBeforeRemote: endpoint.locks.map(lockToRequirement),
      statusLabel: endpoint.backendLocked ? "BACKEND LOCKED" : "LOCAL PREVIEW",
    };
  });
}

function createEnvelopeId(input: MultiplayerAdapterEnvelopeInput, endpoint: MultiplayerAdapterEndpointDefinition): string {
  const base = `${endpoint.routeKey}:${input.playerId}:${input.sourceId}:${input.periodKey ?? "local"}`;
  let hash = 0;
  for (let index = 0; index < base.length; index += 1) {
    hash = (hash * 31 + base.charCodeAt(index)) >>> 0;
  }
  return `${endpoint.channelId}-${hash.toString(16).padStart(8, "0")}`;
}

export function createMultiplayerAdapterEnvelope(input: MultiplayerAdapterEnvelopeInput): MultiplayerAdapterEnvelope {
  const endpoint = getEndpoint(input.channelId);
  const createdAtIso = input.createdAtIso ?? new Date().toISOString();
  const periodKey = input.periodKey ?? createdAtIso.slice(0, 10);

  return {
    id: createEnvelopeId({ ...input, periodKey, createdAtIso }, endpoint),
    channelId: endpoint.channelId,
    payloadKind: endpoint.payloadKind,
    providerId: endpoint.providerId,
    playerId: input.playerId,
    displayName: input.displayName,
    sourceId: input.sourceId,
    value: input.value,
    periodKey,
    status: endpoint.backendLocked ? "blocked_backend_required" : "local_preview",
    localPreviewOnly: true,
    remoteSubmitEnabled: false,
    backendLocked: endpoint.backendLocked,
    locks: endpoint.locks,
    payloadPreview: {
      routeKey: endpoint.routeKey,
      payloadKind: payloadKindToLabel(endpoint.payloadKind),
      requiresAuth: endpoint.requiresAuth,
      requiresAntiCheat: endpoint.requiresAntiCheat,
      requiresCloudSave: endpoint.requiresCloudSave,
      ...input.payloadPreview,
    },
    createdAtIso,
  };
}

function getDisplayName(profile: PlayerProfile): string {
  return profile.identity?.displayName || "Local BROKE Player";
}

function getPlayerId(profile: PlayerProfile): string {
  return profile.identity?.localPlayerId || "local-player";
}

export function createMultiplayerAdapterSnapshot(profile: PlayerProfile, date = new Date()): MultiplayerAdapterSnapshot {
  const createdAtIso = date.toISOString();
  const playerId = getPlayerId(profile);
  const displayName = getDisplayName(profile);
  const readinessRows = getMultiplayerAdapterReadinessRows();
  const sampleEnvelopes = [
    createMultiplayerAdapterEnvelope({
      channelId: "run_validation_submit",
      playerId,
      displayName,
      sourceId: "arena-run-validation-preview",
      value: profile.bestScore,
      periodKey: createdAtIso.slice(0, 10),
      payloadPreview: { source: "arena", validationTier: "backend_required" },
      createdAtIso,
    }),
    createMultiplayerAdapterEnvelope({
      channelId: "leaderboard_submit",
      playerId,
      displayName,
      sourceId: "weekly-arena-preview",
      value: profile.bestScore,
      periodKey: createdAtIso.slice(0, 10),
      payloadPreview: { leaderboardId: "weekly_arena", validationTier: "backend_required" },
      createdAtIso,
    }),
    createMultiplayerAdapterEnvelope({
      channelId: "tournament_submit",
      playerId,
      displayName,
      sourceId: "no-spend-cup-preview",
      value: profile.tournamentPoints,
      periodKey: createdAtIso.slice(0, 10),
      payloadPreview: { tournamentId: "no_spend_arena", validationTier: "backend_required" },
      createdAtIso,
    }),
    createMultiplayerAdapterEnvelope({
      channelId: "duel_submit",
      playerId,
      displayName,
      sourceId: "leak-duel-preview",
      value: profile.rankPoints,
      periodKey: createdAtIso.slice(0, 10),
      payloadPreview: { duelId: "leak_duel", validationTier: "backend_required" },
      createdAtIso,
    }),
  ];

  return {
    version: MULTIPLAYER_ADAPTER_SYSTEM_VERSION,
    providerId: MULTIPLAYER_ADAPTER_SYSTEM_DEFINITION.defaultProviderId,
    generatedAtIso: createdAtIso,
    playerIdentity: profile.identity,
    publicSubmitEnabled: false,
    localPreviewOnly: true,
    endpointCount: MULTIPLAYER_ADAPTER_ENDPOINTS.length,
    backendLockedCount: MULTIPLAYER_ADAPTER_ENDPOINTS.filter((endpoint) => endpoint.backendLocked).length,
    readinessRows,
    sampleEnvelopes,
    requiredBeforeLive: MULTIPLAYER_ADAPTER_SYSTEM_DEFINITION.requiredBeforeLive,
  };
}

export function getMultiplayerAdapterSummary(): MultiplayerAdapterSummary {
  return {
    version: MULTIPLAYER_ADAPTER_SYSTEM_VERSION,
    providerId: MULTIPLAYER_ADAPTER_SYSTEM_DEFINITION.defaultProviderId,
    endpointCount: MULTIPLAYER_ADAPTER_ENDPOINTS.length,
    backendLockedCount: MULTIPLAYER_ADAPTER_ENDPOINTS.filter((endpoint) => endpoint.backendLocked).length,
    publicSubmitEnabled: false,
    requiredBeforeLive: MULTIPLAYER_ADAPTER_SYSTEM_DEFINITION.requiredBeforeLive,
  };
}
