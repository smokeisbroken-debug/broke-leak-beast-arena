export const MASTERY_SYSTEM_VERSION = "0.9.5-mastery-skeleton";

export type MasteryBranchId =
  | "guard_mastery"
  | "dash_mastery"
  | "skill_mastery"
  | "boss_hunter"
  | "leak_control"
  | "survivor";

export type MasteryBranchRole = "defense" | "mobility" | "skills" | "boss" | "control" | "survival";
export type MasteryUnlockStatus = "locked" | "available" | "active" | "maxed";

export interface MasteryBranchBonus {
  id: string;
  label: string;
  unlockLevel: number;
  futureCombatRule: string;
}

export interface MasteryBranchDefinition {
  id: MasteryBranchId;
  name: string;
  shortName: string;
  theme: string;
  role: MasteryBranchRole;
  unlockLevel: number;
  maxLevel: number;
  powerPerLevel: number;
  pointCostPerLevel: number;
  description: string;
  bonuses: readonly MasteryBranchBonus[];
}

export interface MasteryBranchState {
  id: MasteryBranchId;
  name: string;
  shortName: string;
  role: MasteryBranchRole;
  level: number;
  maxLevel: number;
  unlocked: boolean;
  status: MasteryUnlockStatus;
  powerValue: number;
  nextPowerValue: number;
  pointCostToNext: number;
  unlockLabel: string;
  futureCombatRule: string;
}

export interface MasterySystemDefinition {
  version: typeof MASTERY_SYSTEM_VERSION;
  maxBranchLevel: number;
  maxTotalBranchLevels: number;
  maxPowerContribution: number;
  pointRules: readonly string[];
  branches: readonly MasteryBranchDefinition[];
}

export const MASTERY_BRANCHES: readonly MasteryBranchDefinition[] = [
  {
    id: "guard_mastery",
    name: "Wallet Guard",
    shortName: "Guard",
    theme: "Protect the wallet before the leak hits.",
    role: "defense",
    unlockLevel: 3,
    maxLevel: 5,
    powerPerLevel: 3,
    pointCostPerLevel: 1,
    description: "Future branch for guard timing, shield value and counter windows.",
    bonuses: [
      { id: "guard_focus", label: "Cleaner guard window", unlockLevel: 1, futureCombatRule: "Guard feedback becomes stronger before combat scaling is enabled." },
      { id: "counter_receipt", label: "Counter receipt", unlockLevel: 3, futureCombatRule: "Perfect guard may later create a counter-hit opening." },
      { id: "last_wallet", label: "Last wallet stand", unlockLevel: 5, futureCombatRule: "A future capped survival save can be attached here." },
    ],
  },
  {
    id: "dash_mastery",
    name: "Cold Dash",
    shortName: "Dash",
    theme: "Dodge impulse pressure instead of paying for mistakes.",
    role: "mobility",
    unlockLevel: 5,
    maxLevel: 5,
    powerPerLevel: 3,
    pointCostPerLevel: 1,
    description: "Future branch for dodge timing, repositioning and hazard control.",
    bonuses: [
      { id: "clean_escape", label: "Clean escape", unlockLevel: 1, futureCombatRule: "Dash clarity and dodge reward hooks can connect here." },
      { id: "no_fomo_step", label: "No-FOMO step", unlockLevel: 3, futureCombatRule: "Future perfect dodge scoring can attach here." },
      { id: "leak_slip", label: "Leak slip", unlockLevel: 5, futureCombatRule: "Future hazard mitigation stays capped by this branch." },
    ],
  },
  {
    id: "skill_mastery",
    name: "Skill Discipline",
    shortName: "Skills",
    theme: "Use skills with discipline instead of panic spending energy.",
    role: "skills",
    unlockLevel: 8,
    maxLevel: 5,
    powerPerLevel: 3,
    pointCostPerLevel: 1,
    description: "Future branch for active skill timing, energy discipline and ultimate control.",
    bonuses: [
      { id: "calm_cast", label: "Calm cast", unlockLevel: 1, futureCombatRule: "Future skill timing bonuses can be routed through this branch." },
      { id: "anti_panic_combo", label: "Anti-panic combo", unlockLevel: 3, futureCombatRule: "Future combo score modifiers can attach here." },
      { id: "green_finisher", label: "Green finisher", unlockLevel: 5, futureCombatRule: "Ultimate bonuses stay capped here." },
    ],
  },
  {
    id: "boss_hunter",
    name: "Boss Hunter",
    shortName: "Boss",
    theme: "Break major leaks with readable punish windows.",
    role: "boss",
    unlockLevel: 10,
    maxLevel: 5,
    powerPerLevel: 3,
    pointCostPerLevel: 1,
    description: "Future branch for campaign bosses, weekly bosses and tournament boss races.",
    bonuses: [
      { id: "boss_receipts", label: "Boss receipts", unlockLevel: 1, futureCombatRule: "Future boss score modifiers can attach here." },
      { id: "punish_window", label: "Punish window", unlockLevel: 3, futureCombatRule: "Future boss vulnerability windows stay readable and capped." },
      { id: "weekly_breaker", label: "Weekly breaker", unlockLevel: 5, futureCombatRule: "Weekly boss contribution can later reference this branch." },
    ],
  },
  {
    id: "leak_control",
    name: "Leak Control",
    shortName: "Control",
    theme: "Control waves before the arena becomes expensive.",
    role: "control",
    unlockLevel: 12,
    maxLevel: 5,
    powerPerLevel: 3,
    pointCostPerLevel: 1,
    description: "Future branch for crowd control, trap value and anti-swarm builds.",
    bonuses: [
      { id: "swarm_filter", label: "Swarm filter", unlockLevel: 1, futureCombatRule: "Future wave-control scoring can attach here." },
      { id: "receipt_zone", label: "Receipt zone", unlockLevel: 3, futureCombatRule: "Future trap or zone bonuses stay capped here." },
      { id: "leak_lock", label: "Leak lock", unlockLevel: 5, futureCombatRule: "Future crowd-control caps can be tuned from this branch." },
    ],
  },
  {
    id: "survivor",
    name: "Broke Survivor",
    shortName: "Survive",
    theme: "Stay alive long enough to close the leak.",
    role: "survival",
    unlockLevel: 15,
    maxLevel: 5,
    powerPerLevel: 3,
    pointCostPerLevel: 1,
    description: "Future branch for sustain, recovery windows and safe builds.",
    bonuses: [
      { id: "cheap_recovery", label: "Cheap recovery", unlockLevel: 1, futureCombatRule: "Future healing and recovery hooks can reference this branch." },
      { id: "long_run", label: "Long run", unlockLevel: 3, futureCombatRule: "Future survival scoring can attach here." },
      { id: "zero_leak_stand", label: "Zero-leak stand", unlockLevel: 5, futureCombatRule: "Future capped comeback mechanics can be routed here." },
    ],
  },
];

