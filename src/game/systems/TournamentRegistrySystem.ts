import {
  TOURNAMENT_DEFINITIONS,
  getTournamentPeriodKey,
  getTournamentReadiness,
  type TournamentDefinition,
  type TournamentId,
  type TournamentRuleId,
} from "../types/TournamentTypes";
import { calculateTournamentScoreSnapshot } from "./TournamentScoringSystem";
import type {
  TournamentRegistryCard,
  TournamentRegistryCardTone,
  TournamentRegistryFilterId,
  TournamentRegistryGroupSummary,
  TournamentRegistrySnapshot,
  TournamentRegistrySystemDefinition,
} from "../types/TournamentRegistryTypes";

export const TOURNAMENT_REGISTRY_SYSTEM_VERSION = "0.11.1-tournament-run-result";
export const FEATURED_TOURNAMENT_ID: TournamentId = "no_spend_arena_preview";

export const TOURNAMENT_REGISTRY_FILTER_LABELS: Record<TournamentRegistryFilterId, string> = {
  featured: "Featured",
  local_preview: "Local Preview",
  weekly: "Weekly",
  backend_locked: "Backend Locked",
  all: "All Tournaments",
};

export const TOURNAMENT_REGISTRY_SYSTEM_DEFINITION: TournamentRegistrySystemDefinition = {
  version: TOURNAMENT_REGISTRY_SYSTEM_VERSION,
  goal: "Create a single tournament registry layer that can feed the future Tournament Scene, leaderboard tabs, task links and backend submit adapters without enabling public ranked rewards yet.",
  featuredTournamentId: FEATURED_TOURNAMENT_ID,
  defaultFilterId: "featured",
  rules: [
    "The registry may expose tournament cards and local previews, but public submit remains disabled.",
    "Only local-preview tournaments may show a play/preview CTA before backend identity and run validation exist.",
    "Tournament Points, Rank Points, Leak Points and reward brackets remain backend-sensitive.",
    "Every registry card must carry lock labels so UI cannot accidentally present mock data as live multiplayer.",
  ],
  requiredBeforeTournamentScene: [
    "Tournament Scene shell",
    "Tournament scoring preview panel",
    "Run result payload contract",
    "Leaderboard adapter submit path",
    "Backend validation and anti-cheat checks",
  ],
};

function getResetLabel(tournament: TournamentDefinition): string {
  if (tournament.eventWindow.resetRule === "weekly") return "Weekly reset preview";
  if (tournament.eventWindow.resetRule === "season") return "Season event preview";
  return "Event preview";
}

function getTournamentTone(tournament: TournamentDefinition): TournamentRegistryCardTone {
  if (tournament.backendStatus === "local_preview") return "playable_preview";
  if (tournament.eventWindow.resetRule === "weekly") return "weekly_event";
  if (tournament.backendStatus === "remote_required") return "locked_backend";
  return "draft_event";
}

function getParticipationPoints(tournament: TournamentDefinition): number {
  const tournamentPointReward = tournament.participationRewards.find((reward) => reward.currencyId === "tournament_points");
  return Math.max(0, Math.floor(tournamentPointReward?.amount ?? 0));
}

function getRuleLabels(tournament: TournamentDefinition): TournamentRuleId[] {
  return tournament.rules.slice(0, 4);
}

