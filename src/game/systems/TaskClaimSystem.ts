import type { PlayerProfile } from "../data/playerProfile";
import {
  buildRewardWalletDelta,
  createEmptyWallet,
  getCurrencyDefinition,
  sumRewardAmounts,
  type CurrencyWalletV2,
  type RewardAmount,
} from "../types/EconomyTypes";
import {
  TASK_SKELETON_DEFINITIONS,
  TASK_POINT_LEADERBOARD_ID,
  getTaskSkeletonDefinition,
  type TaskDefinitionV2,
} from "../types/TaskTypes";
import type {
  TaskClaimApplication,
  TaskClaimBatchApplication,
  TaskClaimEligibility,
  TaskClaimSystemDefinition,
} from "../types/TaskClaimTypes";
import { getTaskPeriodKey, getTaskProgressState, syncTaskPeriodsForProfile } from "./TaskSystem";

export const TASK_CLAIM_SYSTEM_VERSION = "0.10.0-task-claim-flow";

export const TASK_CLAIM_SYSTEM_DEFINITION: TaskClaimSystemDefinition = {
  version: TASK_CLAIM_SYSTEM_VERSION,
  goal: "Enable safe local claiming for completed daily tasks while keeping weekly, tournament, duel, boss and season tasks backend-locked before public leaderboards exist.",
  localClaimCadences: ["daily"],
  backendLockedCadences: ["weekly", "tournament", "season"],
  leaderboardSubmissionEnabled: false,
  rules: [
    "Only completed local-preview daily tasks can mutate the local wallet in this patch.",
    "Task Points are stored locally for future leaderboard preparation, but no public leaderboard submission is enabled.",
    "Weekly, tournament, duel and boss task claims remain blocked until backend validation and anti-cheat exist.",
    "Rewards containing backend-sensitive currencies are applied locally as preview progress and queued for future economy reconciliation.",
  ],
};

function addUnique(values: readonly string[], value: string): string[] {
  return values.includes(value) ? [...values] : [...values, value];
}

function addUniqueMany(values: readonly string[], additions: readonly string[]): string[] {
  return Array.from(new Set([...values, ...additions]));
}

function safeInteger(value: unknown): number {
  return Math.max(0, Math.floor(Number(value) || 0));
}

function emptyWallet(): CurrencyWalletV2 {
  return createEmptyWallet();
}

function addWallets(left: CurrencyWalletV2, right: CurrencyWalletV2): CurrencyWalletV2 {
  const next = { ...left };
  for (const currencyId of Object.keys(right) as (keyof CurrencyWalletV2)[]) {
    next[currencyId] = safeInteger(next[currencyId]) + safeInteger(right[currencyId]);
  }
  return next;
}

function hasBackendSensitiveReward(task: TaskDefinitionV2, rewards: readonly RewardAmount[]): boolean {
  if (task.leaderboardId === TASK_POINT_LEADERBOARD_ID) return true;
  return rewards.some((reward) => getCurrencyDefinition(reward.currencyId).backendValidationRequired);
}

function createPendingEconomyEventId(taskId: string, claimedAtIso: string): string {
  return `task_claim:${taskId}:${claimedAtIso}`;
}

function applyWalletDelta(profile: PlayerProfile, rewards: readonly RewardAmount[]): PlayerProfile {
  const walletDelta = buildRewardWalletDelta(rewards);
  const xp = safeInteger(profile.xp) + walletDelta.xp;
  const coins = safeInteger(profile.coins) + walletDelta.coins;
  const leakPoints = safeInteger(profile.leakPoints) + walletDelta.leak_points;
  const rankPoints = safeInteger(profile.rankPoints) + walletDelta.rank_points;
  const tournamentPoints = safeInteger(profile.tournamentPoints) + walletDelta.tournament_points;
  const skillCards = safeInteger(profile.skillCards) + walletDelta.skill_cards;
  const skinShards = safeInteger(profile.skinShards) + walletDelta.skin_shards;
  const cosmeticTokens = safeInteger(profile.cosmeticTokens) + walletDelta.cosmetic_tokens;

  return {
    ...profile,
    xp,
    coins,
    leakPoints,
    rankPoints,
    tournamentPoints,
    skillCards,
    skinShards,
    cosmeticTokens,
    wallet: {
      ...profile.wallet,
      xp,
      coins,
      leak_points: leakPoints,
      rank_points: rankPoints,
      tournament_points: tournamentPoints,
      skill_cards: skillCards,
      skin_shards: skinShards,
      cosmetic_tokens: cosmeticTokens,
    },
    multiplayer: {
      ...profile.multiplayer,
      rankPoints,
      tournamentPoints,
      cosmeticTokens,
    },
  };
}

