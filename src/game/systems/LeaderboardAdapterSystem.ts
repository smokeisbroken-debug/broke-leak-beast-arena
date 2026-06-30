import type { PlayerProfile } from "../data/playerProfile";
import {
  getLeaderboardDefinition,
  getLeaderboardReadiness,
  isLeaderboardBackendLocked,
  type LeaderboardId,
} from "../types/LeaderboardTypes";
import {
  createLeaderboardSubmitPayload,
} from "./LeaderboardSystem";
import { createLocalLeaderboardMockSnapshot } from "./LocalLeaderboardMockSystem";
import type {
  LeaderboardAdapterProviderDefinition,
  LeaderboardAdapterProviderId,
  LeaderboardAdapterReadiness,
  LeaderboardAdapterSnapshot,
  LeaderboardAdapterSubmitLock,
  LeaderboardAdapterSubmitPreview,
  LeaderboardAdapterSystemDefinition,
} from "../types/LeaderboardAdapterTypes";

export const LEADERBOARD_ADAPTER_SYSTEM_VERSION = "0.10.6-leaderboard-adapter";

export const LEADERBOARD_ADAPTER_PROVIDERS: readonly LeaderboardAdapterProviderDefinition[] = [
  {
    id: "local_mock_adapter",
    label: "Local Mock Adapter",
    mode: "local_preview",
    syncStatus: "local_only",
    capabilities: ["fetch_snapshot", "create_submit_payload", "preview_weekly_period"],
    publicSubmitEnabled: false,
    description: "Feeds deterministic local leaderboard snapshots and submit payload previews without contacting a backend.",
  },
  {
    id: "remote_http_adapter",
    label: "Remote HTTP Adapter",
    mode: "remote_placeholder",
    syncStatus: "remote_not_configured",
    capabilities: ["fetch_snapshot", "create_submit_payload", "public_submit", "tournament_submit", "duel_submit", "boss_submit"],
    publicSubmitEnabled: false,
    description: "Reserved backend adapter for cloud save, public leaderboard submit, tournaments, Leak Duel and boss damage validation.",
  },
];

export const LEADERBOARD_ADAPTER_SYSTEM_DEFINITION: LeaderboardAdapterSystemDefinition = {
  version: LEADERBOARD_ADAPTER_SYSTEM_VERSION,
  goal: "Provide a backend-ready leaderboard adapter boundary while all public score submission stays disabled until remote validation and anti-cheat exist.",
  defaultProviderId: "local_mock_adapter",
  providers: LEADERBOARD_ADAPTER_PROVIDERS,
  rules: [
    "Leaderboard UI reads through the adapter boundary, not directly from a future remote service.",
    "Local mock snapshots are allowed for preview, balancing and navigation only.",
    "Public score submit, tournament submit, Duel ranked submit and boss damage submit remain disabled.",
    "Every future remote submit must include a typed payload, period key, score breakdown and anti-cheat validation state.",
  ],
};

function getProvider(providerId: LeaderboardAdapterProviderId): LeaderboardAdapterProviderDefinition {
  const provider = LEADERBOARD_ADAPTER_PROVIDERS.find((candidate) => candidate.id === providerId);
  if (!provider) {
    throw new Error(`Unknown leaderboard adapter provider: ${providerId}`);
  }
  return provider;
}

export function getLeaderboardAdapterProvider(leaderboardId: LeaderboardId): LeaderboardAdapterProviderDefinition {
  const leaderboard = getLeaderboardDefinition(leaderboardId);
  if (leaderboard.backendStatus === "remote_required") {
    return getProvider("local_mock_adapter");
  }
  return getProvider("local_mock_adapter");
}

export function getLeaderboardAdapterSubmitLock(leaderboardId: LeaderboardId): LeaderboardAdapterSubmitLock {
  const leaderboard = getLeaderboardDefinition(leaderboardId);
  if (leaderboard.backendStatus === "remote_required") return "remote_adapter_missing";
  if (leaderboard.antiCheatRequired) return "anti_cheat_required";
  if (isLeaderboardBackendLocked(leaderboardId)) return "backend_required";
  return "local_preview_only";
}

export function getLeaderboardAdapterReadiness(leaderboardId: LeaderboardId): LeaderboardAdapterReadiness {
  const leaderboard = getLeaderboardDefinition(leaderboardId);
  const provider = getLeaderboardAdapterProvider(leaderboardId);
  const readiness = getLeaderboardReadiness(leaderboardId);
  const remoteRequired = leaderboard.backendStatus === "remote_required" || readiness.backendValidationRequired;
  const requiredBeforeRemote = [
    ...readiness.requiredBeforePublicSubmit,
    ...(leaderboard.backendStatus === "remote_required" ? ["Remote leaderboard endpoint"] : []),
  ];

  return {
    leaderboardId,
    providerId: provider.id,
    backendStatus: leaderboard.backendStatus,
    canReadPreview: provider.capabilities.includes("fetch_snapshot"),
    canCreateSubmitPayload: provider.capabilities.includes("create_submit_payload"),
    canSubmitPublicScore: false,
    submitLock: getLeaderboardAdapterSubmitLock(leaderboardId),
    remoteRequired,
    requiredBeforeRemote,
  };
}

export function createLeaderboardAdapterSnapshot(
  leaderboardId: LeaderboardId,
  profile: PlayerProfile,
  date = new Date(),
): LeaderboardAdapterSnapshot {
  const provider = getLeaderboardAdapterProvider(leaderboardId);
  const readiness = getLeaderboardReadiness(leaderboardId);
  const adapterReadiness = getLeaderboardAdapterReadiness(leaderboardId);
  const snapshot = createLocalLeaderboardMockSnapshot(leaderboardId, profile, date);

  return {
    leaderboardId,
    providerId: provider.id,
    generatedAtIso: date.toISOString(),
    snapshot,
    readiness,
    adapterReadiness,
    syncStatus: provider.syncStatus,
    localPreviewOnly: true,
    publicSubmitEnabled: false,
    notice: adapterReadiness.remoteRequired
      ? "Adapter is ready for typed payloads, but public submit is locked until backend validation and anti-cheat are implemented."
      : "Adapter is serving a local preview only. Public ranking remains disabled.",
  };
}

export function createLeaderboardAdapterSubmitPreview(
  leaderboardId: LeaderboardId,
  profile: PlayerProfile,
  date = new Date(),
): LeaderboardAdapterSubmitPreview {
  const provider = getLeaderboardAdapterProvider(leaderboardId);
  const adapterReadiness = getLeaderboardAdapterReadiness(leaderboardId);
  const payload = createLeaderboardSubmitPayload(leaderboardId, profile, date);

  return {
    leaderboardId,
    providerId: provider.id,
    payload,
    submissionStatus: payload.submissionStatus,
    adapterSubmitLock: adapterReadiness.submitLock,
    publicSubmitEnabled: false,
    localPreviewOnly: true,
    requiredBeforeRemote: adapterReadiness.requiredBeforeRemote,
    createdAtIso: date.toISOString(),
  };
}

export function createAllLeaderboardAdapterSnapshots(profile: PlayerProfile, date = new Date()): LeaderboardAdapterSnapshot[] {
  return ["global_power", "weekly_arena", "task_points", "tournament", "duel_ranked", "boss_damage"].map((leaderboardId) =>
    createLeaderboardAdapterSnapshot(leaderboardId as LeaderboardId, profile, date),
  );
}
