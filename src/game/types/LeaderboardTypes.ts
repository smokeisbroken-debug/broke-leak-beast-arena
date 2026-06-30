export type LeaderboardId =
  | "global_power"
  | "weekly_arena"
  | "task_points"
  | "tournament"
  | "duel_ranked"
  | "boss_damage";

export type LeaderboardScope = "global" | "weekly" | "seasonal" | "tournament" | "event";
export type LeaderboardMetric = "power_score" | "score" | "task_points" | "tournament_points" | "rank_points" | "boss_damage";
export type LeaderboardBackendStatus = "local_mock" | "adapter_ready" | "remote_required";
export type LeaderboardResetRule = "never" | "daily" | "weekly" | "season" | "event";
export type LeaderboardSortDirection = "desc" | "asc";
export type LeaderboardValidationTier = "local_preview" | "backend_required" | "backend_authoritative";
export type LeaderboardSubmissionStatus =
  | "local_preview"
  | "blocked_backend_required"
  | "blocked_anticheat_required"
  | "blocked_adapter_missing";
export type LeaderboardPeriodKey = string;

export type LeaderboardScoreBucketId =
  | "power"
  | "arena"
  | "tasks"
  | "tournament"
  | "duel"
  | "boss"
  | "participation";

export interface LeaderboardScoreBucketDefinition {
  id: LeaderboardScoreBucketId;
  label: string;
  description: string;
  backendValidationRequired: boolean;
}

export interface LeaderboardScoreBreakdownRow {
  bucketId: LeaderboardScoreBucketId;
  label: string;
  value: number;
  cappedValue?: number;
  backendValidationRequired: boolean;
}

export interface LeaderboardScorePolicy {
  metric: LeaderboardMetric;
  sortDirection: LeaderboardSortDirection;
  minValue: number;
  maxPublicValue?: number;
  maxLocalPreviewValue?: number;
  sourceBuckets: readonly LeaderboardScoreBucketId[];
  validationTier: LeaderboardValidationTier;
  publicSubmitRequires: readonly string[];
}

export interface LeaderboardDefinition {
  id: LeaderboardId;
  title: string;
  shortTitle: string;
  theme: string;
  scope: LeaderboardScope;
  metric: LeaderboardMetric;
  backendStatus: LeaderboardBackendStatus;
  resetRule: LeaderboardResetRule;
  antiCheatRequired: boolean;
  scorePolicy: LeaderboardScorePolicy;
}

