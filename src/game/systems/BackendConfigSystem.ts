import type {
  BackendConfigEnvironmentDefinition,
  BackendConfigEnvironmentId,
  BackendFeatureGateDefinition,
  BackendConfigLockId,
  BackendConfigReadinessRow,
  BackendConfigRouteDefinition,
  BackendConfigRouteKey,
  BackendConfigRouteSnapshotRow,
  BackendConfigSnapshot,
  BackendConfigSummary,
  BackendConfigSystemDefinition,
} from "../types/BackendConfigTypes";

export const BACKEND_CONFIG_SYSTEM_VERSION = "0.13.4-backend-config-layer";

export const BACKEND_CONFIG_ENVIRONMENTS: readonly BackendConfigEnvironmentDefinition[] = [
  {
    id: "local_preview",
    label: "Local Preview",
    releaseLane: "dev",
    transport: "none",
    baseUrl: "local://preview-only",
    remoteReadsEnabled: false,
    publicWritesEnabled: false,
    remoteConfigEnabled: false,
    description: "Safe offline configuration for UI, balancing and payload preview. No public leaderboard, tournament, duel, boss or economy write is allowed.",
  },
  {
    id: "staging_placeholder",
    label: "Staging Placeholder",
    releaseLane: "staging",
    transport: "http_json_future",
    baseUrl: "https://api.smokeisbroke.com/game/staging-placeholder",
    remoteReadsEnabled: false,
    publicWritesEnabled: false,
    remoteConfigEnabled: false,
    description: "Reserved future staging boundary. The client can describe routes, but must not call them until auth, validation and config signing are implemented.",
  },
  {
    id: "production_locked",
    label: "Production Locked",
    releaseLane: "production",
    transport: "http_json_future",
    baseUrl: "https://api.smokeisbroke.com/game",
    remoteReadsEnabled: false,
    publicWritesEnabled: false,
    remoteConfigEnabled: false,
    description: "Production route map with every write locked until backend identity, anti-cheat, cloud save and reward ledger are live.",
  },
];

