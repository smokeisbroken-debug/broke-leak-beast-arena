export type BossMechanicProfileId =
  | "impulse_rusher"
  | "emotion_feinter"
  | "rug_heavy"
  | "wallet_destroyer"
  | "subscription_drain"
  | "gambling_burst"
  | "shopping_summoner"
  | "lifestyle_hazard"
  | "food_tank";

export type BossSpecialEffect = "none" | "energy_drain" | "risk_burst" | "guard_break" | "stun_dash" | "hazard_zone" | "summon_pressure" | "wallet_crush";

export interface BossPhaseDefinition {
  id: string;
  hpPercentAtOrBelow: number;
  label: string;
  speedMultiplier: number;
  cooldownMultiplier: number;
  damageBonus: number;
  guardChanceBonus: number;
  color: number;
}

export interface BossSpecialDefinition {
  name: string;
  effect: BossSpecialEffect;
  windupMs: number;
  cooldownMs: number;
  damageBonus: number;
  rangeBonus: number;
  energyDrain?: number;
  warning: string;
}

export interface BossMechanicProfile {
  id: BossMechanicProfileId;
  role: string;
  shortHint: string;
  jabWeight: number;
  lungeWeight: number;
  heavyWeight: number;
  guardChance: number;
  backstepSpeed: number;
  backstepDurationMs: number;
  recoveryMs: number;
  cooldownMs: number;
  special: BossSpecialDefinition;
  phases: BossPhaseDefinition[];
}

