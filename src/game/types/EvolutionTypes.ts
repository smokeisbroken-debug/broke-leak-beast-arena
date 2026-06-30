export type EvolutionId =
  | "broke_rookie"
  | "leak_fighter"
  | "wallet_guard"
  | "beast_breaker"
  | "anti_leak_champion"
  | "broke_legend";

export type EvolutionBonusId = "hp_cap" | "damage_cap" | "guard_cap" | "boss_focus" | "cosmetic_aura";

export interface EvolutionRequirement {
  level: number;
  leakPoints?: number;
  wins?: number;
  campaignBossesCleared?: number;
}

export interface EvolutionBonus {
  id: EvolutionBonusId;
  label: string;
  value: number;
  capValue: number;
  appliedToCombat: false;
}

export interface MascotEvolutionDefinition {
  id: EvolutionId;
  tier: number;
  name: string;
  title: string;
  theme: string;
  requirement: EvolutionRequirement;
  powerValue: number;
  bonuses: readonly EvolutionBonus[];
  color: number;
  uiColor: string;
}

export interface EvolutionProgressInput {
  level: number;
  leakPoints: number;
  wins: number;
  campaignBossesCleared: number;
}

export interface EvolutionUnlockStatus {
  evolution: MascotEvolutionDefinition;
  unlocked: boolean;
  missing: EvolutionRequirement;
  requirementLabel: string;
}

export interface EvolutionSystemDefinition {
  version: string;
  goal: string;
  rules: readonly string[];
  evolutions: readonly MascotEvolutionDefinition[];
}

export const EVOLUTION_SYSTEM_VERSION = "0.9.3-mascot-evolution-skeleton";

export const MASCOT_EVOLUTIONS: readonly MascotEvolutionDefinition[] = [
  {
    id: "broke_rookie",
    tier: 1,
    name: "Broke Rookie",
    title: "First Anti-Leak Form",
    theme: "A small mascot learning to survive impulse leaks.",
    requirement: { level: 1 },
    powerValue: 0,
    bonuses: [{ id: "cosmetic_aura", label: "Starter aura", value: 0, capValue: 0, appliedToCombat: false }],
    color: 0x72ff57,
    uiColor: "#72ff57",
  },
  {
    id: "leak_fighter",
    tier: 2,
    name: "Leak Fighter",
    title: "Subscription Breaker",
    theme: "The mascot starts fighting small wallet leaks with discipline.",
    requirement: { level: 5, leakPoints: 50 },
    powerValue: 8,
    bonuses: [{ id: "hp_cap", label: "Future HP cap bonus", value: 3, capValue: 15, appliedToCombat: false }],
    color: 0x8cdcff,
    uiColor: "#8cdcff",
  },
  {
    id: "wallet_guard",
    tier: 3,
    name: "Wallet Guard",
    title: "Cold Wallet Defender",
    theme: "The mascot learns to block FOMO and protect the wallet.",
    requirement: { level: 10, leakPoints: 150, wins: 5 },
    powerValue: 16,
    bonuses: [{ id: "guard_cap", label: "Future guard cap bonus", value: 4, capValue: 15, appliedToCombat: false }],
    color: 0xffeb72,
    uiColor: "#ffeb72",
  },
  {
    id: "beast_breaker",
    tier: 4,
    name: "Beast Breaker",
    title: "Boss Leak Hunter",
    theme: "The mascot can pressure major leaks without relying on raw stat inflation.",
    requirement: { level: 15, leakPoints: 350, wins: 12, campaignBossesCleared: 2 },
    powerValue: 24,
    bonuses: [{ id: "boss_focus", label: "Future boss focus cap", value: 5, capValue: 12, appliedToCombat: false }],
    color: 0xff9a3d,
    uiColor: "#ff9a3d",
  },
  {
    id: "anti_leak_champion",
    tier: 5,
    name: "Anti-Leak Champion",
    title: "Community Arena Form",
    theme: "The mascot is ready for leaderboard pressure, tournaments and duel identity.",
    requirement: { level: 22, leakPoints: 750, wins: 25, campaignBossesCleared: 5 },
    powerValue: 32,
    bonuses: [{ id: "damage_cap", label: "Future damage cap bonus", value: 6, capValue: 10, appliedToCombat: false }],
    color: 0xb66cff,
    uiColor: "#b66cff",
  },
  {
    id: "broke_legend",
    tier: 6,
    name: "Broke Legend",
    title: "Prestige-Ready Form",
    theme: "The mascot reaches capped long-term progression and prepares for seasons.",
    requirement: { level: 30, leakPoints: 1500, wins: 50, campaignBossesCleared: 8 },
    powerValue: 40,
    bonuses: [{ id: "cosmetic_aura", label: "Legend aura unlock", value: 1, capValue: 1, appliedToCombat: false }],
    color: 0xfcfff7,
    uiColor: "#fcfff7",
  },
];

