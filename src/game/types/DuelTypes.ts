import type { LeaderboardId } from "./LeaderboardTypes";
import type { RewardAmount } from "./ProgressionTypes";

export type DuelModeId = "leak_duel_async" | "leak_duel_live_future";
export type DuelModifierId = "fomo_storm" | "debt_pressure" | "subscription_swarm" | "rug_pull_traps" | "cold_wallet" | "no_spend_duel";
export type DuelStatus = "created" | "player_a_complete" | "player_b_complete" | "complete" | "expired";

export interface DuelSeedDefinition {
  seedId: string;
  stageId: string;
  bossId?: string;
  durationSeconds: number;
  modifiers: DuelModifierId[];
}

export interface DuelDefinition {
  id: DuelModeId;
  title: string;
  leaderboardId: LeaderboardId;
  asyncFirst: boolean;
  description: string;
  participationRewards: RewardAmount[];
  winRewards: RewardAmount[];
}

export interface DuelScoreInput {
  damageDealt: number;
  leaksDefeated: number;
  survivedSeconds: number;
  hpRemaining: number;
  guards: number;
  skillsUsed: number;
  damageTaken: number;
}

export interface DuelScoreBreakdown extends DuelScoreInput {
  totalScore: number;
}

export interface DuelMatchState {
  duelId: string;
  modeId: DuelModeId;
  status: DuelStatus;
  seed: DuelSeedDefinition;
  playerAId: string;
  playerBId?: string;
  playerAScore?: DuelScoreBreakdown;
  playerBScore?: DuelScoreBreakdown;
  winnerPlayerId?: string;
  createdAtIso: string;
  expiresAtIso: string;
}

export const LEAK_DUEL_DEFINITION: DuelDefinition = {
  id: "leak_duel_async",
  title: "Leak Duel",
  leaderboardId: "duel_ranked",
  asyncFirst: true,
  description: "Two players fight the same leak-pressure seed. The cleaner anti-leak run wins.",
  participationRewards: [
    { currencyId: "xp", amount: 25 },
    { currencyId: "leak_points", amount: 3 },
  ],
  winRewards: [
    { currencyId: "rank_points", amount: 15 },
    { currencyId: "leak_points", amount: 5 },
  ],
};

export const DUEL_MODIFIER_LABELS: Record<DuelModifierId, string> = {
  fomo_storm: "FOMO Storm",
  debt_pressure: "Debt Pressure",
  subscription_swarm: "Subscription Swarm",
  rug_pull_traps: "Rug Pull Traps",
  cold_wallet: "Cold Wallet",
  no_spend_duel: "No-Spend Duel",
};

export function calculateDuelScore(input: DuelScoreInput): DuelScoreBreakdown {
  const safeInput: DuelScoreInput = {
    damageDealt: Math.max(0, Math.floor(input.damageDealt || 0)),
    leaksDefeated: Math.max(0, Math.floor(input.leaksDefeated || 0)),
    survivedSeconds: Math.max(0, Math.floor(input.survivedSeconds || 0)),
    hpRemaining: Math.max(0, Math.floor(input.hpRemaining || 0)),
    guards: Math.max(0, Math.floor(input.guards || 0)),
    skillsUsed: Math.max(0, Math.floor(input.skillsUsed || 0)),
    damageTaken: Math.max(0, Math.floor(input.damageTaken || 0)),
  };

  const totalScore = Math.max(
    0,
    Math.floor(
      safeInput.damageDealt * 0.5 +
        safeInput.leaksDefeated * 20 +
        safeInput.survivedSeconds * 2 +
        safeInput.hpRemaining * 6 +
        safeInput.guards * 12 +
        safeInput.skillsUsed * 4 -
        safeInput.damageTaken * 3,
    ),
  );

  return {
    ...safeInput,
    totalScore,
  };
}
