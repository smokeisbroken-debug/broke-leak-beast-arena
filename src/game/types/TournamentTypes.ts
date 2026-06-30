import type { LeaderboardId, LeaderboardValidationTier } from "./LeaderboardTypes";
import type { RewardAmount } from "./ProgressionTypes";

export type TournamentId =
  | "no_spend_arena_preview"
  | "anti_fomo_cup"
  | "wallet_shield_week"
  | "boss_damage_race"
  | "leak_hunter_sprint"
  | "debt_pressure_trial";

export type TournamentStatus = "draft" | "scheduled" | "active" | "complete" | "archived";
export type TournamentBackendStatus = "local_preview" | "adapter_ready" | "remote_required";
export type TournamentModeId = "arena_sprint" | "boss_damage" | "survival_gauntlet" | "task_chain" | "duel_qualifier";
export type TournamentThemeId = "no_spend" | "anti_fomo" | "wallet_shield" | "boss_race" | "leak_hunter" | "debt_pressure";

export type TournamentRuleId =
  | "fixed_seed"
  | "no_heal_skill"
  | "guard_bonus"
  | "boss_damage_bonus"
  | "limited_loadout"
  | "time_boxed_run"
  | "same_stage_for_all"
  | "no_paid_advantage"
  | "backend_validation_required";

export type TournamentEntryRequirementId =
  | "profile_created"
  | "minimum_level"
  | "minimum_power_score"
  | "verified_run_payload"
  | "eligible_period"
  | "backend_identity";

export type TournamentRewardBracketId = "participation" | "top_50" | "top_25" | "top_10" | "top_3" | "winner";
export type TournamentScoreComponentId =
  | "base_score"
  | "leaks_defeated"
  | "boss_damage"
  | "survival_time"
  | "hp_remaining"
  | "guard_skill"
  | "damage_penalty"
  | "participation";

export interface TournamentEventWindow {
  periodKey: string;
  startsAtIso: string;
  endsAtIso: string;
  resetRule: "event" | "weekly" | "season";
  timezone: "UTC";
}

export interface TournamentEntryRequirement {
  id: TournamentEntryRequirementId;
  label: string;
  requiredValue: number | boolean | string;
  backendValidationRequired: boolean;
}

export interface TournamentScoreWeights {
  score: number;
  leaksDefeated: number;
  bossDamage: number;
  survivedSeconds: number;
  hpRemaining: number;
  guards: number;
  damageTakenPenalty: number;
  participation: number;
}

export interface TournamentScoreInput {
  score: number;
  leaksDefeated: number;
  bossDamage: number;
  survivedSeconds: number;
  hpRemaining: number;
  guards: number;
  damageTaken: number;
  participated: boolean;
}

export interface TournamentScoreBreakdownRow {
  componentId: TournamentScoreComponentId;
  label: string;
  rawValue: number;
  weight: number;
  points: number;
  backendValidationRequired: boolean;
}

export interface TournamentScorePreview {
  tournamentId: TournamentId;
  points: number;
  breakdown: TournamentScoreBreakdownRow[];
  validationTier: LeaderboardValidationTier;
  backendValidationRequired: boolean;
  publicSubmitEnabled: boolean;
}

export interface TournamentRewardBracket {
  id: TournamentRewardBracketId;
  label: string;
  minRank?: number;
  maxRank?: number;
  minPercentile?: number;
  rewards: RewardAmount[];
  backendValidationRequired: boolean;
}

export interface TournamentReadiness {
  tournamentId: TournamentId;
  status: TournamentStatus;
  localPreviewEnabled: boolean;
  publicSubmitEnabled: boolean;
  backendValidationRequired: boolean;
  antiCheatRequired: boolean;
  requiredBeforePublicSubmit: string[];
}

