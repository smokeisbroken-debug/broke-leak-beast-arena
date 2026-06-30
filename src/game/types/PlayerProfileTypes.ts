import type { CurrencyId } from "./EconomyTypes";
import type { PowerBreakdown } from "./ProgressionTypes";
import type { SaveValidationStatus } from "./SaveSchemaTypes";
import type { EvolutionId } from "./EvolutionTypes";

export type ProfileV2BlockId =
  | "identity"
  | "wallet"
  | "progression"
  | "multiplayer"
  | "tasks"
  | "leaderboards"
  | "tournaments"
  | "duels"
  | "sync";

export interface ProfileV2BlockDefinition {
  id: ProfileV2BlockId;
  title: string;
  status: "live" | "local_skeleton" | "backend_locked";
  purpose: string;
}

export interface ProfileCurrencyRow {
  currencyId: CurrencyId;
  label: string;
  shortLabel: string;
  amount: number;
  backendValidationRequired: boolean;
}

export interface ProfileV2ProgressSummary {
  level: number;
  xp: number;
  nextLevel?: number;
  xpRemaining: number;
  xpProgress: number;
  evolutionId: EvolutionId;
  evolutionName: string;
  evolutionTitle: string;
  evolutionPower: number;
  nextEvolutionName?: string;
  nextEvolutionRequirement?: string;
  masteryPoints: number;
  skillLevelTotal: number;
  skillUpgradePower: number;
  readySkillUpgrades: number;
  powerScore: number;
  powerBreakdown: PowerBreakdown;
}

export interface ProfileV2MultiplayerSummary {
  rankPoints: number;
  tournamentPoints: number;
  taskPoints: number;
  duelWins: number;
  duelLosses: number;
  duelRating: number;
  weeklyBossDamage: number;
  verifiedRunCount: number;
  pendingSubmissionCount: number;
}

export interface ProfileV2UnlockSummary {
  skins: number;
  skills: number;
  stages: number;
  campaignBossesCleared: number;
}

export interface PlayerProfileV2Summary {
  localPlayerId: string;
  displayName: string;
  handle?: string;
  schemaVersion: number;
  createdAtIso: string;
  lastSeenAtIso: string;
  validationStatus: SaveValidationStatus;
  backendLinked: boolean;
  progress: ProfileV2ProgressSummary;
  currencies: ProfileCurrencyRow[];
  multiplayer: ProfileV2MultiplayerSummary;
  unlocks: ProfileV2UnlockSummary;
}

export interface PlayerProfileV2SystemDefinition {
  version: string;
  blocks: readonly ProfileV2BlockDefinition[];
  rules: readonly string[];
}
