import type { PlayerProfile } from "../data/playerProfile";
import {
  TOURNAMENT_DEFINITIONS,
  getTournamentDefinition,
  getTournamentPeriodKey,
  getTournamentReadiness,
  isTournamentBackendLocked,
  type TournamentId,
} from "../types/TournamentTypes";
import { createAuthLinkEnvelopeFromProfile } from "./AuthLinkSystem";
import { createCloudSaveProfileHash } from "./CloudSaveAdapterSystem";
import { getBackendConfigRoute } from "./BackendConfigSystem";
import { createMultiplayerAdapterEnvelope } from "./MultiplayerAdapterSystem";
import { createSampleTournamentRunResultPreview } from "./TournamentRunResultSystem";
import { createTournamentLeaderboardSubmitPreviewFromRunResult } from "./TournamentLeaderboardLinkSystem";
import type {
  RemoteTournamentFetchPreview,
  RemoteTournamentSubmitLockId,
  RemoteTournamentSubmitPreview,
  RemoteTournamentSubmitPreviewMap,
  RemoteTournamentSubmitReadinessRow,
  RemoteTournamentSubmitRouteDefinition,
  RemoteTournamentSubmitStatus,
  RemoteTournamentSubmitSummary,
  RemoteTournamentSubmitSystemDefinition,
} from "../types/RemoteTournamentSubmitTypes";

export const REMOTE_TOURNAMENT_SUBMIT_SYSTEM_VERSION = "0.13.7-remote-tournament-submit";

export const REMOTE_TOURNAMENT_SUBMIT_LOCKS: readonly RemoteTournamentSubmitLockId[] = [
  "remote_config_required",
  "backend_identity_required",
  "cloud_save_required",
  "run_validation_required",
  "anti_cheat_required",
  "server_clock_required",
  "server_seed_required",
  "event_window_validation_required",
  "duplicate_submit_protection_required",
  "reward_reconciliation_required",
  "public_submit_disabled",
];

export const REMOTE_TOURNAMENT_SUBMIT_ROUTES: readonly RemoteTournamentSubmitRouteDefinition[] = [
  {
    operationId: "fetch_event",
    label: "Remote Tournament Fetch",
    routeKey: "tournament.fetch",
    method: "GET",
    remotePath: "/api/game/tournaments",
    transport: "http_json_future",
    backendLocked: true,
    publicWriteEnabled: false,
    localPreviewOnly: true,
    locks: ["remote_config_required", "public_submit_disabled"],
    description: "Future signed tournament catalog/event-window read. Local tournament registry remains the source for preview UI until remote config is enabled.",
  },
  {
    operationId: "submit_run",
    label: "Remote Tournament Run Submit",
    routeKey: "tournament.submit",
    method: "POST",
    remotePath: "/api/game/tournaments/submit",
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
      "event_window_validation_required",
      "duplicate_submit_protection_required",
      "reward_reconciliation_required",
      "public_submit_disabled",
    ],
    description: "Future ranked tournament run submission endpoint. It stays locked until identity, validation, anti-cheat, event-window and reward ledger checks are server-side.",
  },
  {
    operationId: "reconcile_rewards",
    label: "Remote Tournament Reward Reconcile",
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
      "reward_reconciliation_required",
      "duplicate_submit_protection_required",
      "public_submit_disabled",
    ],
    description: "Future reward-ledger reconciliation after a tournament submit is accepted. The local client can preview rewards but cannot make them authoritative.",
  },
];

export const REMOTE_TOURNAMENT_SUBMIT_SYSTEM_DEFINITION: RemoteTournamentSubmitSystemDefinition = {
  version: REMOTE_TOURNAMENT_SUBMIT_SYSTEM_VERSION,
  goal: "Prepare backend-ready tournament fetch, run-submit and reward-reconcile contracts while every public tournament write remains disabled.",
  remoteReadEnabled: false,
  remoteSubmitEnabled: false,
  publicSubmitEnabled: false,
  supportedTournamentIds: TOURNAMENT_DEFINITIONS.map((tournament) => tournament.id),
  routes: REMOTE_TOURNAMENT_SUBMIT_ROUTES,
  locks: REMOTE_TOURNAMENT_SUBMIT_LOCKS,
  rules: [
    "Tournament submit previews are created from the existing run-result and leaderboard-link contracts instead of inventing a second score shape.",
    "Every submit preview includes identity, cloud profile hash, tournament points, participation points, leaderboard payload and multiplayer envelope metadata.",
    "Tournament event windows, fixed seeds and duplicate submit protection are treated as backend requirements even for local-preview events.",
    "Reward reconciliation is separate from score submit so accepted ranking and accepted rewards can be audited independently later.",
    "No tournament points, rank points, rewards or leaderboard placements become authoritative in this local client patch.",
  ],
  requiredBeforeLive: [
    "remote tournament fetch endpoint",
    "remote tournament submit endpoint",
    "backend player identity session",
    "cloud save profile hash validation",
    "server-generated tournament seed/ruleset hash",
    "run validation payload acceptance",
    "backend anti-cheat reconstruction",
    "event window and duplicate-submit validation",
    "reward reconciliation ledger",
  ],
};

