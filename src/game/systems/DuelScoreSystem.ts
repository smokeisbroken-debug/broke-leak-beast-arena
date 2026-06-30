import {
  DEFAULT_LEAK_DUEL_SEED,
  DUEL_MODIFIER_LABELS,
  DUEL_SCORE_WEIGHTS,
  calculateDuelScore,
  getDuelOutcome,
  type DuelScoreBreakdownRow,
  type DuelScoreInput,
  type DuelSeedDefinition,
} from "../types/DuelTypes";
import type {
  DuelModifierScoreNote,
  DuelScoreCaps,
  DuelScoreFormulaInput,
  DuelScoreFormulaSnapshot,
  DuelScoreQualityBand,
  DuelScoreSystemDefinition,
  DuelScoreValidationFlag,
  DuelScoreValidationFlagId,
  DuelScoreVersusPreview,
} from "../types/DuelScoreTypes";
import { createDefaultDuelSeedSnapshot } from "./DuelSeedSystem";

export const DUEL_SCORE_SYSTEM_VERSION = "0.11.5-duel-score-formula";

export const DUEL_SCORE_CAPS: DuelScoreCaps = {
  damageDealt: 2500,
  leaksDefeated: 80,
  hpRemaining: 100,
  guards: 30,
  skillsUsed: 24,
  damageTaken: 500,
};

export const DUEL_SCORE_MODIFIER_NOTES: readonly DuelModifierScoreNote[] = [
  {
    modifierId: "fomo_storm",
    label: DUEL_MODIFIER_LABELS.fomo_storm,
    scoringFocus: "Reward leak control and survival under fast pressure.",
  },
  {
    modifierId: "debt_pressure",
    label: DUEL_MODIFIER_LABELS.debt_pressure,
    scoringFocus: "Avoid damage taken; reckless trades lose score quickly.",
  },
  {
    modifierId: "subscription_swarm",
    label: DUEL_MODIFIER_LABELS.subscription_swarm,
    scoringFocus: "Leaks defeated matters, but seed duration and damage caps prevent farming abuse.",
  },
  {
    modifierId: "rug_pull_traps",
    label: DUEL_MODIFIER_LABELS.rug_pull_traps,
    scoringFocus: "Clean movement and low damage taken separate close duels.",
  },
  {
    modifierId: "cold_wallet",
    label: DUEL_MODIFIER_LABELS.cold_wallet,
    scoringFocus: "Guard skill is rewarded without becoming the only win condition.",
  },
  {
    modifierId: "no_spend_duel",
    label: DUEL_MODIFIER_LABELS.no_spend_duel,
    scoringFocus: "Healing and paid advantage stay irrelevant; score comes from execution.",
  },
] as const;

export const DUEL_SCORE_SYSTEM_DEFINITION: DuelScoreSystemDefinition = {
  version: DUEL_SCORE_SYSTEM_VERSION,
  goal: "Define capped Leak Duel score snapshots for same-seed 1v1 comparison before Duel Scene, matchmaking, rewards or remote leaderboard submit are enabled.",
  caps: DUEL_SCORE_CAPS,
  publicSubmitEnabled: false,
  backendValidationRequired: true,
  qualityBands: ["leaked_out", "survived", "clean_run", "dominant_control"],
  modifierNotes: DUEL_SCORE_MODIFIER_NOTES,
  backendLocks: [
    "Ranked duel scores must include the exact seed snapshot used by both players.",
    "Survival seconds are capped by seed duration before score calculation.",
    "Damage, leaks, guard, skill and HP values are capped before comparison to reduce impossible local scores.",
    "Duel score previews do not grant Rank Points, Leak Points, XP or tournament rewards until backend validation exists.",
  ],
};

function normalizeBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeRawScoreInput(input: DuelScoreInput): Required<DuelScoreInput> {
  return {
    damageDealt: Math.max(0, Math.floor(input.damageDealt || 0)),
    leaksDefeated: Math.max(0, Math.floor(input.leaksDefeated || 0)),
    survivedSeconds: Math.max(0, Math.floor(input.survivedSeconds || 0)),
    hpRemaining: Math.max(0, Math.floor(input.hpRemaining || 0)),
    guards: Math.max(0, Math.floor(input.guards || 0)),
    skillsUsed: Math.max(0, Math.floor(input.skillsUsed || 0)),
    damageTaken: Math.max(0, Math.floor(input.damageTaken || 0)),
    participated: normalizeBoolean(input.participated, true),
  };
}

