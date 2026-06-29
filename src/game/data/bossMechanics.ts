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
    guardChance: 0.06,
    backstepSpeed: 116,
    backstepDurationMs: 250,
    recoveryMs: 390,
    cooldownMs: 1040,
    special: {
      name: "CART SPREE",
      effect: "stun_dash",
      windupMs: 540,
      cooldownMs: 5600,
      damageBonus: 2,
      rangeBonus: 44,
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
    guardChance: 0.12,
    backstepSpeed: 132,
    backstepDurationMs: 320,
    recoveryMs: 430,
    cooldownMs: 1120,
    special: {
      name: "PANIC SPIKE",
      effect: "risk_burst",
      windupMs: 640,
      cooldownMs: 6200,
      damageBonus: 4,
      rangeBonus: 28,
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
    guardChance: 0.2,
    backstepSpeed: 82,
    backstepDurationMs: 280,
    recoveryMs: 580,
    cooldownMs: 1460,
    special: {
      name: "LIQUIDITY DROP",
      effect: "guard_break",
      windupMs: 860,
      cooldownMs: 7200,
      damageBonus: 6,
      rangeBonus: 24,
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
    guardChance: 0.18,
    backstepSpeed: 88,
    backstepDurationMs: 300,
    recoveryMs: 540,
    cooldownMs: 1180,
    special: {
      name: "WALLET CRUSH",
      effect: "wallet_crush",
      windupMs: 960,
      cooldownMs: 6900,
      damageBonus: 7,
      rangeBonus: 48,
      energyDrain: 18,
      warning: "ULTIMATE THREAT",
    },
    phases: [
      {
        id: "phase_2",
        hpPercentAtOrBelow: 50,
        label: "BOSS PHASE 2",
        speedMultiplier: 1.1,
        cooldownMultiplier: 0.88,
        damageBonus: 1,
        guardChanceBonus: 0.04,
        color: 0xff4866,
      },
      {
        id: "phase_3",
        hpPercentAtOrBelow: 25,
        label: "FINAL WALLET WAR",
        speedMultiplier: 1.18,
        cooldownMultiplier: 0.78,
        damageBonus: 2,
        guardChanceBonus: 0.06,
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
    guardChance: 0.18,
    backstepSpeed: 86,
    backstepDurationMs: 320,
    recoveryMs: 540,
    cooldownMs: 1300,
    special: {
      name: "AUTO-RENEW DRAIN",
      effect: "energy_drain",
      windupMs: 760,
      cooldownMs: 6800,
      damageBonus: 3,
      rangeBonus: 36,
      energyDrain: 22,
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
    guardChance: 0.1,
    backstepSpeed: 122,
    backstepDurationMs: 290,
    recoveryMs: 450,
    cooldownMs: 1120,
    special: {
      name: "ALL-IN BURST",
      effect: "risk_burst",
      windupMs: 720,
      cooldownMs: 6400,
      damageBonus: 6,
      rangeBonus: 32,
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
    guardChance: 0.12,
    backstepSpeed: 96,
    backstepDurationMs: 340,
    recoveryMs: 500,
    cooldownMs: 1220,
    special: {
      name: "FLASH SALE TRAP",
      effect: "summon_pressure",
      windupMs: 740,
      cooldownMs: 7000,
      damageBonus: 4,
      rangeBonus: 20,
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
    guardChance: 0.14,
    backstepSpeed: 90,
    backstepDurationMs: 320,
    recoveryMs: 560,
    cooldownMs: 1320,
    special: {
      name: "LIFESTYLE TAX",
      effect: "hazard_zone",
      windupMs: 820,
      cooldownMs: 7600,
      damageBonus: 4,
      rangeBonus: 24,
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
    guardChance: 0.22,
    backstepSpeed: 70,
    backstepDurationMs: 260,
    recoveryMs: 620,
    cooldownMs: 1540,
    special: {
      name: "CRAVING SLAM",
      effect: "guard_break",
      windupMs: 940,
      cooldownMs: 8200,
      damageBonus: 7,
      rangeBonus: 22,
      warning: "SLOW HEAVY",
    },
    phases: [],
  },
];

export function getBossMechanicProfile(profileId: BossMechanicProfileId): BossMechanicProfile {
  return BOSS_MECHANIC_PROFILES.find((profile) => profile.id === profileId) ?? BOSS_MECHANIC_PROFILES[0];
}
