import type { LeaderboardId, LeaderboardSubmissionStatus, LeaderboardValidationTier } from "./LeaderboardTypes";
import type { RewardAmount } from "./ProgressionTypes";

export type DuelModeId = "leak_duel_async" | "leak_duel_live_future";
export type DuelMatchType = "friendly" | "ranked" | "tournament_qualifier";
export type DuelBackendStatus = "local_contract" | "adapter_ready" | "remote_required";
export type DuelStatus = "draft" | "created" | "waiting_for_opponent" | "player_a_complete" | "player_b_complete" | "complete" | "expired";
export type DuelParticipantSlot = "player_a" | "player_b";
export type DuelOutcome = "player_a_win" | "player_b_win" | "draw" | "pending" | "expired";
export type DuelSeedStatus = "local_preview" | "backend_seed_required" | "backend_verified";
export type DuelModifierId = "fomo_storm" | "debt_pressure" | "subscription_swarm" | "rug_pull_traps" | "cold_wallet" | "no_spend_duel";

export type DuelRuleId =
  | "same_seed_for_both_players"
  | "fixed_duration"
  | "same_stage"
  | "same_boss"
  | "same_modifiers"
  | "no_paid_advantage"
  | "ranked_backend_validation_required"
  | "async_first_live_later";

export type DuelEntryRequirementId =
  | "profile_created"
  | "minimum_level"
  | "minimum_power_score"
  | "backend_identity"
  | "verified_seed"
  | "anti_cheat_payload";

export type DuelScoreComponentId =
  | "damage_dealt"
  | "leaks_defeated"
  | "survival_time"
  | "hp_remaining"
  | "guard_skill"
  | "skills_used"
  | "damage_taken_penalty"
  | "participation";

export interface DuelEventWindow {
  periodKey: string;
  startsAtIso: string;
  endsAtIso: string;
  resetRule: "match" | "weekly" | "season";
  timezone: "UTC";
}

export interface DuelEntryRequirement {
  id: DuelEntryRequirementId;
  label: string;
  requiredValue: number | boolean | string;
  backendValidationRequired: boolean;
}

export interface DuelScoreWeights {
  damageDealt: number;
  leaksDefeated: number;
  survivedSeconds: number;
  hpRemaining: number;
  guards: number;
  skillsUsed: number;
  damageTakenPenalty: number;
  participation: number;
}

export interface DuelSeedDefinition {
  seedId: string;
  seedKey: string;
  stageId: string;
  bossId?: string;
  durationSeconds: number;
  modifiers: DuelModifierId[];
  seedStatus: DuelSeedStatus;
  backendValidationRequired: boolean;
}

export interface DuelScoreInput {
  damageDealt: number;
  leaksDefeated: number;
  survivedSeconds: number;
  hpRemaining: number;
  guards: number;
  skillsUsed: number;
  damageTaken: number;
  participated?: boolean;
}

export interface DuelScoreBreakdownRow {
  componentId: DuelScoreComponentId;
  label: string;
  rawValue: number;
  weight: number;
  points: number;
  backendValidationRequired: boolean;
}

export interface DuelScoreBreakdown extends DuelScoreInput {
  totalScore: number;
  breakdown: DuelScoreBreakdownRow[];
  validationTier: LeaderboardValidationTier;
  backendValidationRequired: boolean;
}

export interface DuelParticipantSnapshot {
  slot: DuelParticipantSlot;
  playerId: string;
  displayName: string;
  powerScore: number;
  score?: DuelScoreBreakdown;
  completedAtIso?: string;
}

export interface DuelMatchState {
  duelId: string;
  modeId: DuelModeId;
  matchType: DuelMatchType;
  status: DuelStatus;
  seed: DuelSeedDefinition;
  playerA: DuelParticipantSnapshot;
  playerB?: DuelParticipantSnapshot;
  outcome: DuelOutcome;
  winnerPlayerId?: string;
  leaderboardId: LeaderboardId;
  periodKey: string;
  createdAtIso: string;
  expiresAtIso: string;
  submissionStatus: LeaderboardSubmissionStatus;
  backendValidationRequired: boolean;
  publicSubmitEnabled: boolean;
}

