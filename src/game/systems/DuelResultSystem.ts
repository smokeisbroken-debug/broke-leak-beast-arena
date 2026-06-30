import {
  DUEL_DEFINITIONS,
  getDuelDefinition,
  type DuelModeId,
  type DuelOutcome,
} from "../types/DuelTypes";
import type {
  DuelResultLock,
  DuelResultLockId,
  DuelResultPreview,
  DuelResultSystemDefinition,
  DuelResultTone,
} from "../types/DuelResultTypes";
import type { DuelScoreVersusPreview } from "../types/DuelScoreTypes";
import { createDuelContractPreview } from "./DuelSystem";
import { createSampleDuelVersusPreview } from "./DuelScoreSystem";

export const DUEL_RESULT_SYSTEM_VERSION = "0.11.7-duel-result-screen";

const DUEL_RESULT_LOCK_IDS: readonly DuelResultLockId[] = [
  "backend_validation_required",
  "leaderboard_submit_locked",
  "reward_claim_locked",
  "anti_cheat_required",
];

export const DUEL_RESULT_SYSTEM_DEFINITION: DuelResultSystemDefinition = {
  version: DUEL_RESULT_SYSTEM_VERSION,
  goal: "Display a safe Leak Duel result preview after the 1v1 skeleton without submitting ranked scores, claiming rewards or requiring backend matchmaking.",
  source: "local_preview",
  publicSubmitEnabled: false,
  claimEnabled: false,
  backendValidationRequired: true,
  locks: DUEL_RESULT_LOCK_IDS,
};

function createLock(id: DuelResultLockId, label: string, severity: DuelResultLock["severity"]): DuelResultLock {
  return { id, label, severity };
}

function getDuelResultTone(outcome: DuelOutcome): DuelResultTone {
  if (outcome === "player_a_win") return "win";
  if (outcome === "player_b_win") return "loss";
  if (outcome === "draw") return "draw";
  return "locked";
}

function getDuelOutcomeLabel(outcome: DuelOutcome): string {
  if (outcome === "player_a_win") return "YOU WIN THE LEAK DUEL";
  if (outcome === "player_b_win") return "RIVAL WINS THE LEAK DUEL";
  if (outcome === "draw") return "DUEL DRAW";
  if (outcome === "expired") return "DUEL EXPIRED";
  return "DUEL PENDING";
}

function getDuelResultLocks(duelId: DuelModeId): DuelResultLock[] {
  const definition = getDuelDefinition(duelId);
  const locks: DuelResultLock[] = [
    createLock("backend_validation_required", "Backend validation required before ranked duel submit.", "backend_blocker"),
    createLock("leaderboard_submit_locked", "Duel ranked leaderboard submit is still locked.", "backend_blocker"),
    createLock("reward_claim_locked", "Rank Points and Leak Points cannot be claimed from local preview.", "backend_blocker"),
    createLock("anti_cheat_required", "Anti-cheat payload must verify seed, score, time, HP and damage.", "backend_blocker"),
  ];

  if (definition.backendStatus === "remote_required") {
    locks.push(createLock("remote_opponent_required", "Remote opponent and backend seed are required for this duel mode.", "warning"));
  }

  return locks;
}

function formatRewards(rewards: readonly { currencyId: string; amount: number }[]): string {
  if (rewards.length === 0) return "NONE";
  return rewards.map((reward) => `${reward.amount} ${reward.currencyId.replace(/_/g, " ").toUpperCase()}`).join(" · ");
}

export function createDuelResultPreview(duelId: DuelModeId = DUEL_DEFINITIONS[0].id, versus?: DuelScoreVersusPreview): DuelResultPreview {
  const definition = getDuelDefinition(duelId);
  const contract = createDuelContractPreview(duelId);
  const versusPreview = versus ?? createSampleDuelVersusPreview(contract.seed);
  const tone = getDuelResultTone(versusPreview.outcome);
  const visibleRewards = tone === "win"
    ? [...definition.participationRewards, ...definition.winRewards]
    : definition.participationRewards;
  const locks = getDuelResultLocks(duelId);
  const outcomeLabel = getDuelOutcomeLabel(versusPreview.outcome);

  return {
    version: DUEL_RESULT_SYSTEM_VERSION,
    duelId,
    title: definition.title,
    source: "local_preview",
    seed: versusPreview.seed,
    versus: versusPreview,
    localPlayer: versusPreview.playerA,
    opponent: versusPreview.playerB,
    outcome: versusPreview.outcome,
    outcomeLabel,
    tone,
    scoreMargin: versusPreview.scoreMargin,
    leaderboardSubmissionStatus: "blocked_backend_required",
    rewardPreview: {
      participationRewards: definition.participationRewards,
      winRewards: definition.winRewards,
      visibleRewards,
      claimEnabled: false,
      backendValidationRequired: true,
    },
    locks,
    nextSteps: [
      "Connect Duel Result to real Arena run payload later.",
      "Keep Rank Points, Leak Points and leaderboard submit locked until backend validation.",
      "Use the same seed snapshot for both players before judging the winner.",
    ],
    rows: [
      `${outcomeLabel}`,
      `You: ${versusPreview.playerA.score.totalScore} pts`,
      `Rival: ${versusPreview.playerB.score.totalScore} pts`,
      `Margin: ${versusPreview.scoreMargin} pts`,
      `Rewards preview: ${formatRewards(visibleRewards)}`,
      `Submit: locked until backend validation`,
    ],
    shareLines: [
      `${outcomeLabel} in $BROKE Leak Duel`,
      `Score: ${versusPreview.playerA.score.totalScore} vs ${versusPreview.playerB.score.totalScore}`,
      `Margin: ${versusPreview.scoreMargin} pts`,
      `Seed: ${versusPreview.seed.seedKey}`,
      `Stage: ${versusPreview.seed.stageId}`,
      `Ranked submit: backend locked`,
      "$BROKE",
    ],
  };
}

export function createDuelResultPreviewMap(): Record<DuelModeId, DuelResultPreview> {
  return DUEL_DEFINITIONS.reduce<Record<DuelModeId, DuelResultPreview>>((map, duel) => {
    map[duel.id] = createDuelResultPreview(duel.id);
    return map;
  }, {} as Record<DuelModeId, DuelResultPreview>);
}

export function getDuelResultSummary(): { version: string; duelCount: number; publicSubmitEnabled: boolean; claimEnabled: boolean; backendValidationRequired: boolean } {
  return {
    version: DUEL_RESULT_SYSTEM_VERSION,
    duelCount: DUEL_DEFINITIONS.length,
    publicSubmitEnabled: DUEL_RESULT_SYSTEM_DEFINITION.publicSubmitEnabled,
    claimEnabled: DUEL_RESULT_SYSTEM_DEFINITION.claimEnabled,
    backendValidationRequired: DUEL_RESULT_SYSTEM_DEFINITION.backendValidationRequired,
  };
}