function capValue(value: number, cap: number): number {
  return Math.min(Math.max(0, Math.floor(value || 0)), cap);
}

function createValidationFlag(id: DuelScoreValidationFlagId, label: string, severity: DuelScoreValidationFlag["severity"]): DuelScoreValidationFlag {
  return { id, label, severity };
}

function getCapFlags(rawScore: Required<DuelScoreInput>, normalizedScore: Required<DuelScoreInput>, seed: DuelSeedDefinition): DuelScoreValidationFlag[] {
  const flags: DuelScoreValidationFlag[] = [
    createValidationFlag("backend_validation_required", "Backend validation required before ranked submit.", "backend_blocker"),
    createValidationFlag("score_not_reward_claimable", "Local preview score cannot claim duel rewards.", "backend_blocker"),
  ];

  if (rawScore.survivedSeconds > seed.durationSeconds) {
    flags.push(createValidationFlag("seed_duration_cap_applied", "Survival seconds were capped by seed duration.", "warning"));
  }
  if (rawScore.hpRemaining > normalizedScore.hpRemaining) {
    flags.push(createValidationFlag("hp_cap_applied", "HP remaining cap was applied.", "warning"));
  }
  if (rawScore.damageDealt > normalizedScore.damageDealt) {
    flags.push(createValidationFlag("damage_cap_applied", "Damage dealt cap was applied.", "warning"));
  }
  if (rawScore.leaksDefeated > normalizedScore.leaksDefeated) {
    flags.push(createValidationFlag("leak_cap_applied", "Leaks defeated cap was applied.", "warning"));
  }
  if (rawScore.guards > normalizedScore.guards) {
    flags.push(createValidationFlag("guard_cap_applied", "Guard count cap was applied.", "warning"));
  }
  if (rawScore.skillsUsed > normalizedScore.skillsUsed) {
    flags.push(createValidationFlag("skill_cap_applied", "Skill use cap was applied.", "warning"));
  }
  if (rawScore.damageTaken > normalizedScore.damageTaken) {
    flags.push(createValidationFlag("damage_taken_cap_applied", "Damage taken cap was applied.", "info"));
  }
  if (!normalizedScore.participated) {
    flags.push(createValidationFlag("participation_missing", "Participant did not complete a valid run.", "backend_blocker"));
  }

  return flags;
}

export function normalizeDuelScoreForSeed(input: DuelScoreInput, seed: DuelSeedDefinition, caps: DuelScoreCaps = DUEL_SCORE_CAPS): Required<DuelScoreInput> {
  const rawScore = normalizeRawScoreInput(input);

  return {
    damageDealt: capValue(rawScore.damageDealt, caps.damageDealt),
    leaksDefeated: capValue(rawScore.leaksDefeated, caps.leaksDefeated),
    survivedSeconds: capValue(rawScore.survivedSeconds, seed.durationSeconds),
    hpRemaining: capValue(rawScore.hpRemaining, caps.hpRemaining),
    guards: capValue(rawScore.guards, caps.guards),
    skillsUsed: capValue(rawScore.skillsUsed, caps.skillsUsed),
    damageTaken: capValue(rawScore.damageTaken, caps.damageTaken),
    participated: rawScore.participated,
  };
}

export function getDuelScoreQualityBand(score: number): DuelScoreQualityBand {
  if (score >= 1800) {
    return "dominant_control";
  }
  if (score >= 1200) {
    return "clean_run";
  }
  if (score >= 500) {
    return "survived";
  }
  return "leaked_out";
}

function getCappedRows(scoreRows: DuelScoreBreakdownRow[], flags: DuelScoreValidationFlag[]): DuelScoreBreakdownRow[] {
  const cappedIds = new Set(
    flags
      .filter((flag) => flag.id.endsWith("_cap_applied") || flag.id === "seed_duration_cap_applied")
      .map((flag) => flag.id),
  );

  return scoreRows.filter((row) => {
    if (row.componentId === "survival_time") return cappedIds.has("seed_duration_cap_applied");
    if (row.componentId === "hp_remaining") return cappedIds.has("hp_cap_applied");
    if (row.componentId === "damage_dealt") return cappedIds.has("damage_cap_applied");
    if (row.componentId === "leaks_defeated") return cappedIds.has("leak_cap_applied");
    if (row.componentId === "guard_skill") return cappedIds.has("guard_cap_applied");
    if (row.componentId === "skills_used") return cappedIds.has("skill_cap_applied");
    if (row.componentId === "damage_taken_penalty") return cappedIds.has("damage_taken_cap_applied");
    return false;
  });
}