export interface DuelDefinition {
  id: DuelModeId;
  title: string;
  shortTitle: string;
  matchType: DuelMatchType;
  leaderboardId: LeaderboardId;
  backendStatus: DuelBackendStatus;
  asyncFirst: boolean;
  description: string;
  eventWindow: DuelEventWindow;
  entryRequirements: DuelEntryRequirement[];
  rules: DuelRuleId[];
  defaultSeed: DuelSeedDefinition;
  scoreWeights: DuelScoreWeights;
  participationRewards: RewardAmount[];
  winRewards: RewardAmount[];
  antiCheatRequired: boolean;
  notes: string;
}

export interface DuelReadiness {
  duelId: DuelModeId;
  localPreviewEnabled: boolean;
  publicSubmitEnabled: boolean;
  backendValidationRequired: boolean;
  antiCheatRequired: boolean;
  requiredBeforePublicSubmit: string[];
}

export interface DuelRegistrySummary {
  version: string;
  duelCount: number;
  localContractCount: number;
  backendLockedCount: number;
  duelIds: DuelModeId[];
  backendLockedDuelIds: DuelModeId[];
}

export interface DuelContractPreview {
  duelId: DuelModeId;
  title: string;
  matchType: DuelMatchType;
  leaderboardId: LeaderboardId;
  periodKey: string;
  seed: DuelSeedDefinition;
  scorePreview: DuelScoreBreakdown;
  readiness: DuelReadiness;
  rewardPreview: {
    participationRewards: RewardAmount[];
    winRewards: RewardAmount[];
    backendValidationRequired: boolean;
    claimEnabled: boolean;
  };
  summaryRows: readonly string[];
}

export interface DuelSystemDefinition {
  version: string;
  goal: string;
  duelIds: readonly DuelModeId[];
  localContractDuelIds: readonly DuelModeId[];
  backendLockedDuelIds: readonly DuelModeId[];
  requiredBeforeLiveDuels: readonly string[];
  rules: readonly string[];
}

export const DEFAULT_DUEL_EVENT_WINDOW: DuelEventWindow = {
  periodKey: "duel:local-contract",
  startsAtIso: "2026-01-01T00:00:00.000Z",
  endsAtIso: "2026-12-31T23:59:59.000Z",
  resetRule: "match",
  timezone: "UTC",
};

export const DEFAULT_LEAK_DUEL_SEED: DuelSeedDefinition = {
  seedId: "leak-duel-preview-seed-001",
  seedKey: "LD-PREVIEW-001-SAME-LEAK-PRESSURE",
  stageId: "subscription_office",
  bossId: "subscription_leech",
  durationSeconds: 120,
  modifiers: ["subscription_swarm", "cold_wallet"],
  seedStatus: "local_preview",
  backendValidationRequired: true,
};

export const DUEL_SCORE_WEIGHTS: DuelScoreWeights = {
  damageDealt: 0.5,
  leaksDefeated: 20,
  survivedSeconds: 2,
  hpRemaining: 6,
  guards: 12,
  skillsUsed: 4,
  damageTakenPenalty: 3,
  participation: 75,
};

export const DUEL_SCORE_COMPONENT_LABELS: Record<DuelScoreComponentId, string> = {
  damage_dealt: "Damage dealt",
  leaks_defeated: "Leaks defeated",
  survival_time: "Survival time",
  hp_remaining: "HP remaining",
  guard_skill: "Guard skill",
  skills_used: "Skills used",
  damage_taken_penalty: "Damage taken penalty",
  participation: "Participation",
};

export const DUEL_MODIFIER_LABELS: Record<DuelModifierId, string> = {
  fomo_storm: "FOMO Storm",
  debt_pressure: "Debt Pressure",
  subscription_swarm: "Subscription Swarm",
  rug_pull_traps: "Rug Pull Traps",
  cold_wallet: "Cold Wallet",
  no_spend_duel: "No-Spend Duel",
};

const DEFAULT_DUEL_REQUIREMENTS: DuelEntryRequirement[] = [
  { id: "profile_created", label: "Player profile exists", requiredValue: true, backendValidationRequired: false },
  { id: "minimum_level", label: "Minimum mascot level", requiredValue: 1, backendValidationRequired: false },
  { id: "minimum_power_score", label: "Minimum recommended PowerScore", requiredValue: 25, backendValidationRequired: false },
  { id: "verified_seed", label: "Both players receive the same duel seed", requiredValue: true, backendValidationRequired: true },
  { id: "anti_cheat_payload", label: "Run payload can be checked for impossible values", requiredValue: true, backendValidationRequired: true },
];

