import type { LeaderboardId } from "./LeaderboardTypes";
import type { RewardAmount } from "./ProgressionTypes";

export type TaskCadence = "daily" | "weekly" | "tournament" | "season";
export type TaskCategory = "combat" | "skill" | "anti_leak" | "tournament" | "duel" | "boss" | "progression";
export type TaskProgressMetric = "runs" | "wins" | "score" | "leaks_defeated" | "boss_damage" | "guards" | "duel_wins" | "tournament_runs";

export interface TaskDefinitionV2 {
  id: string;
  title: string;
  cadence: TaskCadence;
  category: TaskCategory;
  metric: TaskProgressMetric;
  target: number;
  taskPoints: number;
  leaderboardId?: LeaderboardId;
  rewards: RewardAmount[];
  description: string;
}

export interface TaskProgressState {
  taskId: string;
  progress: number;
  target: number;
  completed: boolean;
  claimed: boolean;
}

export interface TaskClaimResult {
  taskId: string;
  taskPointsAwarded: number;
  rewards: RewardAmount[];
  claimedAtIso: string;
}

export const TASK_POINT_LEADERBOARD_ID: LeaderboardId = "task_points";

export const TASK_SKELETON_DEFINITIONS: readonly TaskDefinitionV2[] = [
  {
    id: "daily_win_one_arena",
    title: "Stop One Leak",
    cadence: "daily",
    category: "combat",
    metric: "wins",
    target: 1,
    taskPoints: 50,
    leaderboardId: TASK_POINT_LEADERBOARD_ID,
    rewards: [
      { currencyId: "xp", amount: 40 },
      { currencyId: "coins", amount: 50 },
      { currencyId: "leak_points", amount: 5 },
    ],
    description: "Win one arena run and prove the wallet is still alive.",
  },
  {
    id: "weekly_tournament_participation",
    title: "Enter the Arena Cup",
    cadence: "weekly",
    category: "tournament",
    metric: "tournament_runs",
    target: 3,
    taskPoints: 150,
    leaderboardId: TASK_POINT_LEADERBOARD_ID,
    rewards: [
      { currencyId: "xp", amount: 120 },
      { currencyId: "tournament_points", amount: 250 },
    ],
    description: "Play three tournament runs during the active event window.",
  },
  {
    id: "weekly_duel_win",
    title: "Win a Leak Duel",
    cadence: "weekly",
    category: "duel",
    metric: "duel_wins",
    target: 1,
    taskPoints: 120,
    leaderboardId: TASK_POINT_LEADERBOARD_ID,
    rewards: [
      { currencyId: "rank_points", amount: 20 },
      { currencyId: "leak_points", amount: 8 },
    ],
    description: "Beat another player on the same leak-pressure seed.",
  },
  {
    id: "weekly_boss_damage_push",
    title: "Hit the Weekly Leak Boss",
    cadence: "weekly",
    category: "boss",
    metric: "boss_damage",
    target: 1000,
    taskPoints: 100,
    leaderboardId: TASK_POINT_LEADERBOARD_ID,
    rewards: [
      { currencyId: "xp", amount: 80 },
      { currencyId: "leak_points", amount: 10 },
    ],
    description: "Contribute verified damage to the weekly community boss.",
  },
];

export function getTaskSkeletonDefinition(taskId: string): TaskDefinitionV2 | undefined {
  return TASK_SKELETON_DEFINITIONS.find((task) => task.id === taskId);
}
