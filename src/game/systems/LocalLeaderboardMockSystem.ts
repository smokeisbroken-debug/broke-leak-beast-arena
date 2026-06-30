import type { PlayerProfile } from "../data/playerProfile";
import {
  LEADERBOARD_DEFINITIONS,
  getLeaderboardDefinition,
  getLeaderboardPeriodKey,
  isLeaderboardBackendLocked,
  type LeaderboardId,
} from "../types/LeaderboardTypes";
import {
  type LocalLeaderboardMockPersonaDefinition,
  type LocalLeaderboardMockRow,
  type LocalLeaderboardMockSnapshot,
  type LocalLeaderboardMockSystemDefinition,
} from "../types/LocalLeaderboardMockTypes";
import { createLeaderboardEntryFromProfile, getLeaderboardValueForProfile } from "./LeaderboardSystem";

export const LOCAL_LEADERBOARD_MOCK_SYSTEM_VERSION = "0.10.5-weekly-leaderboard";

export const LOCAL_LEADERBOARD_MOCK_PERSONAS: readonly LocalLeaderboardMockPersonaDefinition[] = [
  {
    id: "cold_wallet_guard",
    displayName: "Cold Wallet Guard",
    theme: "Defensive player who scores through shield discipline and stable power.",
    baseValues: {
      global_power: 112,
      weekly_arena: 10400,
      task_points: 760,
      tournament: 4200,
      duel_ranked: 1080,
      boss_damage: 180000,
    },
    variance: 0.09,
  },
  {
    id: "anti_fomo_racer",
    displayName: "Anti-FOMO Racer",
    theme: "Fast arena runner with strong weekly activity but lower boss damage.",
    baseValues: {
      global_power: 96,
      weekly_arena: 12800,
      task_points: 540,
      tournament: 5200,
      duel_ranked: 1015,
      boss_damage: 96000,
    },
    variance: 0.13,
  },
  {
    id: "receipt_hunter",
    displayName: "Receipt Hunter",
    theme: "Task-focused grinder who climbs through daily discipline points.",
    baseValues: {
      global_power: 78,
      weekly_arena: 8200,
      task_points: 1250,
      tournament: 3600,
      duel_ranked: 990,
      boss_damage: 116000,
    },
    variance: 0.1,
  },
  {
    id: "debt_breaker",
    displayName: "Debt Breaker",
    theme: "Boss and campaign specialist with heavy single-target pressure.",
    baseValues: {
      global_power: 136,
      weekly_arena: 9600,
      task_points: 680,
      tournament: 4600,
      duel_ranked: 1040,
      boss_damage: 245000,
    },
    variance: 0.08,
  },
  {
    id: "rug_pull_survivor",
    displayName: "Rug Pull Survivor",
    theme: "Risk-control player built for tournaments and duels.",
    baseValues: {
      global_power: 124,
      weekly_arena: 11200,
      task_points: 900,
      tournament: 6400,
      duel_ranked: 1160,
      boss_damage: 150000,
    },
    variance: 0.11,
  },
  {
    id: "subscription_slayer",
    displayName: "Subscription Slayer",
    theme: "Leak cleaner who wins through consistency rather than peak score.",
    baseValues: {
      global_power: 88,
      weekly_arena: 7200,
      task_points: 1020,
      tournament: 2800,
      duel_ranked: 960,
      boss_damage: 132000,
    },
    variance: 0.12,
  },
  {
    id: "green_candle_monk",
    displayName: "Green Candle Monk",
    theme: "Balanced mascot build with steady rank across all boards.",
    baseValues: {
      global_power: 104,
      weekly_arena: 9800,
      task_points: 840,
      tournament: 4800,
      duel_ranked: 1030,
      boss_damage: 162000,
    },
    variance: 0.07,
  },
];

export const LOCAL_LEADERBOARD_MOCK_SYSTEM_DEFINITION: LocalLeaderboardMockSystemDefinition = {
  version: LOCAL_LEADERBOARD_MOCK_SYSTEM_VERSION,
  goal: "Create deterministic local leaderboard snapshots for UI development while real submission, rewards, tournaments, duels and boss rankings remain backend-locked.",
  supportedLeaderboards: LEADERBOARD_DEFINITIONS.map((leaderboard) => leaderboard.id),
  mockPersonaCount: LOCAL_LEADERBOARD_MOCK_PERSONAS.length,
  rules: [
    "Mock rows are deterministic per leaderboard and period so UI can be tested without backend state.",
    "The local player is inserted into the same table and ranked against mock rivals.",
    "Every snapshot is local-only; public submission and rewards stay disabled.",
    "Backend-locked leaderboards may be previewed, but their rows must be labeled as non-authoritative.",
  ],
};

