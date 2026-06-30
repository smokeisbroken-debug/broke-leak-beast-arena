import { GAME_MODE_DEFINITIONS, type GameModeId } from "../types/GameModeTypes";
import { LEADERBOARD_DEFINITIONS, type LeaderboardId } from "../types/LeaderboardTypes";
import { DEFAULT_POWER_CAPS } from "../types/ProgressionTypes";
import {
  CURRENCY_DEFINITIONS,
  ECONOMY_SYSTEM_DEFINITION,
  REWARD_SOURCE_DEFINITIONS,
  type CurrencyId,
} from "../types/EconomyTypes";
import { TASK_SKELETON_DEFINITIONS } from "../types/TaskTypes";
import { TOURNAMENT_DEFINITIONS } from "../types/TournamentTypes";
import { LEAK_DUEL_DEFINITION } from "../types/DuelTypes";

export const GAME_SYSTEMS_VERSION = "0.8.8-economy-types";

export type GameSystemId =
  | "profile"
  | "progression"
  | "economy"
  | "tasks"
  | "leaderboard"
  | "tournaments"
  | "duels"
  | "campaign"
  | "bosses"
  | "multiplayer"
  | "anti_cheat"
  | "seasons";

export type GameSystemStatus = "existing" | "skeleton" | "planned";
export type GameSystemPriority = "now" | "next" | "later";

export interface GameSystemDefinition {
  id: GameSystemId;
  title: string;
  status: GameSystemStatus;
  priority: GameSystemPriority;
  goal: string;
  dependsOn: GameSystemId[];
  relatedModes: GameModeId[];
  nextPatch: string;
}

export interface GameSystemsRegistrySnapshot {
  version: string;
  systems: readonly GameSystemDefinition[];
  modes: typeof GAME_MODE_DEFINITIONS;
  economy: typeof ECONOMY_SYSTEM_DEFINITION;
  currencies: typeof CURRENCY_DEFINITIONS;
  rewardSources: typeof REWARD_SOURCE_DEFINITIONS;
  powerCaps: typeof DEFAULT_POWER_CAPS;
  leaderboards: typeof LEADERBOARD_DEFINITIONS;
  taskSkeletons: typeof TASK_SKELETON_DEFINITIONS;
  tournamentSkeletons: typeof TOURNAMENT_DEFINITIONS;
  duelSkeleton: typeof LEAK_DUEL_DEFINITION;
}

