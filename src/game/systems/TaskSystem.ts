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
  type TaskMetricDeltaMap,
  type TaskPeriodSnapshot,
  type TaskProgressApplySummary,
  type TaskProgressEvent,
  type TaskProgressMetric,
  type TaskProgressState,
  type TaskProgressTrackingStats,
  type TaskStatus,
  type TaskSystemSummary,
} from "../types/TaskTypes";

export const TASK_SYSTEM_VERSION = TASK_TYPES_SYSTEM_VERSION;
export { TASK_SYSTEM_DEFINITION };

function clampProgress(value: number, target: number): number {
  return Math.max(0, Math.min(Math.max(0, Math.floor(target || 0)), Math.floor(Number(value) || 0)));
}

function safeAmount(value: number | undefined): number {
  return Math.max(0, Math.floor(Number(value) || 0));
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

function addUnique(values: readonly string[], value: string): string[] {
  return values.includes(value) ? [...values] : [...values, value];
}

function removeTaskIds(values: readonly string[], taskIds: readonly string[]): string[] {
  const blocked = new Set(taskIds);
  return values.filter((value) => !blocked.has(value));
}

function getTaskIdsForCadence(cadence: TaskCadence): string[] {
  return TASK_SKELETON_DEFINITIONS.filter((task) => task.cadence === cadence).map((task) => task.id);
}

function resetTaskCadence(profile: PlayerProfile, cadence: TaskCadence): PlayerProfile {
  const taskIds = getTaskIdsForCadence(cadence);
  const taskProgressById = { ...profile.tasksV2.taskProgressById };
  for (const taskId of taskIds) delete taskProgressById[taskId];

  return {
    ...profile,
    tasksV2: {
      ...profile.tasksV2,
      claimedTaskIds: removeTaskIds(profile.tasksV2.claimedTaskIds, taskIds),
      completedTaskIds: removeTaskIds(profile.tasksV2.completedTaskIds, taskIds),
      taskProgressById,
    },
  };
}

export function syncTaskPeriodsForProfile(profile: PlayerProfile, date = new Date()): PlayerProfile {
  const dailyKey = getTaskPeriodKey("daily", date);
  const weeklyKey = getTaskPeriodKey("weekly", date);
  let next: PlayerProfile = {
    ...profile,
    tasksV2: {
      ...profile.tasksV2,
      activeDailyTaskIds: uniqueKnownTaskIds(profile.tasksV2.activeDailyTaskIds.length ? profile.tasksV2.activeDailyTaskIds : DEFAULT_DAILY_TASK_IDS),
      activeWeeklyTaskIds: uniqueKnownTaskIds(profile.tasksV2.activeWeeklyTaskIds.length ? profile.tasksV2.activeWeeklyTaskIds : DEFAULT_WEEKLY_TASK_IDS),
      claimedTaskIds: Array.from(new Set(profile.tasksV2.claimedTaskIds)),
      completedTaskIds: Array.from(new Set(profile.tasksV2.completedTaskIds)),
      taskProgressById: { ...profile.tasksV2.taskProgressById },
      taskPointsByPeriod: { ...profile.tasksV2.taskPointsByPeriod },
    },
  };

  if (next.tasksV2.lastDailyResetKey && next.tasksV2.lastDailyResetKey !== dailyKey) {
    next = resetTaskCadence(next, "daily");
  }
  if (next.tasksV2.lastWeeklyResetKey && next.tasksV2.lastWeeklyResetKey !== weeklyKey) {
    next = resetTaskCadence(next, "weekly");
  }

  return {
    ...next,
    tasksV2: {
      ...next.tasksV2,
      lastDailyResetKey: dailyKey,
      lastWeeklyResetKey: weeklyKey,
    },
  };
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
  const synced = syncTaskPeriodsForProfile(profile);
  return getActiveTaskDefinitionsForProfile(synced).map((task) => getTaskProgressState(synced, task));
}

export function getTaskPeriodSnapshot(profile: PlayerProfile, cadence: TaskCadence, date = new Date()): TaskPeriodSnapshot {
  const synced = syncTaskPeriodsForProfile(profile, date);
  const states = getTaskStatesForProfile(synced).filter((task) => task.cadence === cadence);
  return {
    cadence,
    periodKey: getTaskPeriodKey(cadence, date),
    activeTaskIds: states.map((task) => task.taskId),
    completedTaskIds: states.filter((task) => task.completed).map((task) => task.taskId),
    claimedTaskIds: states.filter((task) => task.claimed).map((task) => task.taskId),
    taskPointsPreview: states.filter((task) => task.completed).reduce((total, task) => total + task.taskPoints, 0),
  };
}

function getCompletedTaskPointsPreview(profile: PlayerProfile): number {
  return getTaskStatesForProfile(profile)
    .filter((task) => task.completed)
    .reduce((total, task) => total + task.taskPoints, 0);
}

function refreshTaskPointsByPeriod(profile: PlayerProfile, date = new Date()): PlayerProfile {
  const dailySnapshot = getTaskPeriodSnapshot(profile, "daily", date);
  const weeklySnapshot = getTaskPeriodSnapshot(profile, "weekly", date);
  return {
    ...profile,
    tasksV2: {
      ...profile.tasksV2,
      taskPointsByPeriod: {
        ...profile.tasksV2.taskPointsByPeriod,
        [dailySnapshot.periodKey]: dailySnapshot.taskPointsPreview,
        [weeklySnapshot.periodKey]: weeklySnapshot.taskPointsPreview,
      },
    },
  };
}

export function createTaskProgressEventsFromStats(stats: TaskProgressTrackingStats): TaskProgressEvent[] {
  const common = {
    source: stats.source,
    createdAtIso: stats.createdAtIso,
    runId: stats.runId,
    tournamentId: stats.tournamentId,
    duelId: stats.duelId,
    bossId: stats.bossId,
  };
  const events: TaskProgressEvent[] = [];
  const deltas: TaskMetricDeltaMap = {
    runs: 1,
    wins: stats.victory ? 1 : 0,
    score: safeAmount(stats.score),
    leaks_defeated: safeAmount(stats.leaksDefeated),
    boss_damage: safeAmount(stats.bossDamage),
    guards: safeAmount(stats.guards),
    skill_uses: safeAmount(stats.skillUses),
    tournament_runs: safeAmount(stats.tournamentRuns),
    duel_wins: safeAmount(stats.duelWins),
    participation: safeAmount(stats.participation),
  };

  for (const [metric, amount] of Object.entries(deltas) as [TaskProgressMetric, number][]) {
    if (amount <= 0) continue;
    events.push(createTaskProgressEvent({ ...common, metric, amount }));
  }

  return events;
}

export function applyTaskProgressEventsToProfile(
  profile: PlayerProfile,
  events: readonly TaskProgressEvent[],
  date = new Date(),
): { profile: PlayerProfile; summary: TaskProgressApplySummary } {
  let next = syncTaskPeriodsForProfile(profile, date);
  const updatedTaskIds = new Set<string>();
  const completedTaskIds = new Set<string>();
  const progressDeltaByTaskId: Record<string, number> = {};
  let appliedEventCount = 0;
  let ignoredEventCount = 0;
  let backendValidationRequired = false;

  for (const event of events) {
    const amount = safeAmount(event.amount);
    if (amount <= 0) {
      ignoredEventCount += 1;
      continue;
    }

    const matchingTasks = getActiveTaskDefinitionsForProfile(next).filter(
      (task) => task.metric === event.metric && Math.max(1, Math.floor(next.level || 1)) >= task.minLevel,
    );

    if (!matchingTasks.length) {
      ignoredEventCount += 1;
      continue;
    }

    appliedEventCount += 1;
    for (const task of matchingTasks) {
      const before = getTaskProgressForProfile(next, task.id);
      const after = clampProgress(before + amount, task.target);
      if (after === before) continue;

      next.tasksV2.taskProgressById = {
        ...next.tasksV2.taskProgressById,
        [task.id]: after,
      };
      progressDeltaByTaskId[task.id] = (progressDeltaByTaskId[task.id] || 0) + (after - before);
      updatedTaskIds.add(task.id);

      if (before < task.target && after >= task.target) {
        next.tasksV2.completedTaskIds = addUnique(next.tasksV2.completedTaskIds, task.id);
        completedTaskIds.add(task.id);
        if (task.validationTier !== "local_preview") backendValidationRequired = true;
      }
    }
  }

  next = refreshTaskPointsByPeriod(next, date);

  return {
    profile: next,
    summary: {
      appliedEventCount,
      ignoredEventCount,
      updatedTaskIds: Array.from(updatedTaskIds),
      completedTaskIds: Array.from(completedTaskIds),
      progressDeltaByTaskId,
      completedTaskPointsPreview: getCompletedTaskPointsPreview(next),
      backendValidationRequired,
    },
  };
}

export function getTaskSystemSummary(profile: PlayerProfile): TaskSystemSummary {
  const synced = syncTaskPeriodsForProfile(profile);
  const states = getTaskStatesForProfile(synced);
  return {
    activeDailyCount: states.filter((task) => task.cadence === "daily").length,
    activeWeeklyCount: states.filter((task) => task.cadence === "weekly").length,
    completedCount: states.filter((task) => task.completed).length,
    claimedCount: states.filter((task) => task.claimed).length,
    localTaskPoints: Math.max(0, Math.floor(synced.taskPoints || synced.multiplayer.taskPoints || 0)),
    completedTaskPointsPreview: states.filter((task) => task.completed).reduce((total, task) => total + task.taskPoints, 0),
    backendLockedTaskCount: states.filter((task) => task.validationTier !== "local_preview").length,
    taskLeaderboardId: TASK_POINT_LEADERBOARD_ID,
  };
}
