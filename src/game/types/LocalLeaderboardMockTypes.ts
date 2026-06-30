import type { LeaderboardEntry, LeaderboardId, LeaderboardSnapshot } from "./LeaderboardTypes";

export type LocalLeaderboardMockSource = "local_player" | "mock_rival";

export interface LocalLeaderboardMockPersonaDefinition {
  id: string;
  displayName: string;
  theme: string;
  baseValues: Partial<Record<LeaderboardId, number>>;
  variance: number;
}

export interface LocalLeaderboardMockRow extends LeaderboardEntry {
  source: LocalLeaderboardMockSource;
  isLocalPlayer: boolean;
  backendLocked: boolean;
  localMockOnly: boolean;
}

export interface LocalLeaderboardMockSnapshot extends Omit<LeaderboardSnapshot, "entries" | "playerEntry"> {
  entries: LocalLeaderboardMockRow[];
  playerEntry?: LocalLeaderboardMockRow;
  localMockOnly: true;
  mockNotice: string;
  lockedNotice?: string;
}

export interface LocalLeaderboardMockSystemDefinition {
  version: string;
  goal: string;
  supportedLeaderboards: readonly LeaderboardId[];
  mockPersonaCount: number;
  rules: readonly string[];
}
