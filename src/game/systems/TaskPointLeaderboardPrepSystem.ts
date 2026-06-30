import type { PlayerProfile } from "../data/playerProfile";
import { TASK_POINT_LEADERBOARD_ID, type TaskCategory } from "../types/TaskTypes";
import type {
  TaskPointLeaderboardPayload,
  TaskPointLeaderboardReadiness,
  TaskPointLeaderboardTaskRow,
  TaskPointLeaderboardPrepSystemDefinition,
  TaskPointSourceBreakdownRow,
  TaskPointSourceId,
} from "../types/TaskPointTypes";
import { getTaskPeriodKey, getTaskStatesForProfile, syncTaskPeriodsForProfile } from "./TaskSystem";

export const TASK_POINT_LEADERBOARD_PREP_SYSTEM_VERSION = "0.10.1-task-points-leaderboard-prep";

export const TASK_POINT_LEADERBOARD_PREP_SYSTEM_DEFINITION: TaskPointLeaderboardPrepSystemDefinition = {
  version: TASK_POINT_LEADERBOARD_PREP_SYSTEM_VERSION,
  leaderboardId: TASK_POINT_LEADERBOARD_ID,
  leaderboardSubmissionEnabled: false,
  publicSubmitRequires: [
    "Leaderboard adapter contract",
    "Run/result validation payload",
    "Backend anti-cheat checks",
    "Remote weekly period reset",
  ],
  localPreviewFields: [
    "totalLocalTaskPoints",
    "claimedDailyTaskPoints",
    "completedDailyTaskPointsPreview",
    "completedWeeklyTaskPointsPreview",
    "backendLockedTaskPointsPreview",
    "pendingValidationTaskIds",
  ],
  rules: [
    "Task Points can be calculated locally for preview and profile feedback.",
    "Daily local-preview claims may increase local taskPoints, but public ranking remains disabled.",
    "Weekly, tournament, duel and boss task points are treated as pending validation before leaderboard submission.",
    "This system prepares the Task Points payload only; it does not submit scores or create remote leaderboard entries.",
  ],
};

function safeInteger(value: unknown): number {
  return Math.max(0, Math.floor(Number(value) || 0));
}

function getDisplayName(profile: PlayerProfile): string {
  return profile.identity.displayName || "Broke Fighter";
}

function getTaskBackendLock(row: Pick<TaskPointLeaderboardTaskRow, "cadence" | "validationTier">): boolean {
  return row.validationTier !== "local_preview" || row.cadence !== "daily";
}

function getSourceIdForRow(row: TaskPointLeaderboardTaskRow): TaskPointSourceId {
  if (row.cadence === "daily" && row.claimed) return "daily_claimed";
  if (row.cadence === "daily") return "daily_completed";
  if (row.category === "tournament") return "tournament_completed";
  if (row.category === "duel") return "duel_completed";
  if (row.category === "boss") return "boss_completed";
  return "weekly_completed";
}

const SOURCE_LABELS: Record<TaskPointSourceId, string> = {
  daily_claimed: "Claimed Daily Tasks",
  daily_completed: "Completed Daily Preview",
  weekly_completed: "Weekly Task Preview",
  tournament_completed: "Tournament Task Preview",
  duel_completed: "Leak Duel Task Preview",
  boss_completed: "Boss Task Preview",
};

function createSourceBreakdown(rows: readonly TaskPointLeaderboardTaskRow[]): TaskPointSourceBreakdownRow[] {
  const completedRows = rows.filter((row) => row.completed);
  const bySource = new Map<TaskPointSourceId, TaskPointLeaderboardTaskRow[]>();

  for (const row of completedRows) {
    const sourceId = getSourceIdForRow(row);
    bySource.set(sourceId, [...(bySource.get(sourceId) ?? []), row]);
  }

  return Array.from(bySource.entries()).map(([sourceId, sourceRows]) => ({
    sourceId,
    label: SOURCE_LABELS[sourceId],
    taskIds: sourceRows.map((row) => row.taskId),
    taskPoints: sourceRows.reduce((total, row) => total + safeInteger(row.taskPoints), 0),
    backendValidationRequired: sourceRows.some((row) => row.backendValidationRequired),
  }));
}

