import { GAME_MODE_DEFINITIONS, type GameModeId } from "../types/GameModeTypes";
import { GAME_MODE_REGISTRY_DEFINITION, GAME_MODE_ROUTES, createModeRegistrySnapshot } from "./ModeRegistry";
import { LEADERBOARD_DEFINITIONS, type LeaderboardId } from "../types/LeaderboardTypes";
import { LEADERBOARD_SYSTEM_DEFINITION } from "./LeaderboardSystem";
import { LOCAL_LEADERBOARD_MOCK_SYSTEM_DEFINITION, createLocalLeaderboardMockSnapshot } from "./LocalLeaderboardMockSystem";
import { WEEKLY_LEADERBOARD_SYSTEM_DEFINITION, getWeeklyLeaderboardPeriodState } from "./WeeklyLeaderboardSystem";
import { LEADERBOARD_ADAPTER_SYSTEM_DEFINITION, createLeaderboardAdapterSnapshot } from "./LeaderboardAdapterSystem";
import { DEFAULT_POWER_CAPS } from "../types/ProgressionTypes";
import { BALANCE_SYSTEM_DEFINITION } from "../types/BalanceTypes";
import {
  CURRENCY_DEFINITIONS,
  ECONOMY_SYSTEM_DEFINITION,
  REWARD_SOURCE_DEFINITIONS,
  type CurrencyId,
} from "../types/EconomyTypes";
import { TASK_SKELETON_DEFINITIONS, TASK_SYSTEM_DEFINITION } from "../types/TaskTypes";
import { TASK_REWARD_SYSTEM_DEFINITION, getTaskRewardCatalogSummary } from "./TaskRewardSystem";
import { TASK_CLAIM_SYSTEM_DEFINITION } from "./TaskClaimSystem";
import { TASK_POINT_LEADERBOARD_PREP_SYSTEM_DEFINITION, getTaskPointLeaderboardPayload } from "./TaskPointLeaderboardPrepSystem";
import { TOURNAMENT_DEFINITIONS } from "../types/TournamentTypes";
import { TOURNAMENT_SYSTEM_DEFINITION, getTournamentRegistrySummary, getTournamentReadinessMap, getTournamentScorePreviewMap } from "./TournamentSystem";
import { TOURNAMENT_REGISTRY_SYSTEM_DEFINITION, createTournamentRegistrySnapshot, getTournamentRegistryFeaturedCard } from "./TournamentRegistrySystem";
import {
  TOURNAMENT_RUN_RESULT_SYSTEM_DEFINITION,
  createTournamentRunResultPreviewMap,
  createSampleTournamentRunResultPreview,
  getTournamentRunResultSummary,
} from "./TournamentRunResultSystem";
import {
  TOURNAMENT_LEADERBOARD_LINK_SYSTEM_DEFINITION,
  createSampleTournamentLeaderboardSubmitPreview,
  createTournamentLeaderboardSubmitPreviewMap,
  getTournamentLeaderboardLinkSummary,
} from "./TournamentLeaderboardLinkSystem";
import {
  TOURNAMENT_SCORING_SYSTEM_DEFINITION,
  calculateTournamentScoreSnapshot,
  createTournamentScoringPreviewCardMap,
  getTournamentScoringSummary,
} from "./TournamentScoringSystem";
import { DUEL_DEFINITIONS, LEAK_DUEL_DEFINITION } from "../types/DuelTypes";
import {
  DUEL_SYSTEM_DEFINITION,
  createDuelContractPreview,
  createDuelContractPreviewMap,
  getDuelReadinessMap,
  getDuelRegistrySummary,
} from "./DuelSystem";
import {
  DUEL_SEED_SYSTEM_DEFINITION,
  createDefaultDuelSeedSnapshot,
  createDuelSeedPreviewCard,
  createDuelSeedSnapshot,
} from "./DuelSeedSystem";
import {
  DUEL_SCORE_SYSTEM_DEFINITION,
  calculateDuelScoreSnapshot,
  createSampleDuelScoreSnapshot,
  createSampleDuelVersusPreview,
} from "./DuelScoreSystem";
import {
  DUEL_RESULT_SYSTEM_DEFINITION,
  createDuelResultPreview,
  createDuelResultPreviewMap,
  getDuelResultSummary,
} from "./DuelResultSystem";
import {
  DUEL_LEADERBOARD_LINK_SYSTEM_DEFINITION,
  createDuelLeaderboardSubmitPreviewMap,
  createSampleDuelLeaderboardSubmitPreview,
  getDuelLeaderboardLinkSummary,
} from "./DuelLeaderboardLinkSystem";
import {
  CAMPAIGN_CHAPTER_SYSTEM_DEFINITION,
  createCampaignChapterSnapshot,
  getCampaignChapterContract,
  getCampaignChapterContracts,
} from "./CampaignChapterSystem";
import {
  BOSS_REGISTRY_SYSTEM_DEFINITION,
  createBossRegistrySnapshot,
  getBossRegistryChapterGroups,
  getBossRegistryEntries,
  getBossRegistryEntry,
  getBossRegistrySummary,
} from "./BossRegistrySystem";
import {
  BOSS_REWARD_SYSTEM_DEFINITION,
  createBossRewardPreviewCard,
  getBossRewardPreviewCards,
  getBossRewardSummary,
} from "./BossRewardSystem";

import {
  CAMPAIGN_COMPLETION_REWARD_SYSTEM_DEFINITION,
  getCampaignCompletionRewardCard,
  getCampaignCompletionRewardCards,
  getCampaignCompletionRewardSummary,
} from "./CampaignCompletionRewardSystem";

