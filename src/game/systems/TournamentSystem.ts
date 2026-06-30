import {
  TOURNAMENT_DEFINITIONS,
  getBackendLockedTournaments,
  getLocalPreviewTournaments,
  getTournamentReadiness,
  type TournamentId,
  type TournamentRegistrySummary,
  type TournamentSystemDefinition,
} from "../types/TournamentTypes";
import { calculateTournamentScoreSnapshot } from "./TournamentScoringSystem";

export const TOURNAMENT_SYSTEM_VERSION = "0.11.1-tournament-run-result";

const REQUIRED_BEFORE_LIVE_TOURNAMENTS = [
  "Tournament Scene and mode navigation",
  "Tournament run result payload",
  "Leaderboard adapter submit implementation",
  "Backend identity and run validation",
  "Anti-cheat checks for seed, duration, damage and score",
  "Reward bracket reconciliation before ranked currencies are granted",
] as const;

export const TOURNAMENT_SYSTEM_DEFINITION: TournamentSystemDefinition = {
  version: TOURNAMENT_SYSTEM_VERSION,
  goal: "Define multiplayer-ready tournament contracts, scoring weights, event windows, deterministic score previews, reward brackets and backend locks before tournament UI or remote submission is enabled.",
  tournamentIds: TOURNAMENT_DEFINITIONS.map((tournament) => tournament.id),
  localPreviewTournamentIds: getLocalPreviewTournaments().map((tournament) => tournament.id),
  backendLockedTournamentIds: getBackendLockedTournaments().map((tournament) => tournament.id),
  requiredBeforeLiveTournaments: REQUIRED_BEFORE_LIVE_TOURNAMENTS,
  rules: [
    "Tournaments expose deterministic score previews only; no public submit, live rewards or backend calls are enabled.",
    "Every tournament must declare event window, entry requirements, rules, score weights, leaderboard target and reward brackets.",
    "Tournament Points, Rank Points, Leak Points and Cosmetic Tokens remain backend-sensitive before real multiplayer launch.",
    "No tournament rule may grant paid advantage; all competitive events use fixed seeds or backend-verified run payloads.",
  ],
};

export function getTournamentRegistrySummary(): TournamentRegistrySummary {
  const backendLockedTournamentIds = getBackendLockedTournaments().map((tournament) => tournament.id);

  return {
    version: TOURNAMENT_SYSTEM_VERSION,
    totalTournamentCount: TOURNAMENT_DEFINITIONS.length,
    draftCount: TOURNAMENT_DEFINITIONS.filter((tournament) => tournament.status === "draft").length,
    activeCount: TOURNAMENT_DEFINITIONS.filter((tournament) => tournament.status === "active").length,
    backendLockedCount: backendLockedTournamentIds.length,
    localPreviewCount: getLocalPreviewTournaments().length,
    tournamentIds: TOURNAMENT_DEFINITIONS.map((tournament) => tournament.id),
    backendLockedTournamentIds,
  };
}

export function getTournamentReadinessMap(): Record<TournamentId, ReturnType<typeof getTournamentReadiness>> {
  return TOURNAMENT_DEFINITIONS.reduce<Record<TournamentId, ReturnType<typeof getTournamentReadiness>>>((readinessMap, tournament) => {
    readinessMap[tournament.id] = getTournamentReadiness(tournament.id);
    return readinessMap;
  }, {} as Record<TournamentId, ReturnType<typeof getTournamentReadiness>>);
}

export function getTournamentScorePreviewMap(): Record<TournamentId, ReturnType<typeof calculateTournamentScoreSnapshot>> {
  return TOURNAMENT_DEFINITIONS.reduce<Record<TournamentId, ReturnType<typeof calculateTournamentScoreSnapshot>>>((previewMap, tournament) => {
    previewMap[tournament.id] = calculateTournamentScoreSnapshot(tournament.id, {
      score: 100,
      leaksDefeated: 5,
      bossDamage: 250,
      survivedSeconds: 90,
      hpRemaining: 60,
      guards: 3,
      damageTaken: 20,
      participated: true,
    }, "sample_preview");
    return previewMap;
  }, {} as Record<TournamentId, ReturnType<typeof calculateTournamentScoreSnapshot>>);
}
