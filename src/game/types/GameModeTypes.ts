export type GameModeId =
  | "arena"
  | "campaign"
  | "tasks"
  | "leaderboard"
  | "tournament"
  | "leak_duel"
  | "weekly_boss"
  | "profile";

export type GameModeCategory = "pve" | "pvp" | "progression" | "social" | "meta";
export type GameModeStatus = "live" | "skeleton" | "planned";
export type GameModeAvailability = "playable" | "menu_only" | "mock_ready" | "backend_locked" | "planned";
export type GameModeEntryPoint = "main_menu" | "profile" | "direct_scene" | "future_backend";

export interface GameModeDefinition {
  id: GameModeId;
  title: string;
  category: GameModeCategory;
  status: GameModeStatus;
  shortDescription: string;
  multiplayerReady: boolean;
  ranked: boolean;
  unlockVersion: string;
}

export interface GameModeRouteDefinition {
  modeId: GameModeId;
  menuLabel: string;
  menuSubLabel: string;
  currentSceneKey?: string;
  plannedSceneKey: string;
  availability: GameModeAvailability;
  entryPoint: GameModeEntryPoint;
  sortOrder: number;
  requiresBackend: boolean;
  requiresValidation: boolean;
  nextUnlockPatch: string;
}

export interface GameModeRegistryDefinition {
  version: string;
  title: string;
  routes: readonly GameModeRouteDefinition[];
  rules: readonly string[];
}

export const GAME_MODE_DEFINITIONS: readonly GameModeDefinition[] = [
  {
    id: "arena",
    title: "Arena Run",
    category: "pve",
    status: "live",
    shortDescription: "Solo action run against leak waves and arena bosses.",
    multiplayerReady: false,
    ranked: false,
    unlockVersion: "existing",
  },
  {
    id: "campaign",
    title: "Campaign",
    category: "pve",
    status: "live",
    shortDescription: "Chapter-based PvE progression against themed leak bosses.",
    multiplayerReady: false,
    ranked: false,
    unlockVersion: "existing",
  },
  {
    id: "tasks",
    title: "Tasks",
    category: "progression",
    status: "live",
    shortDescription: "Daily mission loop that will become the task-point backbone.",
    multiplayerReady: false,
    ranked: false,
    unlockVersion: "existing",
  },
  {
    id: "leaderboard",
    title: "Leaderboard",
    category: "social",
    status: "skeleton",
    shortDescription: "Global, weekly, tournament, duel and boss-damage ranking tracks.",
    multiplayerReady: true,
    ranked: true,
    unlockVersion: "v0.10.2+",
  },
  {
    id: "tournament",
    title: "Tournaments",
    category: "social",
    status: "skeleton",
    shortDescription: "Time-boxed events with rules, scoring, participation points and rewards.",
    multiplayerReady: true,
    ranked: true,
    unlockVersion: "v0.10.7+",
  },
  {
    id: "leak_duel",
    title: "Leak Duel",
    category: "pvp",
    status: "skeleton",
    shortDescription: "Asynchronous 1 vs 1 race on the same leak-pressure seed.",
    multiplayerReady: true,
    ranked: true,
    unlockVersion: "v0.11.3+",
  },
  {
    id: "weekly_boss",
    title: "Weekly Boss",
    category: "social",
    status: "skeleton",
    shortDescription: "Community boss contribution track for weekly damage and participation.",
    multiplayerReady: true,
    ranked: true,
    unlockVersion: "v0.13.0+",
  },
  {
    id: "profile",
    title: "Profile",
    category: "meta",
    status: "live",
    shortDescription: "Local player identity, save data, loadout and progression container.",
    multiplayerReady: false,
    ranked: false,
    unlockVersion: "existing",
  },
];

export function getGameModeDefinition(modeId: GameModeId): GameModeDefinition {
  const mode = GAME_MODE_DEFINITIONS.find((candidate) => candidate.id === modeId);
  if (!mode) {
    throw new Error(`Unknown game mode: ${modeId}`);
  }
  return mode;
}

export function getRankedGameModes(): GameModeDefinition[] {
  return GAME_MODE_DEFINITIONS.filter((mode) => mode.ranked);
}

export function getMultiplayerGameModes(): GameModeDefinition[] {
  return GAME_MODE_DEFINITIONS.filter((mode) => mode.multiplayerReady);
}

export function isMultiplayerReadyMode(modeId: GameModeId): boolean {
  return getGameModeDefinition(modeId).multiplayerReady;
}
