import type { PlayerProfile } from "../data/playerProfile";
import {
  DUEL_DEFINITIONS,
  getDuelDefinition,
  getDuelReadiness,
  isDuelBackendLocked,
  type DuelModeId,
} from "../types/DuelTypes";
import { createAuthLinkEnvelopeFromProfile } from "./AuthLinkSystem";
import { getBackendConfigRoute } from "./BackendConfigSystem";
import { createCloudSaveProfileHash } from "./CloudSaveAdapterSystem";
import { createDuelLeaderboardSubmitPreview } from "./DuelLeaderboardLinkSystem";
import { createDuelResultPreview } from "./DuelResultSystem";
import { createMultiplayerAdapterEnvelope } from "./MultiplayerAdapterSystem";
import type {
  RemoteDuelFetchPreview,
  RemoteDuelSubmitLockId,
  RemoteDuelSubmitPreview,
  RemoteDuelSubmitPreviewMap,
  RemoteDuelSubmitReadinessRow,
  RemoteDuelSubmitRouteDefinition,
  RemoteDuelSubmitStatus,
  RemoteDuelSubmitSummary,
  RemoteDuelSubmitSystemDefinition,
} from "../types/RemoteDuelSubmitTypes";

export const REMOTE_DUEL_SUBMIT_SYSTEM_VERSION = "0.13.8-remote-duel-submit";

export const REMOTE_DUEL_SUBMIT_LOCKS: readonly RemoteDuelSubmitLockId[] = [
  "remote_config_required",
  "backend_identity_required",
  "cloud_save_required",
  "run_validation_required",
  "anti_cheat_required",
  "server_clock_required",
  "server_seed_required",
  "opponent_result_required",
  "matchmaking_required",
  "duplicate_submit_protection_required",
  "reward_reconciliation_required",
  "public_submit_disabled",
];

export const REMOTE_DUEL_SUBMIT_ROUTES: readonly RemoteDuelSubmitRouteDefinition[] = [
  {
    operationId: "fetch_match",
    label: "Remote Duel Match Fetch",
    routeKey: "duel.fetch",
    method: "GET",
    remotePath: "/api/game/duels",
    transport: "http_json_future",
    backendLocked: true,
    publicWriteEnabled: false,
    localPreviewOnly: true,
    locks: ["remote_config_required", "backend_identity_required", "server_clock_required", "server_seed_required", "matchmaking_required", "public_submit_disabled"],
    description: "Future signed Leak Duel match read endpoint. The local client only previews fixed async duel contracts until backend matchmaking and seed issuance exist.",
  },
  {
    operationId: "submit_result",
    label: "Remote Duel Result Submit",
    routeKey: "duel.submit",
    method: "POST",
    remotePath: "/api/game/duels/submit",
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
      "opponent_result_required",
      "duplicate_submit_protection_required",
      "reward_reconciliation_required",
      "public_submit_disabled",
    ],
    description: "Future ranked Leak Duel result submission endpoint. It stays locked until both player results, seed hash, anti-cheat and duplicate-submit checks are server-side.",
  },
  {
    operationId: "reconcile_rewards",
    label: "Remote Duel Reward Reconcile",
    routeKey: "economy.reconcile",
    method: "POST",
    remotePath: "/api/game/economy/reconcile",
    transport: "http_json_future",
    backendLocked: true,
    publicWriteEnabled: false,
    localPreviewOnly: true,
    locks: [
      "backend_identity_required",
      "cloud_save_required",
      "server_clock_required",
      "opponent_result_required",
      "reward_reconciliation_required",
      "duplicate_submit_protection_required",
      "public_submit_disabled",
    ],
    description: "Future reward-ledger reconciliation after a Duel result is accepted. Rank Points, Leak Points and win rewards remain preview-only locally.",
  },
];