export function calculateDuelScoreSnapshot(input: DuelScoreFormulaInput): DuelScoreFormulaSnapshot {
  const seed = input.seed || DEFAULT_LEAK_DUEL_SEED;
  const rawScore = normalizeRawScoreInput(input.rawScore);
  const normalizedScore = normalizeDuelScoreForSeed(rawScore, seed);
  const score = calculateDuelScore(normalizedScore, input.weights || DUEL_SCORE_WEIGHTS);
  const validationFlags = getCapFlags(rawScore, normalizedScore, seed);
  const qualityBand = getDuelScoreQualityBand(score.totalScore);
  const cappedRows = getCappedRows(score.breakdown, validationFlags);

  return {
    version: DUEL_SCORE_SYSTEM_VERSION,
    participantSlot: input.participantSlot,
    displayName: input.displayName,
    seed,
    rawScore,
    normalizedScore,
    score,
    cappedRows,
    qualityBand,
    validationFlags,
    backendValidationRequired: true,
    publicSubmitEnabled: false,
    claimEnabled: false,
    rows: [
      `${input.displayName}: ${score.totalScore} pts`,
      `Quality: ${qualityBand.replace(/_/g, " ")}`,
      `Seed duration cap: ${seed.durationSeconds}s`,
      `Validation: backend required`,
      `Rewards: locked`,
    ],
  };
}

export function createSampleDuelScoreSnapshot(participantSlot: "player_a" | "player_b" = "player_a"): DuelScoreFormulaSnapshot {
  const seed = createDefaultDuelSeedSnapshot().seed;
  const isPlayerA = participantSlot === "player_a";

  return calculateDuelScoreSnapshot({
    participantSlot,
    displayName: isPlayerA ? "YOU" : "RIVAL",
    seed,
    rawScore: isPlayerA
      ? {
          damageDealt: 620,
          leaksDefeated: 11,
          survivedSeconds: 118,
          hpRemaining: 64,
          guards: 6,
          skillsUsed: 7,
          damageTaken: 28,
          participated: true,
        }
      : {
          damageDealt: 540,
          leaksDefeated: 9,
          survivedSeconds: 115,
          hpRemaining: 52,
          guards: 4,
          skillsUsed: 8,
          damageTaken: 44,
          participated: true,
        },
  });
}

export function createSampleDuelVersusPreview(seed: DuelSeedDefinition = createDefaultDuelSeedSnapshot().seed): DuelScoreVersusPreview {
  const playerA = calculateDuelScoreSnapshot({
    participantSlot: "player_a",
    displayName: "YOU",
    seed,
    rawScore: {
      damageDealt: 620,
      leaksDefeated: 11,
      survivedSeconds: seed.durationSeconds - 2,
      hpRemaining: 64,
      guards: 6,
      skillsUsed: 7,
      damageTaken: 28,
      participated: true,
    },
  });
  const playerB = calculateDuelScoreSnapshot({
    participantSlot: "player_b",
    displayName: "RIVAL",
    seed,
    rawScore: {
      damageDealt: 540,
      leaksDefeated: 9,
      survivedSeconds: seed.durationSeconds - 5,
      hpRemaining: 52,
      guards: 4,
      skillsUsed: 8,
      damageTaken: 44,
      participated: true,
    },
  });
  const outcome = getDuelOutcome(playerA.score, playerB.score);
  const scoreMargin = Math.abs(playerA.score.totalScore - playerB.score.totalScore);
  const winnerLabel = outcome === "player_a_win" ? playerA.displayName : outcome === "player_b_win" ? playerB.displayName : "DRAW";

  return {
    version: DUEL_SCORE_SYSTEM_VERSION,
    seed,
    playerA,
    playerB,
    outcome,
    winnerLabel,
    scoreMargin,
    backendValidationRequired: true,
    publicSubmitEnabled: false,
    rows: [
      `${playerA.displayName}: ${playerA.score.totalScore} pts`,
      `${playerB.displayName}: ${playerB.score.totalScore} pts`,
      `Outcome preview: ${winnerLabel}`,
      `Margin: ${scoreMargin} pts`,
      `Ranked submit: locked until backend validation`,
    ],
  };
}
