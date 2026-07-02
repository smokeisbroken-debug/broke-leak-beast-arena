import type { PlayerProfile } from "../data/playerProfile";
import { createMultiplayerAdapterEnvelope } from "./MultiplayerAdapterSystem";
import type {
  RunValidationLock,
  RunValidationLockId,
  RunValidationMetricKey,
  RunValidationMetricRow,
  RunValidationPayload,
  RunValidationPayloadInput,
  RunValidationPayloadKind,
  RunValidationPayloadMap,
  RunValidationPayloadSummary,
  RunValidationPayloadSystemDefinition,
  RunValidationProfileSnapshotInput,
  RunValidationRiskTier,
  RunValidationSource,
} from "../types/RunValidationPayloadTypes";

export const RUN_VALIDATION_PAYLOAD_SYSTEM_VERSION = "0.13.2-run-validation-payload";

const RUN_VALIDATION_LOCK_IDS: readonly RunValidationLockId[] = [
  "backend_identity_required",
  "server_clock_required",
  "seed_validation_required",
  "anti_cheat_required",
  "cloud_save_required",
  "reward_reconciliation_required",
  "public_submit_disabled",
];

export const RUN_VALIDATION_PAYLOAD_SYSTEM_DEFINITION: RunValidationPayloadSystemDefinition = {
  version: RUN_VALIDATION_PAYLOAD_SYSTEM_VERSION,
  goal: "Create a typed run validation payload for arena, campaign, tournament, Leak Duel and weekly boss results before ranked submit, reward claim or anti-cheat are enabled.",
  publicSubmitEnabled: false,
  supportedSources: ["arena", "campaign", "tournament", "duel", "weekly_boss"],
  requiredFields: [
    "runId",
    "playerId",
    "displayName",
    "source",
    "seedKey",
    "startedAtIso",
    "completedAtIso",
    "score",
    "survivedSeconds",
    "hpRemaining",
    "damageTaken",
  ],
  locks: RUN_VALIDATION_LOCK_IDS,
  rules: [
    "Run validation payloads are local-preview only in this patch and must not submit ranked scores or unlock rewards.",
    "Every ranked tournament, duel, leaderboard and boss result must pass through this payload shape before future backend validation.",
    "Server seed, server clock, anti-cheat and cloud-save identity remain mandatory before public submission is enabled.",
    "Metrics include capped reasonable ranges so anti-cheat can later flag impossible score, duration, HP, damage and action counts.",
    "The payload creates a multiplayer adapter envelope, but the envelope remains backend-locked and public submit disabled.",
  ],
  requiredBeforeLive: [
    "Auth Link Prep",
    "server-generated run seeds",
    "server clock timestamps",
    "Anti-Cheat Skeleton",
    "Cloud Save Adapter live identity",
    "reward reconciliation ledger",
  ],
};

const METRIC_LIMITS: Record<RunValidationMetricKey, number> = {
  score: 25000,
  leaksDefeated: 250,
  bossesBroken: 12,
  bossDamage: 250000,
  survivedSeconds: 1200,
  hpRemaining: 150,
  damageTaken: 5000,
  guards: 300,
  dodges: 300,
  skillsUsed: 250,
  ultimatesUsed: 80,
};

const METRIC_LABELS: Record<RunValidationMetricKey, string> = {
  score: "Score",
  leaksDefeated: "Leaks defeated",
  bossesBroken: "Bosses broken",
  bossDamage: "Boss damage",
  survivedSeconds: "Survived seconds",
  hpRemaining: "HP remaining",
  damageTaken: "Damage taken",
  guards: "Guards",
  dodges: "Dodges",
  skillsUsed: "Skills used",
  ultimatesUsed: "Ultimates used",
};

function safeInteger(value: unknown): number {
  return Math.max(0, Math.floor(Number(value) || 0));
}

function getKindForSource(source: RunValidationSource): RunValidationPayloadKind {
  if (source === "campaign") return "campaign_boss";
  if (source === "tournament") return "tournament_run";
  if (source === "duel") return "duel_result";
  if (source === "weekly_boss") return "boss_damage";
  return "arena_run";
}

function sourceToRouteSource(source: RunValidationSource): string {
  if (source === "weekly_boss") return "weekly-boss";
  return source.replace(/_/g, "-");
}

function makeRunId(input: RunValidationPayloadInput): string {
  const source = sourceToRouteSource(input.source);
  const seed = input.seedKey || "local-seed";
  const player = input.playerId || "local-player";
  const base = `${source}:${player}:${seed}:${input.completedAtIso || "local"}`.replace(/[^a-z0-9:_-]+/gi, "-").toLowerCase();
  return `run:${base}`;
}

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

function riskForValue(value: number, maxReasonableValue: number): RunValidationRiskTier {
  if (value > maxReasonableValue) return "critical";
  if (value > maxReasonableValue * 0.85) return "high";
  if (value > maxReasonableValue * 0.65) return "medium";
  return "low";
}