const BACKEND_DUEL_REQUIREMENTS: DuelEntryRequirement[] = [
  ...DEFAULT_DUEL_REQUIREMENTS,
  { id: "backend_identity", label: "Backend player identity is linked", requiredValue: true, backendValidationRequired: true },
];

export const DUEL_DEFINITIONS: readonly DuelDefinition[] = [
  {
    id: "leak_duel_async",
    title: "Leak Duel",
    shortTitle: "DUEL",
    matchType: "ranked",
    leaderboardId: "duel_ranked",
    backendStatus: "local_contract",
    asyncFirst: true,
    description: "Two players fight the same leak-pressure seed. The cleaner anti-leak run wins.",
    eventWindow: DEFAULT_DUEL_EVENT_WINDOW,
    entryRequirements: DEFAULT_DUEL_REQUIREMENTS,
    rules: [
      "same_seed_for_both_players",
      "fixed_duration",
      "same_stage",
      "same_boss",
      "same_modifiers",
      "no_paid_advantage",
      "ranked_backend_validation_required",
      "async_first_live_later",
    ],
    defaultSeed: DEFAULT_LEAK_DUEL_SEED,
    scoreWeights: DUEL_SCORE_WEIGHTS,
    participationRewards: [
      { currencyId: "xp", amount: 25 },
      { currencyId: "leak_points", amount: 3 },
    ],
    winRewards: [
      { currencyId: "rank_points", amount: 15 },
      { currencyId: "leak_points", amount: 5 },
    ],
    antiCheatRequired: true,
    notes: "Async 1v1 is the first safe multiplayer form: same stage, same boss, same modifiers, same time box; live real-time 1v1 comes later.",
  },
  {
    id: "leak_duel_live_future",
    title: "Live Leak Duel",
    shortTitle: "LIVE",
    matchType: "ranked",
    leaderboardId: "duel_ranked",
    backendStatus: "remote_required",
    asyncFirst: false,
    description: "Future real-time 1v1 mode after backend identity, reconciliation, reconnect and anti-cheat exist.",
    eventWindow: DEFAULT_DUEL_EVENT_WINDOW,
    entryRequirements: BACKEND_DUEL_REQUIREMENTS,
    rules: [
      "same_seed_for_both_players",
      "fixed_duration",
      "same_stage",
      "same_boss",
      "same_modifiers",
      "no_paid_advantage",
      "ranked_backend_validation_required",
    ],
    defaultSeed: {
      ...DEFAULT_LEAK_DUEL_SEED,
      seedId: "leak-duel-live-future-seed",
      seedKey: "BACKEND-GENERATED-LIVE-DUEL-SEED",
      seedStatus: "backend_seed_required",
      modifiers: ["fomo_storm", "debt_pressure"],
    },
    scoreWeights: DUEL_SCORE_WEIGHTS,
    participationRewards: [
      { currencyId: "xp", amount: 35 },
      { currencyId: "leak_points", amount: 4 },
    ],
    winRewards: [
      { currencyId: "rank_points", amount: 20 },
      { currencyId: "leak_points", amount: 8 },
    ],
    antiCheatRequired: true,
    notes: "Live Duel remains locked until networking, server authority and anti-cheat exist.",
  },
];

export const LEAK_DUEL_DEFINITION = DUEL_DEFINITIONS[0];

export function getDuelDefinition(duelId: DuelModeId): DuelDefinition {
  const definition = DUEL_DEFINITIONS.find((duel) => duel.id === duelId);
  if (!definition) {
    throw new Error(`Unknown duel definition: ${duelId}`);
  }
  return definition;
}

export function getLocalContractDuels(): DuelDefinition[] {
  return DUEL_DEFINITIONS.filter((duel) => duel.backendStatus === "local_contract");
}

export function getBackendLockedDuels(): DuelDefinition[] {
  return DUEL_DEFINITIONS.filter((duel) => duel.backendStatus !== "local_contract" || duel.antiCheatRequired);
}

export function isDuelBackendLocked(duelId: DuelModeId): boolean {
  const duel = getDuelDefinition(duelId);
  return duel.backendStatus !== "local_contract" || duel.antiCheatRequired;
}