import {
  REWARD_TABLE_SYSTEM_DEFINITION,
  getRewardTableCard,
  getRewardTableCardMap,
  getRewardTableCards,
  getRewardTableCatalogSummary,
  getRewardTableRowMap,
  getRewardTableRows,
} from "./RewardTableSystem";

import {
  UPGRADE_COST_SYSTEM_DEFINITION,
  getUpgradeCostCard,
  getUpgradeCostCardMap,
  getUpgradeCostCards,
  getUpgradeCostCatalogSummary,
  getUpgradeCostRowMap,
  getUpgradeCostRows,
} from "./UpgradeCostSystem";

import {
  SOFT_CAP_SYSTEM_DEFINITION,
  getSoftCapCatalogSummary,
  getSoftCapDefinitions,
  getSoftCapRowMap,
  getSoftCapRows,
  getSoftCapScopeCardMap,
  getSoftCapScopeCards,
} from "./SoftCapSystem";

import {
  CATCH_UP_MECHANIC_SYSTEM_DEFINITION,
  getCatchUpMechanicCardMap,
  getCatchUpMechanicPreviewCards,
  getCatchUpMechanicSummary,
  getCatchUpMechanics,
} from "./CatchUpMechanicSystem";

import {
  BALANCE_DEBUG_PANEL_SYSTEM_DEFINITION,
  createBalanceDebugPanelSnapshot,
  getBalanceDebugCriticalRiskCount,
  getBalanceDebugLockedCount,
} from "./BalanceDebugPanelSystem";

import {
  MULTIPLAYER_ADAPTER_SYSTEM_DEFINITION,
  createMultiplayerAdapterEnvelope,
  createMultiplayerAdapterSnapshot,
  getMultiplayerAdapterReadinessRows,
  getMultiplayerAdapterSummary,
} from "./MultiplayerAdapterSystem";

import {
  CLOUD_SAVE_ADAPTER_SYSTEM_DEFINITION,
  createCloudSaveBlockRows,
  createCloudSaveProfileHash,
  createCloudSaveSnapshotEnvelope,
  getCloudSaveAdapterSummary,
} from "./CloudSaveAdapterSystem";

import {
  CHAPTER_1_MAP_SYSTEM_DEFINITION,
  createChapter1MapSnapshot,
  getChapter1MapCurrentNode,
  getChapter1MapReadinessSummary,
} from "./Chapter1MapSystem";
import { SAVE_SCHEMA_DEFINITION_V2 } from "../types/SaveSchemaTypes";
import { PLAYER_PROFILE_V2_DEFINITION } from "./ProfileSystem";
import { EVOLUTION_SYSTEM_DEFINITION } from "../types/EvolutionTypes";
import { SKILL_UPGRADE_SYSTEM_DEFINITION } from "../types/SkillUpgradeTypes";
import { MASTERY_SYSTEM_DEFINITION } from "../types/MasteryTypes";
import { PROGRESSION_UI_SYSTEM_DEFINITION } from "./ProgressionUiSystem";
import {
  RECOMMENDED_POWER_UI_SYSTEM_DEFINITION,
  createRecommendedPowerUiSnapshot,
  getCampaignRecommendedPowerSummary,
  getRecommendedPowerUiCard,
} from "./RecommendedPowerUiSystem";

export const GAME_SYSTEMS_VERSION = "0.13.1-cloud-save-adapter";

export type GameSystemId =
  | "modes"
  | "profile"
  | "progression"
  | "evolution"
  | "skill_upgrades"
  | "mastery"
  | "economy"
  | "balance"
  | "catch_up"
  | "tasks"
  | "leaderboard"
  | "tournaments"
  | "duels"
  | "campaign"
  | "bosses"
  | "multiplayer"
  | "anti_cheat"
  | "seasons";

export type GameSystemStatus = "existing" | "skeleton" | "planned";
export type GameSystemPriority = "now" | "next" | "later";

export interface GameSystemDefinition {
  id: GameSystemId;
  title: string;
  status: GameSystemStatus;
  priority: GameSystemPriority;
  goal: string;
  dependsOn: GameSystemId[];
  relatedModes: GameModeId[];
  nextPatch: string;
}

