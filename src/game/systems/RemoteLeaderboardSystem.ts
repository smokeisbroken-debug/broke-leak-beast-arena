import type { PlayerProfile } from "../data/playerProfile";
import { LEADERBOARD_DEFINITIONS, getLeaderboardDefinition, getLeaderboardPeriodKey, getLeaderboardReadiness, isLeaderboardBackendLocked, type LeaderboardId } from "../types/LeaderboardTypes";
import { createAuthLinkEnvelopeFromProfile } from "./AuthLinkSystem";
import { createCloudSaveProfileHash } from "./CloudSaveAdapterSystem";
import { getBackendConfigRoute } from "./BackendConfigSystem";
import { createLeaderboardAdapterSnapshot, createLeaderboardAdapterSubmitPreview } from "./LeaderboardAdapterSystem";
import { createMultiplayerAdapterEnvelope } from "./MultiplayerAdapterSystem";
import type {
  RemoteLeaderboardFetchPreview,
  RemoteLeaderboardLockId,
  RemoteLeaderboardPreviewMap,
  RemoteLeaderboardReadinessRow,
  RemoteLeaderboardRouteDefinition,
  RemoteLeaderboardStatus,
  RemoteLeaderboardSubmitPreview,
  RemoteLeaderboardSummary,
  RemoteLeaderboardSystemDefinition,
} from "../types/RemoteLeaderboardTypes";

export const REMOTE_LEADERBOARD_SYSTEM_VERSION = "0.13.6-remote-leaderboard";

export const REMOTE_LEADERBOARD_LOCKS: readonly RemoteLeaderboardLockId[] = [
  "remote_config_required",
  "backend_identity_required",
  "cloud_save_required",
  "run_validation_required",
  "anti_cheat_required",
  "server_clock_required",
  "server_seed_required",
  "public_submit_disabled",
];

export const REMOTE_LEADERBOARD_ROUTES: readonly RemoteLeaderboardRouteDefinition[] = [
  {
    operationId: "fetch_snapshot",
    label: "Remote Leaderboard Fetch",
    routeKey: "leaderboard.fetch",
    method: "GET",
    remotePath: "/api/game/leaderboard",
    transport: "http_json_future",
    backendLocked: true,
    publicWriteEnabled: false,
    localPreviewOnly: true,
    locks: ["remote_config_required", "public_submit_disabled"],
    description: "Future signed remote leaderboard read endpoint. The UI continues to use local mock snapshots until remote config is enabled.",
  },
  {
    operationId: "submit_score",
    label: "Remote Leaderboard Submit",
    routeKey: "leaderboard.submit",
    method: "POST",
    remotePath: "/api/game/leaderboard/submit",
    transport: "http_json_future",
    backendLocked: true,
    publicWriteEnabled: false,
    localPreviewOnly: true,
    locks: [
      "backend_identity_required",
      "cloud_save_required",
      "run_validation_required",
      "anti_cheat_required",
      "server_clock_required",
      "server_seed_required",
      "public_submit_disabled",
    ],
    description: "Future public score submission endpoint. It remains locked until identity, cloud save, server validation and anti-cheat are live.",
  },
  {
    operationId: "reconcile_entry",
    label: "Remote Leaderboard Reconcile",
    routeKey: "leaderboard.submit",
    method: "POST",
    remotePath: "/api/game/leaderboard/submit",
    transport: "http_json_future",
    backendLocked: true,
    publicWriteEnabled: false,
    localPreviewOnly: true,
    locks: ["backend_identity_required", "cloud_save_required", "server_clock_required", "public_submit_disabled"],
    description: "Future server reconciliation for a submitted leaderboard entry, rank delta and reward-safe status.",
  },
];

export const REMOTE_LEADERBOARD_SYSTEM_DEFINITION: RemoteLeaderboardSystemDefinition = {
  version: REMOTE_LEADERBOARD_SYSTEM_VERSION,
  goal: "Prepare remote leaderboard read/submit/reconcile contracts while every public leaderboard write remains backend-locked and local previews stay safe.",
  remoteReadEnabled: false,
  remoteSubmitEnabled: false,
  publicSubmitEnabled: false,
  supportedLeaderboards: LEADERBOARD_DEFINITIONS.map((leaderboard) => leaderboard.id),
  routes: REMOTE_LEADERBOARD_ROUTES,
  locks: REMOTE_LEADERBOARD_LOCKS,
  rules: [
    "Remote leaderboard fetch is described through typed route contracts, but the scene still reads deterministic local mock snapshots.",
    "Every score submit preview includes identity, cloud profile hash, adapter submit payload and multiplayer envelope metadata.",
    "Global Power can be previewed locally, but public ranking still requires backend profile snapshot validation.",
    "Arena, task, tournament, Duel and boss leaderboards remain locked behind run validation, anti-cheat, server clock and server seed checks.",
    "No token, reward, tournament or rank-point outcome is made authoritative by this local client patch.",
  ],
  requiredBeforeLive: [
    "remote leaderboard fetch endpoint",
    "remote leaderboard submit endpoint",
    "server identity session",
    "cloud save profile hash validation",
    "run validation payload acceptance",
    "backend anti-cheat reconstruction",
    "server period reset service",
  ],
};