export const EVOLUTION_SYSTEM_DEFINITION: EvolutionSystemDefinition = {
  version: EVOLUTION_SYSTEM_VERSION,
  goal: "Define long-term mascot evolution as a capped progression layer for profile, balance and future multiplayer identity.",
  rules: [
    "Evolution power is capped at 40 and feeds only PowerScore in this skeleton patch.",
    "Evolution bonuses are declared as future capped modifiers, but are not applied to live combat yet.",
    "Evolution unlocks may support level, Leak Points, wins and campaign clears before backend validation exists.",
    "Ranked and tournament rewards must never depend on local-only evolution without future backend validation.",
  ],
  evolutions: MASCOT_EVOLUTIONS,
};

export function getEvolutionDefinition(evolutionId: string): MascotEvolutionDefinition {
  return MASCOT_EVOLUTIONS.find((evolution) => evolution.id === evolutionId) ?? MASCOT_EVOLUTIONS[0];
}

export function getEvolutionPower(evolutionId: string): number {
  return getEvolutionDefinition(evolutionId).powerValue;
}

export function isEvolutionUnlocked(evolution: MascotEvolutionDefinition, progress: EvolutionProgressInput): boolean {
  const requirement = evolution.requirement;
  return (
    progress.level >= requirement.level &&
    progress.leakPoints >= (requirement.leakPoints ?? 0) &&
    progress.wins >= (requirement.wins ?? 0) &&
    progress.campaignBossesCleared >= (requirement.campaignBossesCleared ?? 0)
  );
}

export function getMissingEvolutionRequirement(evolution: MascotEvolutionDefinition, progress: EvolutionProgressInput): EvolutionRequirement {
  const requirement = evolution.requirement;
  return {
    level: Math.max(0, requirement.level - progress.level),
    leakPoints: Math.max(0, (requirement.leakPoints ?? 0) - progress.leakPoints),
    wins: Math.max(0, (requirement.wins ?? 0) - progress.wins),
    campaignBossesCleared: Math.max(0, (requirement.campaignBossesCleared ?? 0) - progress.campaignBossesCleared),
  };
}

export function formatEvolutionRequirement(requirement: EvolutionRequirement): string {
  const parts = [`LV ${requirement.level}`];
  if (requirement.leakPoints) parts.push(`${requirement.leakPoints} LEAK`);
  if (requirement.wins) parts.push(`${requirement.wins} WINS`);
  if (requirement.campaignBossesCleared) parts.push(`${requirement.campaignBossesCleared} BOSSES`);
  return parts.join(" · ");
}

export function getEvolutionUnlockStatus(evolution: MascotEvolutionDefinition, progress: EvolutionProgressInput): EvolutionUnlockStatus {
  return {
    evolution,
    unlocked: isEvolutionUnlocked(evolution, progress),
    missing: getMissingEvolutionRequirement(evolution, progress),
    requirementLabel: formatEvolutionRequirement(evolution.requirement),
  };
}

export function getUnlockedEvolutionForProgress(progress: EvolutionProgressInput): MascotEvolutionDefinition {
  return [...MASCOT_EVOLUTIONS]
    .reverse()
    .find((evolution) => isEvolutionUnlocked(evolution, progress)) ?? MASCOT_EVOLUTIONS[0];
}

export function getNextEvolution(evolutionId: string): MascotEvolutionDefinition | undefined {
  const current = getEvolutionDefinition(evolutionId);
  return MASCOT_EVOLUTIONS.find((evolution) => evolution.tier === current.tier + 1);
}
