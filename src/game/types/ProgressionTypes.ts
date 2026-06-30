export {
  CURRENCY_DEFINITIONS,
  CURRENCY_IDS,
  ECONOMY_SYSTEM_DEFINITION,
  REWARD_SOURCE_DEFINITIONS,
  REWARD_SOURCE_IDS,
  ZERO_CURRENCY_WALLET,
  buildRewardWalletDelta,
  createEconomyTransactionPreview,
  createEmptyWallet,
  getBackendValidatedCurrencies,
  getCurrencyDefinition,
  getLocalOnlyCurrencies,
  getRewardSourceDefinition,
  isRankedCurrency,
  normalizeRewardAmount,
  normalizeRewardBundle,
  sumRewardAmounts,
} from "./EconomyTypes";

export type {
  CurrencyCategory,
  CurrencyDefinition,
  CurrencyId,
  CurrencyWalletV2,
  EconomyEventType,
  EconomySystemDefinition,
  EconomyTransactionPreview,
  EconomyValidationTier,
  RewardAmount,
  RewardBundleV2,
  RewardSourceDefinition,
  RewardSourceId,
} from "./EconomyTypes";

export type PowerSourceId = "level" | "skills" | "evolution" | "mastery" | "charms";

export interface PowerCaps {
  level: number;
  skills: number;
  evolution: number;
  mastery: number;
  charms: number;
}

export interface PowerBreakdown {
  level: number;
  skills: number;
  evolution: number;
  mastery: number;
  charms: number;
}

export interface PowerScoreResult {
  score: number;
  cappedBreakdown: PowerBreakdown;
  caps: PowerCaps;
}

export const DEFAULT_POWER_CAPS: PowerCaps = {
  level: 100,
  skills: 80,
  evolution: 40,
  mastery: 80,
  charms: 50,
};

function clampPower(value: number, cap: number): number {
  return Math.max(0, Math.min(cap, Math.floor(value || 0)));
}

export function calculatePowerScore(breakdown: Partial<PowerBreakdown>, caps: PowerCaps = DEFAULT_POWER_CAPS): PowerScoreResult {
  const cappedBreakdown: PowerBreakdown = {
    level: clampPower(breakdown.level ?? 0, caps.level),
    skills: clampPower(breakdown.skills ?? 0, caps.skills),
    evolution: clampPower(breakdown.evolution ?? 0, caps.evolution),
    mastery: clampPower(breakdown.mastery ?? 0, caps.mastery),
    charms: clampPower(breakdown.charms ?? 0, caps.charms),
  };

  return {
    score: Object.values(cappedBreakdown).reduce((total, value) => total + value, 0),
    cappedBreakdown,
    caps,
  };
}

export {
  EVOLUTION_SYSTEM_DEFINITION,
  EVOLUTION_SYSTEM_VERSION,
  MASCOT_EVOLUTIONS,
  formatEvolutionRequirement,
  getEvolutionDefinition,
  getEvolutionPower,
  getEvolutionUnlockStatus,
  getMissingEvolutionRequirement,
  getNextEvolution,
  getUnlockedEvolutionForProgress,
  isEvolutionUnlocked,
} from "./EvolutionTypes";

export type {
  EvolutionBonus,
  EvolutionBonusId,
  EvolutionId,
  EvolutionProgressInput,
  EvolutionRequirement,
  EvolutionSystemDefinition,
  EvolutionUnlockStatus,
  MascotEvolutionDefinition,
} from "./EvolutionTypes";

export {
  MASTERY_BRANCHES,
  MASTERY_SYSTEM_DEFINITION,
  MASTERY_SYSTEM_VERSION,
  getMasteryBranchDefinition,
  getMasteryBranchPower,
  getMasteryBranchUnlockLabel,
  normalizeMasteryBranchLevel,
} from "./MasteryTypes";

export type {
  MasteryBranchBonus,
  MasteryBranchDefinition,
  MasteryBranchId,
  MasteryBranchRole,
  MasteryBranchState,
  MasterySystemDefinition,
  MasteryUnlockStatus,
} from "./MasteryTypes";