export interface GameSystemsRegistrySnapshot {
  version: string;
  systems: readonly GameSystemDefinition[];
  modes: typeof GAME_MODE_DEFINITIONS;
  modeRoutes: typeof GAME_MODE_ROUTES;
  modeRegistry: ReturnType<typeof createModeRegistrySnapshot>;
  modeRegistryDefinition: typeof GAME_MODE_REGISTRY_DEFINITION;
  economy: typeof ECONOMY_SYSTEM_DEFINITION;
  balance: typeof BALANCE_SYSTEM_DEFINITION;
  currencies: typeof CURRENCY_DEFINITIONS;
  rewardSources: typeof REWARD_SOURCE_DEFINITIONS;
  powerCaps: typeof DEFAULT_POWER_CAPS;
  leaderboards: typeof LEADERBOARD_DEFINITIONS;
  leaderboardSystem: typeof LEADERBOARD_SYSTEM_DEFINITION;
  localLeaderboardMockSystem: typeof LOCAL_LEADERBOARD_MOCK_SYSTEM_DEFINITION;
  localLeaderboardMockSnapshotFactory: typeof createLocalLeaderboardMockSnapshot;
  weeklyLeaderboardSystem: typeof WEEKLY_LEADERBOARD_SYSTEM_DEFINITION;
  weeklyLeaderboardPeriod: ReturnType<typeof getWeeklyLeaderboardPeriodState>;
  leaderboardAdapterSystem: typeof LEADERBOARD_ADAPTER_SYSTEM_DEFINITION;
  leaderboardAdapterSnapshotFactory: typeof createLeaderboardAdapterSnapshot;
  taskSystem: typeof TASK_SYSTEM_DEFINITION;
  taskRewardSystem: typeof TASK_REWARD_SYSTEM_DEFINITION;
  taskClaimSystem: typeof TASK_CLAIM_SYSTEM_DEFINITION;
  taskPointLeaderboardPrepSystem: typeof TASK_POINT_LEADERBOARD_PREP_SYSTEM_DEFINITION;
  taskPointLeaderboardPayloadFactory: typeof getTaskPointLeaderboardPayload;
  taskRewardCatalog: ReturnType<typeof getTaskRewardCatalogSummary>;
  taskSkeletons: typeof TASK_SKELETON_DEFINITIONS;
  tournamentSkeletons: typeof TOURNAMENT_DEFINITIONS;
  tournamentSystem: typeof TOURNAMENT_SYSTEM_DEFINITION;
  tournamentRegistrySystem: typeof TOURNAMENT_REGISTRY_SYSTEM_DEFINITION;
  tournamentRegistrySnapshot: ReturnType<typeof createTournamentRegistrySnapshot>;
  tournamentRegistryFeaturedCard: ReturnType<typeof getTournamentRegistryFeaturedCard>;
  tournamentRegistrySummary: ReturnType<typeof getTournamentRegistrySummary>;
  tournamentReadinessMap: ReturnType<typeof getTournamentReadinessMap>;
  tournamentScorePreviewMap: ReturnType<typeof getTournamentScorePreviewMap>;
  tournamentScoringSystem: typeof TOURNAMENT_SCORING_SYSTEM_DEFINITION;
  tournamentScoringSummary: ReturnType<typeof getTournamentScoringSummary>;
  tournamentScoringPreviewCardMap: ReturnType<typeof createTournamentScoringPreviewCardMap>;
  tournamentScoreSnapshotFactory: typeof calculateTournamentScoreSnapshot;
  tournamentRunResultSystem: typeof TOURNAMENT_RUN_RESULT_SYSTEM_DEFINITION;
  tournamentRunResultSummary: ReturnType<typeof getTournamentRunResultSummary>;
  tournamentRunResultPreviewMap: ReturnType<typeof createTournamentRunResultPreviewMap>;
  tournamentRunResultPreviewFactory: typeof createSampleTournamentRunResultPreview;
  tournamentLeaderboardLinkSystem: typeof TOURNAMENT_LEADERBOARD_LINK_SYSTEM_DEFINITION;
  tournamentLeaderboardLinkSummary: ReturnType<typeof getTournamentLeaderboardLinkSummary>;
  tournamentLeaderboardSubmitPreviewMap: ReturnType<typeof createTournamentLeaderboardSubmitPreviewMap>;
  tournamentLeaderboardSubmitPreviewFactory: typeof createSampleTournamentLeaderboardSubmitPreview;
  duelDefinitions: typeof DUEL_DEFINITIONS;
  duelSystem: typeof DUEL_SYSTEM_DEFINITION;
  duelSeedSystem: typeof DUEL_SEED_SYSTEM_DEFINITION;
  duelSeedSnapshot: ReturnType<typeof createDefaultDuelSeedSnapshot>;
  duelSeedSnapshotFactory: typeof createDuelSeedSnapshot;
  duelSeedPreviewCardFactory: typeof createDuelSeedPreviewCard;
  duelScoreSystem: typeof DUEL_SCORE_SYSTEM_DEFINITION;
  duelScoreSnapshot: ReturnType<typeof createSampleDuelScoreSnapshot>;
  duelScoreSnapshotFactory: typeof calculateDuelScoreSnapshot;
  duelVersusPreview: ReturnType<typeof createSampleDuelVersusPreview>;
  duelVersusPreviewFactory: typeof createSampleDuelVersusPreview;
  duelResultSystem: typeof DUEL_RESULT_SYSTEM_DEFINITION;
  duelResultSummary: ReturnType<typeof getDuelResultSummary>;
  duelResultPreview: ReturnType<typeof createDuelResultPreview>;
  duelResultPreviewMap: ReturnType<typeof createDuelResultPreviewMap>;
  duelResultPreviewFactory: typeof createDuelResultPreview;
  duelLeaderboardLinkSystem: typeof DUEL_LEADERBOARD_LINK_SYSTEM_DEFINITION;
  duelLeaderboardLinkSummary: ReturnType<typeof getDuelLeaderboardLinkSummary>;
  duelLeaderboardSubmitPreviewMap: ReturnType<typeof createDuelLeaderboardSubmitPreviewMap>;
  duelLeaderboardSubmitPreviewFactory: typeof createSampleDuelLeaderboardSubmitPreview;
  duelRegistrySummary: ReturnType<typeof getDuelRegistrySummary>;
  duelReadinessMap: ReturnType<typeof getDuelReadinessMap>;
  duelContractPreviewMap: ReturnType<typeof createDuelContractPreviewMap>;
  duelContractPreviewFactory: typeof createDuelContractPreview;
  duelSkeleton: typeof LEAK_DUEL_DEFINITION;
  campaignChapterSystem: typeof CAMPAIGN_CHAPTER_SYSTEM_DEFINITION;
  campaignChapterSnapshot: ReturnType<typeof createCampaignChapterSnapshot>;
  campaignChapterSnapshotFactory: typeof createCampaignChapterSnapshot;
  campaignChapterContracts: ReturnType<typeof getCampaignChapterContracts>;
  campaignChapterContractFactory: typeof getCampaignChapterContract;
  bossRegistrySystem: typeof BOSS_REGISTRY_SYSTEM_DEFINITION;
  bossRegistrySnapshot: ReturnType<typeof createBossRegistrySnapshot>;
  bossRegistrySummary: ReturnType<typeof getBossRegistrySummary>;
  bossRegistryEntries: ReturnType<typeof getBossRegistryEntries>;
  bossRegistryEntryFactory: typeof getBossRegistryEntry;
  bossRegistryChapterGroups: ReturnType<typeof getBossRegistryChapterGroups>;
  bossRewardSystem: typeof BOSS_REWARD_SYSTEM_DEFINITION;
  bossRewardPreviewCards: ReturnType<typeof getBossRewardPreviewCards>;
  bossRewardPreviewCardFactory: typeof createBossRewardPreviewCard;
  bossRewardSummary: ReturnType<typeof getBossRewardSummary>;
  campaignCompletionRewardSystem: typeof CAMPAIGN_COMPLETION_REWARD_SYSTEM_DEFINITION;
  campaignCompletionRewardCards: ReturnType<typeof getCampaignCompletionRewardCards>;
  campaignCompletionRewardCardFactory: typeof getCampaignCompletionRewardCard;
  campaignCompletionRewardSummary: ReturnType<typeof getCampaignCompletionRewardSummary>;
  rewardTableSystem: typeof REWARD_TABLE_SYSTEM_DEFINITION;
  rewardTableRows: ReturnType<typeof getRewardTableRows>;
  rewardTableRowMap: ReturnType<typeof getRewardTableRowMap>;
  rewardTableCards: ReturnType<typeof getRewardTableCards>;
  rewardTableCardMap: ReturnType<typeof getRewardTableCardMap>;
  rewardTableCardFactory: typeof getRewardTableCard;
  rewardTableCatalogSummary: ReturnType<typeof getRewardTableCatalogSummary>;
  upgradeCostSystem: typeof UPGRADE_COST_SYSTEM_DEFINITION;
  upgradeCostRows: ReturnType<typeof getUpgradeCostRows>;
  upgradeCostRowMap: ReturnType<typeof getUpgradeCostRowMap>;
  upgradeCostCards: ReturnType<typeof getUpgradeCostCards>;
  upgradeCostCardMap: ReturnType<typeof getUpgradeCostCardMap>;
  upgradeCostCardFactory: typeof getUpgradeCostCard;
  upgradeCostCatalogSummary: ReturnType<typeof getUpgradeCostCatalogSummary>;
  softCapSystem: typeof SOFT_CAP_SYSTEM_DEFINITION;
  softCapDefinitions: ReturnType<typeof getSoftCapDefinitions>;
  softCapRows: ReturnType<typeof getSoftCapRows>;
  softCapRowMap: ReturnType<typeof getSoftCapRowMap>;
  softCapScopeCards: ReturnType<typeof getSoftCapScopeCards>;
  softCapScopeCardMap: ReturnType<typeof getSoftCapScopeCardMap>;
  softCapCatalogSummary: ReturnType<typeof getSoftCapCatalogSummary>;
  catchUpMechanicSystem: typeof CATCH_UP_MECHANIC_SYSTEM_DEFINITION;
  catchUpMechanics: ReturnType<typeof getCatchUpMechanics>;
  catchUpMechanicPreviewCards: ReturnType<typeof getCatchUpMechanicPreviewCards>;
  catchUpMechanicCardMap: ReturnType<typeof getCatchUpMechanicCardMap>;
  catchUpMechanicSummary: ReturnType<typeof getCatchUpMechanicSummary>;
  balanceDebugPanelSystem: typeof BALANCE_DEBUG_PANEL_SYSTEM_DEFINITION;
  balanceDebugPanelSnapshotFactory: typeof createBalanceDebugPanelSnapshot;
  balanceDebugCriticalRiskCountFactory: typeof getBalanceDebugCriticalRiskCount;
  balanceDebugLockedCountFactory: typeof getBalanceDebugLockedCount;
  multiplayerAdapterSystem: typeof MULTIPLAYER_ADAPTER_SYSTEM_DEFINITION;
  multiplayerAdapterSnapshotFactory: typeof createMultiplayerAdapterSnapshot;
  multiplayerAdapterEnvelopeFactory: typeof createMultiplayerAdapterEnvelope;
  multiplayerAdapterReadinessRows: ReturnType<typeof getMultiplayerAdapterReadinessRows>;
  multiplayerAdapterSummary: ReturnType<typeof getMultiplayerAdapterSummary>;
  cloudSaveAdapterSystem: typeof CLOUD_SAVE_ADAPTER_SYSTEM_DEFINITION;
  cloudSaveAdapterSummary: ReturnType<typeof getCloudSaveAdapterSummary>;
  cloudSaveSnapshotEnvelopeFactory: typeof createCloudSaveSnapshotEnvelope;
  cloudSaveBlockRowsFactory: typeof createCloudSaveBlockRows;
  cloudSaveProfileHashFactory: typeof createCloudSaveProfileHash;
  chapter1MapSystem: typeof CHAPTER_1_MAP_SYSTEM_DEFINITION;
  chapter1MapSnapshot: ReturnType<typeof createChapter1MapSnapshot>;
  chapter1MapSnapshotFactory: typeof createChapter1MapSnapshot;
  chapter1MapCurrentNode: ReturnType<typeof getChapter1MapCurrentNode>;
  chapter1MapReadinessSummary: ReturnType<typeof getChapter1MapReadinessSummary>;
  saveSchema: typeof SAVE_SCHEMA_DEFINITION_V2;
  playerProfile: typeof PLAYER_PROFILE_V2_DEFINITION;
  evolution: typeof EVOLUTION_SYSTEM_DEFINITION;
  skillUpgrades: typeof SKILL_UPGRADE_SYSTEM_DEFINITION;
  mastery: typeof MASTERY_SYSTEM_DEFINITION;
  progressionUi: typeof PROGRESSION_UI_SYSTEM_DEFINITION;
  recommendedPowerUiSystem: typeof RECOMMENDED_POWER_UI_SYSTEM_DEFINITION;
  recommendedPowerUiSnapshotFactory: typeof createRecommendedPowerUiSnapshot;
  recommendedPowerUiCardFactory: typeof getRecommendedPowerUiCard;
  recommendedPowerCampaignSummaryFactory: typeof getCampaignRecommendedPowerSummary;
}

