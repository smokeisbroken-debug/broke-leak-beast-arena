import { GAME_MODE_DEFINITIONS, type GameModeId } from "../types/GameModeTypes";
import { GAME_MODE_REGISTRY_DEFINITION, GAME_MODE_ROUTES, createModeRegistrySnapshot } from "./ModeRegistry";
import { LEADERBOARD_DEFINITIONS, type LeaderboardId } from "../types/LeaderboardTypes";
import { DEFAULT_POWER_CAPS } from "../types/ProgressionTypes";
import { BALANCE_SYSTEM_DEFINITION } from "../types/BalanceTypes";
import {
  CURRENCY_DEFINITIONS,
  ECONOMY_SYSTEM_DEFINITION,
  REWARD_SOURCE_DEFINITIONS,
  type CurrencyId,
} from "../types/EconomyTypes";
import { TASK_SKELETON_DEFINITIONS } from "../types/TaskTypes";
import { TOURNAMENT_DEFINITIONS } from "../types/TournamentTypes";
import { LEAK_DUEL_DEFINITION } from "../types/DuelTypes";
import { SAVE_SCHEMA_DEFINITION_V2 } from "../types/SaveSchemaTypes";
import { PLAYER_PROFILE_V2_DEFINITION } from "./ProfileSystem";
import { EVOLUTION_SYSTEM_DEFINITION } from "../types/EvolutionTypes";

export const GAME_SYSTEMS_VERSION = "0.9.3-mascot-evolution-skeleton";

export type GameSystemId =
  | "modes"
  | "profile"
  | "progression"
  | "evolution"
  | "economy"
  | "balance"
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
  modeRoutes: typeof GAME_MODE_ROUTES;
  modeRegistry: ReturnType<typeof createModeRegistrySnapshot>;
  modeRegistryDefinition: typeof GAME_MODE_REGISTRY_DEFINITION;
  economy: typeof ECONOMY_SYSTEM_DEFINITION;
  balance: typeof BALANCE_SYSTEM_DEFINITION;
  currencies: typeof CURRENCY_DEFINITIONS;
  rewardSources: typeof REWARD_SOURCE_DEFINITIONS;
  powerCaps: typeof DEFAULT_POWER_CAPS;
  leaderboards: typeof LEADERBOARD_DEFINITIONS;
  taskSkeletons: typeof TASK_SKELETON_DEFINITIONS;
  tournamentSkeletons: typeof TOURNAMENT_DEFINITIONS;
  duelSkeleton: typeof LEAK_DUEL_DEFINITION;
  saveSchema: typeof SAVE_SCHEMA_DEFINITION_V2;
  playerProfile: typeof PLAYER_PROFILE_V2_DEFINITION;
  evolution: typeof EVOLUTION_SYSTEM_DEFINITION;
}

