import type { PlayerProfile } from "../data/playerProfile";
import {
  DEFAULT_DAILY_TASK_IDS,
  DEFAULT_WEEKLY_TASK_IDS,
  TASK_POINT_LEADERBOARD_ID,
  TASK_SKELETON_DEFINITIONS,
  TASK_SYSTEM_DEFINITION,
  TASK_SYSTEM_VERSION as TASK_TYPES_SYSTEM_VERSION,
  getTaskSkeletonDefinition,
  type TaskCadence,
  type TaskDefinitionV2,
  type TaskEventSource,
  type TaskPeriodSnapshot,
  type TaskProgressEvent,
  type TaskProgressMetric,
  type TaskProgressState,
  type TaskStatus,
  type TaskSystemSummary,
} from "../types/TaskTypes";

export const TASK_SYSTEM_VERSION = TASK_TYPES_SYSTEM_VERSION;
export { TASK_SYSTEM_DEFINITION };

function clampProgress(value: number, target: number): number {
  return Math.max(0, Math.min(Math.max(0, Math.floor(target || 0)), Math.floor(Number(value) || 0)));
}

function getUtcDateParts(date: Date): { year: number; month: string; day: string } {
  return {
    year: date.getUTCFullYear(),
    month: String(date.getUTCMonth() + 1).padStart(2, "0"),
    day: String(date.getUTCDate()).padStart(2, "0"),
  };
}

function getIsoWeekKey(date: Date): string {
  const copy = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = copy.getUTCDay() || 7;
  copy.setUTCDate(copy.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(copy.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((copy.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${copy.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function getTaskPeriodKey(cadence: TaskCadence, date = new Date()): string {
  if (cadence === "daily") {
    const parts = getUtcDateParts(date);
    return `${parts.year}-${parts.month}-${parts.day}`;
  }
  if (cadence === "weekly") return getIsoWeekKey(date);
  if (cadence === "tournament") return "tournament-active-local";
  return "season-active-local";
}

export function createTaskProgressEvent(input: {
  source: TaskEventSource;
  metric: TaskProgressMetric;
  amount: number;
  createdAtIso?: string;
  runId?: string;
  tournamentId?: string;
  duelId?: string;
  bossId?: string;
}): TaskProgressEvent {
  return {
    source: input.source,
    metric: input.metric,
    amount: Math.max(0, Math.floor(input.amount || 0)),
    createdAtIso: input.createdAtIso ?? new Date().toISOString(),
    runId: input.runId,
    tournamentId: input.tournamentId,
    duelId: input.duelId,
    bossId: input.bossId,
  };
}

function uniqueKnownTaskIds(taskIds: readonly string[]): string[] {
  return Array.from(new Set(taskIds)).filter((taskId) => Boolean(getTaskSkeletonDefinition(taskId)));
}

export function getActiveTaskIdsForCadence(profile: PlayerProfile, cadence: TaskCadence): string[] {
  if (cadence === "daily") {
    return uniqueKnownTaskIds(profile.tasksV2.activeDailyTaskIds.length ? profile.tasksV2.activeDailyTaskIds : DEFAULT_DAILY_TASK_IDS);
  }
  if (cadence === "weekly") {
    return uniqueKnownTaskIds(profile.tasksV2.activeWeeklyTaskIds.length ? profile.tasksV2.activeWeeklyTaskIds : DEFAULT_WEEKLY_TASK_IDS);
  }
  return TASK_SKELETON_DEFINITIONS.filter((task) => task.cadence === cadence).map((task) => task.id);
}

export function getActiveTaskDefinitionsForProfile(profile: PlayerProfile): TaskDefinitionV2[] {
  const activeIds = [...getActiveTaskIdsForCadence(profile, "daily"), ...getActiveTaskIdsForCadence(profile, "weekly")];
  return activeIds.map((taskId) => getTaskSkeletonDefinition(taskId)).filter((task): task is TaskDefinitionV2 => Boolean(task));
}

export function getTaskProgressForProfile(profile: PlayerProfile, taskId: string): number {
  const task = getTaskSkeletonDefinition(taskId);
  if (!task) return 0;
  return clampProgress(profile.tasksV2.taskProgressById[taskId] ?? 0, task.target);
}

function getTaskStatus(task: TaskDefinitionV2, progress: number, claimed: boolean): TaskStatus {
  if (claimed) return "claimed";
  if (progress >= task.target) return "completed";
  return "active";
}

export function getTaskProgressState(profile: PlayerProfile, task: TaskDefinitionV2): TaskProgressState {
  const progress = getTaskProgressForProfile(profile, task.id);
  const claimed = profile.tasksV2.claimedTaskIds.includes(task.id);
  const completed = progress >= task.target || profile.tasksV2.completedTaskIds.includes(task.id);

  return {
    taskId: task.id,
    title: task.title,
    cadence: task.cadence,
    category: task.category,
    metric: task.metric,
    progress,
    target: task.target,
    completed,
    claimed,
    status: claimed ? "claimed" : completed ? "completed" : getTaskStatus(task, progress, claimed),
    taskPoints: task.taskPoints,
    rewards: task.rewards,
    validationTier: task.validationTier,
    leaderboardId: task.leaderboardId,
  };
}

export function getTaskStatesForProfile(profile: PlayerProfile): TaskProgressState[] {
  return getActiveTaskDefinitionsForProfile(profile).map((task) => getTaskProgressState(profile, task));
}

export function getTaskPeriodSnapshot(profile: PlayerProfile, cadence: TaskCadence, date = new Date()): TaskPeriodSnapshot {
  const states = getTaskStatesForProfile(profile).filter((task) => task.cadence === cadence);
  return {
    cadence,
    periodKey: getTaskPeriodKey(cadence, date),
    activeTaskIds: states.map((task) => task.taskId),
    completedTaskIds: states.filter((task) => task.completed).map((task) => task.taskId),
    claimedTaskIds: states.filter((task) => task.claimed).map((task) => task.taskId),
    taskPointsPreview: states.filter((task) => task.completed).reduce((total, task) => total + task.taskPoints, 0),
  };
}

export function getTaskSystemSummary(profile: PlayerProfile): TaskSystemSummary {
  const states = getTaskStatesForProfile(profile);
  return {
    activeDailyCount: states.filter((task) => task.cadence === "daily").length,
    activeWeeklyCount: states.filter((task) => task.cadence === "weekly").length,
    completedCount: states.filter((task) => task.completed).length,
    claimedCount: states.filter((task) => task.claimed).length,
    localTaskPoints: Math.max(0, Math.floor(profile.taskPoints || profile.multiplayer.taskPoints || 0)),
    backendLockedTaskCount: states.filter((task) => task.validationTier !== "local_preview").length,
    taskLeaderboardId: TASK_POINT_LEADERBOARD_ID,
  };
}