export const BACKEND_FEATURE_GATES: readonly BackendFeatureGateDefinition[] = [
  {
    id: "auth_link",
    label: "Auth Link",
    state: "planned",
    localPreviewAllowed: true,
    remoteReadAllowed: false,
    remoteWriteAllowed: false,
    locks: ["backend_url_missing", "auth_missing", "public_writes_disabled"],
    description: "Future player identity link for Telegram, wallet or account provider. Required before any public multiplayer write.",
  },
  {
    id: "remote_config",
    label: "Remote Config",
    state: "remote_locked",
    localPreviewAllowed: true,
    remoteReadAllowed: false,
    remoteWriteAllowed: false,
    locks: ["remote_config_missing", "backend_url_missing"],
    description: "Future signed config for seasons, tournaments, boss rotations, reward tables and feature switches.",
  },
  {
    id: "cloud_save",
    label: "Cloud Save",
    state: "remote_locked",
    localPreviewAllowed: true,
    remoteReadAllowed: false,
    remoteWriteAllowed: false,
    locks: ["auth_missing", "cloud_save_missing", "public_writes_disabled"],
    description: "Profile sync boundary. Required before ranked runs can trust level, power, skills, evolution and inventory state.",
  },
  {
    id: "run_validation",
    label: "Run Validation",
    state: "remote_locked",
    localPreviewAllowed: true,
    remoteReadAllowed: false,
    remoteWriteAllowed: false,
    locks: ["auth_missing", "cloud_save_missing", "server_clock_missing", "server_seed_missing", "public_writes_disabled"],
    description: "Typed run payloads exist locally, but server validation must own ranked score acceptance.",
  },
  {
    id: "anti_cheat",
    label: "Anti-Cheat",
    state: "remote_locked",
    localPreviewAllowed: true,
    remoteReadAllowed: false,
    remoteWriteAllowed: false,
    locks: ["server_clock_missing", "server_seed_missing", "anti_cheat_missing", "public_writes_disabled"],
    description: "Local assessment exists as preview only. Backend reconstruction is required before public rewards or rankings.",
  },
  {
    id: "leaderboard_fetch",
    label: "Leaderboard Fetch",
    state: "remote_locked",
    localPreviewAllowed: true,
    remoteReadAllowed: false,
    remoteWriteAllowed: false,
    locks: ["backend_url_missing", "remote_config_missing"],
    description: "Leaderboard UI currently uses deterministic local mock data. Remote reads wait for signed route config.",
  },
  {
    id: "leaderboard_submit",
    label: "Leaderboard Submit",
    state: "remote_locked",
    localPreviewAllowed: true,
    remoteReadAllowed: false,
    remoteWriteAllowed: false,
    locks: ["auth_missing", "cloud_save_missing", "anti_cheat_missing", "public_writes_disabled"],
    description: "Public leaderboard writes stay locked until identity, cloud save and anti-cheat checks are active.",
  },
  {
    id: "tournament_fetch",
    label: "Tournament Fetch",
    state: "remote_locked",
    localPreviewAllowed: true,
    remoteReadAllowed: false,
    remoteWriteAllowed: false,
    locks: ["remote_config_missing", "backend_url_missing"],
    description: "Tournament catalog is local-preview only until event config is signed and fetched remotely.",
  },
  {
    id: "tournament_submit",
    label: "Tournament Submit",
    state: "remote_locked",
    localPreviewAllowed: true,
    remoteReadAllowed: false,
    remoteWriteAllowed: false,
    locks: ["auth_missing", "server_clock_missing", "server_seed_missing", "anti_cheat_missing", "reward_ledger_missing", "public_writes_disabled"],
    description: "Tournament points can be previewed locally, but ranked tournament results require server-authoritative validation.",
  },
  {
    id: "duel_fetch",
    label: "Leak Duel Fetch",
    state: "remote_locked",
    localPreviewAllowed: true,
    remoteReadAllowed: false,
    remoteWriteAllowed: false,
    locks: ["auth_missing", "server_seed_missing", "backend_url_missing"],
    description: "Future Duel matchmaking and seed fetch route. Local Duel seed preview remains offline.",
  },
  {
    id: "duel_submit",
    label: "Leak Duel Submit",
    state: "remote_locked",
    localPreviewAllowed: true,
    remoteReadAllowed: false,
    remoteWriteAllowed: false,
    locks: ["auth_missing", "server_clock_missing", "server_seed_missing", "anti_cheat_missing", "public_writes_disabled"],
    description: "1v1 Leak Duel result submission stays blocked until server-approved seeds and anti-cheat validation exist.",
  },
  {
    id: "boss_damage_submit",
    label: "Boss Damage Submit",
    state: "remote_locked",
    localPreviewAllowed: true,
    remoteReadAllowed: false,
    remoteWriteAllowed: false,
    locks: ["auth_missing", "cloud_save_missing", "anti_cheat_missing", "reward_ledger_missing", "public_writes_disabled"],
    description: "Community boss damage must be server-validated before it can affect shared HP or weekly rankings.",
  },
  {
    id: "economy_reconcile",
    label: "Economy Reconcile",
    state: "remote_locked",
    localPreviewAllowed: true,
    remoteReadAllowed: false,
    remoteWriteAllowed: false,
    locks: ["auth_missing", "cloud_save_missing", "reward_ledger_missing", "public_writes_disabled"],
    description: "Coins, leak points, rank points and tournament rewards require a backend ledger before remote claims are public.",
  },
  {
    id: "season_sync",
    label: "Season Sync",
    state: "planned",
    localPreviewAllowed: true,
    remoteReadAllowed: false,
    remoteWriteAllowed: false,
    locks: ["season_backend_missing", "remote_config_missing", "public_writes_disabled"],
    description: "Season progression is planned after backend-ready multiplayer locks are in place.",
  },
];