export interface TournamentDefinition {
  id: TournamentId;
  title: string;
  shortTitle: string;
  theme: string;
  themeId: TournamentThemeId;
  modeId: TournamentModeId;
  status: TournamentStatus;
  backendStatus: TournamentBackendStatus;
  leaderboardId: LeaderboardId;
  eventWindow: TournamentEventWindow;
  entryRequirements: TournamentEntryRequirement[];
  rules: TournamentRuleId[];
  scoreWeights: TournamentScoreWeights;
  participationRewards: RewardAmount[];
  rewardBrackets: TournamentRewardBracket[];
  antiCheatRequired: boolean;
  notes: string;
}

export interface TournamentRunResult {
  tournamentId: TournamentId;
  playerId: string;
  runId: string;
  points: number;
  participationPoints: number;
  submittedAtIso: string;
  validationStatus: "local" | "pending_remote" | "accepted" | "rejected";
}

export interface TournamentSystemDefinition {
  version: string;
  goal: string;
  tournamentIds: readonly TournamentId[];
  localPreviewTournamentIds: readonly TournamentId[];
  backendLockedTournamentIds: readonly TournamentId[];
  requiredBeforeLiveTournaments: readonly string[];
  rules: readonly string[];
}

export interface TournamentRegistrySummary {
  version: string;
  totalTournamentCount: number;
  draftCount: number;
  activeCount: number;
  backendLockedCount: number;
  localPreviewCount: number;
  tournamentIds: TournamentId[];
  backendLockedTournamentIds: TournamentId[];
}

export const DEFAULT_TOURNAMENT_EVENT_WINDOW: TournamentEventWindow = {
  periodKey: "event:local-preview",
  startsAtIso: "2026-01-01T00:00:00.000Z",
  endsAtIso: "2026-12-31T23:59:59.000Z",
  resetRule: "event",
  timezone: "UTC",
};

export const DEFAULT_TOURNAMENT_SCORE_WEIGHTS: TournamentScoreWeights = {
  score: 1,
  leaksDefeated: 12,
  bossDamage: 0.4,
  survivedSeconds: 2,
  hpRemaining: 8,
  guards: 15,
  damageTakenPenalty: 3,
  participation: 100,
};

export const TOURNAMENT_SCORE_COMPONENT_LABELS: Record<TournamentScoreComponentId, string> = {
  base_score: "Base score",
  leaks_defeated: "Leaks defeated",
  boss_damage: "Boss damage",
  survival_time: "Survival time",
  hp_remaining: "HP remaining",
  guard_skill: "Guard skill",
  damage_penalty: "Damage penalty",
  participation: "Participation",
};

const DEFAULT_ENTRY_REQUIREMENTS: TournamentEntryRequirement[] = [
  { id: "profile_created", label: "Player profile exists", requiredValue: true, backendValidationRequired: false },
  { id: "minimum_level", label: "Minimum mascot level", requiredValue: 1, backendValidationRequired: false },
  { id: "eligible_period", label: "Event period is open", requiredValue: "event:local-preview", backendValidationRequired: true },
  { id: "verified_run_payload", label: "Run payload can be validated", requiredValue: true, backendValidationRequired: true },
];

const BACKEND_ENTRY_REQUIREMENTS: TournamentEntryRequirement[] = [
  ...DEFAULT_ENTRY_REQUIREMENTS,
  { id: "backend_identity", label: "Backend player identity is linked", requiredValue: true, backendValidationRequired: true },
];

const DEFAULT_REWARD_BRACKETS: TournamentRewardBracket[] = [
  {
    id: "participation",
    label: "Participation",
    rewards: [
      { currencyId: "xp", amount: 35 },
      { currencyId: "tournament_points", amount: 100 },
    ],
    backendValidationRequired: true,
  },
  {
    id: "top_10",
    label: "Top 10",
    minRank: 1,
    maxRank: 10,
    rewards: [
      { currencyId: "leak_points", amount: 25 },
      { currencyId: "rank_points", amount: 20 },
      { currencyId: "cosmetic_tokens", amount: 3 },
    ],
    backendValidationRequired: true,
  },
  {
    id: "winner",
    label: "Winner",
    minRank: 1,
    maxRank: 1,
    rewards: [
      { currencyId: "leak_points", amount: 50 },
      { currencyId: "rank_points", amount: 40 },
      { currencyId: "cosmetic_tokens", amount: 8 },
    ],
    backendValidationRequired: true,
  },
];

