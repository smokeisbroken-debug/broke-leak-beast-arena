import type { PlayerProfile } from "../data/playerProfile";
import type {
  CloudSaveAdapterProviderDefinition,
  CloudSaveAdapterSummary,
  CloudSaveAdapterSystemDefinition,
  CloudSaveBlockDefinition,
  CloudSaveBlockId,
  CloudSaveBlockSnapshotRow,
  CloudSaveLockId,
  CloudSaveSnapshotEnvelope,
} from "../types/CloudSaveAdapterTypes";

export const CLOUD_SAVE_ADAPTER_SYSTEM_VERSION = "0.13.1-cloud-save-adapter";

export const CLOUD_SAVE_ADAPTER_PROVIDERS: readonly CloudSaveAdapterProviderDefinition[] = [
  {
    id: "local_snapshot_adapter",
    label: "Local Snapshot Adapter",
    mode: "local_preview",
    transport: "local_storage",
    provider: "local",
    publicSyncEnabled: false,
    capabilities: ["create_snapshot", "read_local_profile", "export_payload", "queue_future_push"],
    description: "Builds typed cloud-save snapshots from the local profile without contacting a backend.",
  },
  {
    id: "remote_cloud_placeholder",
    label: "Remote Cloud Placeholder",
    mode: "remote_placeholder",
    transport: "http_json_future",
    provider: "future_backend",
    publicSyncEnabled: false,
    capabilities: ["create_snapshot", "remote_pull_future", "remote_push_future", "conflict_resolve_future"],
    description: "Reserved adapter boundary for future authenticated cloud save, restore and conflict resolution.",
  },
];

export const CLOUD_SAVE_BLOCK_DEFINITIONS: readonly CloudSaveBlockDefinition[] = [
  {
    id: "identity",
    label: "Player Identity",
    syncMode: "remote_locked",
    rankedImpact: false,
    economyImpact: false,
    conflictPolicy: "server_wins_future",
    requiredBeforeRemote: ["Auth Link Prep", "backend player identity"],
  },
  {
    id: "wallet",
    label: "Wallet / Currencies",
    syncMode: "remote_locked",
    rankedImpact: false,
    economyImpact: true,
    conflictPolicy: "server_wins_future",
    requiredBeforeRemote: ["Backend reward reconciliation", "server currency ledger"],
  },
  {
    id: "progression",
    label: "Progression / Power",
    syncMode: "remote_locked",
    rankedImpact: true,
    economyImpact: true,
    conflictPolicy: "manual_merge_future",
    requiredBeforeRemote: ["Run Validation Payload", "Anti-Cheat Skeleton", "server power recalculation"],
  },
  {
    id: "multiplayer",
    label: "Multiplayer Counters",
    syncMode: "remote_locked",
    rankedImpact: true,
    economyImpact: true,
    conflictPolicy: "server_wins_future",
    requiredBeforeRemote: ["Remote leaderboard submit", "Remote tournament submit", "Remote duel submit"],
  },
  {
    id: "tasks",
    label: "Tasks / Claims",
    syncMode: "remote_locked",
    rankedImpact: true,
    economyImpact: true,
    conflictPolicy: "manual_merge_future",
    requiredBeforeRemote: ["Task reward reconciliation", "server task period state"],
  },
  {
    id: "leaderboards",
    label: "Leaderboard Cache",
    syncMode: "remote_future",
    rankedImpact: true,
    economyImpact: false,
    conflictPolicy: "server_wins_future",
    requiredBeforeRemote: ["Remote leaderboard adapter"],
  },
  {
    id: "tournaments",
    label: "Tournament State",
    syncMode: "remote_future",
    rankedImpact: true,
    economyImpact: true,
    conflictPolicy: "server_wins_future",
    requiredBeforeRemote: ["Remote tournament adapter", "server event clock"],
  },
  {
    id: "duels",
    label: "Leak Duel State",
    syncMode: "remote_future",
    rankedImpact: true,
    economyImpact: true,
    conflictPolicy: "server_wins_future",
    requiredBeforeRemote: ["Remote duel adapter", "server duel seed validation"],
  },
  {
    id: "seasons",
    label: "Season State",
    syncMode: "remote_future",
    rankedImpact: true,
    economyImpact: true,
    conflictPolicy: "server_wins_future",
    requiredBeforeRemote: ["Season backend", "server reward track"],
  },
  {
    id: "sync",
    label: "Sync Metadata",
    syncMode: "remote_locked",
    rankedImpact: false,
    economyImpact: false,
    conflictPolicy: "server_wins_future",
    requiredBeforeRemote: ["backend sync clock", "conflict resolver"],
  },
];