export const BOSS_MECHANIC_PROFILES: BossMechanicProfile[] = [
  {
    id: "impulse_rusher",
    role: "Fast rushdown opponent",
    shortHint: "Short cooldowns, quick jabs, punish with block into counter.",
    jabWeight: 0.64,
    lungeWeight: 0.28,
    heavyWeight: 0.08,
    guardChance: 0.1,
    backstepSpeed: 126,
    backstepDurationMs: 230,
    recoveryMs: 340,
    cooldownMs: 880,
    special: {
      name: "CART SPREE",
      effect: "stun_dash",
      windupMs: 470,
      cooldownMs: 4200,
      damageBonus: 3,
      rangeBonus: 52,
      warning: "DASH ATTACK",
    },
    phases: [],
  },
  {
    id: "emotion_feinter",
    role: "Feint and lunge opponent",
    shortHint: "Moves unpredictably. Do not chase; wait for FOMO lunge.",
    jabWeight: 0.32,
    lungeWeight: 0.48,
    heavyWeight: 0.2,
    guardChance: 0.2,
    backstepSpeed: 150,
    backstepDurationMs: 310,
    recoveryMs: 360,
    cooldownMs: 960,
    special: {
      name: "PANIC SPIKE",
      effect: "risk_burst",
      windupMs: 560,
      cooldownMs: 5200,
      damageBonus: 6,
      rangeBonus: 34,
      warning: "RISK BURST",
    },
    phases: [],
  },
  {
    id: "rug_heavy",
    role: "Heavy guard-break opponent",
    shortHint: "Slow pressure, heavy hits, longer punish windows.",
    jabWeight: 0.12,
    lungeWeight: 0.34,
    heavyWeight: 0.54,
    guardChance: 0.28,
    backstepSpeed: 88,
    backstepDurationMs: 260,
    recoveryMs: 520,
    cooldownMs: 1320,
    special: {
      name: "LIQUIDITY DROP",
      effect: "guard_break",
      windupMs: 760,
      cooldownMs: 6100,
      damageBonus: 8,
      rangeBonus: 28,
      warning: "GUARD BREAK",
    },
    phases: [],
  },
  {
    id: "wallet_destroyer",
    role: "Multi-phase final boss",
    shortHint: "Phase 2 accelerates. Special attacks drain energy and punish passive play.",
    jabWeight: 0.22,
    lungeWeight: 0.38,
    heavyWeight: 0.4,
    guardChance: 0.24,
    backstepSpeed: 96,
    backstepDurationMs: 280,
    recoveryMs: 460,
    cooldownMs: 1040,
    special: {
      name: "WALLET CRUSH",
      effect: "wallet_crush",
      windupMs: 820,
      cooldownMs: 5400,
      damageBonus: 10,
      rangeBonus: 64,
      energyDrain: 24,
      warning: "ULTIMATE THREAT",
    },
    phases: [
      {
        id: "phase_2",
        hpPercentAtOrBelow: 50,
        label: "BOSS PHASE 2",
        speedMultiplier: 1.18,
        cooldownMultiplier: 0.78,
        damageBonus: 2,
        guardChanceBonus: 0.08,
        color: 0xff4866,
      },
      {
        id: "phase_3",
        hpPercentAtOrBelow: 25,
        label: "FINAL WALLET WAR",
        speedMultiplier: 1.32,
        cooldownMultiplier: 0.64,
        damageBonus: 4,
        guardChanceBonus: 0.12,
        color: 0xffeb72,
      },
    ],
  },
  {
    id: "subscription_drain",
    role: "Energy drain boss",
    shortHint: "Slowly drains energy and forces active offense.",
    jabWeight: 0.24,
    lungeWeight: 0.28,
    heavyWeight: 0.48,
    guardChance: 0.26,
    backstepSpeed: 90,
    backstepDurationMs: 300,
    recoveryMs: 480,
    cooldownMs: 1160,
    special: {
      name: "AUTO-RENEW DRAIN",
      effect: "energy_drain",
      windupMs: 680,
      cooldownMs: 5600,
      damageBonus: 4,
      rangeBonus: 46,
      energyDrain: 32,
      warning: "ENERGY DRAIN",
    },
    phases: [],
  },
  {
    id: "gambling_burst",
    role: "Random burst boss",
    shortHint: "Unstable burst windows. Respect warnings before countering.",
    jabWeight: 0.28,
    lungeWeight: 0.44,
    heavyWeight: 0.28,
    guardChance: 0.14,
    backstepSpeed: 132,
    backstepDurationMs: 270,
    recoveryMs: 390,
    cooldownMs: 980,
    special: {
      name: "ALL-IN BURST",
      effect: "risk_burst",
      windupMs: 620,
      cooldownMs: 5200,
      damageBonus: 9,
      rangeBonus: 40,
      warning: "RANDOM BURST",
    },
    phases: [],
  },
  {
    id: "shopping_summoner",
    role: "Summon pressure boss",
    shortHint: "Creates pressure zones and forces repositioning.",
    jabWeight: 0.3,
    lungeWeight: 0.3,
    heavyWeight: 0.4,
    guardChance: 0.18,
    backstepSpeed: 104,
    backstepDurationMs: 320,
    recoveryMs: 430,
    cooldownMs: 1060,
    special: {
      name: "FLASH SALE TRAP",
      effect: "summon_pressure",
      windupMs: 650,
      cooldownMs: 6000,
      damageBonus: 5,
      rangeBonus: 22,
      warning: "PRESSURE ZONE",
    },
    phases: [],
  },
  {
    id: "lifestyle_hazard",
    role: "Hazard zone boss",
    shortHint: "Controls the arena with timed leak zones.",
    jabWeight: 0.22,
    lungeWeight: 0.3,
    heavyWeight: 0.48,
    guardChance: 0.2,
    backstepSpeed: 98,
    backstepDurationMs: 300,
    recoveryMs: 500,
    cooldownMs: 1180,
    special: {
      name: "LIFESTYLE TAX",
      effect: "hazard_zone",
      windupMs: 720,
      cooldownMs: 6300,
      damageBonus: 6,
      rangeBonus: 30,
      warning: "LEAK ZONE",
    },
    phases: [],
  },
  {
    id: "food_tank",
    role: "Slow tank boss",
    shortHint: "High durability and punishable heavy attacks.",
    jabWeight: 0.14,
    lungeWeight: 0.24,
    heavyWeight: 0.62,
    guardChance: 0.32,
    backstepSpeed: 74,
    backstepDurationMs: 240,
    recoveryMs: 560,
    cooldownMs: 1380,
    special: {
      name: "CRAVING SLAM",
      effect: "guard_break",
      windupMs: 840,
      cooldownMs: 6800,
      damageBonus: 10,
      rangeBonus: 26,
      warning: "SLOW HEAVY",
    },
    phases: [],
  },
];

export function getBossMechanicProfile(profileId: BossMechanicProfileId): BossMechanicProfile {
  return BOSS_MECHANIC_PROFILES.find((profile) => profile.id === profileId) ?? BOSS_MECHANIC_PROFILES[0];
}
