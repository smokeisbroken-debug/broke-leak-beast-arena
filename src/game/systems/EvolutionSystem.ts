import type { PlayerProfile } from "../data/playerProfile";
import {
  EVOLUTION_SYSTEM_DEFINITION,
  getEvolutionDefinition,
  getEvolutionUnlockStatus,
  getNextEvolution,
  getUnlockedEvolutionForProgress,
  type EvolutionProgressInput,
  type EvolutionUnlockStatus,
  type MascotEvolutionDefinition,
} from "../types/EvolutionTypes";

export interface MascotEvolutionSummary {
  current: MascotEvolutionDefinition;
  highestUnlocked: MascotEvolutionDefinition;
  next?: EvolutionUnlockStatus;
  all: EvolutionUnlockStatus[];
}

export function getEvolutionProgressInput(profile: PlayerProfile): EvolutionProgressInput {
  const campaignBossesCleared = Object.values(profile.campaignProgress).reduce((total, count) => total + Math.max(0, Math.floor(count || 0)), 0);
  return {
    level: Math.max(1, Math.floor(profile.level || 1)),
    leakPoints: Math.max(0, Math.floor(profile.leakPoints || 0)),
    wins: Math.max(0, Math.floor(profile.totalWins || 0)),
    campaignBossesCleared,
  };
}

export function getMascotEvolutionSummary(profile: PlayerProfile): MascotEvolutionSummary {
  const progress = getEvolutionProgressInput(profile);
  const current = getEvolutionDefinition(profile.progressionV2.evolutionId);
  const highestUnlocked = getUnlockedEvolutionForProgress(progress);
  const nextEvolution = getNextEvolution(current.id);

  return {
    current,
    highestUnlocked,
    next: nextEvolution ? getEvolutionUnlockStatus(nextEvolution, progress) : undefined,
    all: EVOLUTION_SYSTEM_DEFINITION.evolutions.map((evolution) => getEvolutionUnlockStatus(evolution, progress)),
  };
}

export { EVOLUTION_SYSTEM_DEFINITION };