const LOCK_REQUIREMENTS: Record<RemoteTournamentSubmitLockId, string> = {
  remote_config_required: "Signed tournament remote config / route enable switch",
  backend_identity_required: "Linked backend player identity",
  cloud_save_required: "Cloud save profile hash validation",
  run_validation_required: "Server accepted run validation payload",
  anti_cheat_required: "Backend anti-cheat reconstruction",
  server_clock_required: "Server clock and tournament period validation",
  server_seed_required: "Server-generated tournament seed and ruleset hash",
  event_window_validation_required: "Tournament event window validation",
  duplicate_submit_protection_required: "Duplicate submit protection for run id",
  reward_reconciliation_required: "Backend reward reconciliation ledger",
  public_submit_disabled: "Public tournament submit enable switch",
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
  return profile.identity?.displayName || "Local BROKE Player";
}

function getPlayerId(profile: PlayerProfile): string {
  return profile.identity?.localPlayerId || "local-player";
}

function getRequiredBeforeRemote(locks: readonly RemoteTournamentSubmitLockId[]): string[] {
  return locks.map((lock) => LOCK_REQUIREMENTS[lock]);
}

function getLocksForTournament(tournamentId: TournamentId): RemoteTournamentSubmitLockId[] {
  const tournament = getTournamentDefinition(tournamentId);
  const readiness = getTournamentReadiness(tournamentId);
  const locks: RemoteTournamentSubmitLockId[] = [
    "backend_identity_required",
    "cloud_save_required",
    "run_validation_required",
    "server_clock_required",
    "server_seed_required",
    "event_window_validation_required",
    "duplicate_submit_protection_required",
    "reward_reconciliation_required",
    "public_submit_disabled",
  ];

  if (readiness.antiCheatRequired || tournament.antiCheatRequired) {
    locks.push("anti_cheat_required");
  }
  if (tournament.backendStatus === "remote_required" || isTournamentBackendLocked(tournamentId)) {
    locks.push("remote_config_required");
  }
  return Array.from(new Set(locks));
}

function getStatusForTournament(tournamentId: TournamentId): RemoteTournamentSubmitStatus {
  return isTournamentBackendLocked(tournamentId) ? "blocked_backend_required" : "remote_submit_locked";
}

function createPreviewId(kind: string, tournamentId: TournamentId, periodKey: string, runId?: string): string {
  return `${kind}-${hashText(`${tournamentId}:${periodKey}:${runId ?? "preview"}`)}`;
}

export function getRemoteTournamentSubmitRoute(operationId: RemoteTournamentSubmitRouteDefinition["operationId"]): RemoteTournamentSubmitRouteDefinition {
  const route = REMOTE_TOURNAMENT_SUBMIT_ROUTES.find((candidate) => candidate.operationId === operationId);
  if (!route) {
    throw new Error(`Unknown remote tournament submit operation: ${operationId}`);
  }
  return route;
}

export function createRemoteTournamentSubmitReadinessRow(
  tournamentId: TournamentId,
): RemoteTournamentSubmitReadinessRow {
  const tournament = getTournamentDefinition(tournamentId);
  const readiness = getTournamentReadiness(tournamentId);
  const locks = getLocksForTournament(tournamentId);
  return {
    tournamentId,
    title: tournament.title,
    leaderboardId: tournament.leaderboardId,
    periodKey: getTournamentPeriodKey(tournamentId),
    fetchStatus: "remote_read_locked",
    submitStatus: getStatusForTournament(tournamentId),
    remoteReadEnabled: false,
    remoteSubmitEnabled: false,
    requiresAntiCheat: readiness.antiCheatRequired,
    requiresBackendValidation: readiness.backendValidationRequired,
    locks,
    requiredBeforeRemote: getRequiredBeforeRemote(locks),
  };
}

export function getRemoteTournamentSubmitReadinessRows(): RemoteTournamentSubmitReadinessRow[] {
  return TOURNAMENT_DEFINITIONS.map((tournament) => createRemoteTournamentSubmitReadinessRow(tournament.id));
}

export function createRemoteTournamentFetchPreview(tournamentId: TournamentId, date = new Date()): RemoteTournamentFetchPreview {
  const route = getBackendConfigRoute("tournament.fetch");
  const periodKey = getTournamentPeriodKey(tournamentId);
  return {
    id: createPreviewId("remote-tournament-fetch", tournamentId, periodKey),
    tournamentId,
    operationId: "fetch_event",
    routeKey: "tournament.fetch",
    remotePath: route.path,
    method: "GET",
    periodKey,
    generatedAtIso: date.toISOString(),
    status: "remote_read_locked",
    remoteReadEnabled: false,
    localPreviewOnly: true,
    locks: ["remote_config_required", "public_submit_disabled"],
    queryPreview: {
      tournamentId,
      periodKey,
    },
  };
}