export const BACKEND_CONFIG_ROUTES: readonly BackendConfigRouteDefinition[] = [
  {
    routeKey: "auth.link",
    label: "Auth Link",
    method: "POST",
    path: "/api/game/auth/link",
    featureGateId: "auth_link",
    requiresAuth: false,
    requiresCloudSave: false,
    requiresServerClock: true,
    requiresServerSeed: false,
    requiresAntiCheat: false,
    requiresRewardLedger: false,
    backendLocked: true,
    publicWriteEnabled: false,
    localPreviewOnly: true,
  },
  {
    routeKey: "config.fetch",
    label: "Remote Config Fetch",
    method: "GET",
    path: "/api/game/config",
    featureGateId: "remote_config",
    requiresAuth: false,
    requiresCloudSave: false,
    requiresServerClock: false,
    requiresServerSeed: false,
    requiresAntiCheat: false,
    requiresRewardLedger: false,
    backendLocked: true,
    publicWriteEnabled: false,
    localPreviewOnly: true,
  },
  {
    routeKey: "save.sync",
    label: "Cloud Save Sync",
    method: "POST",
    path: "/api/game/save/sync",
    channelId: "cloud_save",
    payloadKind: "save_snapshot",
    featureGateId: "cloud_save",
    requiresAuth: true,
    requiresCloudSave: false,
    requiresServerClock: true,
    requiresServerSeed: false,
    requiresAntiCheat: false,
    requiresRewardLedger: false,
    backendLocked: true,
    publicWriteEnabled: false,
    localPreviewOnly: true,
  },
  {
    routeKey: "run.validation.submit",
    label: "Run Validation Submit",
    method: "POST",
    path: "/api/game/runs/validate",
    channelId: "run_validation_submit",
    payloadKind: "run_validation",
    featureGateId: "run_validation",
    requiresAuth: true,
    requiresCloudSave: true,
    requiresServerClock: true,
    requiresServerSeed: true,
    requiresAntiCheat: false,
    requiresRewardLedger: false,
    backendLocked: true,
    publicWriteEnabled: false,
    localPreviewOnly: true,
  },
  {
    routeKey: "leaderboard.fetch",
    label: "Leaderboard Fetch",
    method: "GET",
    path: "/api/game/leaderboard",
    featureGateId: "leaderboard_fetch",
    requiresAuth: false,
    requiresCloudSave: false,
    requiresServerClock: false,
    requiresServerSeed: false,
    requiresAntiCheat: false,
    requiresRewardLedger: false,
    backendLocked: true,
    publicWriteEnabled: false,
    localPreviewOnly: true,
  },
  {
    routeKey: "leaderboard.submit",
    label: "Leaderboard Submit",
    method: "POST",
    path: "/api/game/leaderboard/submit",
    channelId: "leaderboard_submit",
    payloadKind: "leaderboard_score",
    featureGateId: "leaderboard_submit",
    requiresAuth: true,
    requiresCloudSave: true,
    requiresServerClock: true,
    requiresServerSeed: true,
    requiresAntiCheat: true,
    requiresRewardLedger: false,
    backendLocked: true,
    publicWriteEnabled: false,
    localPreviewOnly: true,
  },
  {
    routeKey: "tournament.fetch",
    label: "Tournament Fetch",
    method: "GET",
    path: "/api/game/tournaments",
    featureGateId: "tournament_fetch",
    requiresAuth: false,
    requiresCloudSave: false,
    requiresServerClock: false,
    requiresServerSeed: false,
    requiresAntiCheat: false,
    requiresRewardLedger: false,
    backendLocked: true,
    publicWriteEnabled: false,
    localPreviewOnly: true,
  },
  {
    routeKey: "tournament.submit",
    label: "Tournament Submit",
    method: "POST",
    path: "/api/game/tournaments/submit",
    channelId: "tournament_submit",
    payloadKind: "tournament_run",
    featureGateId: "tournament_submit",
    requiresAuth: true,
    requiresCloudSave: true,
    requiresServerClock: true,
    requiresServerSeed: true,
    requiresAntiCheat: true,
    requiresRewardLedger: true,
    backendLocked: true,
    publicWriteEnabled: false,
    localPreviewOnly: true,
  },
  {
    routeKey: "duel.fetch",
    label: "Leak Duel Fetch",
    method: "GET",
    path: "/api/game/duels",
    featureGateId: "duel_fetch",
    requiresAuth: true,
    requiresCloudSave: false,
    requiresServerClock: true,
    requiresServerSeed: true,
    requiresAntiCheat: false,
    requiresRewardLedger: false,
    backendLocked: true,
    publicWriteEnabled: false,
    localPreviewOnly: true,
  },
  {
    routeKey: "duel.submit",
    label: "Leak Duel Submit",
    method: "POST",
    path: "/api/game/duels/submit",
    channelId: "duel_submit",
    payloadKind: "duel_result",
    featureGateId: "duel_submit",
    requiresAuth: true,
    requiresCloudSave: true,
    requiresServerClock: true,
    requiresServerSeed: true,
    requiresAntiCheat: true,
    requiresRewardLedger: false,
    backendLocked: true,
    publicWriteEnabled: false,
    localPreviewOnly: true,
  },
  {
    routeKey: "boss.damage.submit",
    label: "Weekly Boss Damage Submit",
    method: "POST",
    path: "/api/game/bosses/damage/submit",
    channelId: "boss_damage_submit",
    payloadKind: "boss_damage",
    featureGateId: "boss_damage_submit",
    requiresAuth: true,
    requiresCloudSave: true,
    requiresServerClock: true,
    requiresServerSeed: true,
    requiresAntiCheat: true,
    requiresRewardLedger: true,
    backendLocked: true,
    publicWriteEnabled: false,
    localPreviewOnly: true,
  },
  {
    routeKey: "economy.reconcile",
    label: "Economy Reconcile",
    method: "POST",
    path: "/api/game/economy/reconcile",
    channelId: "economy_reconcile",
    payloadKind: "economy_event",
    featureGateId: "economy_reconcile",
    requiresAuth: true,
    requiresCloudSave: true,
    requiresServerClock: true,
    requiresServerSeed: false,
    requiresAntiCheat: false,
    requiresRewardLedger: true,
    backendLocked: true,
    publicWriteEnabled: false,
    localPreviewOnly: true,
  },
  {
    routeKey: "season.sync",
    label: "Season Sync",
    method: "POST",
    path: "/api/game/seasons/sync",
    channelId: "season_sync",
    payloadKind: "season_progress",
    featureGateId: "season_sync",
    requiresAuth: true,
    requiresCloudSave: true,
    requiresServerClock: true,
    requiresServerSeed: false,
    requiresAntiCheat: false,
    requiresRewardLedger: true,
    backendLocked: true,
    publicWriteEnabled: false,
    localPreviewOnly: true,
  },
];

