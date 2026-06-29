export type SkillSlot = "basic" | "heavy" | "defense" | "mobility" | "skill_1" | "skill_2" | "ultimate";
export type SkillTarget = "enemy" | "self" | "area";
export type SkillEffect = "damage" | "shield" | "dash" | "trap" | "heal" | "buff" | "push";

export interface SkillDefinition {
  id: string;
  name: string;
  slot: SkillSlot;
  target: SkillTarget;
  effect: SkillEffect;
  damage: number;
  range: number;
  cooldownMs: number;
  energyCost: number;
  unlockLevel: number;
  description: string;
}

export const SKILLS: SkillDefinition[] = [
  {
    id: "green_punch",
    name: "Green Punch",
    slot: "basic",
    target: "enemy",
    effect: "damage",
    damage: 8,
    range: 114,
    cooldownMs: 235,
    energyCost: 0,
    unlockLevel: 1,
    description: "Fast basic punch. Builds pressure and starts combo chains.",
  },
  {
    id: "power_kick",
    name: "Power Kick",
    slot: "heavy",
    target: "enemy",
    effect: "damage",
    damage: 18,
    range: 164,
    cooldownMs: 660,
    energyCost: 0,
    unlockLevel: 1,
    description: "Heavy kick with stronger knockback and slower recovery.",
  },
  {
    id: "wallet_guard",
    name: "Wallet Guard",
    slot: "defense",
    target: "self",
    effect: "shield",
    damage: 0,
    range: 0,
    cooldownMs: 0,
    energyCost: 0,
    unlockLevel: 1,
    description: "Hold to reduce incoming damage and open counter windows.",
  },
  {
    id: "broke_dash",
    name: "Broke Dash",
    slot: "mobility",
    target: "self",
    effect: "dash",
    damage: 0,
    range: 0,
    cooldownMs: 860,
    energyCost: 0,
    unlockLevel: 1,
    description: "Short evasive burst with brief invulnerability.",
  },
  {
    id: "green_slash",
    name: "Green Slash",
    slot: "skill_1",
    target: "enemy",
    effect: "damage",
    damage: 22,
    range: 190,
    cooldownMs: 5200,
    energyCost: 18,
    unlockLevel: 2,
    description: "Forward skill strike prepared for the active skill system.",
  },
  {
    id: "cashback_heal",
    name: "Cashback Heal",
    slot: "skill_2",
    target: "self",
    effect: "heal",
    damage: 0,
    range: 0,
    cooldownMs: 9000,
    energyCost: 24,
    unlockLevel: 3,
    description: "Recover wallet HP after surviving a pressure window.",
  },
  {
    id: "anti_fomo_pulse",
    name: "Anti-FOMO Pulse",
    slot: "skill_2",
    target: "area",
    effect: "push",
    damage: 14,
    range: 210,
    cooldownMs: 7600,
    energyCost: 22,
    unlockLevel: 4,
    description: "Area pulse that pushes aggressive enemies away.",
  },
  {
    id: "wallet_protection_mode",
    name: "Wallet Protection Mode",
    slot: "ultimate",
    target: "self",
    effect: "buff",
    damage: 0,
    range: 0,
    cooldownMs: 0,
    energyCost: 100,
    unlockLevel: 5,
    description: "Ultimate slot. Future implementation: temporary damage reduction and counter boost.",
  },
];

export const DEFAULT_LOADOUT = {
  basic: "green_punch",
  heavy: "power_kick",
  defense: "wallet_guard",
  mobility: "broke_dash",
  skill1: "green_slash",
  skill2: "cashback_heal",
  ultimate: "wallet_protection_mode",
};

export function getSkillById(skillId: string): SkillDefinition {
  return SKILLS.find((skill) => skill.id === skillId) ?? SKILLS[0];
}
