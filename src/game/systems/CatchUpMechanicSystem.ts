import { CURRENCY_DEFINITIONS, type RewardAmount } from "../types/EconomyTypes";
import type {
  CatchUpMechanicCardMap,
  CatchUpMechanicDefinition,
  CatchUpMechanicId,
  CatchUpMechanicPreviewCard,
  CatchUpMechanicSummary,
  CatchUpMechanicSystemDefinition,
  CatchUpPreviewContext,
} from "../types/CatchUpMechanicTypes";

export const CATCH_UP_MECHANIC_SYSTEM_VERSION = "0.12.8-catch-up-mechanics";

export const CATCH_UP_MECHANIC_SYSTEM_DEFINITION: CatchUpMechanicSystemDefinition = {
  version: CATCH_UP_MECHANIC_SYSTEM_VERSION,
  goal: "Define safe catch-up rules for new, underpowered and returning players before balance debug tools, cloud save or live ranked catch-up rewards are enabled.",
  liveRewardMutationEnabled: false,
  rankedCatchUpEnabled: false,
  backendSubmitEnabled: false,
  rules: [
    "Catch-up Mechanics v1 is a planning and preview layer; it must not mutate live wallets, ranked points, tournament scores or duel rating.",
    "Catch-up can help players reach playable content, but it must never create a leaderboard advantage over active players.",
    "Local-safe boosts can target XP, coins and starter upgrade materials only.",
    "Leak Points, Rank Points, Tournament Points and cosmetic status remain backend-locked until run validation exists.",
    "Catch-up should reduce early friction, not skip campaign mastery, tournament participation or duel learning.",
  ],
  requiredBeforeLiveCatchUp: [
    "Balance Debug Panel",
    "Cloud Save Adapter",
    "Run Validation Payload",
    "Anti-Cheat Skeleton",
    "Remote Reward Claim Endpoint",
    "Season Rules",
  ],
};

export const DEFAULT_CATCH_UP_PREVIEW_CONTEXT: CatchUpPreviewContext = {
  playerLevel: 7,
  playerPower: 82,
  recommendedPower: 140,
  daysInactive: 9,
  eventProgressPercent: 72,
  duelRunsCompleted: 1,
};

