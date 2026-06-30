import { CURRENCY_DEFINITIONS } from "../types/EconomyTypes";
import type { CurrencyId } from "../types/EconomyTypes";
import type { PlayerProfile } from "../data/playerProfile";
import { CAMPAIGN_CHAPTERS } from "../data/campaigns";
import { getMascotEvolutionSummary } from "./EvolutionSystem";
import { getSkillUpgradeSummary } from "./SkillUpgradeSystem";
import { getXpProgress } from "../data/progression";
import type { PlayerProfileV2SystemDefinition, PlayerProfileV2Summary, ProfileCurrencyRow } from "../types/PlayerProfileTypes";

export const PLAYER_PROFILE_V2_SYSTEM_VERSION = "0.9.4-skill-upgrade-skeleton";

export const PLAYER_PROFILE_V2_DEFINITION: PlayerProfileV2SystemDefinition = {
  version: PLAYER_PROFILE_V2_SYSTEM_VERSION,
  blocks: [
    {
      id: "identity",
      title: "Player Identity",
      status: "live",
      purpose: "Keep a stable local player id and display name before backend auth exists.",
    },
    {
      id: "wallet",
      title: "Wallet / Currencies",
      status: "live",
      purpose: "Mirror XP, coins, Leak Points, Rank Points, Tournament Points and cosmetic resources in one schema.",
    },
    {
      id: "progression",
      title: "Progression",
      status: "live",
      purpose: "Expose level, XP, mascot evolution, mastery placeholders and capped power score.",
    },
    {
      id: "multiplayer",
      title: "Multiplayer Totals",
      status: "local_skeleton",
      purpose: "Prepare rank, tournament, task, duel and weekly boss totals without remote submission yet.",
    },
    {
      id: "leaderboards",
      title: "Leaderboard Snapshot",
      status: "backend_locked",
      purpose: "Store local placeholders only until leaderboard backend validation is added.",
    },
    {
      id: "tournaments",
      title: "Tournament State",
      status: "backend_locked",
      purpose: "Prepare participation and pending run ids for future tournament submission.",
    },
    {
      id: "duels",
      title: "Leak Duel State",
      status: "backend_locked",
      purpose: "Prepare asynchronous 1v1 rating, wins, losses and completed duel ids.",
    },
    {
      id: "sync",
      title: "Sync / Validation",
      status: "local_skeleton",
      purpose: "Track whether this profile is local-only, pending remote validation or backend-linked later.",
    },
  ],
  rules: [
    "Profile v2 may display ranked values locally, but ranked rewards remain backend-locked.",
    "PowerScore is a capped summary for matching and recommendations, not direct damage scaling in this patch.",
    "Mascot evolution is visible in the profile and feeds capped PowerScore, but evolution bonuses are not applied to combat yet.",
    "Skill upgrade levels are visible and feed capped PowerScore, but upgrade bonuses are not applied to combat yet.",
    "Legacy top-level profile fields stay supported while wallet and multiplayer mirrors are introduced.",
  ],
};

const PROFILE_CURRENCY_ORDER: readonly CurrencyId[] = [
  "xp",
  "coins",
  "leak_points",
  "rank_points",
  "tournament_points",
  "skill_cards",
  "skin_shards",
  "cosmetic_tokens",
];

function getCurrencyAmount(profile: PlayerProfile, currencyId: CurrencyId): number {
  return Math.max(0, Math.floor(profile.wallet[currencyId] ?? 0));
}

export function getProfileDisplayName(profile: PlayerProfile): string {
  return profile.identity.displayName.trim() || "Broke Fighter";
}

export function getProfileCurrencyRows(profile: PlayerProfile): ProfileCurrencyRow[] {
  return PROFILE_CURRENCY_ORDER.map((currencyId) => {
    const definition = CURRENCY_DEFINITIONS.find((candidate) => candidate.id === currencyId);
    if (!definition) {
      throw new Error(`Unknown profile currency: ${currencyId}`);
    }

    return {
      currencyId,
      label: definition.label,
      shortLabel: definition.shortLabel,
      amount: getCurrencyAmount(profile, currencyId),
      backendValidationRequired: definition.backendValidationRequired,
    };
  });
}

export function getCampaignBossesCleared(profile: PlayerProfile): number {
  return CAMPAIGN_CHAPTERS.reduce((total, chapter) => total + (profile.campaignProgress[chapter.id] ?? 0), 0);
}

export function getPlayerProfileV2Summary(profile: PlayerProfile): PlayerProfileV2Summary {
  const xp = getXpProgress(profile.xp);
  const evolution = getMascotEvolutionSummary(profile);
  const skillUpgrades = getSkillUpgradeSummary(profile);

  return {
    localPlayerId: profile.identity.localPlayerId,
    displayName: getProfileDisplayName(profile),
    handle: profile.identity.handle,
    schemaVersion: profile.schemaVersion,
    createdAtIso: profile.identity.createdAtIso,
    lastSeenAtIso: profile.identity.lastSeenAtIso,
    validationStatus: profile.sync.validationStatus,
    backendLinked: profile.sync.backendLinked,
    progress: {
      level: profile.level,
      xp: profile.xp,
      nextLevel: xp.nextLevel?.level,
      xpRemaining: xp.remaining,
      xpProgress: xp.progress,
      evolutionId: evolution.current.id,
      evolutionName: evolution.current.name,
      evolutionTitle: evolution.current.title,
      evolutionPower: evolution.current.powerValue,
      nextEvolutionName: evolution.next?.evolution.name,
      nextEvolutionRequirement: evolution.next?.requirementLabel,
      masteryPoints: profile.progressionV2.masteryPoints,
      skillLevelTotal: skillUpgrades.totalSkillLevels,
      skillUpgradePower: skillUpgrades.totalSkillPower,
      readySkillUpgrades: skillUpgrades.readyToUpgradeCount,
      powerScore: profile.progressionV2.powerScore,
      powerBreakdown: profile.progressionV2.powerBreakdown,
    },
    currencies: getProfileCurrencyRows(profile),
    multiplayer: {
      rankPoints: profile.multiplayer.rankPoints,
      tournamentPoints: profile.multiplayer.tournamentPoints,
      taskPoints: profile.multiplayer.taskPoints,
      duelWins: profile.duels.wins,
      duelLosses: profile.duels.losses,
      duelRating: profile.duels.rating,
      weeklyBossDamage: profile.multiplayer.weeklyBossDamage,
      verifiedRunCount: profile.multiplayer.verifiedRunCount,
      pendingSubmissionCount: profile.multiplayer.pendingSubmissionCount,
    },
    unlocks: {
      skins: profile.unlockedSkinIds.length,
      skills: profile.unlockedSkillIds.length,
      stages: profile.unlockedStageIds.length,
      campaignBossesCleared: getCampaignBossesCleared(profile),
    },
  };
}
