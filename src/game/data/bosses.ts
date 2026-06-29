import type { BossDefinition } from "../types/game";
import type { BossMechanicProfileId } from "./bossMechanics";

export type ArenaBossBehavior = "impulse" | "emotion" | "rug" | "destroyer" | "subscription" | "gambling" | "shopping" | "lifestyle" | "food";

export interface ArenaBossDefinition {
  id: string;
  name: string;
  leakLabel: string;
  chapterId: string;
  stageId: string;
  introLine: string;
  threatLine: string;
  defeatLine: string;
  behavior: ArenaBossBehavior;
  texture: string;
  animation: string;
  hp: number;
  damage: number;
  speed: number;
  displayW: number;
  displayH: number;
  bodyW: number;
  bodyH: number;
  attackRange: number;
  color: number;
  boss?: boolean;
  unlockLevel: number;
  rewardTrophyId?: string;
  mechanics: string[];
  mechanicProfileId: BossMechanicProfileId;
}

export const ARENA_BOSSES: ArenaBossDefinition[] = [
  {
    id: "impulse_buy_beast",
    name: "Impulse Buy Beast",
    leakLabel: "STOP IMPULSE SPENDING",
    chapterId: "daily_leaks",
    stageId: "city_street",
    introLine: "Short rushes. Fast jabs. Punish reckless spending.",
    threatLine: "It attacks quickly after closing distance.",
    defeatLine: "IMPULSE SPENDING DEFEATED",
    behavior: "impulse",
    texture: "enemy-imp-01",
    animation: "enemy-bad-habit-move",
    hp: 72,
    damage: 7,
    speed: 116,
    displayW: 126,
    displayH: 126,
    bodyW: 64,
    bodyH: 74,
    attackRange: 118,
    color: 0x72ff57,
    unlockLevel: 1,
    rewardTrophyId: "trophy_impulse_buy_beast",
    mechanics: ["fast_jabs", "short_rush", "low_recovery", "cart_spree"],
    mechanicProfileId: "impulse_rusher",
  },
  {
    id: "emotional_trading_beast",
    name: "Emotional Trading Beast",
    leakLabel: "CONTROL EMOTIONAL TRADING",
    chapterId: "risk_leaks",
    stageId: "crypto_arena",
    introLine: "Erratic movement. Sudden lunges. Do not chase panic.",
    threatLine: "It feints, steps back, then lunges.",
    defeatLine: "EMOTIONAL TRADING DEFEATED",
    behavior: "emotion",
    texture: "enemy-runner-01",
    animation: "enemy-fomo-move",
    hp: 90,
    damage: 9,
    speed: 146,
    displayW: 178,
    displayH: 148,
    bodyW: 90,
    bodyH: 80,
    attackRange: 146,
    color: 0xffeb72,
    unlockLevel: 2,
    rewardTrophyId: "trophy_emotional_trading_beast",
    mechanics: ["feint", "fomo_lunge", "chaotic_spacing", "panic_spike"],
    mechanicProfileId: "emotion_feinter",
  },
  {
    id: "rug_pull_beast",
    name: "Rug Pull Beast",
    leakLabel: "SURVIVE THE RUG PULL",
    chapterId: "risk_leaks",
    stageId: "casino_district",
    introLine: "Slow pressure. Heavy hits. Block before countering.",
    threatLine: "Its heavy attack hurts, but has a long warning.",
    defeatLine: "RUG PULL DEFEATED",
    behavior: "rug",
    texture: "enemy-beast-01",
    animation: "enemy-scam-move",
    hp: 118,
    damage: 11,
    speed: 108,
    displayW: 206,
    displayH: 178,
    bodyW: 104,
    bodyH: 98,
    attackRange: 158,
    color: 0xa45cff,
    unlockLevel: 3,
    rewardTrophyId: "trophy_rug_pull_beast",
    mechanics: ["heavy_attack", "long_warning", "guard_break_pressure", "liquidity_drop"],
    mechanicProfileId: "rug_heavy",
  },
  {
    id: "wallet_destroyer_boss",
    name: "Wallet Destroyer Boss",
    leakLabel: "PROTECT THE WALLET",
    chapterId: "final_wallet_war",
    stageId: "dark_wallet_vault",
    introLine: "Boss fight. Watch phase 2 and punish heavy attacks.",
    threatLine: "At half HP it becomes faster and more aggressive.",
    defeatLine: "WALLET DESTROYER BROKEN",
    behavior: "destroyer",
    texture: "boss-thorn-01",
    animation: "boss-thorn-move",
    hp: 162,
    damage: 13,
    speed: 98,
    displayW: 328,
    displayH: 304,
    bodyW: 160,
    bodyH: 156,
    attackRange: 198,
    color: 0xff4866,
    boss: true,
    unlockLevel: 4,
    rewardTrophyId: "trophy_wallet_destroyer_boss",
    mechanics: ["phase_2", "phase_3", "boss_guard", "heavy_rush", "wallet_crush"],
    mechanicProfileId: "wallet_destroyer",
  },
];

export const ARENA_BATTLE_ROUNDS = ARENA_BOSSES;

export function getArenaBossById(bossId: string): ArenaBossDefinition {
  return ARENA_BOSSES.find((boss) => boss.id === bossId) ?? ARENA_BOSSES[0];
}

export const WEEKLY_BOSSES: BossDefinition[] = [
  {
    id: "smoke_king",
    name: "Smoke King",
    hp: 100000,
    intro: "The first Mega Leak enters the arena.",
  },
  {
    id: "fomo_hydra",
    name: "FOMO Hydra",
    hp: 150000,
    intro: "Every panic move creates another head.",
  },
  {
    id: "scam_lord",
    name: "Scam Lord",
    hp: 180000,
    intro: "Fake links. Fake admins. Real damage.",
  },
];