function createTournamentRegistryCard(tournament: TournamentDefinition): TournamentRegistryCard {
  const readiness = getTournamentReadiness(tournament.id);
  const scorePreview = calculateTournamentScoreSnapshot(tournament.id, {
    score: 100,
    leaksDefeated: 5,
    bossDamage: 250,
    survivedSeconds: 90,
    hpRemaining: 60,
    guards: 3,
    damageTaken: 20,
    participated: true,
  }, "sample_preview");
  const localPreviewEnabled = tournament.backendStatus === "local_preview";

  return {
    id: tournament.id,
    title: tournament.title,
    shortTitle: tournament.shortTitle,
    theme: tournament.theme,
    themeId: tournament.themeId,
    modeId: tournament.modeId,
    status: tournament.status,
    backendStatus: tournament.backendStatus,
    tone: getTournamentTone(tournament),
    leaderboardId: tournament.leaderboardId,
    periodKey: getTournamentPeriodKey(tournament.id),
    resetLabel: getResetLabel(tournament),
    ruleLabels: getRuleLabels(tournament),
    participationPoints: getParticipationPoints(tournament),
    previewScore: scorePreview.points,
    localPreviewEnabled,
    publicSubmitEnabled: readiness.publicSubmitEnabled,
    backendValidationRequired: readiness.backendValidationRequired,
    antiCheatRequired: readiness.antiCheatRequired,
    ctaLabel: localPreviewEnabled ? "PREVIEW" : "LOCKED",
    lockLabel: localPreviewEnabled ? "Local mock only — no public rewards" : "Backend validation required before public entry",
  };
}

function cardsForFilter(filterId: TournamentRegistryFilterId, cards: TournamentRegistryCard[]): TournamentRegistryCard[] {
  switch (filterId) {
    case "featured":
      return cards.filter((card) => card.id === FEATURED_TOURNAMENT_ID);
    case "local_preview":
      return cards.filter((card) => card.localPreviewEnabled);
    case "weekly":
      return cards.filter((card) => card.resetLabel.toLowerCase().includes("weekly"));
    case "backend_locked":
      return cards.filter((card) => card.backendValidationRequired && !card.localPreviewEnabled);
    case "all":
    default:
      return cards;
  }
}

export function createTournamentRegistrySnapshot(): TournamentRegistrySnapshot {
  const cards = TOURNAMENT_DEFINITIONS.map(createTournamentRegistryCard);
  const groups = (Object.keys(TOURNAMENT_REGISTRY_FILTER_LABELS) as TournamentRegistryFilterId[]).map((filterId) => {
    const filteredCards = cardsForFilter(filterId, cards);
    return {
      filterId,
      label: TOURNAMENT_REGISTRY_FILTER_LABELS[filterId],
      count: filteredCards.length,
      tournamentIds: filteredCards.map((card) => card.id),
    } satisfies TournamentRegistryGroupSummary;
  });

  return {
    version: TOURNAMENT_REGISTRY_SYSTEM_VERSION,
    featuredTournamentId: FEATURED_TOURNAMENT_ID,
    cards,
    groups,
    localPreviewCount: cards.filter((card) => card.localPreviewEnabled).length,
    backendLockedCount: cards.filter((card) => card.backendValidationRequired && !card.localPreviewEnabled).length,
    weeklyCount: cards.filter((card) => card.resetLabel.toLowerCase().includes("weekly")).length,
    publicSubmitEnabled: false,
    nextPatch: "v0.11.2-tournament-leaderboard-link",
  };
}

export function getTournamentRegistryCard(tournamentId: TournamentId): TournamentRegistryCard {
  const card = createTournamentRegistrySnapshot().cards.find((candidate) => candidate.id === tournamentId);
  if (!card) {
    throw new Error(`Unknown tournament registry card: ${tournamentId}`);
  }
  return card;
}

export function getTournamentRegistryFeaturedCard(): TournamentRegistryCard {
  return getTournamentRegistryCard(FEATURED_TOURNAMENT_ID);
}

export function getTournamentRegistryCardsByFilter(filterId: TournamentRegistryFilterId): TournamentRegistryCard[] {
  return cardsForFilter(filterId, createTournamentRegistrySnapshot().cards);
}

export function getTournamentRegistryGroupSummary(filterId: TournamentRegistryFilterId): TournamentRegistryGroupSummary {
  const group = createTournamentRegistrySnapshot().groups.find((candidate) => candidate.filterId === filterId);
  if (!group) {
    throw new Error(`Unknown tournament registry filter: ${filterId}`);
  }
  return group;
}