export const MASTERY_SYSTEM_DEFINITION: MasterySystemDefinition = {
  version: MASTERY_SYSTEM_VERSION,
  maxBranchLevel: 5,
  maxTotalBranchLevels: MASTERY_BRANCHES.reduce((total, branch) => total + branch.maxLevel, 0),
  maxPowerContribution: 80,
  pointRules: [
    "Mastery is a long-term horizontal progression layer, not direct uncapped damage scaling.",
    "Each branch changes a future playstyle hook: guard, dash, skills, bosses, control or survival.",
    "Mastery power contributes to capped PowerScore, but this patch does not apply mastery bonuses to combat.",
    "Mastery spending stays local skeleton until upgrade UI, economy costs and backend-safe validation are added.",
  ],
  branches: MASTERY_BRANCHES,
};

export function getMasteryBranchDefinition(branchId: string): MasteryBranchDefinition {
  const branch = MASTERY_BRANCHES.find((candidate) => candidate.id === branchId);
  if (!branch) {
    throw new Error(`Unknown mastery branch: ${branchId}`);
  }
  return branch;
}

export function normalizeMasteryBranchLevel(branchId: string, level: unknown): number {
  const branch = getMasteryBranchDefinition(branchId);
  return Math.max(0, Math.min(branch.maxLevel, Math.floor(Number(level) || 0)));
}

export function getMasteryBranchPower(branchId: string, level: number): number {
  const branch = getMasteryBranchDefinition(branchId);
  return normalizeMasteryBranchLevel(branchId, level) * branch.powerPerLevel;
}

export function getMasteryBranchUnlockLabel(branch: MasteryBranchDefinition, playerLevel: number): string {
  if (playerLevel >= branch.unlockLevel) return "UNLOCKED";
  return `UNLOCKS LV ${branch.unlockLevel}`;
}