export const BACKEND_CONFIG_SYSTEM_DEFINITION: BackendConfigSystemDefinition = {
  version: BACKEND_CONFIG_SYSTEM_VERSION,
  goal: "Create one typed backend configuration layer for auth, cloud save, leaderboard, tournaments, Leak Duel, boss damage, economy reconciliation and seasons while all public remote writes stay disabled.",
  activeEnvironmentId: "local_preview",
  publicWritesEnabled: false,
  remoteReadsEnabled: false,
  remoteConfigEnabled: false,
  environments: BACKEND_CONFIG_ENVIRONMENTS,
  featureGates: BACKEND_FEATURE_GATES,
  routes: BACKEND_CONFIG_ROUTES,
  requiredBeforeLive: [
    "real auth provider",
    "signed remote config",
    "cloud save endpoint",
    "server-generated run and duel seeds",
    "server clock validation",
    "backend anti-cheat reconstruction",
    "reward reconciliation ledger",
  ],
  rules: [
    "Client systems must read backend route intent from this layer instead of hard-coding future URLs in scenes.",
    "Local preview is allowed for UI and payload inspection only.",
    "Public writes stay disabled for leaderboard, tournaments, Leak Duel, boss damage and economy until all locks are cleared server-side.",
    "Reward-affecting routes must require auth, cloud save snapshot and backend ledger reconciliation.",
    "Server seeds and server clock are mandatory before any ranked score can be trusted.",
  ],
};

