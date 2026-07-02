import type { PlayerProfile } from "../data/playerProfile";
import { createAuthLinkEnvelopeFromProfile } from "./AuthLinkSystem";
import { getBackendConfigRoute } from "./BackendConfigSystem";
import { createCloudSaveProfileHash } from "./CloudSaveAdapterSystem";
import type {
  SeasonBackendLockId,
  SeasonBackendPreviewSeason,
  SeasonBackendReadinessRow,
  SeasonBackendRouteDefinition,
  SeasonBackendSnapshot,
  SeasonBackendStatus,
  SeasonBackendSummary,
  SeasonBackendSyncPreview,
  SeasonBackendSystemDefinition,
  SeasonBackendTrackDefinition,
  SeasonBackendTrackId,
} from "../types/SeasonBackendPrepTypes";

export const SEASON_BACKEND_PREP_SYSTEM_VERSION = "0.14.0-season-backend-prep";

export const SEASON_BACKEND_LOCKS: readonly SeasonBackendLockId[] = [
  "remote_config_required",
  "backend_identity_required",
  "cloud_save_required",
  "server_clock_required",
  "season_backend_required",
  "season_catalog_required",
  "season_mission_registry_required",
  "season_reward_ledger_required",
  "leaderboard_snapshot_required",
  "anti_cheat_required",
  "public_sync_disabled",
];

export const SEASON_BACKEND_ROUTES: readonly SeasonBackendRouteDefinition[] = [
  {
    operationId: "fetch_active_season",
    label: "Active Season Fetch",
    routeKey: "config.fetch",
    method: "GET",
    remotePath: "/api/game/seasons/active",
    transport: "http_json_future",
    backendLocked: true,
    publicWriteEnabled: false,
    localPreviewOnly: true,
    locks: ["remote_config_required", "server_clock_required", "season_backend_required", "season_catalog_required"],
    description: "Future remote read for the signed active season catalog. Local UI can preview a foundation season only.",
  },
  {
    operationId: "sync_progress",
    label: "Season Progress Sync",
    routeKey: "season.sync",
    method: "POST",
    remotePath: "/api/game/seasons/sync",
    transport: "http_json_future",
    backendLocked: true,
    publicWriteEnabled: false,
    localPreviewOnly: true,
    locks: [
      "backend_identity_required",
      "cloud_save_required",
      "server_clock_required",
      "season_backend_required",
      "season_mission_registry_required",
      "leaderboard_snapshot_required",
      "anti_cheat_required",
      "public_sync_disabled",
    ],
    description: "Future backend sync for season points, missions and ranked track progress. Local season state is not authoritative.",
  },
  {
    operationId: "finalize_rewards",
    label: "Season Reward Finalize",
    routeKey: "economy.reconcile",
    method: "POST",
    remotePath: "/api/game/seasons/rewards/finalize",
    transport: "http_json_future",
    backendLocked: true,
    publicWriteEnabled: false,
    localPreviewOnly: true,
    locks: [
      "backend_identity_required",
      "cloud_save_required",
      "server_clock_required",
      "season_backend_required",
      "season_reward_ledger_required",
      "leaderboard_snapshot_required",
      "public_sync_disabled",
    ],
    description: "Future reward-ledger finalization after season close. Cosmetic, Leak Point and Rank Point payouts remain backend-locked.",
  },
];

export const SEASON_BACKEND_TRACKS: readonly SeasonBackendTrackDefinition[] = [
  {
    id: "free_progression",
    label: "Free Progression Track",
    scoreSource: "campaign",
    backendLocked: true,
    rewardLedgerRequired: true,
    description: "Long-term season points from safe PvE and mission progress. No paid advantage and no authoritative client payout.",
  },
  {
    id: "missions",
    label: "Season Missions",
    scoreSource: "tasks",
    leaderboardId: "task_points",
    backendLocked: true,
    rewardLedgerRequired: true,
    description: "Season tasks connect daily/weekly habits to season progress after mission registry and backend validation exist.",
  },
  {
    id: "tournament",
    label: "Tournament Track",
    scoreSource: "tournament",
    leaderboardId: "tournament",
    backendLocked: true,
    rewardLedgerRequired: true,
    description: "Season tournament points from limited-time events. Backend must validate run payloads and lock event rankings.",
  },
  {
    id: "duel",
    label: "Leak Duel Track",
    scoreSource: "duel",
    leaderboardId: "duel_ranked",
    backendLocked: true,
    rewardLedgerRequired: true,
    description: "Season 1v1 progress from asynchronous Leak Duels using server-approved seeds and ranked result acceptance.",
  },
  {
    id: "boss",
    label: "Boss Damage Track",
    scoreSource: "boss_damage",
    leaderboardId: "boss_damage",
    backendLocked: true,
    rewardLedgerRequired: true,
    description: "Community boss contribution that can feed season rewards only after weekly snapshots and reward reconciliation are live.",
  },
];

