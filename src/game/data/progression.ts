export interface LevelDefinition {
  level: number;
  xpRequired: number;
  coinReward: number;
  unlocks: string[];
}

export interface RewardBundle {
  xp: number;
  coins: number;
  leakPoints: number;
  skinShards: number;
  skillCards: number;
  bossTrophies: string[];
}

export type RewardChoiceKind = "coins" | "xp" | "leak_points" | "skill_unlock" | "stage_unlock" | "skin_unlock";
export type RewardChoiceRarity = "common" | "rare" | "epic" | "legendary";

export interface RewardChoiceDefinition {
  id: string;
  name: string;
  kind: RewardChoiceKind;
  rarity: RewardChoiceRarity;
  amount: number;
  unlockId?: string;
  color: number;
  uiColor: string;
  description: string;
}

export const LEVELS: LevelDefinition[] = [
  { level: 1, xpRequired: 0, coinReward: 0, unlocks: ["green_punch", "power_kick", "wallet_guard", "broke_dash"] },
  { level: 2, xpRequired: 120, coinReward: 80, unlocks: ["green_slash", "luxury_mall"] },
  { level: 3, xpRequired: 300, coinReward: 120, unlocks: ["cashback_heal", "casino_district", "subscription_office"] },
  { level: 4, xpRequired: 620, coinReward: 160, unlocks: ["anti_fomo_pulse", "crypto_arena", "fast_food_alley"] },
  { level: 5, xpRequired: 1050, coinReward: 240, unlocks: ["wallet_protection_mode", "debt_breaker", "vacation_island"] },
  { level: 6, xpRequired: 1600, coinReward: 320, unlocks: ["dark_wallet_vault"] },
];

export const BASE_FIGHT_REWARDS: RewardBundle = {
  xp: 80,
  coins: 45,
  leakPoints: 10,
  skinShards: 0,
  skillCards: 0,
  bossTrophies: [],
};

export const DEFAULT_REWARD_CHOICES: RewardChoiceDefinition[] = [
  {
    id: "bonus_coins",
    name: "Coin Cache",
    kind: "coins",
    rarity: "common",
    amount: 85,
    color: 0xffeb72,
    uiColor: "#ffeb72",
    description: "+85 coins for future unlocks.",
  },
  {
    id: "bonus_xp",
    name: "XP Boost",
    kind: "xp",
    rarity: "common",
    amount: 110,
    color: 0x72ff57,
    uiColor: "#72ff57",
    description: "+110 XP toward the next level.",
  },
  {
    id: "bonus_leak_points",
    name: "Leak Points",
    kind: "leak_points",
    rarity: "rare",
    amount: 28,
    color: 0xd9a7ff,
    uiColor: "#d9a7ff",
    description: "+28 Leak Points for upgrade economy.",
  },
];

export function getLevelForXp(xp: number): LevelDefinition {
  return [...LEVELS].reverse().find((level) => xp >= level.xpRequired) ?? LEVELS[0];
}

export function getNextLevel(currentLevel: number): LevelDefinition | undefined {
  return LEVELS.find((level) => level.level === currentLevel + 1);
}

export function getXpProgress(xp: number): { level: LevelDefinition; nextLevel?: LevelDefinition; progress: number; remaining: number } {
  const level = getLevelForXp(xp);
  const nextLevel = getNextLevel(level.level);
  if (!nextLevel) return { level, nextLevel, progress: 1, remaining: 0 };
  const span = Math.max(1, nextLevel.xpRequired - level.xpRequired);
  const earned = Math.max(0, xp - level.xpRequired);
  return {
    level,
    nextLevel,
    progress: Math.max(0, Math.min(1, earned / span)),
    remaining: Math.max(0, nextLevel.xpRequired - xp),
  };
}

export function calculateFightReward(victory: boolean, bossesBroken: number, leaksDefeated = 0, score = 0): RewardBundle {
  const multiplier = victory ? 1 : 0.35;
  const scoreBonus = Math.min(70, Math.floor(score / 90));
  const leakBonus = leaksDefeated * 14;
  return {
    xp: Math.round((BASE_FIGHT_REWARDS.xp + bossesBroken * 45 + leakBonus + scoreBonus) * multiplier),
    coins: Math.round((BASE_FIGHT_REWARDS.coins + bossesBroken * 28 + leaksDefeated * 9 + Math.floor(score / 160)) * multiplier),
    leakPoints: Math.round((BASE_FIGHT_REWARDS.leakPoints + bossesBroken * 7 + leaksDefeated * 3) * multiplier),
    skinShards: victory && bossesBroken > 0 ? 1 : 0,
    skillCards: victory ? 1 : 0,
    bossTrophies: victory ? ["wallet_destroyer"] : [],
  };
}

export function getRewardChoiceRarityLabel(choice: RewardChoiceDefinition): string {
  if (choice.rarity === "legendary") return "Legendary";
  if (choice.rarity === "epic") return "Epic";
  if (choice.rarity === "rare") return "Rare";
  return "Common";
}