export const GAME_SYSTEMS: readonly GameSystemDefinition[] = [
  {
    id: "profile",
    title: "Player Profile",
    status: "existing",
    priority: "now",
    goal: "Store identity, selected loadout, progression and future multiplayer-safe fields.",
    dependsOn: [],
    relatedModes: ["profile", "arena", "campaign"],
    nextPatch: "v0.9.1-save-schema-v2",
  },
  {
    id: "progression",
    title: "Progression",
    status: "skeleton",
    priority: "now",
    goal: "Unify level, XP, evolution, mastery and capped power score.",
    dependsOn: ["profile"],
    relatedModes: ["profile", "campaign", "leaderboard"],
    nextPatch: "v0.8.9-balance-formula",
  },
  {
    id: "economy",
    title: "Economy",
    status: "skeleton",
    priority: "now",
    goal: "Separate XP, coins, leak points, rank points, tournament points and cosmetics.",
    dependsOn: ["profile", "progression"],
    relatedModes: ["tasks", "tournament", "leak_duel", "weekly_boss"],
    nextPatch: "v0.8.8-economy-types",
  },
  {
    id: "tasks",
    title: "Tasks",
    status: "skeleton",
    priority: "next",
    goal: "Award task points, progression rewards and future leaderboard activity score.",
    dependsOn: ["profile", "economy"],
    relatedModes: ["tasks", "leaderboard", "tournament", "leak_duel"],
    nextPatch: "v0.9.7-task-system-skeleton",
  },
  {
    id: "leaderboard",
    title: "Leaderboard",
    status: "skeleton",
    priority: "next",
    goal: "Support global power, weekly arena, tasks, tournaments, duels and boss damage.",
    dependsOn: ["profile", "progression", "tasks", "anti_cheat"],
    relatedModes: ["leaderboard", "tournament", "leak_duel", "weekly_boss"],
    nextPatch: "v0.10.2-leaderboard-types",
  },
  {
    id: "tournaments",
    title: "Tournaments",
    status: "skeleton",
    priority: "next",
    goal: "Define time-boxed events with rules, participation points and ranked scoring.",
    dependsOn: ["leaderboard", "economy", "anti_cheat"],
    relatedModes: ["tournament", "leaderboard"],
    nextPatch: "v0.10.7-tournament-types",
  },
  {
    id: "duels",
    title: "Leak Duel 1v1",
    status: "skeleton",
    priority: "next",
    goal: "Create asynchronous 1 vs 1 battles on identical leak-pressure seeds.",
    dependsOn: ["leaderboard", "economy", "anti_cheat"],
    relatedModes: ["leak_duel", "leaderboard"],
    nextPatch: "v0.11.3-duel-types",
  },
  {
    id: "campaign",
    title: "Campaign",
    status: "existing",
    priority: "later",
    goal: "Turn PvE chapters into the main onboarding and long-term boss journey.",
    dependsOn: ["profile", "progression", "economy"],
    relatedModes: ["campaign"],
    nextPatch: "v0.11.9-campaign-chapter-skeleton",
  },
  {
    id: "bosses",
    title: "Bosses",
    status: "existing",
    priority: "later",
    goal: "Connect solo bosses, campaign bosses and weekly community bosses.",
    dependsOn: ["campaign", "leaderboard"],
    relatedModes: ["arena", "campaign", "weekly_boss"],
    nextPatch: "v0.12.0-boss-registry-v2",
  },
  {
    id: "multiplayer",
    title: "Multiplayer Adapter",
    status: "skeleton",
    priority: "later",
    goal: "Prepare backend adapters for save, leaderboard, tournament and duel submission.",
    dependsOn: ["profile", "leaderboard", "tournaments", "duels"],
    relatedModes: ["leaderboard", "tournament", "leak_duel", "weekly_boss"],
    nextPatch: "v0.13.0-multiplayer-adapter",
  },
  {
    id: "anti_cheat",
    title: "Anti-Cheat",
    status: "skeleton",
    priority: "later",
    goal: "Validate run payloads before ranked scores or rewards become real.",
    dependsOn: ["profile", "multiplayer"],
    relatedModes: ["leaderboard", "tournament", "leak_duel", "weekly_boss"],
    nextPatch: "v0.13.3-anti-cheat-skeleton",
  },
  {
    id: "seasons",
    title: "Seasons",
    status: "planned",
    priority: "later",
    goal: "Create long-term progression cycles, cosmetics, missions and seasonal rankings.",
    dependsOn: ["leaderboard", "tournaments", "multiplayer"],
    relatedModes: ["leaderboard", "tournament", "tasks", "weekly_boss"],
    nextPatch: "v0.14.1-season-types",
  },
];

export const GAME_SYSTEMS_REGISTRY: GameSystemsRegistrySnapshot = {
  version: GAME_SYSTEMS_VERSION,
  systems: GAME_SYSTEMS,
  modes: GAME_MODE_DEFINITIONS,
  economy: ECONOMY_SYSTEM_DEFINITION,
  currencies: CURRENCY_DEFINITIONS,
  rewardSources: REWARD_SOURCE_DEFINITIONS,
  powerCaps: DEFAULT_POWER_CAPS,
  leaderboards: LEADERBOARD_DEFINITIONS,
  taskSkeletons: TASK_SKELETON_DEFINITIONS,
  tournamentSkeletons: TOURNAMENT_DEFINITIONS,
  duelSkeleton: LEAK_DUEL_DEFINITION,
};

export function getGameSystem(systemId: GameSystemId): GameSystemDefinition {
  const system = GAME_SYSTEMS.find((candidate) => candidate.id === systemId);
  if (!system) {
    throw new Error(`Unknown game system: ${systemId}`);
  }
  return system;
}

export function getSystemsByPriority(priority: GameSystemPriority): GameSystemDefinition[] {
  return GAME_SYSTEMS.filter((system) => system.priority === priority);
}

export function getSystemsForLeaderboard(leaderboardId: LeaderboardId): GameSystemDefinition[] {
  const leaderboardSystemIds: Record<LeaderboardId, GameSystemId[]> = {
    global_power: ["profile", "progression", "leaderboard"],
    weekly_arena: ["profile", "leaderboard", "anti_cheat"],
    task_points: ["tasks", "leaderboard", "anti_cheat"],
    tournament: ["tournaments", "leaderboard", "anti_cheat"],
    duel_ranked: ["duels", "leaderboard", "anti_cheat"],
    boss_damage: ["bosses", "leaderboard", "anti_cheat"],
  };

  return leaderboardSystemIds[leaderboardId].map(getGameSystem);
}

export function getCurrencyBackendRequirements(): Record<CurrencyId, boolean> {
  return CURRENCY_DEFINITIONS.reduce<Record<CurrencyId, boolean>>((requirements, currency) => {
    requirements[currency.id] = currency.backendValidationRequired;
    return requirements;
  }, {} as Record<CurrencyId, boolean>);
}
