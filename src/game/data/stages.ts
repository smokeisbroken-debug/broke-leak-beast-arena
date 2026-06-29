export type StageModifier = "neutral" | "risk_zones" | "impulse_traps" | "volatility_waves" | "slow_zones" | "leak_zones" | "boss_arena";

export interface StageDefinition {
  id: string;
  name: string;
  chapterId: string;
  backgroundKey: string;
  modifier: StageModifier;
  hazardDamage: number;
  unlockLevel: number;
  missionText: string;
  description: string;
}

export const STAGES: StageDefinition[] = [
  {
    id: "city_street",
    name: "City Street",
    chapterId: "daily_leaks",
    backgroundKey: "arena-bg-01",
    modifier: "neutral",
    hazardDamage: 0,
    unlockLevel: 1,
    missionText: "Break the first daily leaks.",
    description: "Baseline arena for clean combat balance.",
  },
  {
    id: "casino_district",
    name: "Casino District",
    chapterId: "risk_leaks",
    backgroundKey: "arena-bg-01",
    modifier: "risk_zones",
    hazardDamage: 4,
    unlockLevel: 3,
    missionText: "Avoid risk zones and punish reckless attacks.",
    description: "Future stage with random danger zones.",
  },
  {
    id: "luxury_mall",
    name: "Luxury Mall",
    chapterId: "daily_leaks",
    backgroundKey: "arena-bg-01",
    modifier: "impulse_traps",
    hazardDamage: 3,
    unlockLevel: 2,
    missionText: "Do not get trapped by impulse spending.",
    description: "Future stage with impulse traps.",
  },
  {
    id: "crypto_arena",
    name: "Crypto Arena",
    chapterId: "risk_leaks",
    backgroundKey: "arena-bg-01",
    modifier: "volatility_waves",
    hazardDamage: 5,
    unlockLevel: 4,
    missionText: "Survive volatility waves.",
    description: "Future stage with timed wave pressure.",
  },
  {
    id: "vacation_island",
    name: "Vacation Island",
    chapterId: "lifestyle_leaks",
    backgroundKey: "arena-bg-01",
    modifier: "slow_zones",
    hazardDamage: 2,
    unlockLevel: 5,
    missionText: "Stay disciplined through lifestyle pressure.",
    description: "Future stage with slow zones.",
  },
  {
    id: "subscription_office",
    name: "Subscription Office",
    chapterId: "daily_leaks",
    backgroundKey: "arena-bg-01",
    modifier: "leak_zones",
    hazardDamage: 3,
    unlockLevel: 3,
    missionText: "Cancel the recurring leak.",
    description: "Future stage with draining leak zones.",
  },
  {
    id: "fast_food_alley",
    name: "Fast Food Alley",
    chapterId: "lifestyle_leaks",
    backgroundKey: "arena-bg-01",
    modifier: "leak_zones",
    hazardDamage: 4,
    unlockLevel: 4,
    missionText: "Break the cheap dopamine loop.",
    description: "Future stage for poison/leak hazards.",
  },
  {
    id: "dark_wallet_vault",
    name: "Dark Wallet Vault",
    chapterId: "final_wallet_war",
    backgroundKey: "arena-bg-01",
    modifier: "boss_arena",
    hazardDamage: 6,
    unlockLevel: 6,
    missionText: "Protect the wallet from the final leak.",
    description: "Boss arena reserved for final fights.",
  },
];

export const DEFAULT_STAGE_ID = "city_street";

export function getStageById(stageId: string): StageDefinition {
  return STAGES.find((stage) => stage.id === stageId) ?? STAGES[0];
}