function buildTaskPointRows(profile: PlayerProfile): TaskPointLeaderboardTaskRow[] {
  return getTaskStatesForProfile(profile)
    .filter((state) => state.leaderboardId === TASK_POINT_LEADERBOARD_ID)
    .map((state) => {
      const baseRow = {
        taskId: state.taskId,
        title: state.title,
        cadence: state.cadence,
        category: state.category as TaskCategory,
        metric: state.metric,
        progress: state.progress,
        target: state.target,
        completed: state.completed,
        claimed: state.claimed,
        taskPoints: state.taskPoints,
        validationTier: state.validationTier,
        leaderboardId: state.leaderboardId,
      } satisfies Omit<TaskPointLeaderboardTaskRow, "backendValidationRequired">;

      return {
        ...baseRow,
        backendValidationRequired: getTaskBackendLock(baseRow),
      };
    });
}

export function getTaskPointLeaderboardPeriodKey(date = new Date()): string {
  return getTaskPeriodKey("weekly", date);
}

export function getTaskPointLeaderboardPayload(profile: PlayerProfile, date = new Date()): TaskPointLeaderboardPayload {
  const synced = syncTaskPeriodsForProfile(profile, date);
  const rows = buildTaskPointRows(synced);
  const completedRows = rows.filter((row) => row.completed);
  const claimableRows = completedRows.filter((row) => !row.claimed && !row.backendValidationRequired);
  const pendingValidationRows = completedRows.filter((row) => row.backendValidationRequired);
  const claimedDailyTaskPoints = rows
    .filter((row) => row.cadence === "daily" && row.claimed)
    .reduce((total, row) => total + safeInteger(row.taskPoints), 0);
  const completedDailyTaskPointsPreview = completedRows
    .filter((row) => row.cadence === "daily")
    .reduce((total, row) => total + safeInteger(row.taskPoints), 0);
  const completedWeeklyTaskPointsPreview = completedRows
    .filter((row) => row.cadence === "weekly")
    .reduce((total, row) => total + safeInteger(row.taskPoints), 0);
  const backendLockedTaskPointsPreview = pendingValidationRows.reduce((total, row) => total + safeInteger(row.taskPoints), 0);
  const claimableTaskPointsPreview = claimableRows.reduce((total, row) => total + safeInteger(row.taskPoints), 0);

  return {
    leaderboardId: TASK_POINT_LEADERBOARD_ID,
    playerId: synced.identity.localPlayerId,
    displayName: getDisplayName(synced),
    periodKey: getTaskPointLeaderboardPeriodKey(date),
    totalLocalTaskPoints: safeInteger(synced.taskPoints || synced.multiplayer.taskPoints),
    claimedDailyTaskPoints,
    completedDailyTaskPointsPreview,
    completedWeeklyTaskPointsPreview,
    backendLockedTaskPointsPreview,
    claimableTaskPointsPreview,
    completedTaskCount: completedRows.length,
    claimedTaskCount: rows.filter((row) => row.claimed).length,
    pendingValidationTaskIds: pendingValidationRows.map((row) => row.taskId),
    rows,
    sourceBreakdown: createSourceBreakdown(rows),
    submissionStatus: pendingValidationRows.length > 0 ? "blocked_backend_required" : "local_preview",
    leaderboardSubmissionEnabled: false,
    generatedAtIso: date.toISOString(),
  };
}

export function getTaskPointLeaderboardReadiness(profile: PlayerProfile, date = new Date()): TaskPointLeaderboardReadiness {
  const payload = getTaskPointLeaderboardPayload(profile, date);
  const requiredBeforePublicSubmit = [...TASK_POINT_LEADERBOARD_PREP_SYSTEM_DEFINITION.publicSubmitRequires];
  if (payload.pendingValidationTaskIds.length > 0) {
    requiredBeforePublicSubmit.unshift("Validate pending weekly/tournament/duel/boss task completions");
  }

  return {
    leaderboardId: payload.leaderboardId,
    readyForLocalPreview: true,
    readyForPublicSubmit: false,
    requiredBeforePublicSubmit,
    pendingValidationTaskIds: payload.pendingValidationTaskIds,
    backendLockedTaskPointsPreview: payload.backendLockedTaskPointsPreview,
  };
}
