import type { LeaderboardId } from "./LeaderboardTypes";
import type { TaskCadence, TaskCategory, TaskProgressMetric, TaskValidationTier } from "./TaskTypes";

export type TaskPointSourceId = "daily_claimed" | "daily_completed" | "weekly_completed" | "tournament_completed" | "duel_completed" | "boss_completed";
export type TaskPointLeaderboardSubmissionStatus = "local_preview" | "blocked_backend_required" | "blocked_adapter_missing";

export interface TaskPointSourceBreakdownRow {
  sourceId: TaskPointSourceId;
  label: string;
  taskIds: string[];
  taskPoints: number;
  backendValidationRequired: boolean;
}

export interface TaskPointLeaderboardTaskRow {
  taskId: string;
  title: string;
  cadence: TaskCadence;
  category: TaskCategory;
  metric: TaskProgressMetric;
  progress: number;
  target: number;
  completed: boolean;
  claimed: boolean;
  taskPoints: number;
  validationTier: TaskValidationTier;
  leaderboardId?: LeaderboardId;
  backendValidationRequired: boolean;
}

export interface TaskPointLeaderboardPayload {
  leaderboardId: LeaderboardId;
  playerId: string;
  displayName: string;
  periodKey: string;
  totalLocalTaskPoints: number;
  claimedDailyTaskPoints: number;
  completedDailyTaskPointsPreview: number;
  completedWeeklyTaskPointsPreview: number;
  backendLockedTaskPointsPreview: number;
  claimableTaskPointsPreview: number;
  completedTaskCount: number;
  claimedTaskCount: number;
  pendingValidationTaskIds: string[];
  rows: TaskPointLeaderboardTaskRow[];
  sourceBreakdown: TaskPointSourceBreakdownRow[];
  submissionStatus: TaskPointLeaderboardSubmissionStatus;
  leaderboardSubmissionEnabled: boolean;
  generatedAtIso: string;
}

export interface TaskPointLeaderboardReadiness {
  leaderboardId: LeaderboardId;
  readyForLocalPreview: boolean;
  readyForPublicSubmit: boolean;
  requiredBeforePublicSubmit: string[];
  pendingValidationTaskIds: string[];
  backendLockedTaskPointsPreview: number;
}

export interface TaskPointLeaderboardPrepSystemDefinition {
  version: string;
  leaderboardId: LeaderboardId;
  leaderboardSubmissionEnabled: boolean;
  publicSubmitRequires: readonly string[];
  localPreviewFields: readonly string[];
  rules: readonly string[];
}
