import type { PlayerProfile } from "../data/playerProfile";
import { createAuthLinkEnvelopeFromProfile } from "./AuthLinkSystem";
import { getBackendConfigRoute } from "./BackendConfigSystem";
import { createCloudSaveProfileHash } from "./CloudSaveAdapterSystem";
import { getAllWeeklyLeaderboardPreviews, getWeeklyLeaderboardPeriodState } from "./WeeklyLeaderboardSystem";
import { WEEKLY_LEADERBOARD_IDS, type WeeklyLeaderboardId } from "../types/WeeklyLeaderboardTypes";
import type {
  WeeklyResetBackendJobPreview,
  WeeklyResetBackendLockId,
  WeeklyResetBackendReadinessRow,
  WeeklyResetBackendRouteDefinition,
  WeeklyResetBackendSnapshot,
  WeeklyResetBackendStatus,
  WeeklyResetBackendSummary,
  WeeklyResetBackendSystemDefinition,
} from "../types/WeeklyResetBackendTypes";

export const WEEKLY_RESET_BACKEND_SYSTEM_VERSION = "0.13.9-weekly-reset-backend";

export const WEEKLY_RESET_BACKEND_LOCKS: readonly WeeklyResetBackendLockId[] = [
  "remote_config_required",
  "backend_identity_required",
  "cloud_save_required",
  "server_clock_required",
  "weekly_reset_job_required",
  "leaderboard_snapshot_lock_required",
  "duplicate_period_close_required",
  "anti_cheat_required",
  "reward_reconciliation_required",
  "public_reset_disabled",
];

export const WEEKLY_RESET_BACKEND_ROUTES: readonly WeeklyResetBackendRouteDefinition[] = [
  {
    operationId: "fetch_period",
    label: "Weekly Period Fetch",
    routeKey: "leaderboard.fetch",
    method: "GET",
    remotePath: "/api/game/leaderboards/weekly/period",
    transport: "http_json_future",
    backendLocked: true,
    publicWriteEnabled: false,
    localPreviewOnly: true,
    locks: ["remote_config_required", "server_clock_required", "public_reset_disabled"],
    description: "Future remote read for the current weekly leaderboard period. Local UI keeps using deterministic UTC preview until signed config and server clock exist.",
  },
  {
    operationId: "close_period",
    label: "Weekly Period Close",
    routeKey: "leaderboard.submit",
    method: "POST",
    remotePath: "/api/game/leaderboards/weekly/close",
    transport: "http_json_future",
    backendLocked: true,
    publicWriteEnabled: false,
    localPreviewOnly: true,
    locks: [
      "backend_identity_required",
      "cloud_save_required",
      "server_clock_required",
      "weekly_reset_job_required",
      "leaderboard_snapshot_lock_required",
      "duplicate_period_close_required",
      "anti_cheat_required",
      "public_reset_disabled",
    ],
    description: "Future backend job that closes weekly Arena, Task Points and Boss Damage rankings once per period. It must be server-triggered and idempotent.",
  },
  {
    operationId: "finalize_rewards",
    label: "Weekly Reward Finalize",
    routeKey: "economy.reconcile",
    method: "POST",
    remotePath: "/api/game/leaderboards/weekly/rewards/finalize",
    transport: "http_json_future",
    backendLocked: true,
    publicWriteEnabled: false,
    localPreviewOnly: true,
    locks: [
      "backend_identity_required",
      "cloud_save_required",
      "server_clock_required",
      "leaderboard_snapshot_lock_required",
      "reward_reconciliation_required",
      "duplicate_period_close_required",
      "public_reset_disabled",
    ],
    description: "Future reward-ledger finalization after a weekly period is closed. No reward, Rank Point or Leak Point payout is authoritative in the local client.",
  },
];

