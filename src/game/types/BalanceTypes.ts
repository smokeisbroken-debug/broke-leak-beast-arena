import { calculatePowerScore, DEFAULT_POWER_CAPS, type PowerBreakdown, type PowerCaps, type PowerScoreResult } from "./ProgressionTypes";

export type BalanceBandId = "starter" | "early" | "mid" | "late" | "endgame" | "overcap";
export type DifficultySourceId = "stage" | "boss" | "modifiers" | "enemyDensity" | "duration" | "rankedRules";
export type MatchupStatus = "overpowered" | "safe" | "fair" | "hard" | "dangerous";

export interface DifficultyBreakdown {
  stage: number;
  boss: number;
  modifiers: number;
  enemyDensity: number;
  duration: number;
  rankedRules: number;
}

export interface DifficultyCaps {
  stage: number;
  boss: number;
  modifiers: number;
  enemyDensity: number;
  duration: number;
  rankedRules: number;
}

export interface DifficultyScoreResult {
  score: number;
  cappedBreakdown: DifficultyBreakdown;
  caps: DifficultyCaps;
  band: BalanceBandId;
}

export interface BalanceBandDefinition {
  id: BalanceBandId;
  title: string;
  minScore: number;
  maxScore: number;
  targetRunSeconds: [number, number];
  notes: string;
}

export interface MatchupEvaluation {
  playerPower: number;
  difficultyScore: number;
  delta: number;
  status: MatchupStatus;
  recommendedPower: number;
  rankedEligible: boolean;
  rewardMultiplier: number;
  message: string;
}

export interface BalancePreviewInput {
  power: Partial<PowerBreakdown>;
  difficulty: Partial<DifficultyBreakdown>;
  powerCaps?: PowerCaps;
  difficultyCaps?: DifficultyCaps;
}

export interface BalancePreview {
  power: PowerScoreResult;
  difficulty: DifficultyScoreResult;
  matchup: MatchupEvaluation;
}

export interface BalanceSystemDefinition {
  version: string;
  powerCaps: PowerCaps;
  difficultyCaps: DifficultyCaps;
  bands: readonly BalanceBandDefinition[];
  rankedRules: readonly string[];
  notes: readonly string[];
}

export const DEFAULT_DIFFICULTY_CAPS: DifficultyCaps = {
  stage: 120,
  boss: 140,
  modifiers: 70,
  enemyDensity: 70,
  duration: 50,
  rankedRules: 50,
};

export const BALANCE_BANDS: readonly BalanceBandDefinition[] = [
  {
    id: "starter",
    title: "Starter Leak Control",
    minScore: 0,
    maxScore: 60,
    targetRunSeconds: [90, 180],
    notes: "Onboarding runs, readable enemies and low punishment.",
  },
  {
    id: "early",
    title: "Early Arena",
    minScore: 61,
    maxScore: 130,
    targetRunSeconds: [120, 240],
    notes: "First real build choices and basic boss pressure.",
  },
  {
    id: "mid",
    title: "Mid Game",
    minScore: 131,
    maxScore: 230,
    targetRunSeconds: [180, 300],
    notes: "Skill loadout and guard/dash mastery should matter.",
  },
  {
    id: "late",
    title: "Late Game",
    minScore: 231,
    maxScore: 350,
    targetRunSeconds: [240, 360],
    notes: "Boss mechanics, modifiers and mistakes decide the run.",
  },
  {
    id: "endgame",
    title: "Endgame",
    minScore: 351,
    maxScore: 520,
    targetRunSeconds: [300, 420],
    notes: "Seasonal, tournament and prestige content with capped power.",
  },
  {
    id: "overcap",
    title: "Overcap Challenge",
    minScore: 521,
    maxScore: Number.MAX_SAFE_INTEGER,
    targetRunSeconds: [300, 480],
    notes: "Future challenge content. Should scale by rules, not infinite stats.",
  },
];

export const BALANCE_SYSTEM_DEFINITION: BalanceSystemDefinition = {
  version: "0.8.9-balance-formula",
  powerCaps: DEFAULT_POWER_CAPS,
  difficultyCaps: DEFAULT_DIFFICULTY_CAPS,
  bands: BALANCE_BANDS,
  rankedRules: [
    "Ranked scores must compare player power and recommended difficulty before submission.",
    "Leaderboard-sensitive rewards require backend validation before production multiplayer.",
    "Overpowered runs may stay playable but should not grant full ranked value.",
    "Difficulty should grow through mechanics, modifiers and execution checks, not endless HP inflation.",
  ],
  notes: [
    "This patch defines formulas only. It does not change live damage, enemy HP, rewards or scene behavior.",
    "PowerScore is capped by source to prevent infinite character stat growth.",
    "DifficultyScore separates stage, boss, modifiers, enemy density, duration and ranked rules.",
    "Matchup evaluation is backend-ready and can later protect leaderboards, tournaments and 1v1 Leak Duel results.",
  ],
};

