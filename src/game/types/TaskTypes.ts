import type { LeaderboardId } from "./LeaderboardTypes";
import type { RewardAmount, RewardSourceId } from "./ProgressionTypes";

export type TaskCadence = "daily" | "weekly" | "tournament" | "season";
export type TaskCategory = "combat" | "skill" | "anti_leak" | "tournament" | "duel" | "boss" | "progression";
export type TaskProgressMetric =
  | "runs"
  | "wins"
  | "score"
  | "leaks_defeated"
  | "boss_damage"
  | "guards"
  | "skill_uses"
  | "duel_wins"
  | "tournament_runs"
  | "participation";
export type TaskValidationTier = "local_preview" | "backend_required" | "backend_authoritative";
export type TaskStatus = "locked" | "active" | "completed" | "claimed";
export type TaskEventSource = "arena" | "campaign" | "mission" | "tournament" | "duel" | "weekly_boss" | "backend";

export interface TaskDefinitionV2 {
  id: string;
  title: string;
  shortTitle: string;
  cadence: TaskCadence;
  category: TaskCategory;
  metric: TaskProgressMetric;
  target: number;
  minLevel: number;
  taskPoints: number;
  leaderboardId?: LeaderboardId;
  rewardSourceId: RewardSourceId;
  validationTier: TaskValidationTier;
  rewards: RewardAmount[];
  description: string;
  multiplayerNote: string;
}

export interface TaskProgressEvent {
  source: TaskEventSource;
  metric: TaskProgressMetric;
  amount: number;
  createdAtIso: string;
  runId?: string;
  tournamentId?: string;
  duelId?: string;
  bossId?: string;
}

export interface TaskProgressState {
  taskId: string;
  title: string;
  cadence: TaskCadence;
  category: TaskCategory;
  metric: TaskProgressMetric;
  progress: number;
  target: number;
  completed: boolean;
  claimed: boolean;
  status: TaskStatus;
  taskPoints: number;
  rewards: RewardAmount[];
  validationTier: TaskValidationTier;
  leaderboardId?: LeaderboardId;
}

export interface TaskClaimResult {
  taskId: string;
  taskPointsAwarded: number;
  rewards: RewardAmount[];
  claimedAtIso: string;
  backendValidationRequired: boolean;
}

export interface TaskPeriodSnapshot {
  cadence: TaskCadence;
  periodKey: string;
  activeTaskIds: string[];
  completedTaskIds: string[];
  claimedTaskIds: string[];
  taskPointsPreview: number;
}

export interface TaskSystemSummary {
  activeDailyCount: number;
  activeWeeklyCount: number;
  completedCount: number;
  claimedCount: number;
  localTaskPoints: number;
  backendLockedTaskCount: number;
  taskLeaderboardId: LeaderboardId;
}

export interface TaskSystemDefinition {
  version: string;
  goal: string;
  defaultDailyTaskIds: readonly string[];
  defaultWeeklyTaskIds: readonly string[];
  backendLockedCadences: readonly TaskCadence[];
  leaderboardIds: readonly LeaderboardId[];
  rules: readonly string[];
}

export const TASK_POINT_LEADERBOARD_ID: LeaderboardId = "task_points";

export const DEFAULT_DAILY_TASK_IDS = ["daily_win_one_arena", "daily_defeat_five_leaks", "daily_use_guard"] as const;
export const DEFAULT_WEEKLY_TASK_IDS = ["weekly_tournament_participation", "weekly_duel_win", "weekly_boss_damage_push"] as const;

export const TASK_SYSTEM_VERSION = "0.9.7-task-system-skeleton";

export const TASK_SYSTEM_DEFINITION: TaskSystemDefinition = {
  version: TASK_SYSTEM_VERSION,
  goal: "Define daily, weekly, tournament, duel and boss tasks as a multiplayer-ready progression layer before claim flow and leaderboard submission are enabled.",
  defaultDailyTaskIds: DEFAULT_DAILY_TASK_IDS,
  defaultWeeklyTaskIds: DEFAULT_WEEKLY_TASK_IDS,
  backendLockedCadences: ["weekly", "tournament", "season"],
  leaderboardIds: [TASK_POINT_LEADERBOARD_ID],
  rules: [
    "Daily task rewards may stay local during skeleton development, but Leak Points remain future validation-sensitive.",
    "Weekly, tournament, duel and boss task points are leaderboard-sensitive and must be backend-validated before public ranking.",
    "This patch defines task contracts only; it does not enable task claiming, ranked submission or real multiplayer rewards.",
    "Task Points become the bridge between daily activity, tournament participation and future leaderboard placement.",
  ],
};