export const WEEKLY_RESET_BACKEND_SYSTEM_DEFINITION: WeeklyResetBackendSystemDefinition = {
  version: WEEKLY_RESET_BACKEND_SYSTEM_VERSION,
  goal: "Prepare backend contracts for weekly leaderboard close, snapshot lock and reward reconciliation while all public reset/reward writes remain disabled.",
  remoteReadEnabled: false,
  remoteWriteEnabled: false,
  publicResetEnabled: false,
  supportedLeaderboards: WEEKLY_LEADERBOARD_IDS,
  routes: WEEKLY_RESET_BACKEND_ROUTES,
  locks: WEEKLY_RESET_BACKEND_LOCKS,
  rules: [
    "Weekly resets must be server-clock based, not local-device based.",
    "Each weekly period can be closed only once after its leaderboard snapshots are locked.",
    "Weekly Arena, Task Points and Boss Damage close together so rewards cannot be claimed against mismatched periods.",
    "Reward finalization is separate from period close so leaderboard acceptance and economy payouts can be audited independently.",
    "No public rank, reward, Rank Point, Leak Point or tournament carryover becomes authoritative in this local client patch.",
  ],
  requiredBeforeLive: [
    "signed remote config",
    "server clock period authority",
    "backend weekly reset job",
    "idempotent period close protection",
    "leaderboard snapshot lock",
    "backend anti-cheat acceptance for weekly entries",
    "reward reconciliation ledger",
    "public reset enable switch",
  ],
};

