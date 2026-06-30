import type { PlayerProfile } from "../data/playerProfile";
import {
  CURRENCY_IDS,
  createEconomyTransactionPreview,
  createEmptyWallet,
  getRewardSourceDefinition,
  type CurrencyWalletV2,
  type RewardAmount,
} from "../types/EconomyTypes";
import { TASK_SKELETON_DEFINITIONS, type TaskDefinitionV2 } from "../types/TaskTypes";
import {
  getTaskProgressState,
  getTaskStatesForProfile,
} from "./TaskSystem";
import type {
  TaskRewardCatalogSummary,
  TaskRewardPolicyDefinition,
  TaskRewardPolicyId,
  TaskRewardPreview,
  TaskRewardProfileSummary,
  TaskRewardRiskTier,
  TaskRewardSystemDefinition,
} from "../types/TaskRewardTypes";

export const TASK_REWARD_SYSTEM_VERSION = "0.9.8-task-rewards";

export const TASK_REWARD_POLICIES: readonly TaskRewardPolicyDefinition[] = [
  {
    id: "daily_local_preview",
    label: "Daily Local Preview",
    riskTier: "leaderboard_sensitive",
    claimEnabled: false,
    leaderboardSubmissionEnabled: false,
    backendValidationRequired: false,
    description: "Daily task rewards can be previewed locally, but Task Points are not submitted to public leaderboards yet.",
  },
  {
    id: "weekly_backend_locked",
    label: "Weekly Backend Locked",
    riskTier: "leaderboard_sensitive",
    claimEnabled: false,
    leaderboardSubmissionEnabled: false,
    backendValidationRequired: true,
    description: "Weekly rewards are multiplayer-sensitive and remain locked until backend validation exists.",
  },
  {
    id: "tournament_backend_locked",
    label: "Tournament Backend Locked",
    riskTier: "backend_authoritative",
    claimEnabled: false,
    leaderboardSubmissionEnabled: false,
    backendValidationRequired: true,
    description: "Tournament reward previews must not become real rewards without verified event runs.",
  },
  {
    id: "duel_backend_locked",
    label: "Leak Duel Backend Locked",
    riskTier: "backend_authoritative",
    claimEnabled: false,
    leaderboardSubmissionEnabled: false,
    backendValidationRequired: true,
    description: "1v1 Leak Duel rewards require matched seed verification and backend winner validation.",
  },
  {
    id: "boss_backend_locked",
    label: "Boss Backend Locked",
    riskTier: "backend_authoritative",
    claimEnabled: false,
    leaderboardSubmissionEnabled: false,
    backendValidationRequired: true,
    description: "Weekly/community boss rewards require remote damage validation before public ranking.",
  },
  {
    id: "season_backend_locked",
    label: "Season Backend Locked",
    riskTier: "backend_authoritative",
    claimEnabled: false,
    leaderboardSubmissionEnabled: false,
    backendValidationRequired: true,
    description: "Season rewards stay server-authoritative because they affect long-term multiplayer status.",
  },
];

export const TASK_REWARD_SYSTEM_DEFINITION: TaskRewardSystemDefinition = {
  version: TASK_REWARD_SYSTEM_VERSION,
  goal: "Define task reward previews, safety policies and backend locks before claim flow, wallet mutation or leaderboard submission are enabled.",
  policies: TASK_REWARD_POLICIES,
  rules: [
    "This system returns reward previews only; it does not mutate player wallets or save claimed rewards.",
    "Task Points are displayed as progression intent, not submitted to public leaderboards yet.",
    "Weekly, tournament, duel, boss and season rewards stay backend-locked until validation and anti-cheat patches exist.",
    "Daily rewards can be previewed locally, but ranked currencies remain validation-sensitive before real multiplayer launch.",
  ],
};

function addRewardsToWallet(wallet: CurrencyWalletV2, rewards: readonly RewardAmount[]): CurrencyWalletV2 {
  const nextWallet = { ...wallet };
  for (const reward of rewards) {
    nextWallet[reward.currencyId] = Math.max(0, Math.floor((nextWallet[reward.currencyId] || 0) + reward.amount));
  }
  return nextWallet;
}

function emptyRewardWallet(): CurrencyWalletV2 {
  return createEmptyWallet();
}

export function getTaskRewardPolicy(policyId: TaskRewardPolicyId): TaskRewardPolicyDefinition {
  const policy = TASK_REWARD_POLICIES.find((candidate) => candidate.id === policyId);
  if (!policy) throw new Error(`Unknown task reward policy: ${policyId}`);
  return policy;
}

export function getTaskRewardPolicyId(task: TaskDefinitionV2): TaskRewardPolicyId {
  if (task.cadence === "season") return "season_backend_locked";
  if (task.category === "tournament" || task.cadence === "tournament") return "tournament_backend_locked";
  if (task.category === "duel") return "duel_backend_locked";
  if (task.category === "boss") return "boss_backend_locked";
  if (task.cadence === "weekly") return "weekly_backend_locked";
  return "daily_local_preview";
}

export function getTaskRewardRiskTier(task: TaskDefinitionV2): TaskRewardRiskTier {
  const source = getRewardSourceDefinition(task.rewardSourceId);
  const policy = getTaskRewardPolicy(getTaskRewardPolicyId(task));
  if (source.validationTier === "backend_authoritative" || policy.riskTier === "backend_authoritative") return "backend_authoritative";
  if (source.leaderboardSensitive || task.leaderboardId || task.validationTier !== "local_preview") return "leaderboard_sensitive";
  return "safe_local";
}

