export type StageModifier = "neutral" | "risk_zones" | "impulse_traps" | "volatility_waves" | "slow_zones" | "leak_zones" | "boss_arena";
export type StageRarity = "starter" | "common" | "rare" | "epic" | "boss";

export interface StageDefinition {
  id: string;
  name: string;
  chapterId: string;
  backgroundKey: string;
  modifier: StageModifier;
  rarity: StageRarity;
  hazardDamage: number;
  hazardIntervalMs: number;
  unlockLevel: number;
  color: number;
  uiColor: string;
  missionText: string;
  description: string;
}

export interface StageProfileState {
  selectedStageId: string;
  unlockedStageIds: string[];
  level: number;
}

export const STAGES: StageDefinition[] = [
  {
    id: "city_street",
    name: "City Street",
    chapterId: "daily_leaks",
    backgroundKey: "arena-bg-01",
    modifier: "neutral",
    rarity: "starter",
    hazardDamage: 0,
    hazardIntervalMs: 0,
    unlockLevel: 1,
    color: 0x72ff57,
    uiColor: "#72ff57",
    missionText: "Break the first daily leaks.",
    description: "Clean baseline arena for reading combat balance.",
  },
  {
    id: "luxury_mall",
    name: "Luxury Mall",
    chapterId: "daily_leaks",
    backgroundKey: "arena-bg-01",
    modifier: "impulse_traps",
    rarity: "common",
    hazardDamage: 2,
    hazardIntervalMs: 5600,
    unlockLevel: 1,
    color: 0xffeb72,
    uiColor: "#ffeb72",
    missionText: "Do not get trapped by impulse spending.",
    description: "Impulse traps appear on the floor and punish careless positioning.",
  },
  {
    id: "casino_district",
    name: "Casino District",
    chapterId: "risk_leaks",
    backgroundKey: "arena-bg-01",
    modifier: "risk_zones",
    rarity: "common",
    hazardDamage: 3,
    hazardIntervalMs: 6500,
    unlockLevel: 1,
    color: 0xff4866,
    uiColor: "#ff9aaa",
    missionText: "Avoid risk zones and punish reckless attacks.",
    description: "Random risk zones charge up, then damage anyone standing inside.",
  },
  {
    id: "crypto_arena",
    name: "Crypto Arena",
    chapterId: "risk_leaks",
    backgroundKey: "arena-bg-01",
    modifier: "volatility_waves",
    rarity: "rare",
    hazardDamage: 4,
    hazardIntervalMs: 7600,
    unlockLevel: 4,
    color: 0xa45cff,
    uiColor: "#d9a7ff",
    missionText: "Survive volatility waves.",
    description: "Volatility waves sweep across the arena and force timing decisions.",
  },
  {
    id: "vacation_island",
    name: "Vacation Island",
    chapterId: "lifestyle_leaks",
    backgroundKey: "arena-bg-01",
    modifier: "slow_zones",
    rarity: "rare",
    hazardDamage: 1,
    hazardIntervalMs: 0,
    unlockLevel: 5,
    color: 0x4de8ff,
    uiColor: "#4de8ff",
    missionText: "Stay disciplined through lifestyle pressure.",
    description: "Slow zones reduce movement speed and make spacing harder.",
  },
  {
    id: "subscription_office",
    name: "Subscription Office",
    chapterId: "daily_leaks",
    backgroundKey: "arena-bg-01",
    modifier: "leak_zones",
    rarity: "rare",
    hazardDamage: 2,
    hazardIntervalMs: 0,
    unlockLevel: 3,
    color: 0x72ff57,
    uiColor: "#d7ffd0",
    missionText: "Cancel the recurring leak.",
    description: "Recurring leak zone drains energy and HP if you stay inside.",
  },
  {
    id: "fast_food_alley",
    name: "Fast Food Alley",
    chapterId: "lifestyle_leaks",
    backgroundKey: "arena-bg-01",
    modifier: "leak_zones",
    rarity: "epic",
    hazardDamage: 3,
    hazardIntervalMs: 0,
    unlockLevel: 4,
    color: 0xff8a48,
    uiColor: "#ffb15c",
    missionText: "Break the cheap dopamine loop.",
    description: "A stronger leak zone forces aggressive movement and quick exits.",
  },
  {
    id: "dark_wallet_vault",
    name: "Dark Wallet Vault",
    chapterId: "final_wallet_war",
    backgroundKey: "arena-bg-01",
    modifier: "boss_arena",
    rarity: "boss",
    hazardDamage: 4,
    hazardIntervalMs: 7600,
    unlockLevel: 6,
    color: 0xff4866,
    uiColor: "#ff9aaa",
    missionText: "Protect the wallet from the final leak.",
    description: "Boss arena with pressure zones designed for final fights.",
  },
];

export const DEFAULT_STAGE_ID = "city_street";
export const STARTER_STAGE_IDS = ["city_street", "luxury_mall", "casino_district"];

export function getStageById(stageId: string): StageDefinition {
  return STAGES.find((stage) => stage.id === stageId) ?? STAGES[0];
}

export function getStageModifierLabel(stage: StageDefinition): string {
  if (stage.modifier === "neutral") return "Clean Fight";
  if (stage.modifier === "risk_zones") return "Risk Zones";
  if (stage.modifier === "impulse_traps") return "Impulse Traps";
  if (stage.modifier === "volatility_waves") return "Volatility Waves";
  if (stage.modifier === "slow_zones") return "Slow Zones";
  if (stage.modifier === "leak_zones") return "Leak Drain";
  return "Boss Pressure";
}

export function getStageRarityColor(stage: StageDefinition): string {
  if (stage.rarity === "starter") return "#72ff57";
  if (stage.rarity === "common") return "#fcfff7";
  if (stage.rarity === "rare") return "#4de8ff";
  if (stage.rarity === "epic") return "#d9a7ff";
  return "#ff9aaa";
}

export function isStageUnlocked(profile: Pick<StageProfileState, "unlockedStageIds" | "level">, stageId: string): boolean {
  const stage = getStageById(stageId);
  return profile.unlockedStageIds.includes(stageId) || profile.level >= stage.unlockLevel;
}

export function getStageUnlockLabel(stage: StageDefinition): string {
  if (STARTER_STAGE_IDS.includes(stage.id)) return "Starter";
  return `Level ${stage.unlockLevel}`;
}