function emptyApplication(profile: PlayerProfile, input: Omit<TaskClaimApplication<PlayerProfile>, "profile" | "walletDelta" | "rewardsApplied" | "rewardsPreview" | "taskPointsAwarded" | "backendValidationRequired" | "pendingBackendValidation" | "leaderboardSubmissionEnabled"> & Partial<Pick<TaskClaimApplication<PlayerProfile>, "rewardsApplied" | "rewardsPreview" | "walletDelta" | "taskPointsAwarded" | "backendValidationRequired" | "pendingBackendValidation">>): TaskClaimApplication<PlayerProfile> {
  return {
    profile,
    taskId: input.taskId,
    claimed: input.claimed,
    outcome: input.outcome,
    message: input.message,
    taskPointsAwarded: input.taskPointsAwarded ?? 0,
    rewardsApplied: input.rewardsApplied ?? [],
    rewardsPreview: input.rewardsPreview ?? [],
    walletDelta: input.walletDelta ?? emptyWallet(),
    claimedAtIso: input.claimedAtIso,
    backendValidationRequired: input.backendValidationRequired ?? false,
    pendingBackendValidation: input.pendingBackendValidation ?? false,
    pendingEconomyEventId: input.pendingEconomyEventId,
    leaderboardSubmissionEnabled: false,
  };
}

export function getTaskClaimEligibility(profile: PlayerProfile, taskId: string, date = new Date()): TaskClaimEligibility {
  const synced = syncTaskPeriodsForProfile(profile, date);
  const task = getTaskSkeletonDefinition(taskId);
  if (!task) {
    return {
      taskId,
      claimable: false,
      outcome: "not_found",
      backendValidationRequired: false,
      reason: "Task definition not found.",
    };
  }

  const state = getTaskProgressState(synced, task);
  const backendValidationRequired = task.validationTier !== "local_preview" || task.cadence !== "daily";

  if (state.claimed) {
    return {
      taskId,
      claimable: false,
      outcome: "already_claimed",
      status: state.status,
      cadence: task.cadence,
      validationTier: task.validationTier,
      backendValidationRequired,
      reason: "Task reward was already claimed for this period.",
    };
  }

  if (!state.completed) {
    return {
      taskId,
      claimable: false,
      outcome: "not_completed",
      status: state.status,
      cadence: task.cadence,
      validationTier: task.validationTier,
      backendValidationRequired,
      reason: "Task is not completed yet.",
    };
  }

  if (backendValidationRequired) {
    return {
      taskId,
      claimable: false,
      outcome: "backend_locked",
      status: state.status,
      cadence: task.cadence,
      validationTier: task.validationTier,
      backendValidationRequired: true,
      reason: "This task needs backend validation before rewards can be claimed.",
    };
  }

  return {
    taskId,
    claimable: true,
    outcome: "claimed",
    status: state.status,
    cadence: task.cadence,
    validationTier: task.validationTier,
    backendValidationRequired: hasBackendSensitiveReward(task, task.rewards),
    reason: "Task can be claimed locally. Public leaderboard submission remains disabled.",
  };
}