export const TOURNAMENT_DEFINITIONS: readonly TournamentDefinition[] = [
  {
    id: "no_spend_arena_preview",
    title: "No-Spend Arena Preview",
    shortTitle: "NO-SPEND",
    theme: "Win under pressure without wasting wallet energy.",
    themeId: "no_spend",
    modeId: "arena_sprint",
    status: "draft",
    backendStatus: "local_preview",
    leaderboardId: "tournament",
    eventWindow: DEFAULT_TOURNAMENT_EVENT_WINDOW,
    entryRequirements: DEFAULT_ENTRY_REQUIREMENTS,
    rules: ["fixed_seed", "same_stage_for_all", "time_boxed_run", "no_paid_advantage"],
    scoreWeights: DEFAULT_TOURNAMENT_SCORE_WEIGHTS,
    participationRewards: [
      { currencyId: "xp", amount: 35 },
      { currencyId: "leak_points", amount: 5 },
      { currencyId: "tournament_points", amount: 100 },
    ],
    rewardBrackets: DEFAULT_REWARD_BRACKETS,
    antiCheatRequired: true,
    notes: "First skeleton tournament for participation, scoring and leaderboard wiring. Public rewards stay locked.",
  },
  {
    id: "anti_fomo_cup",
    title: "Anti-FOMO Cup",
    shortTitle: "FOMO CUP",
    theme: "Defeat fast FOMO enemies and punish panic spending.",
    themeId: "anti_fomo",
    modeId: "arena_sprint",
    status: "draft",
    backendStatus: "remote_required",
    leaderboardId: "tournament",
    eventWindow: DEFAULT_TOURNAMENT_EVENT_WINDOW,
    entryRequirements: BACKEND_ENTRY_REQUIREMENTS,
    rules: ["fixed_seed", "limited_loadout", "same_stage_for_all", "backend_validation_required", "no_paid_advantage"],
    scoreWeights: DEFAULT_TOURNAMENT_SCORE_WEIGHTS,
    participationRewards: [
      { currencyId: "xp", amount: 40 },
      { currencyId: "tournament_points", amount: 100 },
    ],
    rewardBrackets: DEFAULT_REWARD_BRACKETS,
    antiCheatRequired: true,
    notes: "Designed for short seasonal cups after leaderboard adapter and run validation exist.",
  },
  {
    id: "wallet_shield_week",
    title: "Wallet Shield Week",
    shortTitle: "SHIELD",
    theme: "Earn extra points for guard timing and defensive discipline.",
    themeId: "wallet_shield",
    modeId: "survival_gauntlet",
    status: "draft",
    backendStatus: "remote_required",
    leaderboardId: "tournament",
    eventWindow: { ...DEFAULT_TOURNAMENT_EVENT_WINDOW, resetRule: "weekly" },
    entryRequirements: BACKEND_ENTRY_REQUIREMENTS,
    rules: ["fixed_seed", "guard_bonus", "time_boxed_run", "backend_validation_required", "no_paid_advantage"],
    scoreWeights: { ...DEFAULT_TOURNAMENT_SCORE_WEIGHTS, guards: 30 },
    participationRewards: [
      { currencyId: "xp", amount: 30 },
      { currencyId: "coins", amount: 60 },
      { currencyId: "tournament_points", amount: 100 },
    ],
    rewardBrackets: DEFAULT_REWARD_BRACKETS,
    antiCheatRequired: true,
    notes: "Supports defensive build relevance without raising raw damage caps.",
  },
  {
    id: "boss_damage_race",
    title: "Boss Damage Race",
    shortTitle: "BOSS RACE",
    theme: "Race the community on verified damage against the weekly leak boss.",
    themeId: "boss_race",
    modeId: "boss_damage",
    status: "draft",
    backendStatus: "remote_required",
    leaderboardId: "boss_damage",
    eventWindow: { ...DEFAULT_TOURNAMENT_EVENT_WINDOW, resetRule: "weekly" },
    entryRequirements: BACKEND_ENTRY_REQUIREMENTS,
    rules: ["fixed_seed", "boss_damage_bonus", "time_boxed_run", "backend_validation_required", "no_paid_advantage"],
    scoreWeights: { ...DEFAULT_TOURNAMENT_SCORE_WEIGHTS, bossDamage: 1.2 },
    participationRewards: [
      { currencyId: "leak_points", amount: 8 },
      { currencyId: "tournament_points", amount: 100 },
    ],
    rewardBrackets: DEFAULT_REWARD_BRACKETS,
    antiCheatRequired: true,
    notes: "Remote validation required before real rewards are enabled.",
  },
  {
    id: "leak_hunter_sprint",
    title: "Leak Hunter Sprint",
    shortTitle: "SPRINT",
    theme: "Clear waves quickly while avoiding impulse-spend hazards.",
    themeId: "leak_hunter",
    modeId: "arena_sprint",
    status: "draft",
    backendStatus: "remote_required",
    leaderboardId: "tournament",
    eventWindow: DEFAULT_TOURNAMENT_EVENT_WINDOW,
    entryRequirements: BACKEND_ENTRY_REQUIREMENTS,
    rules: ["fixed_seed", "time_boxed_run", "same_stage_for_all", "backend_validation_required", "no_paid_advantage"],
    scoreWeights: { ...DEFAULT_TOURNAMENT_SCORE_WEIGHTS, survivedSeconds: 1, leaksDefeated: 20 },
    participationRewards: [
      { currencyId: "xp", amount: 35 },
      { currencyId: "tournament_points", amount: 100 },
    ],
    rewardBrackets: DEFAULT_REWARD_BRACKETS,
    antiCheatRequired: true,
    notes: "Speed-focused tournament for future short runs and mobile sessions.",
  },
  {
    id: "debt_pressure_trial",
    title: "Debt Pressure Trial",
    shortTitle: "DEBT",
    theme: "Survive pressure with restricted healing and disciplined shield timing.",
    themeId: "debt_pressure",
    modeId: "survival_gauntlet",
    status: "draft",
    backendStatus: "remote_required",
    leaderboardId: "tournament",
    eventWindow: DEFAULT_TOURNAMENT_EVENT_WINDOW,
    entryRequirements: BACKEND_ENTRY_REQUIREMENTS,
    rules: ["fixed_seed", "no_heal_skill", "guard_bonus", "time_boxed_run", "backend_validation_required", "no_paid_advantage"],
    scoreWeights: { ...DEFAULT_TOURNAMENT_SCORE_WEIGHTS, hpRemaining: 12, damageTakenPenalty: 5, guards: 24 },
    participationRewards: [
      { currencyId: "xp", amount: 45 },
      { currencyId: "tournament_points", amount: 100 },
    ],
    rewardBrackets: DEFAULT_REWARD_BRACKETS,
    antiCheatRequired: true,
    notes: "Harder pressure mode reserved for late skeleton balancing and backend validation.",
  },
];