const LOCK_REQUIREMENTS: Record<WeeklyResetBackendLockId, string> = {
  remote_config_required: "Signed remote config / weekly schedule switch",
  backend_identity_required: "Linked backend player identity",
  cloud_save_required: "Cloud save profile snapshot",
  server_clock_required: "Server clock and period authority",
  weekly_reset_job_required: "Backend weekly reset job",
  leaderboard_snapshot_lock_required: "Locked leaderboard snapshot for the closing period",
  duplicate_period_close_required: "Idempotent duplicate-close protection",
  anti_cheat_required: "Backend anti-cheat acceptance for weekly entries",
  reward_reconciliation_required: "Reward reconciliation ledger",
  public_reset_disabled: "Public weekly reset enable switch",
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

function getRequiredBeforeRemote(locks: readonly WeeklyResetBackendLockId[]): string[] {
  return locks.map((lock) => LOCK_REQUIREMENTS[lock]);
}

function getLocksForWeeklyLeaderboard(leaderboardId: WeeklyLeaderboardId): WeeklyResetBackendLockId[] {
  const locks: WeeklyResetBackendLockId[] = [
    "backend_identity_required",
    "cloud_save_required",
    "server_clock_required",
    "weekly_reset_job_required",
    "leaderboard_snapshot_lock_required",
    "duplicate_period_close_required",
    "public_reset_disabled",
  ];

  if (leaderboardId === "weekly_arena" || leaderboardId === "boss_damage") {
    locks.push("anti_cheat_required");
  }
  if (leaderboardId === "task_points" || leaderboardId === "boss_damage") {
    locks.push("reward_reconciliation_required");
  }
  return Array.from(new Set(locks));
}

function getStatusForWeeklyLeaderboard(): WeeklyResetBackendStatus {
  return "blocked_backend_required";
}

function createJobId(periodKey: string): string {
  return `weekly-reset-${hashText(periodKey)}`;
}

export function getWeeklyResetBackendRoute(operationId: WeeklyResetBackendRouteDefinition["operationId"]): WeeklyResetBackendRouteDefinition {
  const route = WEEKLY_RESET_BACKEND_ROUTES.find((candidate) => candidate.operationId === operationId);
  if (!route) {
    throw new Error(`Unknown weekly reset backend operation: ${operationId}`);
  }
  return route;
}

export function createWeeklyResetBackendReadinessRow(
  leaderboardId: WeeklyLeaderboardId,
  date = new Date(),
): WeeklyResetBackendReadinessRow {
  const period = getWeeklyLeaderboardPeriodState(date);
  const locks = getLocksForWeeklyLeaderboard(leaderboardId);
  return {
    leaderboardId,
    periodKey: period.periodKey,
    status: getStatusForWeeklyLeaderboard(),
    submitLock: locks.includes("anti_cheat_required") ? "anti_cheat_required" : "backend_required",
    requiresServerClock: true,
    requiresSnapshotLock: true,
    requiresRewardReconciliation: locks.includes("reward_reconciliation_required"),
    locks,
    requiredBeforeRemote: getRequiredBeforeRemote(locks),
  };
}

export function getWeeklyResetBackendReadinessRows(date = new Date()): WeeklyResetBackendReadinessRow[] {
  return WEEKLY_LEADERBOARD_IDS.map((leaderboardId) => createWeeklyResetBackendReadinessRow(leaderboardId, date));
}

export function createWeeklyResetBackendJobPreview(
  profile: PlayerProfile,
  date = new Date(),
): WeeklyResetBackendJobPreview {
  const closeRoute = getBackendConfigRoute("leaderboard.submit");
  const period = getWeeklyLeaderboardPeriodState(date);
  const previewRows = getAllWeeklyLeaderboardPreviews(profile, date);
  const locks = WEEKLY_RESET_BACKEND_LOCKS;
  const cloudProfileHash = createCloudSaveProfileHash(profile);
  const payloadPreview = {
    periodKey: period.periodKey,
    startsAtIso: period.startsAtIso,
    endsAtIso: period.endsAtIso,
    nextResetAtIso: period.nextResetAtIso,
    leaderboardIds: WEEKLY_LEADERBOARD_IDS,
    snapshotLockRequired: true,
    duplicatePeriodCloseProtectionRequired: true,
    rewardReconciliationRequired: true,
    publicResetEnabled: false,
    cloudProfileHash,
  };
  const payloadHash = hashText(stableStringify({ payloadPreview, previewRows }));

  return {
    id: createJobId(period.periodKey),
    operationId: "close_period",
    routeKey: "leaderboard.submit",
    remotePath: closeRoute.path,
    method: "POST",
    period,
    generatedAtIso: date.toISOString(),
    status: "blocked_backend_required",
    remoteWriteEnabled: false,
    localPreviewOnly: true,
    playerId: getPlayerId(profile),
    displayName: getDisplayName(profile),
    cloudProfileHash,
    payloadHash,
    locks,
    requiredBeforeRemote: getRequiredBeforeRemote(locks),
    authEnvelope: createAuthLinkEnvelopeFromProfile(profile),
    leaderboardIds: WEEKLY_LEADERBOARD_IDS,
    affectedLeaderboardCount: WEEKLY_LEADERBOARD_IDS.length,
    previewRows,
    payloadPreview,
  };
}

export function createWeeklyResetBackendSnapshot(
  profile: PlayerProfile,
  date = new Date(),
): WeeklyResetBackendSnapshot {
  const period = getWeeklyLeaderboardPeriodState(date);
  return {
    version: WEEKLY_RESET_BACKEND_SYSTEM_VERSION,
    generatedAtIso: date.toISOString(),
    period,
    remoteReadEnabled: false,
    remoteWriteEnabled: false,
    publicResetEnabled: false,
    routeCount: WEEKLY_RESET_BACKEND_ROUTES.length,
    lockedRouteCount: WEEKLY_RESET_BACKEND_ROUTES.filter((route) => route.backendLocked).length,
    readinessRows: getWeeklyResetBackendReadinessRows(date),
    closePeriodPreview: createWeeklyResetBackendJobPreview(profile, date),
    routes: WEEKLY_RESET_BACKEND_ROUTES,
    requiredBeforeLive: WEEKLY_RESET_BACKEND_SYSTEM_DEFINITION.requiredBeforeLive,
  };
}

export function getWeeklyResetBackendSummary(): WeeklyResetBackendSummary {
  return {
    version: WEEKLY_RESET_BACKEND_SYSTEM_VERSION,
    weeklyLeaderboardCount: WEEKLY_LEADERBOARD_IDS.length,
    routeCount: WEEKLY_RESET_BACKEND_ROUTES.length,
    backendLockedCount: WEEKLY_RESET_BACKEND_ROUTES.filter((route) => route.backendLocked).length,
    remoteReadEnabled: false,
    remoteWriteEnabled: false,
    publicResetEnabled: false,
    requiredBeforeLive: WEEKLY_RESET_BACKEND_SYSTEM_DEFINITION.requiredBeforeLive,
  };
}