export const GAME_SYSTEMS: readonly GameSystemDefinition[] = [
  {
    id: "modes",
    title: "Mode Registry",
    status: "skeleton",
    priority: "now",
    goal: "Centralize playable, ranked and backend-locked mode routes before UI and multiplayer work expands.",
    dependsOn: [],
    relatedModes: ["arena", "campaign", "tasks", "profile", "leaderboard", "tournament", "leak_duel", "weekly_boss"],
    nextPatch: "v0.13.1-cloud-save-adapter",
  },
  {
    id: "profile",
    title: "Player Profile",
    status: "existing",
    priority: "now",
    goal: "Store identity, selected loadout, synced wallet, capped power score and future multiplayer-safe fields.",
    dependsOn: ["modes"],
    relatedModes: ["profile", "arena", "campaign"],
    nextPatch: "v0.13.1-cloud-save-adapter",
  },
  {
    id: "progression",
    title: "Progression",
    status: "existing",
    priority: "now",
    goal: "Unify level, XP, mastery placeholders and capped power score.",
    dependsOn: ["modes", "profile"],
    relatedModes: ["profile", "campaign", "leaderboard"],
    nextPatch: "v0.13.1-cloud-save-adapter",
  },
  {
    id: "evolution",
    title: "Mascot Evolution",
    status: "skeleton",
    priority: "now",
    goal: "Define capped long-term mascot forms for profile identity, PowerScore and future seasons without direct combat scaling yet.",
    dependsOn: ["modes", "profile", "progression"],
    relatedModes: ["profile", "campaign", "leaderboard", "tournament", "leak_duel"],
    nextPatch: "v0.13.1-cloud-save-adapter",
  },
  {
    id: "skill_upgrades",
    title: "Skill Upgrades",
    status: "skeleton",
    priority: "now",
    goal: "Define capped skill levels, upgrade costs and PowerScore contribution before real upgrade spending and combat scaling are enabled.",
    dependsOn: ["modes", "profile", "progression", "evolution"],
    relatedModes: ["profile", "campaign", "leaderboard", "tournament", "leak_duel"],
    nextPatch: "v0.13.1-cloud-save-adapter",
  },
  {
    id: "mastery",
    title: "Mastery",
    status: "skeleton",
    priority: "now",
    goal: "Define long-term horizontal branches for guard, dash, skills, bosses, leak control and survival without direct combat scaling yet.",
    dependsOn: ["modes", "profile", "progression", "evolution", "skill_upgrades"],
    relatedModes: ["profile", "campaign", "leaderboard", "tournament", "leak_duel", "weekly_boss"],
    nextPatch: "v0.13.1-cloud-save-adapter",
  },
  {
    id: "economy",
    title: "Economy",
    status: "skeleton",
    priority: "now",
    goal: "Separate XP, coins, leak points, rank points, tournament points and cosmetics.",
    dependsOn: ["modes", "profile", "progression", "evolution", "skill_upgrades", "mastery"],
    relatedModes: ["tasks", "tournament", "leak_duel", "weekly_boss"],
    nextPatch: "v0.13.1-cloud-save-adapter",
  },
  {
    id: "balance",
    title: "Balance Formula",
    status: "skeleton",
    priority: "now",
    goal: "Define capped power score, difficulty score and matchup evaluation before ranked systems go live.",
    dependsOn: ["modes", "profile", "progression", "evolution", "skill_upgrades", "mastery", "economy"],
    relatedModes: ["arena", "campaign", "leaderboard", "tournament", "leak_duel", "weekly_boss"],
    nextPatch: "v0.13.1-cloud-save-adapter",
  },
  {
    id: "catch_up",
    title: "Catch-up Mechanics",
    status: "skeleton",
    priority: "now",
    goal: "Define safe catch-up rules for rookie, underpowered, returning, late tournament and first-duel players without granting ranked advantage.",
    dependsOn: ["profile", "progression", "economy", "balance"],
    relatedModes: ["arena", "campaign", "tasks", "leaderboard", "tournament", "leak_duel"],
    nextPatch: "v0.13.1-cloud-save-adapter",
  },
  {
    id: "tasks",
    title: "Task System",
    status: "skeleton",
    priority: "now",
    goal: "Define daily, weekly, tournament, duel and boss tasks, reward previews, local progress tracking and safe daily claim flow before task-point leaderboard payloads are enabled.",
    dependsOn: ["profile", "economy", "balance"],
    relatedModes: ["tasks", "leaderboard", "tournament", "leak_duel", "weekly_boss"],
    nextPatch: "v0.13.1-cloud-save-adapter",
  },
  {
    id: "leaderboard",
    title: "Leaderboard",
    status: "skeleton",
    priority: "now",
    goal: "Display typed score contracts, deterministic local mock snapshots and weekly reset previews before remote submission is enabled.",
    dependsOn: ["profile", "progression", "evolution", "skill_upgrades", "mastery", "balance", "tasks", "anti_cheat"],
    relatedModes: ["leaderboard", "tournament", "leak_duel", "weekly_boss"],
    nextPatch: "v0.13.1-cloud-save-adapter",
  },
  {
    id: "tournaments",
    title: "Tournaments",
    status: "skeleton",
    priority: "next",
    goal: "Define time-boxed events with rules, participation points, deterministic scoring and ranked leaderboard wiring.",
    dependsOn: ["leaderboard", "economy", "balance", "anti_cheat"],
    relatedModes: ["tournament", "leaderboard"],
    nextPatch: "v0.13.1-cloud-save-adapter",
  },
  {
    id: "duels",
    title: "Leak Duel 1v1",
    status: "skeleton",
    priority: "next",
    goal: "Create asynchronous 1 vs 1 battles on identical leak-pressure seeds with capped score comparison.",
    dependsOn: ["leaderboard", "economy", "balance", "anti_cheat"],
    relatedModes: ["leak_duel", "leaderboard"],
    nextPatch: "v0.13.1-cloud-save-adapter",
  },
  {
    id: "campaign",
    title: "Campaign",
    status: "existing",
    priority: "later",
    goal: "Expose PvE chapters through a backend-ready skeleton, Chapter 1 tactical map, boss nodes, gates, task links, reward previews and recommended power bands.",
    dependsOn: ["profile", "progression", "economy", "balance"],
    relatedModes: ["campaign"],
    nextPatch: "v0.13.1-cloud-save-adapter",
  },
  {
    id: "bosses",
    title: "Boss Registry v2",
    status: "skeleton",
    priority: "later",
    goal: "Normalize campaign bosses and weekly community bosses with difficultyScore, recommendedPower, threat tags, reward previews and leaderboard/task links.",
    dependsOn: ["campaign", "leaderboard", "balance"],
    relatedModes: ["arena", "campaign", "weekly_boss", "tournament", "leak_duel"],
    nextPatch: "v0.13.1-cloud-save-adapter",
  },
  {
    id: "multiplayer",
    title: "Multiplayer Adapter",
    status: "skeleton",
    priority: "now",
    goal: "Prepare backend adapters for cloud save, leaderboard, tournament and duel submission while public remote sync remains locked.",
    dependsOn: ["profile", "leaderboard", "tournaments", "duels"],
    relatedModes: ["leaderboard", "tournament", "leak_duel", "weekly_boss"],
    nextPatch: "v0.13.2-run-validation-payload",
  },
  {
    id: "anti_cheat",
    title: "Anti-Cheat",
    status: "skeleton",
    priority: "later",
    goal: "Validate run payloads before ranked scores or rewards become real.",
    dependsOn: ["profile", "multiplayer"],
    relatedModes: ["leaderboard", "tournament", "leak_duel", "weekly_boss"],
    nextPatch: "v0.13.3-anti-cheat-skeleton",
  },
  {
    id: "seasons",
    title: "Seasons",
    status: "planned",
    priority: "later",
    goal: "Create long-term progression cycles, cosmetics, missions and seasonal rankings.",
    dependsOn: ["leaderboard", "tournaments", "multiplayer"],
    relatedModes: ["leaderboard", "tournament", "tasks", "weekly_boss"],
    nextPatch: "v0.14.1-season-types",
  },
];