function createMetric(key: RunValidationMetricKey, value: number, requiresServerCheck = true): RunValidationMetricRow {
  const maxReasonableValue = METRIC_LIMITS[key];
  return {
    key,
    label: METRIC_LABELS[key],
    value: safeInteger(value),
    maxReasonableValue,
    riskTier: riskForValue(safeInteger(value), maxReasonableValue),
    requiresServerCheck,
  };
}

function createLocks(): RunValidationLock[] {
  const labelById: Record<RunValidationLockId, string> = {
    backend_identity_required: "Backend player identity is required before this run can become ranked.",
    server_clock_required: "Server start/end timestamps are required before remote validation.",
    seed_validation_required: "Server seed validation is required for fair tournaments and 1v1 duels.",
    anti_cheat_required: "Anti-cheat must validate score, duration, HP, damage and actions.",
    cloud_save_required: "Cloud save identity and profile hash are required before submit.",
    reward_reconciliation_required: "Backend reward reconciliation is required before any claim.",
    public_submit_disabled: "Public run submit remains disabled in this local preview.",
  };

  return RUN_VALIDATION_LOCK_IDS.map((id) => ({ id, label: labelById[id], blocking: true }));
}

function getStartedAtIso(input: RunValidationPayloadInput): string {
  if (input.startedAtIso) return input.startedAtIso;
  if (input.completedAtIso) return new Date(new Date(input.completedAtIso).getTime() - safeInteger(input.survivedSeconds || 120) * 1000).toISOString();
  return "2026-01-01T00:00:00.000Z";
}

function getCompletedAtIso(input: RunValidationPayloadInput): string {
  return input.completedAtIso || "2026-01-01T00:03:00.000Z";
}

function durationSeconds(startedAtIso: string, completedAtIso: string, fallbackSeconds: number): number {
  const start = new Date(startedAtIso).getTime();
  const end = new Date(completedAtIso).getTime();
  const diff = Math.floor((end - start) / 1000);
  return Number.isFinite(diff) && diff > 0 ? diff : safeInteger(fallbackSeconds);
}

function createPayloadId(input: RunValidationPayloadInput, runId: string, payloadHash: string): string {
  const base = `${input.source}:${runId}:${payloadHash}`;
  return `run-validation-${hashText(base)}`;
}

export function createRunValidationPayload(input: RunValidationPayloadInput): RunValidationPayload {
  const kind = input.kind ?? getKindForSource(input.source);
  const runId = input.runId ?? makeRunId(input);
  const startedAtIso = getStartedAtIso(input);
  const completedAtIso = getCompletedAtIso(input);
  const duration = durationSeconds(startedAtIso, completedAtIso, safeInteger(input.survivedSeconds ?? 180));
  const seedKey = input.seedKey || `${sourceToRouteSource(input.source)}-local-preview-seed`;
  const metrics: RunValidationMetricRow[] = [
    createMetric("score", input.score ?? 0),
    createMetric("leaksDefeated", input.leaksDefeated ?? 0),
    createMetric("bossesBroken", input.bossesBroken ?? 0),
    createMetric("bossDamage", input.bossDamage ?? 0),
    createMetric("survivedSeconds", input.survivedSeconds ?? duration),
    createMetric("hpRemaining", input.hpRemaining ?? 0),
    createMetric("damageTaken", input.damageTaken ?? 0),
    createMetric("guards", input.guards ?? 0),
    createMetric("dodges", input.dodges ?? 0),
    createMetric("skillsUsed", input.skillsUsed ?? 0),
    createMetric("ultimatesUsed", input.ultimatesUsed ?? 0),
  ];
  const payloadHash = hashText(stableStringify({ kind, runId, seedKey, startedAtIso, completedAtIso, metrics }));
  const locks = createLocks();
  const adapterEnvelope = createMultiplayerAdapterEnvelope({
    channelId: "run_validation_submit",
    playerId: input.playerId,
    displayName: input.displayName,
    sourceId: runId,
    value: safeInteger(input.score ?? 0),
    periodKey: completedAtIso.slice(0, 10),
    payloadPreview: {
      source: input.source,
      kind,
      runId,
      seedKey,
      payloadHash,
      validationTier: "backend_required",
    },
    createdAtIso: completedAtIso,
  });

  return {
    id: createPayloadId(input, runId, payloadHash),
    version: RUN_VALIDATION_PAYLOAD_SYSTEM_VERSION,
    source: input.source,
    kind,
    runId,
    playerId: input.playerId,
    displayName: input.displayName,
    status: "blocked_backend_required",
    validationTier: "backend_required",
    submissionStatus: "blocked_backend_required",
    saveValidationStatus: "pending_remote",
    clockStatus: "server_clock_required",
    localPreviewOnly: true,
    publicSubmitEnabled: false,
    startedAtIso,
    completedAtIso,
    durationSeconds: duration,
    identifiers: {
      stageId: input.stageId,
      bossId: input.bossId,
      tournamentId: input.tournamentId,
      duelId: input.duelId,
      seedKey,
    },
    playerSnapshot: {
      level: 0,
      powerScore: 0,
      evolutionId: "unknown",
      selectedSkillIds: [],
      selectedSkinId: "unknown",
      selectedStageId: input.stageId || "unknown",
    },
    metrics,
    integrity: {
      payloadHash,
      requiresServerSeed: true,
      requiresServerClock: true,
      requiresAntiCheat: true,
    },
    locks,
    adapterEnvelope,
    summaryRows: [
      `SOURCE: ${input.source.replace(/_/g, " ").toUpperCase()}`,
      `KIND: ${kind.replace(/_/g, " ").toUpperCase()}`,
      `RUN ID: ${runId}`,
      `HASH: ${payloadHash}`,
      "STATUS: BACKEND VALIDATION REQUIRED",
      "SUBMIT: DISABLED",
    ],
  };
}