export const TASK_SKELETON_DEFINITIONS: readonly TaskDefinitionV2[] = [
  {
    id: "daily_win_one_arena",
    title: "Stop One Leak",
    shortTitle: "WIN 1 ARENA",
    cadence: "daily",
    category: "combat",
    metric: "wins",
    target: 1,
    minLevel: 1,
    taskPoints: 50,
    leaderboardId: TASK_POINT_LEADERBOARD_ID,
    rewardSourceId: "daily_task",
    validationTier: "local_preview",
    rewards: [
      { currencyId: "xp", amount: 40 },
      { currencyId: "coins", amount: 50 },
      { currencyId: "leak_points", amount: 5 },
    ],
    description: "Win one arena run and prove the wallet is still alive.",
    multiplayerNote: "Feeds future weekly task leaderboard after validation exists.",
  },
  {
    id: "daily_defeat_five_leaks",
    title: "Clean Small Leaks",
    shortTitle: "DEFEAT 5 LEAKS",
    cadence: "daily",
    category: "anti_leak",
    metric: "leaks_defeated",
    target: 5,
    minLevel: 1,
    taskPoints: 35,
    leaderboardId: TASK_POINT_LEADERBOARD_ID,
    rewardSourceId: "daily_task",
    validationTier: "local_preview",
    rewards: [
      { currencyId: "xp", amount: 30 },
      { currencyId: "coins", amount: 35 },
    ],
    description: "Defeat five leak enemies in any arena or campaign run.",
    multiplayerNote: "Basic activity task for future daily task streaks.",
  },
  {
    id: "daily_use_guard",
    title: "Hold the Wallet Line",
    shortTitle: "GUARD 3 TIMES",
    cadence: "daily",
    category: "skill",
    metric: "guards",
    target: 3,
    minLevel: 1,
    taskPoints: 30,
    leaderboardId: TASK_POINT_LEADERBOARD_ID,
    rewardSourceId: "daily_task",
    validationTier: "local_preview",
    rewards: [
      { currencyId: "xp", amount: 25 },
      { currencyId: "skill_cards", amount: 1 },
    ],
    description: "Use guard three times and build a defensive anti-leak habit.",
    multiplayerNote: "Later supports guard-focused tournaments and duel modifiers.",
  },
  {
    id: "weekly_tournament_participation",
    title: "Enter the Arena Cup",
    shortTitle: "PLAY 3 TOURNAMENT RUNS",
    cadence: "weekly",
    category: "tournament",
    metric: "tournament_runs",
    target: 3,
    minLevel: 3,
    taskPoints: 150,
    leaderboardId: TASK_POINT_LEADERBOARD_ID,
    rewardSourceId: "weekly_task",
    validationTier: "backend_required",
    rewards: [
      { currencyId: "xp", amount: 120 },
      { currencyId: "tournament_points", amount: 250 },
    ],
    description: "Play three tournament runs during the active event window.",
    multiplayerNote: "Participation points must be verified before tournament leaderboard submission.",
  },
  {
    id: "weekly_duel_win",
    title: "Win a Leak Duel",
    shortTitle: "WIN 1 LEAK DUEL",
    cadence: "weekly",
    category: "duel",
    metric: "duel_wins",
    target: 1,
    minLevel: 5,
    taskPoints: 120,
    leaderboardId: TASK_POINT_LEADERBOARD_ID,
    rewardSourceId: "weekly_task",
    validationTier: "backend_required",
    rewards: [
      { currencyId: "rank_points", amount: 20 },
      { currencyId: "leak_points", amount: 8 },
    ],
    description: "Beat another player on the same leak-pressure seed.",
    multiplayerNote: "Async 1v1 results require backend validation before ranked points become real.",
  },
  {
    id: "weekly_boss_damage_push",
    title: "Hit the Weekly Leak Boss",
    shortTitle: "DEAL 1000 BOSS DAMAGE",
    cadence: "weekly",
    category: "boss",
    metric: "boss_damage",
    target: 1000,
    minLevel: 2,
    taskPoints: 100,
    leaderboardId: TASK_POINT_LEADERBOARD_ID,
    rewardSourceId: "weekly_task",
    validationTier: "backend_required",
    rewards: [
      { currencyId: "xp", amount: 80 },
      { currencyId: "leak_points", amount: 10 },
    ],
    description: "Contribute verified damage to the weekly community boss.",
    multiplayerNote: "Community boss contribution is public leaderboard data and must be remote-checked.",
  },
];

export function getTaskSkeletonDefinition(taskId: string): TaskDefinitionV2 | undefined {
  return TASK_SKELETON_DEFINITIONS.find((task) => task.id === taskId);
}

export function getTaskDefinitionsByCadence(cadence: TaskCadence): TaskDefinitionV2[] {
  return TASK_SKELETON_DEFINITIONS.filter((task) => task.cadence === cadence);
}

export function getDefaultTaskIdsForCadence(cadence: TaskCadence): string[] {
  if (cadence === "daily") return [...DEFAULT_DAILY_TASK_IDS];
  if (cadence === "weekly") return [...DEFAULT_WEEKLY_TASK_IDS];
  return TASK_SKELETON_DEFINITIONS.filter((task) => task.cadence === cadence).map((task) => task.id);
}
