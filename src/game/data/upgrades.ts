import type { UpgradeDefinition } from "../types/economy";

export const UPGRADES: UpgradeDefinition[] = [
  { id: "speed_boost", name: "Speed Boost", description: "Move faster during arena runs." },
  { id: "shield", name: "Shield", description: "Block one hit at the start of a run." },
  { id: "magnet", name: "Magnet", description: "Pull Safe Points from a wider range." },
  { id: "invincibility", name: "Temporary Invincibility", description: "Short safety window after taking damage." },
  { id: "damage_boost", name: "Damage Boost", description: "Deal more damage to Leak Beasts and bosses." },
];
