export type SkillSlot = "basic" | "heavy" | "defense" | "mobility" | "skill_1" | "skill_2" | "ultimate";
export type ActiveSkillSlot = "skill1" | "skill2" | "ultimate";
export type SkillTarget = "enemy" | "self" | "area";
export type SkillEffect = "damage" | "shield" | "dash" | "trap" | "heal" | "buff" | "push";
export type SkillRarity = "starter" | "common" | "rare" | "epic" | "legendary";

export interface SkillDefinition {
  id: string;
  name: string;
  slot: SkillSlot;
  target: SkillTarget;
  effect: SkillEffect;
  rarity: SkillRarity;
  damage: number;
  healAmount?: number;
  range: number;
  knockback: number;
  cooldownMs: number;
  energyCost: number;
  unlockLevel: number;
  uiColor: string;
  color: number;
  description: string;
}

export interface SkillLoadoutIds {
  basic: string;
  heavy: string;
  defense: string;
  mobility: string;
  skill1: string;
  skill2: string;
  ultimate: string;
}

export const SKILLS: SkillDefinition[] = [
  {
    id: "green_punch",
    name: "Green Punch",
    slot: "basic",
    target: "enemy",
    effect: "damage",
    rarity: "starter",
    damage: 8,
    range: 114,
    knockback: 150,
    cooldownMs: 235,
    energyCost: 0,
    unlockLevel: 1,
    uiColor: "#72ff57",
    color: 0x72ff57,
    description: "Fast basic punch. Builds pressure and starts combo chains.",
  },
  {
    id: "power_kick",
    name: "Power Kick",
    slot: "heavy",
    target: "enemy",
    effect: "damage",
    rarity: "starter",
    damage: 18,
    range: 164,
    knockback: 360,
    cooldownMs: 660,
    energyCost: 0,
    unlockLevel: 1,
    uiColor: "#ffeb72",
    color: 0xffeb72,
    description: "Heavy kick with stronger knockback and slower recovery.",
  },
  {
    id: "wallet_guard",
    name: "Wallet Guard",
    slot: "defense",
    target: "self",
    effect: "shield",
    rarity: "starter",
    damage: 0,
    range: 0,
    knockback: 0,
    cooldownMs: 0,
    energyCost: 0,
    unlockLevel: 1,
    uiColor: "#72ff57",
    color: 0x72ff57,
    description: "Hold to reduce incoming damage and open counter windows.",
  },
  {
    id: "broke_dash",
    name: "Broke Dash",
    slot: "mobility",
    target: "self",
    effect: "dash",
    rarity: "starter",
    damage: 0,
    range: 0,
    knockback: 0,
    cooldownMs: 860,
    energyCost: 0,
    unlockLevel: 1,
    uiColor: "#d9a7ff",
    color: 0xa45cff,
    description: "Short evasive burst with brief invulnerability.",
  },
  {
    id: "green_slash",
    name: "Green Slash",
    slot: "skill_1",
    target: "enemy",
    effect: "damage",
    rarity: "starter",
    damage: 22,
    range: 205,
    knockback: 430,
    cooldownMs: 5200,
    energyCost: 18,
    unlockLevel: 1,
    uiColor: "#72ff57",
    color: 0x72ff57,
    description: "Forward skill strike. Longer range than punch and good for counter pressure.",
  },
  {
    id: "cashback_heal",
    name: "Cashback Heal",
    slot: "skill_2",
    target: "self",
    effect: "heal",
    rarity: "starter",
    damage: 0,
    healAmount: 18,
    range: 0,
    knockback: 0,
    cooldownMs: 9000,
    energyCost: 24,
    unlockLevel: 1,
    uiColor: "#fcfff7",
    color: 0xfcfff7,
    description: "Recover wallet HP after surviving a pressure window.",
  },
  {
    id: "anti_fomo_pulse",
    name: "Anti-FOMO Pulse",
    slot: "skill_2",
    target: "area",
    effect: "push",
    rarity: "rare",
    damage: 14,
    range: 230,
    knockback: 520,
    cooldownMs: 7600,
    energyCost: 22,
    unlockLevel: 4,
    uiColor: "#d9a7ff",
    color: 0xa45cff,
    description: "Area pulse that damages and pushes aggressive enemies away.",
  },
  {
    id: "debt_breaker",
    name: "Debt Breaker",
    slot: "skill_1",
    target: "enemy",
    effect: "damage",
    rarity: "rare",
    damage: 30,
    range: 176,
    knockback: 300,
    cooldownMs: 8200,
    energyCost: 30,
    unlockLevel: 5,
    uiColor: "#ffeb72",
    color: 0xffeb72,
    description: "Heavy skill hit designed to crack guarded enemies and bosses.",
  },
  {
    id: "leak_trap",
    name: "Leak Trap",
    slot: "skill_2",
    target: "area",
    effect: "trap",
    rarity: "epic",
    damage: 16,
    range: 190,
    knockback: 180,
    cooldownMs: 10500,
    energyCost: 34,
    unlockLevel: 7,
    uiColor: "#ff9aaa",
    color: 0xff4866,
    description: "Future trap skill: places a punish zone for rushing enemies.",
  },
  {
    id: "wallet_protection_mode",
    name: "Wallet Protection Mode",
    slot: "ultimate",
    target: "self",
    effect: "buff",
    rarity: "legendary",
    damage: 0,
    range: 0,
    knockback: 0,
    cooldownMs: 0,
    energyCost: 100,
    unlockLevel: 5,
    uiColor: "#72ff57",
    color: 0x72ff57,
    description: "Ultimate slot. Next step: energy bar and temporary protection mode.",
  },
];

export const DEFAULT_LOADOUT: SkillLoadoutIds = {
  basic: "green_punch",
  heavy: "power_kick",
  defense: "wallet_guard",
  mobility: "broke_dash",
  skill1: "green_slash",
  skill2: "cashback_heal",
  ultimate: "wallet_protection_mode",
};

export const STARTER_SKILL_IDS = [
  "green_punch",
  "power_kick",
  "wallet_guard",
  "broke_dash",
  "green_slash",
  "cashback_heal",
  "wallet_protection_mode",
];

export function getSkillById(skillId: string): SkillDefinition {
  return SKILLS.find((skill) => skill.id === skillId) ?? SKILLS[0];
}

export function getActiveSkills(): SkillDefinition[] {
  return SKILLS.filter((skill) => skill.slot === "skill_1" || skill.slot === "skill_2" || skill.slot === "ultimate");
}

export function getSkillsForLoadoutSlot(slot: ActiveSkillSlot): SkillDefinition[] {
  if (slot === "skill1") return SKILLS.filter((skill) => skill.slot === "skill_1");
  if (slot === "skill2") return SKILLS.filter((skill) => skill.slot === "skill_2");
  return SKILLS.filter((skill) => skill.slot === "ultimate");
}

export function getSkillRarityColor(skill: SkillDefinition): string {
  if (skill.rarity === "legendary") return "#72ff57";
  if (skill.rarity === "epic") return "#d9a7ff";
  if (skill.rarity === "rare") return "#ffeb72";
  if (skill.rarity === "common") return "#fcfff7";
  return "#d7ffd0";
}

export function isSkillUnlocked(unlockedSkillIds: string[], skillId: string): boolean {
  return unlockedSkillIds.includes(skillId);
}