export function claimTaskRewardToProfile(profile: PlayerProfile, taskId: string, date = new Date()): TaskClaimApplication<PlayerProfile> {
  const synced = syncTaskPeriodsForProfile(profile, date);
  const task = getTaskSkeletonDefinition(taskId);
  if (!task) {
    return emptyApplication(synced, {
      taskId,
      claimed: false,
      outcome: "not_found",
      message: "TASK NOT FOUND",
    });
  }

  const eligibility = getTaskClaimEligibility(synced, task.id, date);
  const rewardsPreview = sumRewardAmounts(task.rewards);
  const previewDelta = buildRewardWalletDelta(rewardsPreview);

  if (!eligibility.claimable) {
    return emptyApplication(synced, {
      taskId: task.id,
      claimed: false,
      outcome: eligibility.outcome,
      message: eligibility.reason,
      rewardsPreview,
      walletDelta: previewDelta,
      backendValidationRequired: eligibility.backendValidationRequired,
      pendingBackendValidation: eligibility.backendValidationRequired,
    });
  }

  const claimedAtIso = new Date().toISOString();
  const pendingBackendValidation = hasBackendSensitiveReward(task, rewardsPreview);
  const pendingEconomyEventId = pendingBackendValidation ? createPendingEconomyEventId(task.id, claimedAtIso) : undefined;
  const periodKey = getTaskPeriodKey(task.cadence, date);
  const nextTaskPoints = safeInteger(synced.taskPoints) + safeInteger(task.taskPoints);
  let next = applyWalletDelta(synced, rewardsPreview);

  next = {
    ...next,
    taskPoints: nextTaskPoints,
    tasksV2: {
      ...next.tasksV2,
      claimedTaskIds: addUnique(next.tasksV2.claimedTaskIds, task.id),
      completedTaskIds: addUnique(next.tasksV2.completedTaskIds, task.id),
      taskProgressById: {
        ...next.tasksV2.taskProgressById,
        [task.id]: task.target,
      },
      taskPointsByPeriod: {
        ...next.tasksV2.taskPointsByPeriod,
        [periodKey]: Math.max(safeInteger(next.tasksV2.taskPointsByPeriod[periodKey]), nextTaskPoints),
      },
    },
    multiplayer: {
      ...next.multiplayer,
      rankPoints: next.rankPoints,
      tournamentPoints: next.tournamentPoints,
      cosmeticTokens: next.cosmeticTokens,
      taskPoints: nextTaskPoints,
      pendingSubmissionCount: next.sync.pendingRunResultIds.length + (pendingEconomyEventId ? addUnique(next.sync.pendingEconomyEventIds, pendingEconomyEventId).length : next.sync.pendingEconomyEventIds.length),
    },
    sync: {
      ...next.sync,
      pendingEconomyEventIds: pendingEconomyEventId
        ? addUnique(next.sync.pendingEconomyEventIds, pendingEconomyEventId)
        : [...next.sync.pendingEconomyEventIds],
    },
  };

  return {
    profile: next,
    taskId: task.id,
    claimed: true,
    outcome: "claimed",
    message: pendingBackendValidation ? "CLAIMED LOCALLY · PENDING FUTURE VALIDATION" : "CLAIMED",
    taskPointsAwarded: task.taskPoints,
    rewardsApplied: rewardsPreview,
    rewardsPreview,
    walletDelta: previewDelta,
    claimedAtIso,
    backendValidationRequired: pendingBackendValidation,
    pendingBackendValidation,
    pendingEconomyEventId,
    leaderboardSubmissionEnabled: false,
  };
}

export function claimCompletedLocalTasksToProfile(profile: PlayerProfile, date = new Date()): TaskClaimBatchApplication<PlayerProfile> {
  let next = syncTaskPeriodsForProfile(profile, date);
  const applications: TaskClaimApplication<PlayerProfile>[] = [];
  let walletDelta = emptyWallet();
  const rewards: RewardAmount[] = [];
  const pendingEconomyEventIds: string[] = [];

  const activeTaskIds = TASK_SKELETON_DEFINITIONS
    .filter((task) => task.cadence === "daily")
    .map((task) => task.id);

  for (const taskId of activeTaskIds) {
    const application = claimTaskRewardToProfile(next, taskId, date);
    if (application.claimed) {
      next = application.profile;
      applications.push(application);
      walletDelta = addWallets(walletDelta, application.walletDelta);
      rewards.push(...application.rewardsApplied);
      if (application.pendingEconomyEventId) pendingEconomyEventIds.push(application.pendingEconomyEventId);
    } else if (application.outcome === "backend_locked") {
      applications.push(application);
    }
  }

  const claimedCount = applications.filter((application) => application.claimed).length;
  const blockedCount = applications.filter((application) => application.outcome === "backend_locked").length;

  return {
    profile: {
      ...next,
      sync: {
        ...next.sync,
        pendingEconomyEventIds: addUniqueMany(next.sync.pendingEconomyEventIds, pendingEconomyEventIds),
      },
    },
    applications,
    claimedCount,
    blockedCount,
    taskPointsAwarded: applications.reduce((total, application) => total + application.taskPointsAwarded, 0),
    rewardsApplied: sumRewardAmounts(rewards),
    walletDelta,
    pendingEconomyEventIds,
    message: claimedCount > 0 ? `CLAIMED ${claimedCount} TASK REWARD${claimedCount === 1 ? "" : "S"}` : "NO CLAIMABLE LOCAL TASKS",
  };
}