export const REMOTE_DUEL_SUBMIT_SYSTEM_DEFINITION: RemoteDuelSubmitSystemDefinition = {
  version: REMOTE_DUEL_SUBMIT_SYSTEM_VERSION,
  goal: "Prepare backend-ready Leak Duel fetch, result-submit and reward-reconcile contracts while every public duel write remains disabled.",
  remoteReadEnabled: false,
  remoteSubmitEnabled: false,
  publicSubmitEnabled: false,
  supportedDuelIds: DUEL_DEFINITIONS.map((duel) => duel.id),
  routes: REMOTE_DUEL_SUBMIT_ROUTES,
  locks: REMOTE_DUEL_SUBMIT_LOCKS,
  rules: [
    "Remote Duel submit previews are created from the existing result and duel_ranked leaderboard-link contracts instead of inventing a second score shape.",
    "Every submit preview includes identity, cloud profile hash, same-seed result, rank-point payload and multiplayer envelope metadata.",
    "Async Duel remains the first multiplayer form: both players must be reconciled against the same seed before any ranked result is public.",
    "Live Duel stays locked until matchmaking, reconnect, server authority and anti-cheat are implemented remotely.",
    "No Rank Points, Leak Points, XP, win rewards or leaderboard placements become authoritative in this local client patch.",
  ],
  requiredBeforeLive: [
    "remote duel fetch endpoint",
    "remote duel result submit endpoint",
    "backend player identity session",
    "cloud save profile hash validation",
    "server-generated duel seed and ruleset hash",
    "opponent result reconciliation",
    "run validation payload acceptance",
    "backend anti-cheat reconstruction",
    "duplicate submit protection per match id",
    "reward reconciliation ledger",
  ],
};

