import { SCENE_KEYS } from "../../config/routes";
import { LEAK_DUEL_DEFINITION } from "../types/DuelTypes";
import { LEADERBOARD_DEFINITIONS } from "../types/LeaderboardTypes";
import { TOURNAMENT_DEFINITIONS } from "../types/TournamentTypes";
import {
  GAME_MODE_DEFINITIONS,
  getGameModeDefinition,
  type GameModeId,
  type GameModeRegistryDefinition,
  type GameModeRouteDefinition,
} from "../types/GameModeTypes";

export const MODE_REGISTRY_VERSION = "0.11.6-duel-scene-skeleton";

export interface GameModeRegistrySnapshot {
  version: string;
  modes: typeof GAME_MODE_DEFINITIONS;
  routes: readonly GameModeRouteDefinition[];
  playableModeIds: GameModeId[];
  multiplayerModeIds: GameModeId[];
  rankedModeIds: GameModeId[];
  backendLockedModeIds: GameModeId[];
  leaderboardCount: number;
  tournamentCount: number;
  duelModeId: typeof LEAK_DUEL_DEFINITION.id;
}

export const GAME_MODE_ROUTES: readonly GameModeRouteDefinition[] = [
  {
    modeId: "arena",
    menuLabel: "ARENA",
    menuSubLabel: "SOLO RUN",
    currentSceneKey: SCENE_KEYS.arena,
    plannedSceneKey: SCENE_KEYS.arena,
    availability: "playable",
    entryPoint: "main_menu",
    sortOrder: 10,
    requiresBackend: false,
    requiresValidation: false,
    nextUnlockPatch: "existing",
  },
  {
    modeId: "campaign",
    menuLabel: "CAMPAIGN",
    menuSubLabel: "BOSSES",
    currentSceneKey: SCENE_KEYS.campaign,
    plannedSceneKey: SCENE_KEYS.campaign,
    availability: "playable",
    entryPoint: "main_menu",
    sortOrder: 20,
    requiresBackend: false,
    requiresValidation: false,
    nextUnlockPatch: "existing",
  },
  {
    modeId: "tasks",
    menuLabel: "TASKS",
    menuSubLabel: "DAILY POINTS",
    currentSceneKey: SCENE_KEYS.missions,
    plannedSceneKey: SCENE_KEYS.missions,
    availability: "playable",
    entryPoint: "main_menu",
    sortOrder: 30,
    requiresBackend: false,
    requiresValidation: false,
    nextUnlockPatch: "v0.9.7-task-system-skeleton",
  },
  {
    modeId: "profile",
    menuLabel: "PROFILE",
    menuSubLabel: "POWER",
    currentSceneKey: SCENE_KEYS.profile,
    plannedSceneKey: SCENE_KEYS.profile,
    availability: "playable",
    entryPoint: "main_menu",
    sortOrder: 40,
    requiresBackend: false,
    requiresValidation: false,
    nextUnlockPatch: "v0.9.1-save-schema-v2",
  },
  {
    modeId: "leaderboard",
    menuLabel: "LEADERBOARD",
    menuSubLabel: "RANKED",
    currentSceneKey: SCENE_KEYS.leaderboard,
    plannedSceneKey: SCENE_KEYS.leaderboard,
    availability: "mock_ready",
    entryPoint: "main_menu",
    sortOrder: 50,
    requiresBackend: true,
    requiresValidation: true,
    nextUnlockPatch: "v0.10.4-leaderboard-scene",
  },
  {
    modeId: "tournament",
    menuLabel: "TOURNAMENTS",
    menuSubLabel: "EVENT POINTS",
    currentSceneKey: SCENE_KEYS.tournament,
    plannedSceneKey: SCENE_KEYS.tournament,
    availability: "mock_ready",
    entryPoint: "main_menu",
    sortOrder: 60,
    requiresBackend: true,
    requiresValidation: true,
    nextUnlockPatch: "v0.11.1-tournament-run-result",
  },
  {
    modeId: "leak_duel",
    menuLabel: "LEAK DUEL",
    menuSubLabel: "1 VS 1 PREVIEW",
    currentSceneKey: SCENE_KEYS.duel,
    plannedSceneKey: SCENE_KEYS.duel,
    availability: "mock_ready",
    entryPoint: "main_menu",
    sortOrder: 70,
    requiresBackend: true,
    requiresValidation: true,
    nextUnlockPatch: "v0.11.6-duel-scene-skeleton",
  },
  {
    modeId: "weekly_boss",
    menuLabel: "WEEKLY BOSS",
    menuSubLabel: "COMMUNITY",
    plannedSceneKey: "WeeklyBossScene",
    availability: "backend_locked",
    entryPoint: "future_backend",
    sortOrder: 80,
    requiresBackend: true,
    requiresValidation: true,
    nextUnlockPatch: "v0.13.0-multiplayer-adapter",
  },
];

export const GAME_MODE_REGISTRY_DEFINITION: GameModeRegistryDefinition = {
  version: MODE_REGISTRY_VERSION,
  title: "Broke Leak Beast Arena Mode Registry",
  routes: GAME_MODE_ROUTES,
  rules: [
    "Live local modes can be playable before backend exists.",
    "Ranked multiplayer modes stay backend-locked until run validation and anti-cheat exist.",
    "Leaderboard, tournament, duel and weekly boss routes must share the same registry before UI work starts.",
    "1v1 Leak Duel launches asynchronous first; live real-time 1v1 is a future mode after backend stability.",
  ],
};

export function getModeRoute(modeId: GameModeId): GameModeRouteDefinition {
  const route = GAME_MODE_ROUTES.find((candidate) => candidate.modeId === modeId);
  if (!route) {
    throw new Error(`Unknown mode route: ${modeId}`);
  }
  return route;
}

export function getPlayableModeRoutes(): GameModeRouteDefinition[] {
  return GAME_MODE_ROUTES.filter((route) => route.availability === "playable");
}

export function getBackendLockedModeRoutes(): GameModeRouteDefinition[] {
  return GAME_MODE_ROUTES.filter((route) => route.requiresBackend || route.requiresValidation);
}

export function getRankedModeRoutes(): GameModeRouteDefinition[] {
  return GAME_MODE_ROUTES.filter((route) => getGameModeDefinition(route.modeId).ranked);
}

export function getMultiplayerModeRoutes(): GameModeRouteDefinition[] {
  return GAME_MODE_ROUTES.filter((route) => getGameModeDefinition(route.modeId).multiplayerReady);
}

export function createModeRegistrySnapshot(): GameModeRegistrySnapshot {
  return {
    version: MODE_REGISTRY_VERSION,
    modes: GAME_MODE_DEFINITIONS,
    routes: GAME_MODE_ROUTES,
    playableModeIds: getPlayableModeRoutes().map((route) => route.modeId),
    multiplayerModeIds: getMultiplayerModeRoutes().map((route) => route.modeId),
    rankedModeIds: getRankedModeRoutes().map((route) => route.modeId),
    backendLockedModeIds: getBackendLockedModeRoutes().map((route) => route.modeId),
    leaderboardCount: LEADERBOARD_DEFINITIONS.length,
    tournamentCount: TOURNAMENT_DEFINITIONS.length,
    duelModeId: LEAK_DUEL_DEFINITION.id,
  };
}