function safeInteger(value: unknown): number {
  return Math.max(0, Math.floor(Number(value) || 0));
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function getVarianceMultiplier(seed: string, variance: number): number {
  const normalized = (hashString(seed) % 1000) / 1000;
  return 1 + (normalized * 2 - 1) * variance;
}

function getMockValue(
  leaderboardId: LeaderboardId,
  persona: LocalLeaderboardMockPersonaDefinition,
  periodKey: string,
): number {
  const baseValue = persona.baseValues[leaderboardId] ?? 0;
  const leaderboard = getLeaderboardDefinition(leaderboardId);
  const variedValue = baseValue * getVarianceMultiplier(`${leaderboardId}:${periodKey}:${persona.id}`, persona.variance);
  const cappedValue = leaderboard.scorePolicy.maxLocalPreviewValue
    ? Math.min(variedValue, leaderboard.scorePolicy.maxLocalPreviewValue)
    : variedValue;
  return safeInteger(cappedValue);
}

function sortLeaderboardRows(rows: LocalLeaderboardMockRow[], leaderboardId: LeaderboardId): LocalLeaderboardMockRow[] {
  const leaderboard = getLeaderboardDefinition(leaderboardId);
  const sortedRows = [...rows].sort((left, right) => {
    const valueDelta = leaderboard.scorePolicy.sortDirection === "asc" ? left.value - right.value : right.value - left.value;
    if (valueDelta !== 0) return valueDelta;
    return left.displayName.localeCompare(right.displayName);
  });

  return sortedRows.map((row, index) => ({
    ...row,
    rank: index + 1,
  }));
}

function createMockRow(
  leaderboardId: LeaderboardId,
  periodKey: string,
  persona: LocalLeaderboardMockPersonaDefinition,
  generatedAtIso: string,
): LocalLeaderboardMockRow {
  const leaderboard = getLeaderboardDefinition(leaderboardId);
  const backendLocked = isLeaderboardBackendLocked(leaderboardId);

  return {
    playerId: `mock_${persona.id}`,
    displayName: persona.displayName,
    rank: 0,
    value: getMockValue(leaderboardId, persona, periodKey),
    periodKey,
    validationTier: leaderboard.scorePolicy.validationTier,
    updatedAtIso: generatedAtIso,
    source: "mock_rival",
    isLocalPlayer: false,
    backendLocked,
    localMockOnly: true,
    metadata: {
      mockPersonaId: persona.id,
      theme: persona.theme,
      backendLocked,
      localMockOnly: true,
      metric: leaderboard.metric,
      scope: leaderboard.scope,
    },
  };
}

function createPlayerMockRow(
  leaderboardId: LeaderboardId,
  profile: PlayerProfile,
  periodKey: string,
  generatedAtIso: string,
): LocalLeaderboardMockRow {
  const leaderboard = getLeaderboardDefinition(leaderboardId);
  const backendLocked = isLeaderboardBackendLocked(leaderboardId);
  const playerEntry = createLeaderboardEntryFromProfile(leaderboardId, profile, 0, new Date(generatedAtIso));
  const value = getLeaderboardValueForProfile(leaderboardId, profile);

  return {
    ...playerEntry,
    rank: 0,
    value,
    periodKey,
    updatedAtIso: generatedAtIso,
    source: "local_player",
    isLocalPlayer: true,
    backendLocked,
    localMockOnly: true,
    metadata: {
      ...playerEntry.metadata,
      backendLocked,
      localMockOnly: true,
      metric: leaderboard.metric,
      scope: leaderboard.scope,
    },
  };
}

export function createLocalLeaderboardMockSnapshot(
  leaderboardId: LeaderboardId,
  profile: PlayerProfile,
  date = new Date(),
): LocalLeaderboardMockSnapshot {
  const leaderboard = getLeaderboardDefinition(leaderboardId);
  const periodKey = getLeaderboardPeriodKey(leaderboardId, date);
  const generatedAtIso = date.toISOString();
  const backendLocked = isLeaderboardBackendLocked(leaderboardId);
  const mockRows = LOCAL_LEADERBOARD_MOCK_PERSONAS.map((persona) =>
    createMockRow(leaderboardId, periodKey, persona, generatedAtIso),
  );
  const playerRow = createPlayerMockRow(leaderboardId, profile, periodKey, generatedAtIso);
  const entries = sortLeaderboardRows([...mockRows, playerRow], leaderboardId);
  const playerEntry = entries.find((entry) => entry.isLocalPlayer);

  return {
    leaderboardId,
    periodKey,
    generatedAtIso,
    entries,
    playerEntry,
    backendStatus: leaderboard.backendStatus,
    submissionEnabled: false,
    localMockOnly: true,
    mockNotice: "Local preview only. Rankings are generated for UI and balance testing.",
    lockedNotice: backendLocked ? "Public ranking, rewards and score submission require backend validation and anti-cheat." : undefined,
  };
}

export function createAllLocalLeaderboardMockSnapshots(
  profile: PlayerProfile,
  date = new Date(),
): LocalLeaderboardMockSnapshot[] {
  return LEADERBOARD_DEFINITIONS.map((leaderboard) => createLocalLeaderboardMockSnapshot(leaderboard.id, profile, date));
}

export function getLocalLeaderboardMockSummary(profile: PlayerProfile, date = new Date()): Record<LeaderboardId, number> {
  return LEADERBOARD_DEFINITIONS.reduce<Record<LeaderboardId, number>>((summary, leaderboard) => {
    summary[leaderboard.id] = createLocalLeaderboardMockSnapshot(leaderboard.id, profile, date).playerEntry?.rank ?? 0;
    return summary;
  }, {} as Record<LeaderboardId, number>);
}
