import {
  DUEL_DEFINITIONS,
  LEAK_DUEL_DEFINITION,
  getBackendLockedDuels,
  getDuelReadiness,
  getLocalContractDuels,
  type DuelContractPreview,
  type DuelModeId,
  type DuelRegistrySummary,
  type DuelSystemDefinition,
} from "../types/DuelTypes";
import { createDefaultDuelSeedSnapshot } from "./DuelSeedSystem";
import { calculateDuelScoreSnapshot } from "./DuelScoreSystem";

export const DUEL_SYSTEM_VERSION = "0.11.5-duel-score-formula";

const REQUIRED_BEFORE_LIVE_DUELS = [
  "Duel seed system with deterministic stage, boss, modifiers and time box",
  "Capped duel score formula for same-seed score comparison",
  "Duel result payload connected to Arena result stats",
  "Leaderboard adapter submit implementation for duel_ranked",
  "Backend identity and opponent matching",
  "Anti-cheat validation for seed, duration, score, HP, damage and impossible inputs",
  "Reward reconciliation before Rank Points, Leak Points or tournament-related rewards become real",
] as const;

export const DUEL_SYSTEM_DEFINITION: DuelSystemDefinition = {
  version: DUEL_SYSTEM_VERSION,
  goal: "Define 1v1 Leak Duel contracts, deterministic equal-condition seeds and capped score formula before duel UI, result submit or real matchmaking are enabled.",
  duelIds: DUEL_DEFINITIONS.map((duel) => duel.id),
  localContractDuelIds: getLocalContractDuels().map((duel) => duel.id),
  backendLockedDuelIds: getBackendLockedDuels().map((duel) => duel.id),
  requiredBeforeLiveDuels: REQUIRED_BEFORE_LIVE_DUELS,
  rules: [
    "Leak Duel launches asynchronous first: both players fight the same leak-pressure seed and score is compared after both runs finish.",
    "Duel scoring is capped by seed duration and anti-abuse stat ceilings before leaderboard submission exists.",
    "Live real-time 1v1 stays locked until backend authority, reconnect and anti-cheat exist.",
    "Rank Points, Leak Points and win rewards remain backend-sensitive and cannot be publicly claimed from local preview data.",
    "Competitive duels must not include paid advantage; score comes from discipline, survival, guard timing, leak control and clean damage.",
  ],
};

export function getDuelRegistrySummary(): DuelRegistrySummary {
  const backendLockedDuelIds = getBackendLockedDuels().map((duel) => duel.id);

  return {
    version: DUEL_SYSTEM_VERSION,
    duelCount: DUEL_DEFINITIONS.length,
    localContractCount: getLocalContractDuels().length,
    backendLockedCount: backendLockedDuelIds.length,
    duelIds: DUEL_DEFINITIONS.map((duel) => duel.id),
    backendLockedDuelIds,
  };
}

export function getDuelReadinessMap(): Record<DuelModeId, ReturnType<typeof getDuelReadiness>> {
  return DUEL_DEFINITIONS.reduce<Record<DuelModeId, ReturnType<typeof getDuelReadiness>>>((readinessMap, duel) => {
    readinessMap[duel.id] = getDuelReadiness(duel.id);
    return readinessMap;
  }, {} as Record<DuelModeId, ReturnType<typeof getDuelReadiness>>);
}

export function createDuelContractPreview(duelId: DuelModeId = LEAK_DUEL_DEFINITION.id): DuelContractPreview {
  const duel = DUEL_DEFINITIONS.find((candidate) => candidate.id === duelId) ?? LEAK_DUEL_DEFINITION;
  const readiness = getDuelReadiness(duel.id);
  const seedSnapshot = createDefaultDuelSeedSnapshot();
  const scorePreview = calculateDuelScoreSnapshot({
    participantSlot: "player_a",
    displayName: "YOU",
    seed: duel.id === "leak_duel_async" ? seedSnapshot.seed : duel.defaultSeed,
    weights: duel.scoreWeights,
    rawScore: {
      damageDealt: 420,
      leaksDefeated: 8,
      survivedSeconds: 118,
      hpRemaining: 54,
      guards: 5,
      skillsUsed: 6,
      damageTaken: 32,
      participated: true,
    },
  }).score;

  return {
    duelId: duel.id,
    title: duel.title,
    matchType: duel.matchType,
    leaderboardId: duel.leaderboardId,
    periodKey: duel.eventWindow.periodKey,
    seed: duel.id === "leak_duel_async" ? seedSnapshot.seed : duel.defaultSeed,
    scorePreview,
    readiness,
    rewardPreview: {
      participationRewards: duel.participationRewards,
      winRewards: duel.winRewards,
      backendValidationRequired: true,
      claimEnabled: false,
    },
    summaryRows: [
      `${duel.shortTitle}: ${duel.description}`,
      `Seed: ${(duel.id === "leak_duel_async" ? seedSnapshot.seed : duel.defaultSeed).seedKey}`,
      `Leaderboard: ${duel.leaderboardId}`,
      `Public submit: ${readiness.publicSubmitEnabled ? "enabled" : "locked"}`,
      `Rewards: backend validation required`,
    ],
  };
}

export function createDuelContractPreviewMap(): Record<DuelModeId, DuelContractPreview> {
  return DUEL_DEFINITIONS.reduce<Record<DuelModeId, DuelContractPreview>>((previewMap, duel) => {
    previewMap[duel.id] = createDuelContractPreview(duel.id);
    return previewMap;
  }, {} as Record<DuelModeId, DuelContractPreview>);
}
