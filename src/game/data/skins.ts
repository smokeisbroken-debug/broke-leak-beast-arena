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
  tintColor: number;
  auraColor: number;
  uiColor: string;
  bonuses: SkinStatBonuses;
  unlock: SkinUnlockRule;
  description: string;
}

export interface SkinProfileState {
  selectedSkinId: string;
  unlockedSkinIds: string[];
  coins: number;
  totalWins: number;
  bestScore: number;
  bossProgress: Record<string, boolean>;
}

export const SKINS: SkinDefinition[] = [
  {
    id: "default_broke",
    heroId: "broke_mascot",
    name: "Default Broke",
    rarity: "common",
    assetKey: "mascot-idle-front",
    previewKey: "mascot-idle-front",
    tintColor: 0xffffff,
    auraColor: 0x72ff57,
    uiColor: "#72ff57",
    bonuses: {},
    unlock: { type: "starter" },
    description: "Base fighter skin. Balanced stats and clean baseline.",
  },
  {
    id: "ninja_broke",
    heroId: "broke_mascot",
    name: "Ninja Broke",
    rarity: "rare",
    assetKey: "mascot-idle-front",
    previewKey: "mascot-idle-front",
    tintColor: 0xd8fff0,
    auraColor: 0x72ff57,
    uiColor: "#72ff57",
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
    tintColor: 0xfff0cf,
    auraColor: 0xffeb72,
    uiColor: "#ffeb72",
    bonuses: { punchDamagePercent: 6, blockReductionPercent: 6 },
    unlock: { type: "boss_trophy", value: "rug_pull_beast" },
    description: "Better punch pressure and stronger block discipline.",
  },
  {
    id: "cyber_broke",
    heroId: "broke_mascot",
    name: "Cyber Broke",
    rarity: "epic",
    assetKey: "mascot-idle-front",
    previewKey: "mascot-idle-front",
    tintColor: 0xd4f6ff,
    auraColor: 0x4de8ff,
    uiColor: "#4de8ff",
    bonuses: { kickDamagePercent: 6, speedPercent: 2 },
    unlock: { type: "boss_trophy", value: "gambling_demon" },
    description: "Aggressive arena fighter unlocked by breaking risky burst pressure.",
  },
  {
    id: "diamond_broke",
    heroId: "broke_mascot",
    name: "Diamond Broke",
    rarity: "legendary",
    assetKey: "mascot-idle-front",
    previewKey: "mascot-idle-front",
    tintColor: 0xe7f3ff,
    auraColor: 0xb6e8ff,
    uiColor: "#b6e8ff",
    bonuses: { hpPercent: 8, blockReductionPercent: 8 },
    unlock: { type: "boss_trophy", value: "wallet_destroyer_boss" },
    description: "High durability skin for final boss runs.",
  },
  {
    id: "street_broke",
    heroId: "broke_mascot",
    name: "Street Broke",
    rarity: "rare",
    assetKey: "mascot-idle-front",
    previewKey: "mascot-idle-front",
    tintColor: 0xfff5df,
    auraColor: 0xff9a48,
    uiColor: "#ffb15c",
    bonuses: { punchDamagePercent: 4 },
    unlock: { type: "starter" },
    description: "Starter punch-focused skin for testing the skin stat system.",
  },
  {
    id: "investor_broke",
    heroId: "broke_mascot",
    name: "Investor Broke",
    rarity: "event",
    assetKey: "mascot-idle-front",
    previewKey: "mascot-idle-front",
    tintColor: 0xe0ffd0,
    auraColor: 0x39ff14,
    uiColor: "#39ff14",
    bonuses: { hpPercent: 4, speedPercent: 2 },
    unlock: { type: "boss_trophy", value: "lifestyle_dragon" },
    description: "Late campaign skin prepared for lifestyle leak victories.",
  },
  {
    id: "shadow_broke",
    heroId: "broke_mascot",
    name: "Shadow Broke",
    rarity: "legendary",
    assetKey: "mascot-idle-front",
    previewKey: "mascot-idle-front",
    tintColor: 0xdcc4ff,
    auraColor: 0xa45cff,
    uiColor: "#d9a7ff",
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

export function getSkinRarityColor(rarity: SkinRarity): string {
  if (rarity === "rare") return "#72ff57";
  if (rarity === "epic") return "#d9a7ff";
  if (rarity === "legendary") return "#ffeb72";
  if (rarity === "event") return "#4de8ff";
  return "#fcfff7";
}

export function formatSkinBonuses(skin: SkinDefinition): string {
  const bonuses: string[] = [];
  const b = skin.bonuses;
  if (b.hpPercent) bonuses.push(`HP +${b.hpPercent}%`);
  if (b.speedPercent) bonuses.push(`SPD +${b.speedPercent}%`);
  if (b.punchDamagePercent) bonuses.push(`PUNCH +${b.punchDamagePercent}%`);
  if (b.kickDamagePercent) bonuses.push(`KICK +${b.kickDamagePercent}%`);
  if (b.dashCooldownPercent) bonuses.push(`DASH ${b.dashCooldownPercent}%`);
  if (b.blockReductionPercent) bonuses.push(`BLOCK +${b.blockReductionPercent}%`);
  return bonuses.length > 0 ? bonuses.join(" · ") : "Balanced baseline";
}

export function getSkinUnlockLabel(skin: SkinDefinition): string {
  const value = skin.unlock.value;
  if (skin.unlock.type === "starter") return "Starter";
  if (skin.unlock.type === "coins") return `${value} coins`;
  if (skin.unlock.type === "boss_trophy") return `Trophy: ${String(value).split("_").join(" ")}`;
  if (skin.unlock.type === "achievement") return `Achievement: ${String(value).split("_").join(" ")}`;
  return `Event: ${String(value ?? "future")}`;
}

export function isSkinUnlocked(profile: Pick<SkinProfileState, "unlockedSkinIds">, skinId: string): boolean {
  return profile.unlockedSkinIds.includes(skinId);
}

export function canUnlockSkin(profile: SkinProfileState, skin: SkinDefinition): boolean {
  if (isSkinUnlocked(profile, skin.id)) return false;
  const value = skin.unlock.value;
  if (skin.unlock.type === "starter") return true;
  if (skin.unlock.type === "coins") return typeof value === "number" && profile.coins >= value;
  if (skin.unlock.type === "boss_trophy") return typeof value === "string" && Boolean(profile.bossProgress[value]);
  if (skin.unlock.type === "achievement") {
    if (value === "win_10_fights") return profile.totalWins >= 10;
    if (value === "perfect_boss_win") return profile.bestScore >= 5000;
    if (value === "no_hit_chapter") return profile.bestScore >= 7000;
  }
  return false;
}

export function getSkinStatMultiplier(percent?: number): number {
  return 1 + (percent ?? 0) / 100;
}