export const CATCH_UP_MECHANICS: readonly CatchUpMechanicDefinition[] = [
  {
    id: "rookie_xp_boost",
    label: "Rookie XP Boost",
    scope: "progression",
    triggerKind: "level_band",
    targetCohort: "Level 1-10 players who still need the first real skill and campaign unlocks.",
    relatedModes: ["arena", "tasks", "campaign"],
    minLevel: 1,
    maxLevel: 10,
    multiplier: 1.25,
    flatRewards: [{ currencyId: "skill_cards", amount: 1 }],
    durationLabel: "First 8 safe local PvE clears",
    claimMode: "local_safe_later",
    riskTier: "safe_local",
    backendValidationRequired: false,
    leaderboardValueAllowed: false,
    rules: ["Applies only to local PvE reward previews.", "Does not increase rank, tournament or duel score."],
    displayOrder: 10,
  },
  {
    id: "early_wallet_boost",
    label: "Early Wallet Boost",
    scope: "economy",
    triggerKind: "level_band",
    targetCohort: "Early players who need basic coins for first upgrade costs.",
    relatedModes: ["arena", "profile", "tasks"],
    minLevel: 1,
    maxLevel: 15,
    multiplier: 1.15,
    flatRewards: [
      { currencyId: "coins", amount: 40 },
      { currencyId: "skin_shards", amount: 1 },
    ],
    durationLabel: "First week local preview cap",
    claimMode: "local_safe_later",
    riskTier: "safe_local",
    backendValidationRequired: false,
    leaderboardValueAllowed: false,
    rules: ["Coins can help first upgrades but must stay below soft-cap event deltas.", "Cosmetic shards stay low and non-ranked."],
    displayOrder: 20,
  },
  {
    id: "underpowered_campaign_assist",
    label: "Underpowered Campaign Assist",
    scope: "campaign",
    triggerKind: "power_gap",
    targetCohort: "Players below recommended campaign power who should train instead of hitting a hard wall.",
    relatedModes: ["campaign", "arena", "tasks"],
    minPowerGap: 35,
    multiplier: 1.1,
    flatRewards: [
      { currencyId: "xp", amount: 60 },
      { currencyId: "coins", amount: 50 },
    ],
    durationLabel: "Until player reaches fair recommended power",
    claimMode: "preview_only",
    riskTier: "progression_sensitive",
    backendValidationRequired: false,
    leaderboardValueAllowed: false,
    rules: ["Shown as a training recommendation, not an automatic campaign payout.", "Should point players to arena/tasks before boss retry."],
    displayOrder: 30,
  },
  {
    id: "returning_player_reentry",
    label: "Returning Player Re-entry",
    scope: "tasks",
    triggerKind: "days_inactive",
    targetCohort: "Players who return after a break and need a clear short task chain.",
    relatedModes: ["tasks", "arena", "campaign"],
    minDaysInactive: 7,
    multiplier: 1.2,
    flatRewards: [
      { currencyId: "xp", amount: 90 },
      { currencyId: "coins", amount: 75 },
      { currencyId: "skill_cards", amount: 1 },
    ],
    durationLabel: "3-day re-entry mission chain",
    claimMode: "preview_only",
    riskTier: "progression_sensitive",
    backendValidationRequired: true,
    leaderboardValueAllowed: false,
    rules: ["Requires server timestamp later; local clock must not be trusted for live rewards.", "No rank catch-up from inactivity alone."],
    displayOrder: 40,
  },
  {
    id: "late_tournament_joiner",
    label: "Late Tournament Joiner",
    scope: "tournament",
    triggerKind: "event_late_join",
    targetCohort: "Players who enter a tournament after most of the event window has passed.",
    relatedModes: ["tournament", "leaderboard"],
    eventProgressAfterPercent: 65,
    multiplier: 1,
    flatRewards: [{ currencyId: "tournament_points", amount: 150 }],
    durationLabel: "Participation floor only",
    claimMode: "backend_locked",
    riskTier: "ranked_sensitive",
    backendValidationRequired: true,
    leaderboardValueAllowed: false,
    rules: ["Can grant a participation floor later, never a ranking multiplier.", "Must be season/event scoped and backend-authoritative."],
    displayOrder: 50,
  },
  {
    id: "duel_starter_protection",
    label: "Duel Starter Protection",
    scope: "duel",
    triggerKind: "first_runs",
    targetCohort: "First-time Leak Duel players learning same-seed competition.",
    relatedModes: ["leak_duel", "leaderboard"],
    firstRunCount: 3,
    multiplier: 1,
    flatRewards: [
      { currencyId: "xp", amount: 50 },
      { currencyId: "coins", amount: 35 },
    ],
    durationLabel: "First 3 duel completions",
    claimMode: "backend_locked",
    riskTier: "ranked_sensitive",
    backendValidationRequired: true,
    leaderboardValueAllowed: false,
    rules: ["Can reward completion later but must not protect or inflate duel rating.", "Duel outcome and ranked points remain backend-validated."],
    displayOrder: 60,
  },
];

function safeInteger(value: number): number {
  return Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));
}

function currencyLabel(currencyId: RewardAmount["currencyId"]): string {
  return CURRENCY_DEFINITIONS.find((currency) => currency.id === currencyId)?.shortLabel ?? currencyId.toUpperCase();
}

function formatRewardLine(rewards: readonly RewardAmount[]): string {
  if (!rewards.length) return "No flat rewards";
  return rewards.map((reward) => `+${safeInteger(reward.amount)} ${currencyLabel(reward.currencyId)}`).join(" / ");
}