export function getTaskRewardPreview(task: TaskDefinitionV2, input?: { progress?: number; status?: TaskRewardPreview["status"] }): TaskRewardPreview {
  const policy = getTaskRewardPolicy(getTaskRewardPolicyId(task));
  const source = getRewardSourceDefinition(task.rewardSourceId);
  const transaction = createEconomyTransactionPreview(
    {
      sourceId: task.rewardSourceId,
      rewards: task.rewards,
      notes: `${task.shortTitle}: task reward preview only.`,
      requiresBackendValidation: policy.backendValidationRequired || task.validationTier !== "local_preview",
    },
    "claim",
  );
  const riskTier = getTaskRewardRiskTier(task);
  const backendValidationRequired =
    policy.backendValidationRequired ||
    transaction.backendValidationRequired ||
    task.validationTier !== "local_preview" ||
    riskTier === "backend_authoritative";

  return {
    taskId: task.id,
    title: task.title,
    cadence: task.cadence,
    category: task.category,
    metric: task.metric,
    target: task.target,
    progress: Math.max(0, Math.floor(input?.progress ?? 0)),
    status: input?.status ?? "active",
    taskPoints: task.taskPoints,
    rewardSourceId: task.rewardSourceId,
    validationTier: task.validationTier,
    economyValidationTier: transaction.validationTier,
    policyId: policy.id,
    riskTier,
    rewards: transaction.normalizedRewards,
    walletDelta: transaction.walletDelta,
    backendValidationRequired,
    claimEnabled: false,
    leaderboardSubmissionEnabled: false,
    rewardNotes: [
      policy.description,
      source.description,
      backendValidationRequired
        ? "Backend validation is required before this reward can affect wallet, leaderboard or tournament state."
        : "Local preview is allowed, but claim flow is intentionally disabled in this patch.",
    ],
  };
}

export function getTaskRewardPreviewsForCatalog(tasks: readonly TaskDefinitionV2[] = TASK_SKELETON_DEFINITIONS): TaskRewardPreview[] {
  return tasks.map((task) => getTaskRewardPreview(task));
}

export function getTaskRewardPreviewForProfile(profile: PlayerProfile, task: TaskDefinitionV2): TaskRewardPreview {
  const state = getTaskProgressState(profile, task);
  return getTaskRewardPreview(task, {
    progress: state.progress,
    status: state.status,
  });
}

export function getTaskRewardPreviewsForProfile(profile: PlayerProfile): TaskRewardPreview[] {
  const states = getTaskStatesForProfile(profile);
  return states
    .map((state) => {
      const task = TASK_SKELETON_DEFINITIONS.find((candidate) => candidate.id === state.taskId);
      if (!task) return undefined;
      return getTaskRewardPreview(task, {
        progress: state.progress,
        status: state.status,
      });
    })
    .filter((preview): preview is TaskRewardPreview => Boolean(preview));
}

export function getTaskRewardCatalogSummary(tasks: readonly TaskDefinitionV2[] = TASK_SKELETON_DEFINITIONS): TaskRewardCatalogSummary {
  const previews = getTaskRewardPreviewsForCatalog(tasks);
  let localPreviewWallet = emptyRewardWallet();
  let backendLockedWallet = emptyRewardWallet();

  for (const preview of previews) {
    if (preview.backendValidationRequired) backendLockedWallet = addRewardsToWallet(backendLockedWallet, preview.rewards);
    else localPreviewWallet = addRewardsToWallet(localPreviewWallet, preview.rewards);
  }

  return {
    version: TASK_REWARD_SYSTEM_VERSION,
    totalTaskCount: previews.length,
    dailyTaskCount: previews.filter((preview) => preview.cadence === "daily").length,
    weeklyTaskCount: previews.filter((preview) => preview.cadence === "weekly").length,
    backendLockedTaskCount: previews.filter((preview) => preview.backendValidationRequired).length,
    totalTaskPointsAvailable: previews.reduce((total, preview) => total + preview.taskPoints, 0),
    localPreviewWallet,
    backendLockedWallet,
    claimEnabled: false,
    leaderboardSubmissionEnabled: false,
  };
}

export function getTaskRewardProfileSummary(profile: PlayerProfile): TaskRewardProfileSummary {
  const previews = getTaskRewardPreviewsForProfile(profile);
  const completedPreviews = previews.filter((preview) => preview.status === "completed" || preview.status === "claimed");
  let completedRewardWalletPreview = emptyRewardWallet();
  let backendLockedRewardWalletPreview = emptyRewardWallet();

  for (const preview of completedPreviews) {
    completedRewardWalletPreview = addRewardsToWallet(completedRewardWalletPreview, preview.rewards);
    if (preview.backendValidationRequired) backendLockedRewardWalletPreview = addRewardsToWallet(backendLockedRewardWalletPreview, preview.rewards);
  }

  return {
    activeTaskCount: previews.filter((preview) => preview.status === "active").length,
    completedTaskCount: previews.filter((preview) => preview.status === "completed").length,
    claimedTaskCount: previews.filter((preview) => preview.status === "claimed").length,
    claimablePreviewCount: previews.filter((preview) => preview.status === "completed" && !preview.backendValidationRequired).length,
    backendLockedPreviewCount: previews.filter((preview) => preview.backendValidationRequired).length,
    completedTaskPointsPreview: completedPreviews.reduce((total, preview) => total + preview.taskPoints, 0),
    completedRewardWalletPreview,
    backendLockedRewardWalletPreview,
  };
}

export function formatTaskRewardWallet(wallet: CurrencyWalletV2): string[] {
  return CURRENCY_IDS.map((currencyId) => ({ currencyId, amount: wallet[currencyId] }))
    .filter((entry) => entry.amount > 0)
    .map((entry) => `${entry.currencyId}:${entry.amount}`);
}
