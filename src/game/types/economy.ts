export type UpgradeId = "speed_boost" | "shield" | "magnet" | "invincibility" | "damage_boost";

export interface UpgradeDefinition {
  id: UpgradeId;
  name: string;
  description: string;
}

export interface MissionDefinition {
  id: string;
  title: string;
  rewardSafePoints: number;
}

export interface HolderPerk {
  tier: "none" | "holder" | "strong_holder" | "whale";
  cosmeticSkins: string[];
  dailyEnergyBonus: number;
  notes: string;
}
