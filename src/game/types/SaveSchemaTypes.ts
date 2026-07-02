import type { CurrencyWalletV2 } from "./EconomyTypes";
import { createEmptyWallet } from "./EconomyTypes";
import type { PowerBreakdown } from "./ProgressionTypes";

export const CURRENT_SAVE_SCHEMA_VERSION = 2;
export const SAVE_SCHEMA_VERSION_LABEL = "v2-profile-multiplayer-ready";

export type SaveValidationStatus = "local_only" | "pending_remote" | "verified" | "rejected";
export type SaveSyncProvider = "local" | "future_backend";

export interface PlayerIdentityV2 {
  localPlayerId: string;
  displayName: string;
  handle?: string;
  walletAddress?: string;
  authProviderId?: string;
  authSubjectId?: string;
  linkedAtIso?: string;
  createdAtIso: string;
  lastSeenAtIso: string;
}

export interface ProgressionSaveStateV2 {
  powerScore: number;
  powerBreakdown: PowerBreakdown;
  evolutionId: string;
  masteryPoints: number;
  masteryBranchLevels: Record<string, number>;
  skillLevels: Record<string, number>;
  equippedCharmIds: string[];
}

export interface MultiplayerSaveStateV2 {
  rankPoints: number;
  tournamentPoints: number;
  taskPoints: number;
  cosmeticTokens: number;
  duelWins: number;
  duelLosses: number;
  weeklyBossDamage: number;
  verifiedRunCount: number;
  pendingSubmissionCount: number;
}

export interface TaskSaveStateV2 {
  activeDailyTaskIds: string[];
  activeWeeklyTaskIds: string[];
  claimedTaskIds: string[];
  completedTaskIds: string[];
  taskProgressById: Record<string, number>;
  taskPointsByPeriod: Record<string, number>;
  lastDailyResetKey: string;
  lastWeeklyResetKey: string;
}

export interface LeaderboardSaveStateV2 {
  lastKnownRanks: Record<string, number>;
  bestValues: Record<string, number>;
  lastSubmittedAtIso?: string;
}

export interface TournamentSaveStateV2 {
  activeTournamentId?: string;
  participationCount: number;
  bestTournamentPoints: number;
  completedTournamentIds: string[];
  pendingRunIds: string[];
}

export interface DuelSaveStateV2 {
  activeDuelIds: string[];
  completedDuelIds: string[];
  wins: number;
  losses: number;
  rating: number;
  lastDuelAtIso?: string;
}

export interface SeasonSaveStateV2 {
  activeSeasonId?: string;
  seasonPoints: number;
  claimedRewardIds: string[];
  completedMissionIds: string[];
}

export interface SaveSyncStateV2 {
  provider: SaveSyncProvider;
  backendLinked: boolean;
  validationStatus: SaveValidationStatus;
  lastSyncAtIso?: string;
  pendingRunResultIds: string[];
  pendingEconomyEventIds: string[];
}

export interface SaveSystemsStateV2 {
  identity: PlayerIdentityV2;
  wallet: CurrencyWalletV2;
  progression: ProgressionSaveStateV2;
  multiplayer: MultiplayerSaveStateV2;
  tasks: TaskSaveStateV2;
  leaderboards: LeaderboardSaveStateV2;
  tournaments: TournamentSaveStateV2;
  duels: DuelSaveStateV2;
  seasons: SeasonSaveStateV2;
  sync: SaveSyncStateV2;
}

export interface SaveSchemaDefinitionV2 {
  version: typeof CURRENT_SAVE_SCHEMA_VERSION;
  label: typeof SAVE_SCHEMA_VERSION_LABEL;
  goal: string;
  storedBlocks: readonly (keyof SaveSystemsStateV2)[];
  backendLockedBlocks: readonly (keyof SaveSystemsStateV2)[];
  migrationNotes: readonly string[];
}

export const SAVE_SCHEMA_DEFINITION_V2: SaveSchemaDefinitionV2 = {
  version: CURRENT_SAVE_SCHEMA_VERSION,
  label: SAVE_SCHEMA_VERSION_LABEL,
  goal: "Prepare local saves for progression, task points, leaderboards, tournaments, asynchronous 1v1 Leak Duel and future backend sync.",
  storedBlocks: ["identity", "wallet", "progression", "multiplayer", "tasks", "leaderboards", "tournaments", "duels", "seasons", "sync"],
  backendLockedBlocks: ["leaderboards", "tournaments", "duels", "seasons", "sync"],
  migrationNotes: [
    "v1 saves remain readable and normalize into schema v2 fields.",
    "Ranked values stay local placeholders until backend validation exists.",
    "Leaderboard, tournament and duel submissions must use pending queues before remote adapters are enabled.",
    "Task progress and completed local daily task claims are stored locally; ranked task rewards still require future backend reconciliation.",
  ],
};

const DEFAULT_POWER_BREAKDOWN: PowerBreakdown = {
  level: 0,
  skills: 0,
  evolution: 0,
  mastery: 0,
  charms: 0,
};

function createLocalPlayerId(): string {
  const cryptoApi = typeof crypto !== "undefined" ? crypto : undefined;
  if (cryptoApi && typeof cryptoApi.randomUUID === "function") return `local_${cryptoApi.randomUUID()}`;
  return `local_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createDefaultSaveSystemsState(nowIso = new Date().toISOString()): SaveSystemsStateV2 {
  return {
    identity: {
      localPlayerId: createLocalPlayerId(),
      displayName: "Broke Fighter",
      createdAtIso: nowIso,
      lastSeenAtIso: nowIso,
    },
    wallet: createEmptyWallet(),
    progression: {
      powerScore: 0,
      powerBreakdown: { ...DEFAULT_POWER_BREAKDOWN },
      evolutionId: "broke_rookie",
      masteryPoints: 0,
      masteryBranchLevels: {},
      skillLevels: {},
      equippedCharmIds: [],
    },
    multiplayer: {
      rankPoints: 0,
      tournamentPoints: 0,
      taskPoints: 0,
      cosmeticTokens: 0,
      duelWins: 0,
      duelLosses: 0,
      weeklyBossDamage: 0,
      verifiedRunCount: 0,
      pendingSubmissionCount: 0,
    },
    tasks: {
      activeDailyTaskIds: ["daily_win_one_arena", "daily_defeat_five_leaks", "daily_use_guard"],
      activeWeeklyTaskIds: ["weekly_tournament_participation", "weekly_duel_win", "weekly_boss_damage_push"],
      claimedTaskIds: [],
      completedTaskIds: [],
      taskProgressById: {},
      taskPointsByPeriod: {},
      lastDailyResetKey: "",
      lastWeeklyResetKey: "",
    },
    leaderboards: {
      lastKnownRanks: {},
      bestValues: {},
    },
    tournaments: {
      participationCount: 0,
      bestTournamentPoints: 0,
      completedTournamentIds: [],
      pendingRunIds: [],
    },
    duels: {
      activeDuelIds: [],
      completedDuelIds: [],
      wins: 0,
      losses: 0,
      rating: 1000,
    },
    seasons: {
      seasonPoints: 0,
      claimedRewardIds: [],
      completedMissionIds: [],
    },
    sync: {
      provider: "local",
      backendLinked: false,
      validationStatus: "local_only",
      pendingRunResultIds: [],
      pendingEconomyEventIds: [],
    },
  };
}