export const CLOUD_SAVE_ADAPTER_SYSTEM_DEFINITION: CloudSaveAdapterSystemDefinition = {
  version: CLOUD_SAVE_ADAPTER_SYSTEM_VERSION,
  goal: "Create a backend-ready cloud save boundary for local profile snapshots, future remote push/pull, ranked block locking and conflict resolution without enabling public sync yet.",
  defaultProviderId: "local_snapshot_adapter",
  remotePath: "/api/game/save/sync",
  routeKey: "save.sync",
  publicSyncEnabled: false,
  providers: CLOUD_SAVE_ADAPTER_PROVIDERS,
  blocks: CLOUD_SAVE_BLOCK_DEFINITIONS,
  locks: [
    "remote_adapter_missing",
    "auth_required",
    "backend_link_required",
    "server_timestamp_required",
    "conflict_resolution_required",
    "anti_cheat_required_for_ranked_blocks",
    "public_sync_disabled",
  ],
  rules: [
    "Cloud save reads local profile snapshots through this adapter boundary instead of remote code touching localStorage directly.",
    "Remote push, pull, restore and merge remain disabled until authenticated backend identity exists.",
    "Ranked, economy and reward-impacting blocks stay backend-locked until run validation, anti-cheat and server reconciliation are implemented.",
    "Every future remote snapshot must include schema version, player identity, block hashes, pending queues and server timestamp metadata.",
  ],
  requiredBeforeLive: [
    "Auth Link Prep",
    "Run Validation Payload",
    "Anti-Cheat Skeleton",
    "Backend Config Layer",
    "server-side conflict resolution",
  ],
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

function getProfileBlock(profile: PlayerProfile, blockId: CloudSaveBlockId): unknown {
  if (blockId === "identity") return profile.identity;
  if (blockId === "wallet") return profile.wallet;
  if (blockId === "progression") return profile.progressionV2;
  if (blockId === "multiplayer") return profile.multiplayer;
  if (blockId === "tasks") return profile.tasksV2;
  if (blockId === "leaderboards") return profile.leaderboards;
  if (blockId === "tournaments") return profile.tournaments;
  if (blockId === "duels") return profile.duels;
  if (blockId === "seasons") return profile.seasons;
  return profile.sync;
}

export function createCloudSaveBlockRows(profile: PlayerProfile): CloudSaveBlockSnapshotRow[] {
  return CLOUD_SAVE_BLOCK_DEFINITIONS.map((block) => {
    const text = stableStringify(getProfileBlock(profile, block.id));
    return {
      blockId: block.id,
      label: block.label,
      syncMode: block.syncMode,
      rankedImpact: block.rankedImpact,
      economyImpact: block.economyImpact,
      localHash: hashText(text),
      approxBytes: text.length,
      canPushRemote: false,
      requiredBeforeRemote: block.requiredBeforeRemote,
    };
  });
}

export function createCloudSaveProfileHash(profile: PlayerProfile): string {
  const blockRows = createCloudSaveBlockRows(profile);
  return hashText(blockRows.map((row) => `${row.blockId}:${row.localHash}`).join("|"));
}

function createCloudSaveEnvelopeId(profile: PlayerProfile, generatedAtIso: string): string {
  const base = `${profile.identity.localPlayerId}:${profile.schemaVersion}:${createCloudSaveProfileHash(profile)}:${generatedAtIso.slice(0, 10)}`;
  return `cloud-save-${hashText(base)}`;
}

export function createCloudSaveSnapshotEnvelope(profile: PlayerProfile, date = new Date()): CloudSaveSnapshotEnvelope {
  const generatedAtIso = date.toISOString();
  const blockRows = createCloudSaveBlockRows(profile);
  const rankedBlockCount = blockRows.filter((row) => row.rankedImpact).length;
  const economyBlockCount = blockRows.filter((row) => row.economyImpact).length;

  return {
    id: createCloudSaveEnvelopeId(profile, generatedAtIso),
    version: CLOUD_SAVE_ADAPTER_SYSTEM_VERSION,
    schemaVersion: profile.schemaVersion,
    providerId: CLOUD_SAVE_ADAPTER_SYSTEM_DEFINITION.defaultProviderId,
    operationId: "local_snapshot",
    playerIdentity: profile.identity,
    generatedAtIso,
    localPreviewOnly: true,
    publicSyncEnabled: false,
    backendLinked: profile.sync.backendLinked,
    validationStatus: profile.sync.validationStatus,
    pendingRunResultIds: profile.sync.pendingRunResultIds,
    pendingEconomyEventIds: profile.sync.pendingEconomyEventIds,
    blockRows,
    locks: CLOUD_SAVE_ADAPTER_SYSTEM_DEFINITION.locks,
    payloadPreview: {
      routeKey: CLOUD_SAVE_ADAPTER_SYSTEM_DEFINITION.routeKey,
      remotePath: CLOUD_SAVE_ADAPTER_SYSTEM_DEFINITION.remotePath,
      profileHash: createCloudSaveProfileHash(profile),
      blockCount: blockRows.length,
      rankedBlockCount,
      economyBlockCount,
    },
  };
}

export function getCloudSaveAdapterSummary(): CloudSaveAdapterSummary {
  return {
    version: CLOUD_SAVE_ADAPTER_SYSTEM_VERSION,
    defaultProviderId: CLOUD_SAVE_ADAPTER_SYSTEM_DEFINITION.defaultProviderId,
    blockCount: CLOUD_SAVE_BLOCK_DEFINITIONS.length,
    remoteLockedBlockCount: CLOUD_SAVE_BLOCK_DEFINITIONS.filter((block) => block.syncMode !== "local_only").length,
    rankedBlockCount: CLOUD_SAVE_BLOCK_DEFINITIONS.filter((block) => block.rankedImpact).length,
    economyBlockCount: CLOUD_SAVE_BLOCK_DEFINITIONS.filter((block) => block.economyImpact).length,
    publicSyncEnabled: false,
    requiredBeforeLive: CLOUD_SAVE_ADAPTER_SYSTEM_DEFINITION.requiredBeforeLive,
  };
}