function safeInteger(value: unknown): number {
  return Math.max(0, Math.floor(Number(value) || 0));
}

function scoreComponent(
  componentId: TournamentScoreComponentId,
  rawValue: number,
  weight: number,
  backendValidationRequired = true,
): TournamentScoreBreakdownRow {
  const normalizedRawValue = safeInteger(rawValue);
  return {
    componentId,
    label: TOURNAMENT_SCORE_COMPONENT_LABELS[componentId],
    rawValue: normalizedRawValue,
    weight,
    points: Math.floor(normalizedRawValue * weight),
    backendValidationRequired,
  };
}

export function getTournamentDefinition(tournamentId: TournamentId): TournamentDefinition {
  const tournament = TOURNAMENT_DEFINITIONS.find((candidate) => candidate.id === tournamentId);
  if (!tournament) {
    throw new Error(`Unknown tournament: ${tournamentId}`);
  }
  return tournament;
}

export function getTournamentDefinitionsByStatus(status: TournamentStatus): TournamentDefinition[] {
  return TOURNAMENT_DEFINITIONS.filter((tournament) => tournament.status === status);
}

export function getLocalPreviewTournaments(): TournamentDefinition[] {
  return TOURNAMENT_DEFINITIONS.filter((tournament) => tournament.backendStatus === "local_preview");
}