function clampScore(value: number, cap: number): number {
  return Math.max(0, Math.min(cap, Math.floor(value || 0)));
}

export function getBalanceBand(score: number): BalanceBandDefinition {
  const safeScore = Math.max(0, Math.floor(score || 0));
  return BALANCE_BANDS.find((band) => safeScore >= band.minScore && safeScore <= band.maxScore) ?? BALANCE_BANDS[0];
}

export function calculateDifficultyScore(
  breakdown: Partial<DifficultyBreakdown>,
  caps: DifficultyCaps = DEFAULT_DIFFICULTY_CAPS,
): DifficultyScoreResult {
  const cappedBreakdown: DifficultyBreakdown = {
    stage: clampScore(breakdown.stage ?? 0, caps.stage),
    boss: clampScore(breakdown.boss ?? 0, caps.boss),
    modifiers: clampScore(breakdown.modifiers ?? 0, caps.modifiers),
    enemyDensity: clampScore(breakdown.enemyDensity ?? 0, caps.enemyDensity),
    duration: clampScore(breakdown.duration ?? 0, caps.duration),
    rankedRules: clampScore(breakdown.rankedRules ?? 0, caps.rankedRules),
  };

  const score = Object.values(cappedBreakdown).reduce((total, value) => total + value, 0);

  return {
    score,
    cappedBreakdown,
    caps,
    band: getBalanceBand(score).id,
  };
}

export function evaluateMatchup(playerPower: number, difficultyScore: number): MatchupEvaluation {
  const safePower = Math.max(0, Math.floor(playerPower || 0));
  const safeDifficulty = Math.max(0, Math.floor(difficultyScore || 0));
  const delta = safePower - safeDifficulty;
  const recommendedPower = Math.max(0, safeDifficulty);

  if (delta >= 80) {
    return {
      playerPower: safePower,
      difficultyScore: safeDifficulty,
      delta,
      status: "overpowered",
      recommendedPower,
      rankedEligible: false,
      rewardMultiplier: 0.65,
      message: "Player power is far above this content. Keep it playable, but reduce ranked value.",
    };
  }

  if (delta >= 30) {
    return {
      playerPower: safePower,
      difficultyScore: safeDifficulty,
      delta,
      status: "safe",
      recommendedPower,
      rankedEligible: true,
      rewardMultiplier: 0.9,
      message: "Player has a safe advantage. Good for farming and progression cleanup.",
    };
  }

  if (delta >= -25) {
    return {
      playerPower: safePower,
      difficultyScore: safeDifficulty,
      delta,
      status: "fair",
      recommendedPower,
      rankedEligible: true,
      rewardMultiplier: 1,
      message: "Fair matchup. This is the target range for campaign, tournaments and duels.",
    };
  }

  if (delta >= -70) {
    return {
      playerPower: safePower,
      difficultyScore: safeDifficulty,
      delta,
      status: "hard",
      recommendedPower,
      rankedEligible: true,
      rewardMultiplier: 1.15,
      message: "Hard matchup. Higher reward is allowed if validation passes.",
    };
  }

  return {
    playerPower: safePower,
    difficultyScore: safeDifficulty,
    delta,
    status: "dangerous",
    recommendedPower,
    rankedEligible: false,
    rewardMultiplier: 1,
    message: "Player is underpowered. Show warning and avoid ranked submission until backend validation exists.",
  };
}

export function createBalancePreview(input: BalancePreviewInput): BalancePreview {
  const power = calculatePowerScore(input.power, input.powerCaps ?? DEFAULT_POWER_CAPS);
  const difficulty = calculateDifficultyScore(input.difficulty, input.difficultyCaps ?? DEFAULT_DIFFICULTY_CAPS);

  return {
    power,
    difficulty,
    matchup: evaluateMatchup(power.score, difficulty.score),
  };
}

export function getRecommendedPowerForDifficulty(difficulty: Partial<DifficultyBreakdown>): number {
  return calculateDifficultyScore(difficulty).score;
}
