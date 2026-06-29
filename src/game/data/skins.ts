export type SkinRarity = "common" | "rare" | "epic" | "legendary" | "event";

export interface SkinStatBonuses {
  hpPercent?: number;
  speedPercent?: number;
  punchDamagePercent?: number;
  kickDamagePercent?: number;
  dashCooldownPercent?: number;
  blockReductionPercent?: number;
}

export interface SkinUnlockRule {
  type: "starter" | "coins" | "achievement" | "event" | "boss_trophy";
  value?: number | string;
}

export interface SkinDefinition {
  id: string;
  heroId: string;
  name: string;
  rarity: SkinRarity;
  assetKey: string;
  previewKey: string;
  bonuses: SkinStatBonuses;
  unlock: SkinUnlockRule;
  description: string;
}

export const SKINS: SkinDefinition[] = [
  {
    id: "default_broke",
    heroId: "broke_mascot",
    name: "Default Broke",
    rarity: "common",
    assetKey: "mascot-idle-front",
    previewKey: "mascot-idle-front",
    bonuses: {},
    unlock: { type: "starter" },
    description: "Base fighter skin. No bonus, clean balance baseline.",
  },
  {
    id: "ninja_broke",
    heroId: "broke_mascot",
    name: "Ninja Broke",
    rarity: "rare",
    assetKey: "mascot-idle-front",
    previewKey: "mascot-idle-front",
    bonuses: { speedPercent: 4, dashCooldownPercent: -6 },
    unlock: { type: "coins", value: 650 },
    description: "Fast movement and shorter dash recovery.",
  },
  {
    id: "samurai_broke",
    heroId: "broke_mascot",
    name: "Samurai Broke",
    rarity: "epic",
    assetKey: "mascot-idle-front",
    previewKey: "mascot-idle-front",
    bonuses: { punchDamagePercent: 6, blockReductionPercent: 6 },
    unlock: { type: "boss_trophy", value: "rug_pull_beast" },
    description: "Better punish windows after blocking heavy attacks.",
  },
  {
    id: "cyber_broke",
    heroId: "broke_mascot",
    name: "Cyber Broke",
    rarity: "epic",
    assetKey: "mascot-idle-front",
    previewKey: "mascot-idle-front",
    bonuses: { kickDamagePercent: 6, speedPercent: 2 },
    unlock: { type: "achievement", value: "win_10_fights" },
    description: "Aggressive arena fighter with stronger kicks.",
  },
  {
    id: "diamond_broke",
    heroId: "broke_mascot",
    name: "Diamond Broke",
    rarity: "legendary",
    assetKey: "mascot-idle-front",
    previewKey: "mascot-idle-front",
    bonuses: { hpPercent: 8, blockReductionPercent: 8 },
    unlock: { type: "achievement", value: "perfect_boss_win" },
    description: "High durability skin for boss runs.",
  },
  {
    id: "street_broke",
    heroId: "broke_mascot",
    name: "Street Broke",
    rarity: "rare",
    assetKey: "mascot-idle-front",
    previewKey: "mascot-idle-front",
    bonuses: { punchDamagePercent: 4 },
    unlock: { type: "coins", value: 420 },
    description: "Simple punch-focused street fighter setup.",
  },
  {
    id: "investor_broke",
    heroId: "broke_mascot",
    name: "Investor Broke",
    rarity: "event",
    assetKey: "mascot-idle-front",
    previewKey: "mascot-idle-front",
    bonuses: { hpPercent: 4, speedPercent: 2 },
    unlock: { type: "event", value: "launch_event" },
    description: "Event skin prepared for future economy hooks.",
  },
  {
    id: "shadow_broke",
    heroId: "broke_mascot",
    name: "Shadow Broke",
    rarity: "legendary",
    assetKey: "mascot-idle-front",
    previewKey: "mascot-idle-front",
    bonuses: { speedPercent: 6, dashCooldownPercent: -8, kickDamagePercent: 4 },
    unlock: { type: "achievement", value: "no_hit_chapter" },
    description: "Late-game evasive skin for high-skill fights.",
  },
];

export const STARTER_SKIN_IDS = SKINS.filter((skin) => skin.unlock.type === "starter").map((skin) => skin.id);
export const DEFAULT_SKIN_ID = "default_broke";

export function getSkinById(skinId: string): SkinDefinition {
  return SKINS.find((skin) => skin.id === skinId) ?? SKINS[0];
}
