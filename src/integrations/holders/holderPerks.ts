import type { HolderPerk } from "../../game/types/economy";

export function getMockHolderPerk(): HolderPerk {
  // Later: verify wallet / balance off-chain or via backend.
  return {
    tier: "none",
    cosmeticSkins: [],
    dailyEnergyBonus: 0,
    notes: "Holder perks should stay mostly cosmetic. Avoid heavy pay-to-win.",
  };
}