export const SEASON_BACKEND_PREP_SYSTEM_DEFINITION: SeasonBackendSystemDefinition = {
  version: SEASON_BACKEND_PREP_SYSTEM_VERSION,
  goal: "Prepare season backend contracts for active season config, season progress sync, ranked track snapshots and reward-ledger finalization while all public season writes stay disabled.",
  remoteReadEnabled: false,
  remoteWriteEnabled: false,
  publicSyncEnabled: false,
  routes: SEASON_BACKEND_ROUTES,
  tracks: SEASON_BACKEND_TRACKS,
  locks: SEASON_BACKEND_LOCKS,
  rules: [
    "Season dates, phase changes and claim windows must be server-clock based.",
    "Season progress can read local preview state, but ranked season points are not authoritative in the client.",
    "Tournament, Duel, Boss Damage and Task tracks must be validated independently before they feed season rewards.",
    "Season reward finalization must use a backend reward ledger and cannot be claimed from localStorage alone.",
    "Season cosmetics may be previewed locally later, but ownership must be reconciled through backend sync before public launch.",
  ],
  requiredBeforeLive: [
    "signed active season config",
    "server clock season phase authority",
    "backend season progress endpoint",
    "season mission registry",
    "ranked track snapshot locks",
    "backend anti-cheat acceptance for ranked track inputs",
    "season reward reconciliation ledger",
    "public season sync enable switch",
  ],
};

const LOCK_REQUIREMENTS: Record<SeasonBackendLockId, string> = {
  remote_config_required: "Signed remote season config",
  backend_identity_required: "Linked backend player identity",
  cloud_save_required: "Cloud save profile snapshot",
  server_clock_required: "Server clock and season phase authority",
  season_backend_required: "Season backend service",
  season_catalog_required: "Season catalog and active season record",
  season_mission_registry_required: "Season mission registry",
  season_reward_ledger_required: "Season reward reconciliation ledger",
  leaderboard_snapshot_required: "Locked leaderboard / ranked track snapshots",
  anti_cheat_required: "Backend anti-cheat acceptance",
  public_sync_disabled: "Public season sync enable switch",
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

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function getDisplayName(profile: PlayerProfile): string {
  return profile.identity?.displayName || "Local BROKE Player";
}

function getPlayerId(profile: PlayerProfile): string {
  return profile.identity?.localPlayerId || "local-player";
}

function getRequiredBeforeRemote(locks: readonly SeasonBackendLockId[]): string[] {
  return locks.map((lock) => LOCK_REQUIREMENTS[lock]);
}

function getLocksForTrack(track: SeasonBackendTrackDefinition): SeasonBackendLockId[] {
  const locks: SeasonBackendLockId[] = [
    "backend_identity_required",
    "cloud_save_required",
    "server_clock_required",
    "season_backend_required",
    "public_sync_disabled",
  ];

  if (track.id === "missions") locks.push("season_mission_registry_required");
  if (track.leaderboardId) locks.push("leaderboard_snapshot_required");
  if (track.scoreSource === "tournament" || track.scoreSource === "duel" || track.scoreSource === "boss_damage") {
    locks.push("anti_cheat_required");
  }
  if (track.rewardLedgerRequired) locks.push("season_reward_ledger_required");
  return Array.from(new Set(locks));
}

function getStatusForTrack(track: SeasonBackendTrackDefinition): SeasonBackendStatus {
  return track.backendLocked ? "blocked_backend_required" : "local_preview";
}

export function createSeasonBackendPreviewSeason(date = new Date()): SeasonBackendPreviewSeason {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0));
  const end = addDays(start, 56);
  const claimEnd = addDays(end, 7);
  return {
    seasonId: "season_0_foundation_preview",
    label: "Season 0: Leak Control Foundation",
    phase: "preseason",
    startsAtIso: start.toISOString(),
    endsAtIso: end.toISOString(),
    claimEndsAtIso: claimEnd.toISOString(),
    durationDays: 56,
    localPreviewOnly: true,
    theme: "Build discipline, fight wallet leaks and prepare the first ranked season loop.",
  };
}

export function createSeasonBackendReadinessRow(trackId: SeasonBackendTrackId): SeasonBackendReadinessRow {
  const track = SEASON_BACKEND_TRACKS.find((candidate) => candidate.id === trackId);
  if (!track) {
    throw new Error(`Unknown season backend track: ${trackId}`);
  }
  const locks = getLocksForTrack(track);
  return {
    trackId: track.id,
    label: track.label,
    status: getStatusForTrack(track),
    scoreSource: track.scoreSource,
    leaderboardId: track.leaderboardId,
    requiresServerClock: true,
    requiresRewardLedger: track.rewardLedgerRequired,
    locks,
    requiredBeforeRemote: getRequiredBeforeRemote(locks),
  };
}