export const GAME_SYSTEMS_REGISTRY: GameSystemsRegistrySnapshot = {
  version: GAME_SYSTEMS_VERSION,
  systems: GAME_SYSTEMS,
  modes: GAME_MODE_DEFINITIONS,
  modeRoutes: GAME_MODE_ROUTES,
  modeRegistry: createModeRegistrySnapshot(),
  modeRegistryDefinition: GAME_MODE_REGISTRY_DEFINITION,
  economy: ECONOMY_SYSTEM_DEFINITION,
  balance: BALANCE_SYSTEM_DEFINITION,
  currencies: CURRENCY_DEFINITIONS,
  rewardSources: REWARD_SOURCE_DEFINITIONS,
  powerCaps: DEFAULT_POWER_CAPS,
  leaderboards: LEADERBOARD_DEFINITIONS,
  leaderboardSystem: LEADERBOARD_SYSTEM_DEFINITION,
  localLeaderboardMockSystem: LOCAL_LEADERBOARD_MOCK_SYSTEM_DEFINITION,
  localLeaderboardMockSnapshotFactory: createLocalLeaderboardMockSnapshot,
  weeklyLeaderboardSystem: WEEKLY_LEADERBOARD_SYSTEM_DEFINITION,
  weeklyLeaderboardPeriod: getWeeklyLeaderboardPeriodState(),
  leaderboardAdapterSystem: LEADERBOARD_ADAPTER_SYSTEM_DEFINITION,
  leaderboardAdapterSnapshotFactory: createLeaderboardAdapterSnapshot,
  taskSystem: TASK_SYSTEM_DEFINITION,
  taskRewardSystem: TASK_REWARD_SYSTEM_DEFINITION,
  taskClaimSystem: TASK_CLAIM_SYSTEM_DEFINITION,
  taskPointLeaderboardPrepSystem: TASK_POINT_LEADERBOARD_PREP_SYSTEM_DEFINITION,
  taskPointLeaderboardPayloadFactory: getTaskPointLeaderboardPayload,
  taskRewardCatalog: getTaskRewardCatalogSummary(),
  taskSkeletons: TASK_SKELETON_DEFINITIONS,
  tournamentSkeletons: TOURNAMENT_DEFINITIONS,
  tournamentSystem: TOURNAMENT_SYSTEM_DEFINITION,
  tournamentRegistrySystem: TOURNAMENT_REGISTRY_SYSTEM_DEFINITION,
  tournamentRegistrySnapshot: createTournamentRegistrySnapshot(),
  tournamentRegistryFeaturedCard: getTournamentRegistryFeaturedCard(),
  tournamentRegistrySummary: getTournamentRegistrySummary(),
  tournamentReadinessMap: getTournamentReadinessMap(),
  tournamentScorePreviewMap: getTournamentScorePreviewMap(),
  tournamentScoringSystem: TOURNAMENT_SCORING_SYSTEM_DEFINITION,
  tournamentScoringSummary: getTournamentScoringSummary(),
  tournamentScoringPreviewCardMap: createTournamentScoringPreviewCardMap(),
  tournamentScoreSnapshotFactory: calculateTournamentScoreSnapshot,
  tournamentRunResultSystem: TOURNAMENT_RUN_RESULT_SYSTEM_DEFINITION,
  tournamentRunResultSummary: getTournamentRunResultSummary(),
  tournamentRunResultPreviewMap: createTournamentRunResultPreviewMap(),
  tournamentRunResultPreviewFactory: createSampleTournamentRunResultPreview,
  tournamentLeaderboardLinkSystem: TOURNAMENT_LEADERBOARD_LINK_SYSTEM_DEFINITION,
  tournamentLeaderboardLinkSummary: getTournamentLeaderboardLinkSummary(),
  tournamentLeaderboardSubmitPreviewMap: createTournamentLeaderboardSubmitPreviewMap(),
  tournamentLeaderboardSubmitPreviewFactory: createSampleTournamentLeaderboardSubmitPreview,
  duelDefinitions: DUEL_DEFINITIONS,
  duelSystem: DUEL_SYSTEM_DEFINITION,
  duelSeedSystem: DUEL_SEED_SYSTEM_DEFINITION,
  duelSeedSnapshot: createDefaultDuelSeedSnapshot(),
  duelSeedSnapshotFactory: createDuelSeedSnapshot,
  duelSeedPreviewCardFactory: createDuelSeedPreviewCard,
  duelScoreSystem: DUEL_SCORE_SYSTEM_DEFINITION,
  duelScoreSnapshot: createSampleDuelScoreSnapshot(),
  duelScoreSnapshotFactory: calculateDuelScoreSnapshot,
  duelVersusPreview: createSampleDuelVersusPreview(),
  duelVersusPreviewFactory: createSampleDuelVersusPreview,
  duelResultSystem: DUEL_RESULT_SYSTEM_DEFINITION,
  duelResultSummary: getDuelResultSummary(),
  duelResultPreview: createDuelResultPreview(),
  duelResultPreviewMap: createDuelResultPreviewMap(),
  duelResultPreviewFactory: createDuelResultPreview,
  duelLeaderboardLinkSystem: DUEL_LEADERBOARD_LINK_SYSTEM_DEFINITION,
  duelLeaderboardLinkSummary: getDuelLeaderboardLinkSummary(),
  duelLeaderboardSubmitPreviewMap: createDuelLeaderboardSubmitPreviewMap(),
  duelLeaderboardSubmitPreviewFactory: createSampleDuelLeaderboardSubmitPreview,
  duelRegistrySummary: getDuelRegistrySummary(),
  duelReadinessMap: getDuelReadinessMap(),
  duelContractPreviewMap: createDuelContractPreviewMap(),
  duelContractPreviewFactory: createDuelContractPreview,
  duelSkeleton: LEAK_DUEL_DEFINITION,
  campaignChapterSystem: CAMPAIGN_CHAPTER_SYSTEM_DEFINITION,
  campaignChapterSnapshot: createCampaignChapterSnapshot(),
  campaignChapterSnapshotFactory: createCampaignChapterSnapshot,
  campaignChapterContracts: getCampaignChapterContracts(),
  campaignChapterContractFactory: getCampaignChapterContract,
  bossRegistrySystem: BOSS_REGISTRY_SYSTEM_DEFINITION,
  bossRegistrySnapshot: createBossRegistrySnapshot(),
  bossRegistrySummary: getBossRegistrySummary(),
  bossRegistryEntries: getBossRegistryEntries(),
  bossRegistryEntryFactory: getBossRegistryEntry,
  bossRegistryChapterGroups: getBossRegistryChapterGroups(),
  bossRewardSystem: BOSS_REWARD_SYSTEM_DEFINITION,
  bossRewardPreviewCards: getBossRewardPreviewCards(),
  bossRewardPreviewCardFactory: createBossRewardPreviewCard,
  bossRewardSummary: getBossRewardSummary(),
  campaignCompletionRewardSystem: CAMPAIGN_COMPLETION_REWARD_SYSTEM_DEFINITION,
  campaignCompletionRewardCards: getCampaignCompletionRewardCards(),
  campaignCompletionRewardCardFactory: getCampaignCompletionRewardCard,
  campaignCompletionRewardSummary: getCampaignCompletionRewardSummary(),
  rewardTableSystem: REWARD_TABLE_SYSTEM_DEFINITION,
  rewardTableRows: getRewardTableRows(),
  rewardTableRowMap: getRewardTableRowMap(),
  rewardTableCards: getRewardTableCards(),
  rewardTableCardMap: getRewardTableCardMap(),
  rewardTableCardFactory: getRewardTableCard,
  rewardTableCatalogSummary: getRewardTableCatalogSummary(),
  upgradeCostSystem: UPGRADE_COST_SYSTEM_DEFINITION,
  upgradeCostRows: getUpgradeCostRows(),
  upgradeCostRowMap: getUpgradeCostRowMap(),
  upgradeCostCards: getUpgradeCostCards(),
  upgradeCostCardMap: getUpgradeCostCardMap(),
  upgradeCostCardFactory: getUpgradeCostCard,
  upgradeCostCatalogSummary: getUpgradeCostCatalogSummary(),
  softCapSystem: SOFT_CAP_SYSTEM_DEFINITION,
  softCapDefinitions: getSoftCapDefinitions(),
  softCapRows: getSoftCapRows(),
  softCapRowMap: getSoftCapRowMap(),
  softCapScopeCards: getSoftCapScopeCards(),
  softCapScopeCardMap: getSoftCapScopeCardMap(),
  softCapCatalogSummary: getSoftCapCatalogSummary(),
  catchUpMechanicSystem: CATCH_UP_MECHANIC_SYSTEM_DEFINITION,
  catchUpMechanics: getCatchUpMechanics(),
  catchUpMechanicPreviewCards: getCatchUpMechanicPreviewCards(),
  catchUpMechanicCardMap: getCatchUpMechanicCardMap(),
  catchUpMechanicSummary: getCatchUpMechanicSummary(),
  balanceDebugPanelSystem: BALANCE_DEBUG_PANEL_SYSTEM_DEFINITION,
  balanceDebugPanelSnapshotFactory: createBalanceDebugPanelSnapshot,
  balanceDebugCriticalRiskCountFactory: getBalanceDebugCriticalRiskCount,
  balanceDebugLockedCountFactory: getBalanceDebugLockedCount,
  multiplayerAdapterSystem: MULTIPLAYER_ADAPTER_SYSTEM_DEFINITION,
  multiplayerAdapterSnapshotFactory: createMultiplayerAdapterSnapshot,
  multiplayerAdapterEnvelopeFactory: createMultiplayerAdapterEnvelope,
  multiplayerAdapterReadinessRows: getMultiplayerAdapterReadinessRows(),
  multiplayerAdapterSummary: getMultiplayerAdapterSummary(),
  cloudSaveAdapterSystem: CLOUD_SAVE_ADAPTER_SYSTEM_DEFINITION,
  cloudSaveAdapterSummary: getCloudSaveAdapterSummary(),
  cloudSaveSnapshotEnvelopeFactory: createCloudSaveSnapshotEnvelope,
  cloudSaveBlockRowsFactory: createCloudSaveBlockRows,
  cloudSaveProfileHashFactory: createCloudSaveProfileHash,
  chapter1MapSystem: CHAPTER_1_MAP_SYSTEM_DEFINITION,
  chapter1MapSnapshot: createChapter1MapSnapshot(),
  chapter1MapSnapshotFactory: createChapter1MapSnapshot,
  chapter1MapCurrentNode: getChapter1MapCurrentNode(),
  chapter1MapReadinessSummary: getChapter1MapReadinessSummary(),
  saveSchema: SAVE_SCHEMA_DEFINITION_V2,
  playerProfile: PLAYER_PROFILE_V2_DEFINITION,
  evolution: EVOLUTION_SYSTEM_DEFINITION,
  skillUpgrades: SKILL_UPGRADE_SYSTEM_DEFINITION,
  mastery: MASTERY_SYSTEM_DEFINITION,
  progressionUi: PROGRESSION_UI_SYSTEM_DEFINITION,
  recommendedPowerUiSystem: RECOMMENDED_POWER_UI_SYSTEM_DEFINITION,
  recommendedPowerUiSnapshotFactory: createRecommendedPowerUiSnapshot,
  recommendedPowerUiCardFactory: getRecommendedPowerUiCard,
  recommendedPowerCampaignSummaryFactory: getCampaignRecommendedPowerSummary,
};