const LOCK_REQUIREMENTS: Record<RemoteLeaderboardLockId, string> = {
  remote_config_required: "Signed remote config / route enable switch",
  backend_identity_required: "Linked backend player identity",
  cloud_save_required: "Cloud save profile hash validation",
  run_validation_required: "Server accepted run validation payload",
  anti_cheat_required: "Backend anti-cheat reconstruction",
  server_clock_required: "Server clock and period key validation",
  server_seed_required: "Server seed / event ruleset verification",
  public_submit_disabled: "Public submit enable switch",
};

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(",")}}`;
}

function hashText(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

function getLocksForLeaderboard(leaderboardId: LeaderboardId): RemoteLeaderboardLockId[] {
  const definition = getLeaderboardDefinition(leaderboardId);
  const locks: RemoteLeaderboardLockId[] = ["backend_identity_required", "cloud_save_required", "server_clock_required", "public_submit_disabled"];

  if (definition.resetRule === "weekly" || definition.resetRule === "season" || definition.resetRule === "event") {
    locks.push("server_seed_required");
  }
  if (isLeaderboardBackendLocked(leaderboardId)) {
    locks.push("run_validation_required");
  }
  if (definition.antiCheatRequired) {
    locks.push("anti_cheat_required");
  }
  return Array.from(new Set(locks));
}

function getStatusForLeaderboard(leaderboardId: LeaderboardId): RemoteLeaderboardStatus {
  return isLeaderboardBackendLocked(leaderboardId) ? "blocked_backend_required" : "remote_submit_locked";
}

function getRequiredBeforeRemote(locks: readonly RemoteLeaderboardLockId[]): string[] {
  return locks.map((lock) => LOCK_REQUIREMENTS[lock]);
}

function createPreviewId(kind: string, leaderboardId: LeaderboardId, periodKey: string, playerId?: string): string {
  return `${kind}-${hashText(`${leaderboardId}:${periodKey}:${playerId ?? "anonymous"}`)}`;
}

export function getRemoteLeaderboardRoute(operationId: RemoteLeaderboardRouteDefinition["operationId"]): RemoteLeaderboardRouteDefinition {
  const route = REMOTE_LEADERBOARD_ROUTES.find((candidate) => candidate.operationId === operationId);
  if (!route) {
    throw new Error(`Unknown remote leaderboard operation: ${operationId}`);
  }
  return route;
}

export function createRemoteLeaderboardReadinessRow(
  leaderboardId: LeaderboardId,
  date = new Date(),
): RemoteLeaderboardReadinessRow {
  const definition = getLeaderboardDefinition(leaderboardId);
  const readiness = getLeaderboardReadiness(leaderboardId);
  const locks = getLocksForLeaderboard(leaderboardId);
  return {
    leaderboardId,
    title: definition.title,
    metric: definition.metric,
    periodKey: getLeaderboardPeriodKey(leaderboardId, date),
    fetchStatus: "remote_read_locked",
    submitStatus: getStatusForLeaderboard(leaderboardId),
    remoteReadEnabled: false,
    remoteSubmitEnabled: false,
    requiresAntiCheat: readiness.antiCheatRequired,
    requiresBackendValidation: readiness.backendValidationRequired,
    locks,
    requiredBeforeRemote: getRequiredBeforeRemote(locks),
  };
}

export function getRemoteLeaderboardReadinessRows(date = new Date()): RemoteLeaderboardReadinessRow[] {
  return LEADERBOARD_DEFINITIONS.map((leaderboard) => createRemoteLeaderboardReadinessRow(leaderboard.id, date));
}

export function createRemoteLeaderboardFetchPreview(
  leaderboardId: LeaderboardId,
  profile: PlayerProfile,
  date = new Date(),
  limit = 25,
  offset = 0,
): RemoteLeaderboardFetchPreview {
  const route = getBackendConfigRoute("leaderboard.fetch");
  const adapterSnapshot = createLeaderboardAdapterSnapshot(leaderboardId, profile, date);
  const periodKey = getLeaderboardPeriodKey(leaderboardId, date);
  return {
    id: createPreviewId("remote-leaderboard-fetch", leaderboardId, periodKey),
    leaderboardId,
    operationId: "fetch_snapshot",
    routeKey: "leaderboard.fetch",
    remotePath: route.path,
    method: "GET",
    periodKey,
    limit,
    offset,
    generatedAtIso: date.toISOString(),
    status: "remote_read_locked",
    remoteReadEnabled: false,
    localPreviewOnly: true,
    locks: ["remote_config_required", "public_submit_disabled"],
    queryPreview: {
      leaderboardId,
      periodKey,
      limit,
      offset,
    },
    adapterSnapshot,
  };
}

export function createRemoteLeaderboardSubmitPreview(
  leaderboardId: LeaderboardId,
  profile: PlayerProfile,
  date = new Date(),
): RemoteLeaderboardSubmitPreview {
  const route = getBackendConfigRoute("leaderboard.submit");
  const definition = getLeaderboardDefinition(leaderboardId);
  const adapterSubmitPreview = createLeaderboardAdapterSubmitPreview(leaderboardId, profile, date);
  const payload = adapterSubmitPreview.payload;
  const authEnvelope = createAuthLinkEnvelopeFromProfile(profile);
  const cloudProfileHash = createCloudSaveProfileHash(profile);
  const locks = getLocksForLeaderboard(leaderboardId);
  const payloadPreview = {
    leaderboardId,
    periodKey: payload.periodKey,
    metric: definition.metric,
    value: payload.value,
    validationTier: payload.validationTier,
    backendValidationRequired: payload.backendValidationRequired,
    antiCheatRequired: payload.antiCheatRequired,
    cloudProfileHash,
  };
  const payloadHash = hashText(stableStringify({ payloadPreview, scoreBreakdown: payload.scoreBreakdown, playerId: payload.playerId }));
  const multiplayerEnvelope = createMultiplayerAdapterEnvelope({
    channelId: "leaderboard_submit",
    playerId: payload.playerId,
    displayName: payload.displayName,
    sourceId: `leaderboard:${leaderboardId}`,
    value: payload.value,
    periodKey: payload.periodKey,
    payloadPreview: {
      leaderboardId,
      metric: definition.metric,
      payloadHash,
      validationTier: payload.validationTier,
      backendValidationRequired: payload.backendValidationRequired,
      antiCheatRequired: payload.antiCheatRequired,
    },
    createdAtIso: date.toISOString(),
  });

  return {
    id: createPreviewId("remote-leaderboard-submit", leaderboardId, payload.periodKey, payload.playerId),
    leaderboardId,
    operationId: "submit_score",
    routeKey: "leaderboard.submit",
    remotePath: route.path,
    method: "POST",
    playerId: payload.playerId,
    displayName: payload.displayName,
    periodKey: payload.periodKey,
    value: payload.value,
    metric: definition.metric,
    payloadHash,
    generatedAtIso: date.toISOString(),
    submissionStatus: payload.submissionStatus,
    status: getStatusForLeaderboard(leaderboardId),
    remoteSubmitEnabled: false,
    localPreviewOnly: true,
    locks,
    requiredBeforeRemote: getRequiredBeforeRemote(locks),
    authEnvelope,
    cloudProfileHash,
    adapterSubmitPreview,
    multiplayerEnvelope,
    payloadPreview,
  };
}

export function createRemoteLeaderboardSubmitPreviewMap(profile: PlayerProfile, date = new Date()): RemoteLeaderboardPreviewMap {
  return LEADERBOARD_DEFINITIONS.reduce<RemoteLeaderboardPreviewMap>((map, leaderboard) => {
    map[leaderboard.id] = createRemoteLeaderboardSubmitPreview(leaderboard.id, profile, date);
    return map;
  }, {} as RemoteLeaderboardPreviewMap);
}

export function getRemoteLeaderboardSummary(): RemoteLeaderboardSummary {
  return {
    version: REMOTE_LEADERBOARD_SYSTEM_VERSION,
    leaderboardCount: LEADERBOARD_DEFINITIONS.length,
    backendLockedCount: LEADERBOARD_DEFINITIONS.filter((leaderboard) => isLeaderboardBackendLocked(leaderboard.id)).length,
    remoteReadEnabled: REMOTE_LEADERBOARD_SYSTEM_DEFINITION.remoteReadEnabled,
    remoteSubmitEnabled: REMOTE_LEADERBOARD_SYSTEM_DEFINITION.remoteSubmitEnabled,
    publicSubmitEnabled: REMOTE_LEADERBOARD_SYSTEM_DEFINITION.publicSubmitEnabled,
    requiredBeforeLive: REMOTE_LEADERBOARD_SYSTEM_DEFINITION.requiredBeforeLive,
  };
}
