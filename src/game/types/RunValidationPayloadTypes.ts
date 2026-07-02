import type { PlayerIdentityV2, SaveValidationStatus } from "./SaveSchemaTypes";
import type { LeaderboardSubmissionStatus, LeaderboardValidationTier } from "./LeaderboardTypes";
import type { MultiplayerAdapterEnvelope } from "./MultiplayerAdapterTypes";

export type RunValidationSource = "arena" | "campaign" | "tournament" | "duel" | "weekly_boss";
export type RunValidationPayloadKind = "arena_run" | "campaign_boss" | "tournament_run" | "duel_result" | "boss_damage";
export type RunValidationStatus = "local_preview" | "blocked_backend_required" | "ready_for_anti_cheat_future";
export type RunValidationRiskTier = "low" | "medium" | "high" | "critical";
export type RunValidationClockStatus = "local_clock" | "server_clock_required";

export type RunValidationMetricKey =
  | "score"
  | "leaksDefeated"
  | "bossesBroken"
  | "bossDamage"
  | "survivedSeconds"
  | "hpRemaining"
  | "damageTaken"
  | "guards"
  | "dodges"
  | "skillsUsed"
  | "ultimatesUsed";

export type RunValidationLockId =
  | "backend_identity_required"
  | "server_clock_required"
  | "seed_validation_required"
  | "anti_cheat_required"
  | "cloud_save_required"
  | "reward_reconciliation_required"
  | "public_submit_disabled";

export interface RunValidationMetricRow {
  key: RunValidationMetricKey;
  label: string;
  value: number;
  maxReasonableValue: number;
  riskTier: RunValidationRiskTier;
  requiresServerCheck: boolean;
}

export interface RunValidationLock {
  id: RunValidationLockId;
  label: string;
  blocking: boolean;
}

export interface RunValidationPayloadInput {
  source: RunValidationSource;
  kind?: RunValidationPayloadKind;
  runId?: string;
  playerId: string;
  displayName: string;
  stageId?: string;
  bossId?: string;
  tournamentId?: string;
  duelId?: string;
  seedKey?: string;
  startedAtIso?: string;
  completedAtIso?: string;
  score?: number;
  leaksDefeated?: number;
  bossesBroken?: number;
  bossDamage?: number;
  survivedSeconds?: number;
  hpRemaining?: number;
  damageTaken?: number;
  guards?: number;
  dodges?: number;
  skillsUsed?: number;
  ultimatesUsed?: number;
}

export interface RunValidationPayload {
  id: string;
  version: string;
  source: RunValidationSource;
  kind: RunValidationPayloadKind;
  runId: string;
  playerId: string;
  displayName: string;
  status: RunValidationStatus;
  validationTier: LeaderboardValidationTier;
  submissionStatus: LeaderboardSubmissionStatus;
  saveValidationStatus: SaveValidationStatus;
  clockStatus: RunValidationClockStatus;
  localPreviewOnly: boolean;
  publicSubmitEnabled: boolean;
  startedAtIso: string;
  completedAtIso: string;
  durationSeconds: number;
  identifiers: {
    stageId?: string;
    bossId?: string;
    tournamentId?: string;
    duelId?: string;
    seedKey: string;
  };
  playerSnapshot: {
    level: number;
    powerScore: number;
    evolutionId: string;
    selectedSkillIds: readonly string[];
    selectedSkinId: string;
    selectedStageId: string;
  };
  metrics: readonly RunValidationMetricRow[];
  integrity: {
    payloadHash: string;
    requiresServerSeed: boolean;
    requiresServerClock: boolean;
    requiresAntiCheat: boolean;
  };
  locks: readonly RunValidationLock[];
  adapterEnvelope: MultiplayerAdapterEnvelope;
  summaryRows: readonly string[];
}

export interface RunValidationProfileSnapshotInput extends Partial<RunValidationPayloadInput> {
  source: RunValidationSource;
}

export interface RunValidationPayloadSummary {
  version: string;
  publicSubmitEnabled: boolean;
  sampleCount: number;
  blockingLockCount: number;
  requiredBeforeLive: readonly string[];
}

export interface RunValidationPayloadSystemDefinition {
  version: string;
  goal: string;
  publicSubmitEnabled: boolean;
  supportedSources: readonly RunValidationSource[];
  requiredFields: readonly string[];
  locks: readonly RunValidationLockId[];
  rules: readonly string[];
  requiredBeforeLive: readonly string[];
}

export type RunValidationPayloadMap = Record<RunValidationSource, RunValidationPayload>;
export type RunValidationIdentity = Pick<PlayerIdentityV2, "localPlayerId" | "displayName" | "handle" | "walletAddress">;