function getActiveEnvironment(): BackendConfigEnvironmentDefinition {
  const environment = BACKEND_CONFIG_ENVIRONMENTS.find((candidate) => candidate.id === BACKEND_CONFIG_SYSTEM_DEFINITION.activeEnvironmentId);
  if (!environment) {
    throw new Error(`Unknown backend config environment: ${BACKEND_CONFIG_SYSTEM_DEFINITION.activeEnvironmentId}`);
  }
  return environment;
}

function getFeatureGate(id: BackendFeatureGateDefinition["id"]): BackendFeatureGateDefinition {
  const gate = BACKEND_FEATURE_GATES.find((candidate) => candidate.id === id);
  if (!gate) {
    throw new Error(`Unknown backend feature gate: ${id}`);
  }
  return gate;
}

function lockToRequirement(lock: BackendConfigLockId): string {
  if (lock === "backend_url_missing") return "backend base URL";
  if (lock === "auth_missing") return "player auth link";
  if (lock === "cloud_save_missing") return "cloud save profile snapshot";
  if (lock === "server_clock_missing") return "server clock";
  if (lock === "server_seed_missing") return "server-approved seed";
  if (lock === "anti_cheat_missing") return "backend anti-cheat validation";
  if (lock === "reward_ledger_missing") return "reward reconciliation ledger";
  if (lock === "remote_config_missing") return "signed remote config";
  if (lock === "season_backend_missing") return "season backend";
  return "public write switch";
}

function statusLabelForGate(gate: BackendFeatureGateDefinition): string {
  if (gate.remoteWriteAllowed) return "REMOTE WRITE ENABLED";
  if (gate.remoteReadAllowed) return "REMOTE READ PREVIEW";
  if (gate.state === "planned") return "PLANNED";
  return "BACKEND LOCKED";
}

function getRequiredBeforeLive(route: BackendConfigRouteDefinition): string[] {
  const gate = getFeatureGate(route.featureGateId);
  const requirements = new Set<string>();
  gate.locks.forEach((lock) => requirements.add(lockToRequirement(lock)));
  if (route.requiresAuth) requirements.add("player auth link");
  if (route.requiresCloudSave) requirements.add("cloud save profile snapshot");
  if (route.requiresServerClock) requirements.add("server clock");
  if (route.requiresServerSeed) requirements.add("server-approved seed");
  if (route.requiresAntiCheat) requirements.add("backend anti-cheat validation");
  if (route.requiresRewardLedger) requirements.add("reward reconciliation ledger");
  if (!route.publicWriteEnabled && route.method === "POST") requirements.add("public write switch");
  return Array.from(requirements);
}

export function getBackendConfigEnvironment(environmentId: BackendConfigEnvironmentId = BACKEND_CONFIG_SYSTEM_DEFINITION.activeEnvironmentId): BackendConfigEnvironmentDefinition {
  const environment = BACKEND_CONFIG_ENVIRONMENTS.find((candidate) => candidate.id === environmentId);
  if (!environment) {
    throw new Error(`Unknown backend config environment: ${environmentId}`);
  }
  return environment;
}