export interface LeaderboardEntry {
  playerId: string;
  displayName: string;
  rank: number;
  value: number;
  periodKey: LeaderboardPeriodKey;
  validationTier: LeaderboardValidationTier;
  updatedAtIso: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface LeaderboardSnapshot {
  leaderboardId: LeaderboardId;
  periodKey: LeaderboardPeriodKey;
  generatedAtIso: string;
  entries: LeaderboardEntry[];
  playerEntry?: LeaderboardEntry;
  backendStatus: LeaderboardBackendStatus;
  submissionEnabled: boolean;
}

export interface LeaderboardSubmitPayload {
  leaderboardId: LeaderboardId;
  playerId: string;
  displayName: string;
  periodKey: LeaderboardPeriodKey;
  value: number;
  metric: LeaderboardMetric;
  scoreBreakdown: LeaderboardScoreBreakdownRow[];
  validationTier: LeaderboardValidationTier;
  submissionStatus: LeaderboardSubmissionStatus;
  backendValidationRequired: boolean;
  antiCheatRequired: boolean;
  submissionEnabled: boolean;
  createdAtIso: string;
}

export interface LeaderboardReadiness {
  leaderboardId: LeaderboardId;
  localPreviewEnabled: boolean;
  publicSubmitEnabled: boolean;
  requiredBeforePublicSubmit: string[];
  backendValidationRequired: boolean;
  antiCheatRequired: boolean;
}

export interface LeaderboardSystemDefinition {
  version: string;
  goal: string;
  leaderboardIds: readonly LeaderboardId[];
  localPreviewLeaderboards: readonly LeaderboardId[];
  backendLockedLeaderboards: readonly LeaderboardId[];
  scoreBuckets: readonly LeaderboardScoreBucketDefinition[];
  rules: readonly string[];
}

export const LEADERBOARD_SCORE_BUCKETS: readonly LeaderboardScoreBucketDefinition[] = [
  {
    id: "power",
    label: "Power",
    description: "Capped mascot progression power from level, skills, evolution, mastery and future charms.",
    backendValidationRequired: false,
  },
  {
    id: "arena",
    label: "Arena",
    description: "Run score, wins and combat performance from arena or campaign fights.",
    backendValidationRequired: true,
  },
  {
    id: "tasks",
    label: "Tasks",
    description: "Task Points from daily local claims and future backend-validated weekly tasks.",
    backendValidationRequired: true,
  },
  {
    id: "tournament",
    label: "Tournament",
    description: "Tournament Points from event-specific runs, participation and challenge modifiers.",
    backendValidationRequired: true,
  },
  {
    id: "duel",
    label: "Leak Duel",
    description: "Rank Points and win/loss data from 1 vs 1 Leak Duel results on identical seeds.",
    backendValidationRequired: true,
  },
  {
    id: "boss",
    label: "Boss",
    description: "Verified contribution damage against weekly or community leak bosses.",
    backendValidationRequired: true,
  },
  {
    id: "participation",
    label: "Participation",
    description: "Safe activity signal for tournaments, seasons and community events.",
    backendValidationRequired: true,
  },
];

const COMMON_PUBLIC_SUBMIT_REQUIREMENTS = [
  "Leaderboard adapter contract",
  "Run/result validation payload",
  "Backend anti-cheat checks",
] as const;

export const LEADERBOARD_DEFINITIONS: readonly LeaderboardDefinition[] = [
  {
    id: "global_power",
    title: "Global Power",
    shortTitle: "POWER",
    theme: "Who built the strongest anti-leak mascot without breaking capped balance.",
    scope: "global",
    metric: "power_score",
    backendStatus: "local_mock",
    resetRule: "never",
    antiCheatRequired: false,
    scorePolicy: {
      metric: "power_score",
      sortDirection: "desc",
      minValue: 0,
      maxPublicValue: 350,
      maxLocalPreviewValue: 350,
      sourceBuckets: ["power"],
      validationTier: "local_preview",
      publicSubmitRequires: ["Cloud save identity link", "Remote profile snapshot validation"],
    },
  },
  {
    id: "weekly_arena",
    title: "Weekly Arena",
    shortTitle: "WEEKLY",
    theme: "Weekly pressure test: survive the leaks, score cleanly, reset every week.",
    scope: "weekly",
    metric: "score",
    backendStatus: "local_mock",
    resetRule: "weekly",
    antiCheatRequired: true,
    scorePolicy: {
      metric: "score",
      sortDirection: "desc",
      minValue: 0,
      maxLocalPreviewValue: 999999,
      sourceBuckets: ["arena"],
      validationTier: "backend_required",
      publicSubmitRequires: [...COMMON_PUBLIC_SUBMIT_REQUIREMENTS, "Weekly period reset service"],
    },
  },
  {
    id: "task_points",
    title: "Task Points",
    shortTitle: "TASKS",
    theme: "Discipline leaderboard for daily, weekly, tournament, duel and boss objectives.",
    scope: "weekly",
    metric: "task_points",
    backendStatus: "local_mock",
    resetRule: "weekly",
    antiCheatRequired: true,
    scorePolicy: {
      metric: "task_points",
      sortDirection: "desc",
      minValue: 0,
      maxLocalPreviewValue: 5000,
      sourceBuckets: ["tasks"],
      validationTier: "backend_required",
      publicSubmitRequires: [...COMMON_PUBLIC_SUBMIT_REQUIREMENTS, "Task completion reconciliation"],
    },
  },
  {
    id: "tournament",
    title: "Tournament",
    shortTitle: "CUP",
    theme: "Event-specific ranking for Anti-FOMO Cups, No-Spend Arena and leak-control sprints.",
    scope: "tournament",
    metric: "tournament_points",
    backendStatus: "remote_required",
    resetRule: "event",
    antiCheatRequired: true,
    scorePolicy: {
      metric: "tournament_points",
      sortDirection: "desc",
      minValue: 0,
      maxLocalPreviewValue: 999999,
      sourceBuckets: ["tournament", "participation"],
      validationTier: "backend_authoritative",
      publicSubmitRequires: [...COMMON_PUBLIC_SUBMIT_REQUIREMENTS, "Tournament ruleset hash", "Tournament event window validation"],
    },
  },
  {
    id: "duel_ranked",
    title: "1v1 Leak Duel",
    shortTitle: "DUEL",
    theme: "Asynchronous 1 vs 1 ranking where both players fight the same leak-pressure seed.",
    scope: "seasonal",
    metric: "rank_points",
    backendStatus: "remote_required",
    resetRule: "season",
    antiCheatRequired: true,
    scorePolicy: {
      metric: "rank_points",
      sortDirection: "desc",
      minValue: 0,
      maxLocalPreviewValue: 5000,
      sourceBuckets: ["duel"],
      validationTier: "backend_authoritative",
      publicSubmitRequires: [...COMMON_PUBLIC_SUBMIT_REQUIREMENTS, "Duel seed verification", "Opponent result reconciliation"],
    },
  },
  {
    id: "boss_damage",
    title: "Boss Damage",
    shortTitle: "BOSS",
    theme: "Community damage race against the weekly leak boss.",
    scope: "weekly",
    metric: "boss_damage",
    backendStatus: "remote_required",
    resetRule: "weekly",
    antiCheatRequired: true,
    scorePolicy: {
      metric: "boss_damage",
      sortDirection: "desc",
      minValue: 0,
      maxLocalPreviewValue: 9999999,
      sourceBuckets: ["boss"],
      validationTier: "backend_authoritative",
      publicSubmitRequires: [...COMMON_PUBLIC_SUBMIT_REQUIREMENTS, "Boss rotation state", "Damage cap validation"],
    },
  },
];

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

function getWeekNumber(date: Date): number {
  const workingDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNumber = workingDate.getUTCDay() || 7;
  workingDate.setUTCDate(workingDate.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(workingDate.getUTCFullYear(), 0, 1));
  return Math.ceil(((workingDate.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function getWeekYear(date: Date): number {
  const workingDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNumber = workingDate.getUTCDay() || 7;
  workingDate.setUTCDate(workingDate.getUTCDate() + 4 - dayNumber);
  return workingDate.getUTCFullYear();
}

export function getLeaderboardDefinition(leaderboardId: LeaderboardId): LeaderboardDefinition {
  const leaderboard = LEADERBOARD_DEFINITIONS.find((candidate) => candidate.id === leaderboardId);
  if (!leaderboard) {
    throw new Error(`Unknown leaderboard: ${leaderboardId}`);
  }
  return leaderboard;
}

export function getLeaderboardScoreBucket(bucketId: LeaderboardScoreBucketId): LeaderboardScoreBucketDefinition {
  const bucket = LEADERBOARD_SCORE_BUCKETS.find((candidate) => candidate.id === bucketId);
  if (!bucket) {
    throw new Error(`Unknown leaderboard score bucket: ${bucketId}`);
  }
  return bucket;
}

export function getLeaderboardsByScope(scope: LeaderboardScope): LeaderboardDefinition[] {
  return LEADERBOARD_DEFINITIONS.filter((leaderboard) => leaderboard.scope === scope);
}

export function getBackendRequiredLeaderboards(): LeaderboardDefinition[] {
  return LEADERBOARD_DEFINITIONS.filter((leaderboard) => leaderboard.backendStatus === "remote_required");
}

export function getLocalPreviewLeaderboards(): LeaderboardDefinition[] {
  return LEADERBOARD_DEFINITIONS.filter((leaderboard) => leaderboard.backendStatus === "local_mock");
}

export function isLeaderboardBackendLocked(leaderboardId: LeaderboardId): boolean {
  const leaderboard = getLeaderboardDefinition(leaderboardId);
  return leaderboard.backendStatus === "remote_required" || leaderboard.scorePolicy.validationTier !== "local_preview";
}

export function getLeaderboardPeriodKey(leaderboardId: LeaderboardId, date = new Date(), eventId?: string): LeaderboardPeriodKey {
  const leaderboard = getLeaderboardDefinition(leaderboardId);
  if (leaderboard.resetRule === "never") return "all_time";
  if (leaderboard.resetRule === "daily") {
    return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
  }
  if (leaderboard.resetRule === "weekly") {
    return `${getWeekYear(date)}-W${pad(getWeekNumber(date))}`;
  }
  if (leaderboard.resetRule === "season") {
    return eventId ? `season:${eventId}` : "season:local-preview";
  }
  return eventId ? `event:${eventId}` : "event:local-preview";
}

export function getLeaderboardReadiness(leaderboardId: LeaderboardId): LeaderboardReadiness {
  const leaderboard = getLeaderboardDefinition(leaderboardId);
  const backendValidationRequired = isLeaderboardBackendLocked(leaderboardId);
  const requiredBeforePublicSubmit = [...leaderboard.scorePolicy.publicSubmitRequires];
  if (leaderboard.antiCheatRequired && !requiredBeforePublicSubmit.includes("Backend anti-cheat checks")) {
    requiredBeforePublicSubmit.push("Backend anti-cheat checks");
  }

  return {
    leaderboardId,
    localPreviewEnabled: leaderboard.backendStatus !== "remote_required",
    publicSubmitEnabled: false,
    requiredBeforePublicSubmit,
    backendValidationRequired,
    antiCheatRequired: leaderboard.antiCheatRequired,
  };
}
