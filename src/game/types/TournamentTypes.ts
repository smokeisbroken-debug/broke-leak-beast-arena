import type { LeaderboardId } from "./LeaderboardTypes";
import type { RewardAmount } from "./ProgressionTypes";

export type TournamentId = "no_spend_arena_preview" | "anti_fomo_cup" | "wallet_shield_week" | "boss_damage_race";
export type TournamentStatus = "draft" | "scheduled" | "active" | "complete";
export type TournamentRuleId = "fixed_seed" | "no_heal_skill" | "guard_bonus" | "boss_damage_bonus" | "limited_loadout";

export interface TournamentScoreWeights {
  score: number;
  leaksDefeated: number;
  bossDamage: number;
  survivedSeconds: number;
  hpRemaining: number;
  guards: number;
  damageTakenPenalty: number;
  participation: number;
}

export interface TournamentDefinition {
  id: TournamentId;
  title: string;
  theme: string;
  status: TournamentStatus;
  leaderboardId: LeaderboardId;
  rules: TournamentRuleId[];
  scoreWeights: TournamentScoreWeights;
  participationRewards: RewardAmount[];
  notes: string;
}

export interface TournamentRunResult {
  tournamentId: TournamentId;
  playerId: string;
  runId: string;
  points: number;
  participationPoints: number;
  submittedAtIso: string;
  validationStatus: "local" | "pending_remote" | "accepted" | "rejected";
}

export const DEFAULT_TOURNAMENT_SCORE_WEIGHTS: TournamentScoreWeights = {
  score: 1,
  leaksDefeated: 12,
  bossDamage: 0.4,
  survivedSeconds: 2,
  hpRemaining: 8,
  guards: 15,
  damageTakenPenalty: 3,
  participation: 100,
};

export const TOURNAMENT_DEFINITIONS: readonly TournamentDefinition[] = [
  {
    id: "no_spend_arena_preview",
    title: "No-Spend Arena Preview",
    theme: "Win under pressure without wasting wallet energy.",
    status: "draft",
    leaderboardId: "tournament",
    rules: ["fixed_seed"],
    scoreWeights: DEFAULT_TOURNAMENT_SCORE_WEIGHTS,
    participationRewards: [
      { currencyId: "xp", amount: 35 },
      { currencyId: "leak_points", amount: 5 },
      { currencyId: "tournament_points", amount: 100 },
    ],
    notes: "First skeleton tournament for participation and leaderboard wiring.",
  },
  {
    id: "anti_fomo_cup",
    title: "Anti-FOMO Cup",
    theme: "Defeat fast FOMO enemies and punish panic spending.",
    status: "draft",
    leaderboardId: "tournament",
    rules: ["fixed_seed", "limited_loadout"],
    scoreWeights: DEFAULT_TOURNAMENT_SCORE_WEIGHTS,
    participationRewards: [
      { currencyId: "xp", amount: 40 },
      { currencyId: "tournament_points", amount: 100 },
    ],
    notes: "Designed for short seasonal cups after leaderboard adapter exists.",
  },
  {
    id: "wallet_shield_week",
    title: "Wallet Shield Week",
    theme: "Earn extra points for guard timing and defensive discipline.",
    status: "draft",
    leaderboardId: "tournament",
    rules: ["fixed_seed", "guard_bonus"],
    scoreWeights: { ...DEFAULT_TOURNAMENT_SCORE_WEIGHTS, guards: 30 },
    participationRewards: [
      { currencyId: "xp", amount: 30 },
      { currencyId: "coins", amount: 60 },
      { currencyId: "tournament_points", amount: 100 },
    ],
    notes: "Supports defensive build relevance without raising raw damage caps.",
  },
  {
    id: "boss_damage_race",
    title: "Boss Damage Race",
    theme: "Race the community on verified damage against the weekly leak boss.",
    status: "draft",
    leaderboardId: "boss_damage",
    rules: ["fixed_seed", "boss_damage_bonus"],
    scoreWeights: { ...DEFAULT_TOURNAMENT_SCORE_WEIGHTS, bossDamage: 1.2 },
    participationRewards: [
      { currencyId: "leak_points", amount: 8 },
      { currencyId: "tournament_points", amount: 100 },
    ],
    notes: "Remote validation required before real rewards are enabled.",
  },
];

export function getTournamentDefinition(tournamentId: TournamentId): TournamentDefinition {
  const tournament = TOURNAMENT_DEFINITIONS.find((candidate) => candidate.id === tournamentId);
  if (!tournament) {
    throw new Error(`Unknown tournament: ${tournamentId}`);
  }
  return tournament;
}