export function getBackendLockedTournaments(): TournamentDefinition[] {
  return TOURNAMENT_DEFINITIONS.filter((tournament) => tournament.backendStatus === "remote_required");
}

export function isTournamentBackendLocked(tournamentId: TournamentId): boolean {
  const tournament = getTournamentDefinition(tournamentId);
  return tournament.backendStatus === "remote_required" || tournament.antiCheatRequired;
}

export function getTournamentPeriodKey(tournamentId: TournamentId): string {
  const tournament = getTournamentDefinition(tournamentId);
  return tournament.eventWindow.periodKey || `event:${tournament.id}`;
}

export function getTournamentReadiness(tournamentId: TournamentId): TournamentReadiness {
  const tournament = getTournamentDefinition(tournamentId);
  const requiredBeforePublicSubmit = [
    "Leaderboard adapter submit path",
    "Run/result validation payload",
    "Backend anti-cheat checks",
    "Tournament event window validation",
    "Reward bracket reconciliation",
  ];

  return {
    tournamentId,
    status: tournament.status,
    localPreviewEnabled: tournament.backendStatus === "local_preview",
    publicSubmitEnabled: false,
    backendValidationRequired: isTournamentBackendLocked(tournamentId),
    antiCheatRequired: tournament.antiCheatRequired,
    requiredBeforePublicSubmit,
  };
}

export function calculateTournamentScorePreview(
  tournamentId: TournamentId,
  input: Partial<TournamentScoreInput>,
): TournamentScorePreview {
  const tournament = getTournamentDefinition(tournamentId);
  const weights = tournament.scoreWeights;
  const breakdown: TournamentScoreBreakdownRow[] = [
    scoreComponent("base_score", input.score ?? 0, weights.score),
    scoreComponent("leaks_defeated", input.leaksDefeated ?? 0, weights.leaksDefeated),
    scoreComponent("boss_damage", input.bossDamage ?? 0, weights.bossDamage),
    scoreComponent("survival_time", input.survivedSeconds ?? 0, weights.survivedSeconds),
    scoreComponent("hp_remaining", input.hpRemaining ?? 0, weights.hpRemaining),
    scoreComponent("guard_skill", input.guards ?? 0, weights.guards),
    scoreComponent("participation", input.participated ? 1 : 0, weights.participation),
    scoreComponent("damage_penalty", input.damageTaken ?? 0, -weights.damageTakenPenalty),
  ];
  const points = Math.max(0, breakdown.reduce((total, row) => total + row.points, 0));
  const readiness = getTournamentReadiness(tournamentId);

  return {
    tournamentId,
    points,
    breakdown,
    validationTier: tournament.backendStatus === "local_preview" ? "backend_required" : "backend_authoritative",
    backendValidationRequired: readiness.backendValidationRequired,
    publicSubmitEnabled: false,
  };
}

export function getTournamentRewardBracket(tournamentId: TournamentId, rank: number): TournamentRewardBracket {
  const tournament = getTournamentDefinition(tournamentId);
  const normalizedRank = safeInteger(rank || 1);
  const bracket = tournament.rewardBrackets.find((candidate) => {
    if (candidate.minRank !== undefined && normalizedRank < candidate.minRank) return false;
    if (candidate.maxRank !== undefined && normalizedRank > candidate.maxRank) return false;
    return true;
  });

  return bracket || tournament.rewardBrackets[0];
}