export function createRemoteTournamentSubmitPreview(
  tournamentId: TournamentId,
  profile: PlayerProfile,
  date = new Date(),
): RemoteTournamentSubmitPreview {
  const route = getBackendConfigRoute("tournament.submit");
  const runResultPreview = createSampleTournamentRunResultPreview(tournamentId);
  const leaderboardSubmitPreview = createTournamentLeaderboardSubmitPreviewFromRunResult(runResultPreview, getDisplayName(profile), "local_result_preview");
  const periodKey = getTournamentPeriodKey(tournamentId);
  const tournament = getTournamentDefinition(tournamentId);
  const playerId = getPlayerId(profile);
  const displayName = getDisplayName(profile);
  const cloudProfileHash = createCloudSaveProfileHash(profile);
  const authEnvelope = createAuthLinkEnvelopeFromProfile(profile);
  const tournamentPoints = runResultPreview.result.points;
  const participationPoints = runResultPreview.result.participationPoints;
  const totalValue = tournamentPoints + participationPoints;
  const locks = getLocksForTournament(tournamentId);
  const payloadPreview = {
    tournamentId,
    leaderboardId: tournament.leaderboardId,
    periodKey,
    runId: runResultPreview.runId,
    tournamentPoints,
    participationPoints,
    totalValue,
    validationTier: runResultPreview.validationTier,
    backendValidationRequired: true,
    antiCheatRequired: tournament.antiCheatRequired,
    eventWindowValidationRequired: true,
    duplicateSubmitProtectionRequired: true,
    rewardReconciliationRequired: true,
    cloudProfileHash,
  };
  const payloadHash = hashText(stableStringify({ payloadPreview, scoreSnapshot: runResultPreview.scoreSnapshot, playerId }));
  const multiplayerEnvelope = createMultiplayerAdapterEnvelope({
    channelId: "tournament_submit",
    playerId,
    displayName,
    sourceId: `tournament:${tournamentId}:${runResultPreview.runId}`,
    value: totalValue,
    periodKey,
    payloadPreview: {
      tournamentId,
      leaderboardId: tournament.leaderboardId,
      payloadHash,
      validationTier: runResultPreview.validationTier,
      backendValidationRequired: true,
      antiCheatRequired: tournament.antiCheatRequired,
      rewardReconciliationRequired: true,
    },
    createdAtIso: date.toISOString(),
  });

  return {
    id: createPreviewId("remote-tournament-submit", tournamentId, periodKey, runResultPreview.runId),
    tournamentId,
    leaderboardId: tournament.leaderboardId,
    operationId: "submit_run",
    routeKey: "tournament.submit",
    remotePath: route.path,
    method: "POST",
    playerId,
    displayName,
    periodKey,
    runId: runResultPreview.runId,
    tournamentPoints,
    participationPoints,
    totalValue,
    payloadHash,
    generatedAtIso: date.toISOString(),
    status: getStatusForTournament(tournamentId),
    remoteSubmitEnabled: false,
    localPreviewOnly: true,
    locks,
    requiredBeforeRemote: getRequiredBeforeRemote(locks),
    authEnvelope,
    cloudProfileHash,
    runResultPreview,
    leaderboardSubmitPreview,
    multiplayerEnvelope,
    payloadPreview,
  };
}

export function createRemoteTournamentSubmitPreviewMap(profile: PlayerProfile, date = new Date()): RemoteTournamentSubmitPreviewMap {
  return TOURNAMENT_DEFINITIONS.reduce<RemoteTournamentSubmitPreviewMap>((map, tournament) => {
    map[tournament.id] = createRemoteTournamentSubmitPreview(tournament.id, profile, date);
    return map;
  }, {} as RemoteTournamentSubmitPreviewMap);
}

export function getRemoteTournamentSubmitSummary(): RemoteTournamentSubmitSummary {
  return {
    version: REMOTE_TOURNAMENT_SUBMIT_SYSTEM_VERSION,
    tournamentCount: TOURNAMENT_DEFINITIONS.length,
    backendLockedCount: TOURNAMENT_DEFINITIONS.filter((tournament) => isTournamentBackendLocked(tournament.id)).length,
    remoteReadEnabled: REMOTE_TOURNAMENT_SUBMIT_SYSTEM_DEFINITION.remoteReadEnabled,
    remoteSubmitEnabled: REMOTE_TOURNAMENT_SUBMIT_SYSTEM_DEFINITION.remoteSubmitEnabled,
    publicSubmitEnabled: REMOTE_TOURNAMENT_SUBMIT_SYSTEM_DEFINITION.publicSubmitEnabled,
    requiredBeforeLive: REMOTE_TOURNAMENT_SUBMIT_SYSTEM_DEFINITION.requiredBeforeLive,
  };
}