const LOCK_REQUIREMENTS: Record<RemoteDuelSubmitLockId, string> = {
  remote_config_required: "Signed Duel remote config / route enable switch",
  backend_identity_required: "Linked backend player identity",
  cloud_save_required: "Cloud save profile hash validation",
  run_validation_required: "Server accepted run validation payload",
  anti_cheat_required: "Backend anti-cheat reconstruction",
  server_clock_required: "Server clock and Duel period validation",
  server_seed_required: "Server-generated Duel seed and ruleset hash",
  opponent_result_required: "Opponent result reconciliation",
  matchmaking_required: "Remote matchmaking or invite identity",
  duplicate_submit_protection_required: "Duplicate submit protection for match id",
  reward_reconciliation_required: "Backend reward reconciliation ledger",
  public_submit_disabled: "Public Duel submit enable switch",
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

function getDisplayName(profile: PlayerProfile): string {
  return profile.identity?.displayName || "Local BROKE Duelist";
}

function getPlayerId(profile: PlayerProfile): string {
  return profile.identity?.localPlayerId || "local-duel-player";
}

function getRequiredBeforeRemote(locks: readonly RemoteDuelSubmitLockId[]): string[] {
  return locks.map((lock) => LOCK_REQUIREMENTS[lock]);
}

function getLocksForDuel(duelId: DuelModeId): RemoteDuelSubmitLockId[] {
  const duel = getDuelDefinition(duelId);
  const readiness = getDuelReadiness(duelId);
  const locks: RemoteDuelSubmitLockId[] = [
    "backend_identity_required",
    "cloud_save_required",
    "run_validation_required",
    "server_clock_required",
    "server_seed_required",
    "opponent_result_required",
    "duplicate_submit_protection_required",
    "reward_reconciliation_required",
    "public_submit_disabled",
  ];

  if (!duel.asyncFirst || duel.backendStatus === "remote_required") {
    locks.push("matchmaking_required");
  }
  if (readiness.antiCheatRequired || duel.antiCheatRequired) {
    locks.push("anti_cheat_required");
  }
  if (duel.backendStatus === "remote_required" || isDuelBackendLocked(duelId)) {
    locks.push("remote_config_required");
  }
  return Array.from(new Set(locks));
}

function getStatusForDuel(duelId: DuelModeId): RemoteDuelSubmitStatus {
  return isDuelBackendLocked(duelId) ? "blocked_backend_required" : "remote_submit_locked";
}

function createPreviewId(kind: string, duelId: DuelModeId, periodKey: string, matchId?: string): string {
  return `${kind}-${hashText(`${duelId}:${periodKey}:${matchId ?? "preview"}`)}`;
}

export function getRemoteDuelSubmitRoute(operationId: RemoteDuelSubmitRouteDefinition["operationId"]): RemoteDuelSubmitRouteDefinition {
  const route = REMOTE_DUEL_SUBMIT_ROUTES.find((candidate) => candidate.operationId === operationId);
  if (!route) {
    throw new Error(`Unknown remote duel submit operation: ${operationId}`);
  }
  return route;
}

export function createRemoteDuelSubmitReadinessRow(duelId: DuelModeId): RemoteDuelSubmitReadinessRow {
  const duel = getDuelDefinition(duelId);
  const readiness = getDuelReadiness(duelId);
  const locks = getLocksForDuel(duelId);
  return {
    duelId,
    title: duel.title,
    leaderboardId: duel.leaderboardId,
    periodKey: duel.eventWindow.periodKey,
    fetchStatus: "remote_read_locked",
    submitStatus: getStatusForDuel(duelId),
    remoteReadEnabled: false,
    remoteSubmitEnabled: false,
    asyncFirst: duel.asyncFirst,
    requiresAntiCheat: readiness.antiCheatRequired,
    requiresBackendValidation: readiness.backendValidationRequired,
    locks,
    requiredBeforeRemote: getRequiredBeforeRemote(locks),
  };
}

export function getRemoteDuelSubmitReadinessRows(): RemoteDuelSubmitReadinessRow[] {
  return DUEL_DEFINITIONS.map((duel) => createRemoteDuelSubmitReadinessRow(duel.id));
}

export function createRemoteDuelFetchPreview(duelId: DuelModeId, date = new Date()): RemoteDuelFetchPreview {
  const route = getBackendConfigRoute("duel.fetch");
  const periodKey = getDuelDefinition(duelId).eventWindow.periodKey;
  return {
    id: createPreviewId("remote-duel-fetch", duelId, periodKey),
    duelId,
    operationId: "fetch_match",
    routeKey: "duel.fetch",
    remotePath: route.path,
    method: "GET",
    periodKey,
    generatedAtIso: date.toISOString(),
    status: "remote_read_locked",
    remoteReadEnabled: false,
    localPreviewOnly: true,
    locks: ["remote_config_required", "backend_identity_required", "server_clock_required", "server_seed_required", "matchmaking_required", "public_submit_disabled"],
    queryPreview: {
      duelId,
      periodKey,
      includeSeed: true,
      includeOpponent: true,
    },
  };
}

export function createRemoteDuelSubmitPreview(
  duelId: DuelModeId,
  profile: PlayerProfile,
  date = new Date(),
): RemoteDuelSubmitPreview {
  const route = getBackendConfigRoute("duel.submit");
  const duel = getDuelDefinition(duelId);
  const resultPreview = createDuelResultPreview(duelId);
  const playerId = getPlayerId(profile);
  const displayName = getDisplayName(profile);
  const periodKey = duel.eventWindow.periodKey;
  const matchId = `remote-duel:${duelId}:${resultPreview.seed.seedId}:${resultPreview.versus.outcome}`;
  const cloudProfileHash = createCloudSaveProfileHash(profile);
  const authEnvelope = createAuthLinkEnvelopeFromProfile(profile);
  const leaderboardSubmitPreview = createDuelLeaderboardSubmitPreview({
    duelId,
    playerId,
    displayName,
    matchId,
    source: "duel_result_preview",
    duelScore: resultPreview.localPlayer.score.totalScore,
    opponentScore: resultPreview.opponent.score.totalScore,
    outcome: resultPreview.outcome,
    scoreMargin: resultPreview.scoreMargin,
    periodKey,
    completedAtIso: date.toISOString(),
  });
  const localScore = resultPreview.localPlayer.score.totalScore;
  const opponentScore = resultPreview.opponent.score.totalScore;
  const rankPoints = leaderboardSubmitPreview.value;
  const locks = getLocksForDuel(duelId);
  const payloadPreview = {
    duelId,
    leaderboardId: duel.leaderboardId,
    periodKey,
    matchId,
    seedId: resultPreview.seed.seedId,
    seedKey: resultPreview.seed.seedKey,
    localScore,
    opponentScore,
    scoreMargin: resultPreview.scoreMargin,
    outcome: resultPreview.outcome,
    rankPoints,
    validationTier: leaderboardSubmitPreview.validationTier,
    backendValidationRequired: true,
    antiCheatRequired: duel.antiCheatRequired,
    opponentResultRequired: true,
    duplicateSubmitProtectionRequired: true,
    rewardReconciliationRequired: true,
    cloudProfileHash,
  };
  const payloadHash = hashText(stableStringify({ payloadPreview, scoreBreakdown: resultPreview.localPlayer.score.breakdown, playerId }));
  const multiplayerEnvelope = createMultiplayerAdapterEnvelope({
    channelId: "duel_submit",
    playerId,
    displayName,
    sourceId: `duel:${duelId}:${matchId}`,
    value: rankPoints,
    periodKey,
    payloadPreview: {
      duelId,
      leaderboardId: duel.leaderboardId,
      matchId,
      payloadHash,
      seedKey: resultPreview.seed.seedKey,
      backendValidationRequired: true,
      antiCheatRequired: duel.antiCheatRequired,
      opponentResultRequired: true,
      rewardReconciliationRequired: true,
    },
    createdAtIso: date.toISOString(),
  });

  return {
    id: createPreviewId("remote-duel-submit", duelId, periodKey, matchId),
    duelId,
    leaderboardId: duel.leaderboardId,
    operationId: "submit_result",
    routeKey: "duel.submit",
    remotePath: route.path,
    method: "POST",
    playerId,
    displayName,
    periodKey,
    matchId,
    outcome: resultPreview.outcome,
    localScore,
    opponentScore,
    scoreMargin: resultPreview.scoreMargin,
    rankPoints,
    payloadHash,
    generatedAtIso: date.toISOString(),
    status: getStatusForDuel(duelId),
    remoteSubmitEnabled: false,
    localPreviewOnly: true,
    locks,
    requiredBeforeRemote: getRequiredBeforeRemote(locks),
    authEnvelope,
    cloudProfileHash,
    resultPreview,
    leaderboardSubmitPreview,
    multiplayerEnvelope,
    payloadPreview,
  };
}

export function createRemoteDuelSubmitPreviewMap(profile: PlayerProfile, date = new Date()): RemoteDuelSubmitPreviewMap {
  return DUEL_DEFINITIONS.reduce<RemoteDuelSubmitPreviewMap>((map, duel) => {
    map[duel.id] = createRemoteDuelSubmitPreview(duel.id, profile, date);
    return map;
  }, {} as RemoteDuelSubmitPreviewMap);
}

export function getRemoteDuelSubmitSummary(): RemoteDuelSubmitSummary {
  return {
    version: REMOTE_DUEL_SUBMIT_SYSTEM_VERSION,
    duelCount: DUEL_DEFINITIONS.length,
    backendLockedCount: DUEL_DEFINITIONS.filter((duel) => isDuelBackendLocked(duel.id)).length,
    remoteReadEnabled: REMOTE_DUEL_SUBMIT_SYSTEM_DEFINITION.remoteReadEnabled,
    remoteSubmitEnabled: REMOTE_DUEL_SUBMIT_SYSTEM_DEFINITION.remoteSubmitEnabled,
    publicSubmitEnabled: REMOTE_DUEL_SUBMIT_SYSTEM_DEFINITION.publicSubmitEnabled,
    requiredBeforeLive: REMOTE_DUEL_SUBMIT_SYSTEM_DEFINITION.requiredBeforeLive,
  };
}