export const GAME_SYSTEMS: readonly GameSystemDefinition[] = [
  {
    id: "modes",
    title: "Mode Registry",
    status: "skeleton",
    priority: "now",
    goal: "Centralize playable, ranked and backend-locked mode routes before UI and multiplayer work expands.",
    dependsOn: [],
    relatedModes: ["arena", "campaign", "tasks", "profile", "leaderboard", "tournament", "leak_duel", "weekly_boss"],
    nextPatch: "v0.9.3-mascot-evolution-skeleton",
  },
  {
    id: "profile",
    title: "Player Profile",
    status: "existing",
    priority: "now",
    goal: "Store identity, selected loadout, synced wallet, capped power score and future multiplayer-safe fields.",
    dependsOn: ["modes"],
    relatedModes: ["profile", "arena", "campaign"],
    nextPatch: "v0.9.3-mascot-evolution-skeleton",
  },
  {
    id: "progression",
    title: "Progression",
    status: "existing",
    priority: "now",
    goal: "Unify level, XP, mastery placeholders and capped power score.",
    dependsOn: ["modes", "profile"],
    relatedModes: ["profile", "campaign", "leaderboard"],
    nextPatch: "v0.9.3-mascot-evolution-skeleton",
  },
  {
    id: "evolution",
    title: "Mascot Evolution",
    status: "skeleton",
    priority: "now",
    goal: "Define capped long-term mascot forms for profile identity, PowerScore and future seasons without direct combat scaling yet.",
    dependsOn: ["modes", "profile", "progression"],
    relatedModes: ["profile", "campaign", "leaderboard", "tournament", "leak_duel"],
    nextPatch: "v0.9.4-skill-upgrade-skeleton",
  },
  {
    id: "economy",
    title: "Economy",
    status: "skeleton",
    priority: "now",
    goal: "Separate XP, coins, leak points, rank points, tournament points and cosmetics.",
    dependsOn: ["modes", "profile", "progression", "evolution"],
    relatedModes: ["tasks", "tournament", "leak_duel", "weekly_boss"],
    nextPatch: "v0.9.4-skill-upgrade-skeleton",
  },
  {
    id: "balance",
    title: "Balance Formula",
    status: "skeleton",
    priority: "now",
    goal: "Define capped power score, difficulty score and matchup evaluation before ranked systems go live.",
    dependsOn: ["modes", "profile", "progression", "evolution", "economy"],
    relatedModes: ["arena", "campaign", "leaderboard", "tournament", "leak_duel", "weekly_boss"],
    nextPatch: "v0.9.4-skill-upgrade-skeleton",
  },
  {
    id: "tasks",
    title: "Tasks",
    status: "skeleton",
    priority: "next",
    goal: "Award task points, progression rewards and future leaderboard activity score.",
    dependsOn: ["profile", "economy", "balance"],
    relatedModes: ["tasks", "leaderboard", "tournament", "leak_duel"],
    nextPatch: "v0.9.7-task-system-skeleton",
  },
  {
    id: "leaderboard",
    title: "Leaderboard",
    status: "skeleton",
    priority: "next",
    goal: "Support global power, weekly arena, tasks, tournaments, duels and boss damage.",
    dependsOn: ["profile", "progression", "evolution", "balance", "tasks", "anti_cheat"],
    relatedModes: ["leaderboard", "tournament", "leak_duel", "weekly_boss"],
    nextPatch: "v0.10.2-leaderboard-types",
  },
  {
    id: "tournaments",
    title: "Tournaments",
    status: "skeleton",
    priority: "next",
    goal: "Define time-boxed events with rules, participation points and ranked scoring.",
    dependsOn: ["leaderboard", "economy", "balance", "anti_cheat"],
    relatedModes: ["tournament", "leaderboard"],
    nextPatch: "v0.10.7-tournament-types",
  },
  {
    id: "duels",
    title: "Leak Duel 1v1",
    status: "skeleton",
    priority: "next",
    goal: "Create asynchronous 1 vs 1 battles on identical leak-pressure seeds.",
    dependsOn: ["leaderboard", "economy", "balance", "anti_cheat"],
    relatedModes: ["leak_duel", "leaderboard"],
    nextPatch: "v0.11.3-duel-types",
  },
  {
    id: "campaign",
    title: "Campaign",
    status: "existing",
    priority: "later",
    goal: "Turn PvE chapters into the main onboarding and long-term boss journey.",
    dependsOn: ["profile", "progression", "economy", "balance"],
    relatedModes: ["campaign"],
    nextPatch: "v0.11.9-campaign-chapter-skeleton",
  },
  {
    id: "bosses",
    title: "Bosses",
    status: "existing",
    priority: "later",
    goal: "Connect solo bosses, campaign bosses and weekly community bosses.",
    dependsOn: ["campaign", "leaderboard", "balance"],
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
  modeRoutes: GAME_MODE_ROUTES,
  modeRegistry: createModeRegistrySnapshot(),
  modeRegistryDefinition: GAME_MODE_REGISTRY_DEFINITION,
  economy: ECONOMY_SYSTEM_DEFINITION,
  balance: BALANCE_SYSTEM_DEFINITION,
  currencies: CURRENCY_DEFINITIONS,
  rewardSources: REWARD_SOURCE_DEFINITIONS,
  powerCaps: DEFAULT_POWER_CAPS,
  leaderboards: LEADERBOARD_DEFINITIONS,
  taskSkeletons: TASK_SKELETON_DEFINITIONS,
  tournamentSkeletons: TOURNAMENT_DEFINITIONS,
  duelSkeleton: LEAK_DUEL_DEFINITION,
  saveSchema: SAVE_SCHEMA_DEFINITION_V2,
  playerProfile: PLAYER_PROFILE_V2_DEFINITION,
  evolution: EVOLUTION_SYSTEM_DEFINITION,
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
    global_power: ["profile", "progression", "evolution", "balance", "leaderboard"],
    weekly_arena: ["profile", "balance", "leaderboard", "anti_cheat"],
    task_points: ["tasks", "leaderboard", "anti_cheat"],
    tournament: ["tournaments", "balance", "leaderboard", "anti_cheat"],
    duel_ranked: ["duels", "balance", "leaderboard", "anti_cheat"],
    boss_damage: ["bosses", "balance", "leaderboard", "anti_cheat"],
  };

  return leaderboardSystemIds[leaderboardId].map(getGameSystem);
}

export function getCurrencyBackendRequirements(): Record<CurrencyId, boolean> {
  return CURRENCY_DEFINITIONS.reduce<Record<CurrencyId, boolean>>((requirements, currency) => {
    requirements[currency.id] = currency.backendValidationRequired;
    return requirements;
  }, {} as Record<CurrencyId, boolean>);
}