function overlayPlayerSnapshot(payload: RunValidationPayload, profile: PlayerProfile): RunValidationPayload {
  const selectedSkillIds = Object.values(profile.selectedSkillIds).filter(Boolean);
  return {
    ...payload,
    playerSnapshot: {
      level: profile.level,
      powerScore: profile.progressionV2.powerScore,
      evolutionId: profile.progressionV2.evolutionId,
      selectedSkillIds,
      selectedSkinId: profile.selectedSkinId,
      selectedStageId: profile.selectedStageId,
    },
  };
}

export function createRunValidationPayloadFromProfile(profile: PlayerProfile, input: RunValidationProfileSnapshotInput): RunValidationPayload {
  const payload = createRunValidationPayload({
    source: input.source,
    kind: input.kind,
    runId: input.runId,
    playerId: input.playerId || profile.identity.localPlayerId,
    displayName: input.displayName || profile.identity.displayName,
    stageId: input.stageId || profile.selectedStageId,
    bossId: input.bossId || profile.selectedBossId,
    tournamentId: input.tournamentId,
    duelId: input.duelId,
    seedKey: input.seedKey,
    startedAtIso: input.startedAtIso,
    completedAtIso: input.completedAtIso,
    score: input.score ?? profile.bestScore,
    leaksDefeated: input.leaksDefeated ?? 8,
    bossesBroken: input.bossesBroken ?? 1,
    bossDamage: input.bossDamage ?? profile.multiplayer.weeklyBossDamage,
    survivedSeconds: input.survivedSeconds ?? 180,
    hpRemaining: input.hpRemaining ?? 65,
    damageTaken: input.damageTaken ?? 90,
    guards: input.guards ?? 4,
    dodges: input.dodges ?? 5,
    skillsUsed: input.skillsUsed ?? 6,
    ultimatesUsed: input.ultimatesUsed ?? 1,
  });
  return overlayPlayerSnapshot(payload, profile);
}

export function createRunValidationPayloadMap(profile: PlayerProfile): RunValidationPayloadMap {
  return {
    arena: createRunValidationPayloadFromProfile(profile, {
      source: "arena",
      seedKey: "arena-local-preview-seed",
      score: Math.max(profile.bestScore, 1200),
      leaksDefeated: 12,
      survivedSeconds: 160,
      hpRemaining: 72,
      damageTaken: 80,
    }),
    campaign: createRunValidationPayloadFromProfile(profile, {
      source: "campaign",
      seedKey: "chapter-1-boss-preview-seed",
      bossId: profile.selectedBossId,
      score: Math.max(profile.bestScore, 1500),
      bossDamage: 5200,
      bossesBroken: 1,
      survivedSeconds: 210,
    }),
    tournament: createRunValidationPayloadFromProfile(profile, {
      source: "tournament",
      tournamentId: profile.tournaments.activeTournamentId || "no_spend_arena",
      seedKey: "no-spend-cup-preview-seed",
      score: Math.max(profile.tournamentPoints, 1800),
      survivedSeconds: 180,
    }),
    duel: createRunValidationPayloadFromProfile(profile, {
      source: "duel",
      duelId: "leak_duel",
      seedKey: "leak-duel-preview-seed",
      score: Math.max(profile.rankPoints, 1400),
      leaksDefeated: 14,
      survivedSeconds: 150,
      hpRemaining: 68,
    }),
    weekly_boss: createRunValidationPayloadFromProfile(profile, {
      source: "weekly_boss",
      bossId: "weekly_leak_king",
      seedKey: "weekly-boss-preview-seed",
      score: Math.max(profile.bestScore, 1600),
      bossDamage: Math.max(profile.multiplayer.weeklyBossDamage, 7500),
      survivedSeconds: 240,
    }),
  };
}

export function getRunValidationPayloadSummary(): RunValidationPayloadSummary {
  return {
    version: RUN_VALIDATION_PAYLOAD_SYSTEM_VERSION,
    publicSubmitEnabled: RUN_VALIDATION_PAYLOAD_SYSTEM_DEFINITION.publicSubmitEnabled,
    sampleCount: RUN_VALIDATION_PAYLOAD_SYSTEM_DEFINITION.supportedSources.length,
    blockingLockCount: RUN_VALIDATION_LOCK_IDS.length,
    requiredBeforeLive: RUN_VALIDATION_PAYLOAD_SYSTEM_DEFINITION.requiredBeforeLive,
  };
}
