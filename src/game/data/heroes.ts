export type HeroId = "broke_mascot";

export interface HeroDefinition {
  id: HeroId;
  name: string;
  title: string;
  baseHp: number;
  baseSpeed: number;
  defaultSkinId: string;
  defaultSkillIds: string[];
  description: string;
}

export const HEROES: HeroDefinition[] = [
  {
    id: "broke_mascot",
    name: "BROKE Mascot",
    title: "Wallet Defender",
    baseHp: 100,
    baseSpeed: 260,
    defaultSkinId: "default_broke",
    defaultSkillIds: ["green_punch", "power_kick", "wallet_guard", "broke_dash"],
    description: "The core fighter. Balanced movement, strong counters, and defensive wallet control.",
  },
];

export const DEFAULT_HERO_ID: HeroId = "broke_mascot";

export function getHeroById(heroId: string): HeroDefinition {
  return HEROES.find((hero) => hero.id === heroId) ?? HEROES[0];
}