export function getGameSystem(systemId: GameSystemId): GameSystemDefinition {
  const system = GAME_SYSTEMS.find((candidate) => candidate.id === systemId);
  if (!system) {
    throw new Error(`Unknown game system: ${systemId}`);
  }
  return system;
}

export function getSystemsByPriority(priority: GameSystemPriority): GameSystemDefinition[] {
  return GAME_SYSTEMS.filter((system) => system.priority === priority);
}

export function getSystemsForLeaderboard(leaderboardId: LeaderboardId): GameSystemDefinition[] {
  const leaderboardSystemIds: Record<LeaderboardId, GameSystemId[]> = {
    global_power: ["profile", "progression", "evolution", "skill_upgrades", "balance", "leaderboard"],
    weekly_arena: ["profile", "balance", "leaderboard", "anti_cheat"],
    task_points: ["tasks", "leaderboard", "anti_cheat"],
    tournament: ["tournaments", "balance", "leaderboard", "anti_cheat"],
    duel_ranked: ["duels", "balance", "leaderboard", "anti_cheat"],
    boss_damage: ["bosses", "balance", "leaderboard", "anti_cheat"],
  };

  return leaderboardSystemIds[leaderboardId].map(getGameSystem);
}

export function getCurrencyBackendRequirements(): Record<CurrencyId, boolean> {
  return CURRENCY_DEFINITIONS.reduce<Record<CurrencyId, boolean>>((requirements, currency) => {
    requirements[currency.id] = currency.backendValidationRequired;
    return requirements;
  }, {} as Record<CurrencyId, boolean>);
}
