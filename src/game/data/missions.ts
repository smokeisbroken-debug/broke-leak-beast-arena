import type { MissionDefinition } from "../types/economy";

export const DAILY_MISSIONS: MissionDefinition[] = [
  { id: "survive_60", title: "Survive 60 seconds", rewardSafePoints: 50 },
  { id: "defeat_20", title: "Defeat 20 Leak Beasts", rewardSafePoints: 75 },
  { id: "dodge_10", title: "Dodge 10 attacks", rewardSafePoints: 40 },
  { id: "no_hit", title: "Complete a no-hit run", rewardSafePoints: 120 },
];
