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

export const LEVELS: LevelDefinition[] = [
  { level: 1, xpRequired: 0, coinReward: 0, unlocks: ["green_punch", "power_kick", "wallet_guard", "broke_dash"] },
  { level: 2, xpRequired: 120, coinReward: 80, unlocks: ["green_slash", "luxury_mall"] },
  { level: 3, xpRequired: 300, coinReward: 120, unlocks: ["cashback_heal", "casino_district", "subscription_office"] },
  { level: 4, xpRequired: 620, coinReward: 160, unlocks: ["anti_fomo_pulse", "crypto_arena", "fast_food_alley"] },
  { level: 5, xpRequired: 1050, coinReward: 240, unlocks: ["wallet_protection_mode", "vacation_island"] },
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

export function getLevelForXp(xp: number): LevelDefinition {
  return [...LEVELS].reverse().find((level) => xp >= level.xpRequired) ?? LEVELS[0];
}

export function calculateFightReward(victory: boolean, bossesBroken: number): RewardBundle {
  const multiplier = victory ? 1 : 0.35;
  return {
    xp: Math.round((BASE_FIGHT_REWARDS.xp + bossesBroken * 30) * multiplier),
    coins: Math.round((BASE_FIGHT_REWARDS.coins + bossesBroken * 18) * multiplier),
    leakPoints: Math.round((BASE_FIGHT_REWARDS.leakPoints + bossesBroken * 4) * multiplier),
    skinShards: victory && bossesBroken > 0 ? 1 : 0,
    skillCards: victory ? 1 : 0,
    bossTrophies: [],
  };
}