function isEligible(definition: CatchUpMechanicDefinition, context: CatchUpPreviewContext): boolean {
  const level = safeInteger(context.playerLevel);
  const powerGap = safeInteger(context.recommendedPower) - safeInteger(context.playerPower);

  if (definition.triggerKind === "level_band") {
    const aboveMin = definition.minLevel === undefined || level >= definition.minLevel;
    const belowMax = definition.maxLevel === undefined || level <= definition.maxLevel;
    return aboveMin && belowMax;
  }

  if (definition.triggerKind === "power_gap") {
    return powerGap >= safeInteger(definition.minPowerGap ?? 0);
  }

  if (definition.triggerKind === "days_inactive") {
    return safeInteger(context.daysInactive) >= safeInteger(definition.minDaysInactive ?? 0);
  }

  if (definition.triggerKind === "event_late_join") {
    return safeInteger(context.eventProgressPercent) >= safeInteger(definition.eventProgressAfterPercent ?? 0);
  }

  if (definition.triggerKind === "first_runs") {
    return safeInteger(context.duelRunsCompleted) < safeInteger(definition.firstRunCount ?? 0);
  }

  return false;
}

export function createCatchUpMechanicPreviewCard(
  definition: CatchUpMechanicDefinition,
  context: CatchUpPreviewContext = DEFAULT_CATCH_UP_PREVIEW_CONTEXT,
): CatchUpMechanicPreviewCard {
  const powerGap = Math.max(0, safeInteger(context.recommendedPower) - safeInteger(context.playerPower));
  const eligible = isEligible(definition, context);
  const multiplierLabel = definition.multiplier > 1 ? `${definition.multiplier.toFixed(2)}x preview` : "no score multiplier";
  const flatRewardLine = formatRewardLine(definition.flatRewards);
  const lockReason = definition.claimMode === "backend_locked"
    ? "Backend locked before live multiplayer validation."
    : definition.claimMode === "preview_only"
      ? "Preview only; no wallet mutation."
      : "Local-safe later; not enabled in this patch.";

  return {
    ...definition,
    eligible,
    powerGap,
    multiplierLabel,
    flatRewardLine,
    displayLine: `${definition.label}: ${eligible ? "ELIGIBLE PREVIEW" : "STANDBY"} / ${multiplierLabel} / ${flatRewardLine}`,
    lockReason,
  };
}

export function getCatchUpMechanics(): readonly CatchUpMechanicDefinition[] {
  return CATCH_UP_MECHANICS;
}

export function getCatchUpMechanic(id: CatchUpMechanicId): CatchUpMechanicDefinition {
  const mechanic = CATCH_UP_MECHANICS.find((candidate) => candidate.id === id);
  if (!mechanic) {
    throw new Error(`Unknown catch-up mechanic: ${id}`);
  }
  return mechanic;
}

export function getCatchUpMechanicPreviewCards(
  context: CatchUpPreviewContext = DEFAULT_CATCH_UP_PREVIEW_CONTEXT,
): CatchUpMechanicPreviewCard[] {
  return [...CATCH_UP_MECHANICS]
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((definition) => createCatchUpMechanicPreviewCard(definition, context));
}

export function getCatchUpMechanicCardMap(
  context: CatchUpPreviewContext = DEFAULT_CATCH_UP_PREVIEW_CONTEXT,
): CatchUpMechanicCardMap {
  return getCatchUpMechanicPreviewCards(context).reduce<CatchUpMechanicCardMap>((map, card) => {
    map[card.id] = card;
    return map;
  }, {} as CatchUpMechanicCardMap);
}

export function getCatchUpMechanicSummary(
  context: CatchUpPreviewContext = DEFAULT_CATCH_UP_PREVIEW_CONTEXT,
): CatchUpMechanicSummary {
  const cards = getCatchUpMechanicPreviewCards(context);
  return {
    version: CATCH_UP_MECHANIC_SYSTEM_VERSION,
    mechanicCount: cards.length,
    localSafeLaterCount: cards.filter((card) => card.claimMode === "local_safe_later").length,
    backendLockedCount: cards.filter((card) => card.claimMode === "backend_locked").length,
    rankedSensitiveCount: cards.filter((card) => card.riskTier === "ranked_sensitive").length,
    eligiblePreviewCount: cards.filter((card) => card.eligible).length,
    maxMultiplier: Math.max(...cards.map((card) => card.multiplier)),
    nextPatch: "v0.12.9-balance-debug-panel",
  };
}