export function getSeasonBackendReadinessRows(): SeasonBackendReadinessRow[] {
  return SEASON_BACKEND_TRACKS.map((track) => createSeasonBackendReadinessRow(track.id));
}

export function getSeasonBackendRoute(operationId: SeasonBackendRouteDefinition["operationId"]): SeasonBackendRouteDefinition {
  const route = SEASON_BACKEND_ROUTES.find((candidate) => candidate.operationId === operationId);
  if (!route) {
    throw new Error(`Unknown season backend operation: ${operationId}`);
  }
  return route;
}

export function createSeasonBackendSyncPreview(
  profile: PlayerProfile,
  date = new Date(),
): SeasonBackendSyncPreview {
  const syncRoute = getBackendConfigRoute("season.sync");
  const season = createSeasonBackendPreviewSeason(date);
  const cloudProfileHash = createCloudSaveProfileHash(profile);
  const seasonState = profile.seasons || {
    activeSeasonId: season.seasonId,
    seasonPoints: 0,
    claimedRewardIds: [],
    completedMissionIds: [],
  };
  const activeTrackIds = SEASON_BACKEND_TRACKS.map((track) => track.id);
  const payloadPreview = {
    operationId: "sync_progress" as const,
    seasonId: seasonState.activeSeasonId || season.seasonId,
    generatedAtIso: date.toISOString(),
    playerId: getPlayerId(profile),
    displayName: getDisplayName(profile),
    cloudProfileHash,
    seasonState,
    activeTrackIds,
    localSeasonPoints: seasonState.seasonPoints,
    completedMissionCount: seasonState.completedMissionIds.length,
    claimedRewardCount: seasonState.claimedRewardIds.length,
    publicSyncEnabled: false,
    rewardLedgerRequired: true,
    serverClockRequired: true,
  };
  const payloadHash = hashText(stableStringify(payloadPreview));
  const locks = SEASON_BACKEND_LOCKS;

  return {
    id: `season-sync-${hashText(`${payloadPreview.seasonId}:${payloadHash}`)}`,
    operationId: "sync_progress",
    routeKey: "season.sync",
    remotePath: syncRoute.path,
    method: "POST",
    status: "blocked_backend_required",
    generatedAtIso: date.toISOString(),
    remoteWriteEnabled: false,
    localPreviewOnly: true,
    playerId: getPlayerId(profile),
    displayName: getDisplayName(profile),
    cloudProfileHash,
    payloadHash,
    locks,
    requiredBeforeRemote: getRequiredBeforeRemote(locks),
    authEnvelope: createAuthLinkEnvelopeFromProfile(profile),
    season,
    payloadPreview,
  };
}

export function createSeasonBackendSnapshot(
  profile: PlayerProfile,
  date = new Date(),
): SeasonBackendSnapshot {
  return {
    version: SEASON_BACKEND_PREP_SYSTEM_VERSION,
    generatedAtIso: date.toISOString(),
    remoteReadEnabled: false,
    remoteWriteEnabled: false,
    publicSyncEnabled: false,
    activeSeason: createSeasonBackendPreviewSeason(date),
    routeCount: SEASON_BACKEND_ROUTES.length,
    lockedRouteCount: SEASON_BACKEND_ROUTES.filter((route) => route.backendLocked).length,
    trackCount: SEASON_BACKEND_TRACKS.length,
    readinessRows: getSeasonBackendReadinessRows(),
    syncPreview: createSeasonBackendSyncPreview(profile, date),
    routes: SEASON_BACKEND_ROUTES,
    tracks: SEASON_BACKEND_TRACKS,
    requiredBeforeLive: SEASON_BACKEND_PREP_SYSTEM_DEFINITION.requiredBeforeLive,
  };
}

export function getSeasonBackendSummary(date = new Date()): SeasonBackendSummary {
  const season = createSeasonBackendPreviewSeason(date);
  return {
    version: SEASON_BACKEND_PREP_SYSTEM_VERSION,
    activeSeasonId: season.seasonId,
    phase: season.phase,
    trackCount: SEASON_BACKEND_TRACKS.length,
    routeCount: SEASON_BACKEND_ROUTES.length,
    backendLockedCount: SEASON_BACKEND_ROUTES.filter((route) => route.backendLocked).length,
    remoteReadEnabled: false,
    remoteWriteEnabled: false,
    publicSyncEnabled: false,
    requiredBeforeLive: SEASON_BACKEND_PREP_SYSTEM_DEFINITION.requiredBeforeLive,
  };
}
