export type CurrencyId =
  | "xp"
  | "coins"
  | "leak_points"
  | "rank_points"
  | "tournament_points"
  | "skill_cards"
  | "skin_shards"
  | "cosmetic_tokens";

export type RewardSourceId =
  | "arena_run"
  | "campaign_boss"
  | "daily_task"
  | "weekly_task"
  | "tournament_participation"
  | "tournament_rank"
  | "duel_participation"
  | "duel_win"
  | "weekly_boss_damage";

export interface CurrencyDefinition {
  id: CurrencyId;
  label: string;
  purpose: string;
  multiplayerSensitive: boolean;
  backendValidationRequired: boolean;
}

export interface RewardAmount {
  currencyId: CurrencyId;
  amount: number;
}

export interface RewardBundleV2 {
  sourceId: RewardSourceId;
  rewards: RewardAmount[];
  notes?: string;
}

export type PowerSourceId = "level" | "skills" | "evolution" | "mastery" | "charms";

export interface PowerCaps {
  level: number;
  skills: number;
  evolution: number;
  mastery: number;
  charms: number;
}

export interface PowerBreakdown {
  level: number;
  skills: number;
  evolution: number;
  mastery: number;
  charms: number;
}

export interface PowerScoreResult {
  score: number;
  cappedBreakdown: PowerBreakdown;
  caps: PowerCaps;
}

export const CURRENCY_DEFINITIONS: readonly CurrencyDefinition[] = [
  {
    id: "xp",
    label: "XP",
    purpose: "Mascot level growth and long-term progression.",
    multiplayerSensitive: false,
    backendValidationRequired: false,
  },
  {
    id: "coins",
    label: "Coins",
    purpose: "Upgrade costs, skill growth, charms and non-ranked purchases.",
    multiplayerSensitive: false,
    backendValidationRequired: false,
  },
  {
    id: "leak_points",
    label: "Leak Points",
    purpose: "Core SmokeIsBroke themed progression and anti-leak status.",
    multiplayerSensitive: true,
    backendValidationRequired: true,
  },
  {
    id: "rank_points",
    label: "Rank Points",
    purpose: "Leaderboard and ranked competitive placement.",
    multiplayerSensitive: true,
    backendValidationRequired: true,
  },
  {
    id: "tournament_points",
    label: "Tournament Points",
    purpose: "Time-boxed event scoring, participation and reward brackets.",
    multiplayerSensitive: true,
    backendValidationRequired: true,
  },
  {
    id: "skill_cards",
    label: "Skill Cards",
    purpose: "Skill upgrades without infinite raw power scaling.",
    multiplayerSensitive: false,
    backendValidationRequired: false,
  },
  {
    id: "skin_shards",
    label: "Skin Shards",
    purpose: "Cosmetic and evolution unlock progress.",
    multiplayerSensitive: false,
    backendValidationRequired: false,
  },
  {
    id: "cosmetic_tokens",
    label: "Cosmetic Tokens",
    purpose: "Seasonal skins, titles, banners and visual prestige.",
    multiplayerSensitive: true,
    backendValidationRequired: true,
  },
];

export const DEFAULT_POWER_CAPS: PowerCaps = {
  level: 100,
  skills: 80,
  evolution: 40,
  mastery: 80,
  charms: 50,
};

function clampPower(value: number, cap: number): number {
  return Math.max(0, Math.min(cap, Math.floor(value || 0)));
}

export function calculatePowerScore(breakdown: Partial<PowerBreakdown>, caps: PowerCaps = DEFAULT_POWER_CAPS): PowerScoreResult {
  const cappedBreakdown: PowerBreakdown = {
    level: clampPower(breakdown.level ?? 0, caps.level),
    skills: clampPower(breakdown.skills ?? 0, caps.skills),
    evolution: clampPower(breakdown.evolution ?? 0, caps.evolution),
    mastery: clampPower(breakdown.mastery ?? 0, caps.mastery),
    charms: clampPower(breakdown.charms ?? 0, caps.charms),
  };

  return {
    score: Object.values(cappedBreakdown).reduce((total, value) => total + value, 0),
    cappedBreakdown,
    caps,
  };
}

export function getCurrencyDefinition(currencyId: CurrencyId): CurrencyDefinition {
  const currency = CURRENCY_DEFINITIONS.find((candidate) => candidate.id === currencyId);
  if (!currency) {
    throw new Error(`Unknown currency: ${currencyId}`);
  }
  return currency;
}