export function getBackendConfigRoute(routeKey: BackendConfigRouteKey): BackendConfigRouteDefinition {
  const route = BACKEND_CONFIG_ROUTES.find((candidate) => candidate.routeKey === routeKey);
  if (!route) {
    throw new Error(`Unknown backend config route: ${routeKey}`);
  }
  return route;
}

export function getBackendFeatureGateRows(): BackendConfigReadinessRow[] {
  return BACKEND_FEATURE_GATES.map((gate) => {
    const routeCount = BACKEND_CONFIG_ROUTES.filter((route) => route.featureGateId === gate.id).length;
    return {
      id: gate.id,
      label: gate.label,
      state: gate.state,
      remoteReady: gate.remoteReadAllowed || gate.remoteWriteAllowed,
      localPreviewAllowed: gate.localPreviewAllowed,
      routeCount,
      locks: gate.locks,
      statusLabel: statusLabelForGate(gate),
    };
  });
}

export function getBackendConfigRouteRows(): BackendConfigRouteSnapshotRow[] {
  return BACKEND_CONFIG_ROUTES.map((route) => ({
    routeKey: route.routeKey,
    label: route.label,
    method: route.method,
    path: route.path,
    featureGateId: route.featureGateId,
    backendLocked: route.backendLocked,
    publicWriteEnabled: route.publicWriteEnabled,
    localPreviewOnly: route.localPreviewOnly,
    requiredBeforeLive: getRequiredBeforeLive(route),
  }));
}

export function isBackendRoutePublicWriteEnabled(routeKey: BackendConfigRouteKey): boolean {
  const route = getBackendConfigRoute(routeKey);
  const environment = getActiveEnvironment();
  const gate = getFeatureGate(route.featureGateId);
  return environment.publicWritesEnabled && gate.remoteWriteAllowed && route.publicWriteEnabled && !route.backendLocked;
}

export function createBackendConfigSnapshot(input?: { generatedAtIso?: string }): BackendConfigSnapshot {
  const environment = getActiveEnvironment();
  const readinessRows = getBackendFeatureGateRows();
  const routeRows = getBackendConfigRouteRows();
  return {
    version: BACKEND_CONFIG_SYSTEM_VERSION,
    environmentId: environment.id,
    releaseLane: environment.releaseLane,
    generatedAtIso: input?.generatedAtIso ?? new Date(0).toISOString(),
    baseUrl: environment.baseUrl,
    transport: environment.transport,
    remoteReadsEnabled: environment.remoteReadsEnabled,
    publicWritesEnabled: environment.publicWritesEnabled,
    remoteConfigEnabled: environment.remoteConfigEnabled,
    featureGateCount: BACKEND_FEATURE_GATES.length,
    remoteLockedGateCount: readinessRows.filter((row) => row.state === "remote_locked" || row.state === "planned").length,
    publicWriteRouteCount: BACKEND_CONFIG_ROUTES.filter((route) => route.publicWriteEnabled).length,
    lockedRouteCount: BACKEND_CONFIG_ROUTES.filter((route) => route.backendLocked).length,
    readinessRows,
    routeRows,
    requiredBeforeLive: BACKEND_CONFIG_SYSTEM_DEFINITION.requiredBeforeLive,
  };
}

export function getBackendConfigSummary(): BackendConfigSummary {
  const snapshot = createBackendConfigSnapshot();
  return {
    version: snapshot.version,
    environmentId: snapshot.environmentId,
    releaseLane: snapshot.releaseLane,
    remoteReadsEnabled: snapshot.remoteReadsEnabled,
    publicWritesEnabled: snapshot.publicWritesEnabled,
    remoteConfigEnabled: snapshot.remoteConfigEnabled,
    featureGateCount: snapshot.featureGateCount,
    remoteLockedGateCount: snapshot.remoteLockedGateCount,
    routeCount: BACKEND_CONFIG_ROUTES.length,
    lockedRouteCount: snapshot.lockedRouteCount,
    requiredBeforeLive: snapshot.requiredBeforeLive,
  };
}