export function getDuelReadiness(duelId: DuelModeId): DuelReadiness {
  const duel = getDuelDefinition(duelId);
  const backendValidationRequired = duel.backendStatus !== "local_contract" || duel.entryRequirements.some((requirement) => requirement.backendValidationRequired);
  const requiredBeforePublicSubmit = [
    "Duel seed generation system",
    "Duel result payload",
    "Leaderboard adapter submit implementation",
    "Backend identity link",
    "Anti-cheat checks for seed, duration, damage, HP and score",
  ];

  return {
    duelId,
    localPreviewEnabled: duel.backendStatus === "local_contract",
    publicSubmitEnabled: false,
    backendValidationRequired,
    antiCheatRequired: duel.antiCheatRequired,
    requiredBeforePublicSubmit,
  };
}

function normalizeDuelScoreInput(input: DuelScoreInput): Required<DuelScoreInput> {
  return {
    damageDealt: Math.max(0, Math.floor(input.damageDealt || 0)),
    leaksDefeated: Math.max(0, Math.floor(input.leaksDefeated || 0)),
    survivedSeconds: Math.max(0, Math.floor(input.survivedSeconds || 0)),
    hpRemaining: Math.max(0, Math.floor(input.hpRemaining || 0)),
    guards: Math.max(0, Math.floor(input.guards || 0)),
    skillsUsed: Math.max(0, Math.floor(input.skillsUsed || 0)),
    damageTaken: Math.max(0, Math.floor(input.damageTaken || 0)),
    participated: Boolean(input.participated ?? true),
  };
}

function createDuelScoreRow(
  componentId: DuelScoreComponentId,
  rawValue: number,
  weight: number,
  points: number,
  backendValidationRequired = true,
): DuelScoreBreakdownRow {
  return {
    componentId,
    label: DUEL_SCORE_COMPONENT_LABELS[componentId],
    rawValue,
    weight,
    points: Math.floor(points),
    backendValidationRequired,
  };
}

export function calculateDuelScore(input: DuelScoreInput, weights: DuelScoreWeights = DUEL_SCORE_WEIGHTS): DuelScoreBreakdown {
  const safeInput = normalizeDuelScoreInput(input);
  const breakdown: DuelScoreBreakdownRow[] = [
    createDuelScoreRow("damage_dealt", safeInput.damageDealt, weights.damageDealt, safeInput.damageDealt * weights.damageDealt),
    createDuelScoreRow("leaks_defeated", safeInput.leaksDefeated, weights.leaksDefeated, safeInput.leaksDefeated * weights.leaksDefeated),
    createDuelScoreRow("survival_time", safeInput.survivedSeconds, weights.survivedSeconds, safeInput.survivedSeconds * weights.survivedSeconds),
    createDuelScoreRow("hp_remaining", safeInput.hpRemaining, weights.hpRemaining, safeInput.hpRemaining * weights.hpRemaining),
    createDuelScoreRow("guard_skill", safeInput.guards, weights.guards, safeInput.guards * weights.guards),
    createDuelScoreRow("skills_used", safeInput.skillsUsed, weights.skillsUsed, safeInput.skillsUsed * weights.skillsUsed),
    createDuelScoreRow(
      "damage_taken_penalty",
      safeInput.damageTaken,
      weights.damageTakenPenalty,
      -safeInput.damageTaken * weights.damageTakenPenalty,
    ),
    createDuelScoreRow("participation", Number(safeInput.participated), weights.participation, safeInput.participated ? weights.participation : 0, false),
  ];

  const totalScore = Math.max(0, Math.floor(breakdown.reduce((total, row) => total + row.points, 0)));

  return {
    ...safeInput,
    totalScore,
    breakdown,
    validationTier: "backend_required",
    backendValidationRequired: true,
  };
}

export function getDuelOutcome(playerAScore?: DuelScoreBreakdown, playerBScore?: DuelScoreBreakdown): DuelOutcome {
  if (!playerAScore || !playerBScore) {
    return "pending";
  }

  if (playerAScore.totalScore > playerBScore.totalScore) {
    return "player_a_win";
  }

  if (playerBScore.totalScore > playerAScore.totalScore) {
    return "player_b_win";
  }

  return "draw";
}
