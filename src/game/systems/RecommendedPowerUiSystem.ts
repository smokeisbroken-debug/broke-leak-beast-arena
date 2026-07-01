import { CAMPAIGN_CHAPTERS, getCampaignBosses, type CampaignProfileState } from "../data/campaigns";
import { evaluateMatchup } from "../types/BalanceTypes";
import { getBossRegistryEntry } from "./BossRegistrySystem";
import type { PlayerProfile } from "../data/playerProfile";
import type { BossRegistryEntry } from "../types/BossRegistryTypes";
import type {
  RecommendedPowerChapterSummary,
  RecommendedPowerStatusId,
  RecommendedPowerUiCard,
  RecommendedPowerUiSnapshot,
  RecommendedPowerUiSystemDefinition,
} from "../types/RecommendedPowerUiTypes";

export const RECOMMENDED_POWER_UI_SYSTEM_VERSION = "0.12.3-recommended-power-ui";

export const RECOMMENDED_POWER_UI_SYSTEM_DEFINITION: RecommendedPowerUiSystemDefinition = {
  version: RECOMMENDED_POWER_UI_SYSTEM_VERSION,
  goal: "Show player power, recommended power, difficulty and readiness status on campaign and boss UI before real power gates, ranked submit rules or reward multipliers are enabled.",
  backendSubmitEnabled: false,
  localPreviewOnly: true,
  rules: [
    "Recommended Power UI is guidance only in this patch. It must not block campaign fights.",
    "Player Power is read from the existing capped profile powerScore and does not change combat stats.",
    "Boss difficulty comes from Boss Registry v2 and stays a UI/balance preview until backend validation exists.",
    "DANGEROUS content may warn the player, but it must not change rewards, enemy HP, damage or unlocks yet.",
  ],
  requiredBeforePowerGates: [
    "Reward Tables",
    "Upgrade Costs",
    "Soft Caps",
    "Run Validation Payload",
    "Anti-Cheat Skeleton",
    "Cloud Save Adapter",
  ],
};

function safeInt(value: number | undefined, fallback = 0): number {
  return Math.max(0, Math.floor(Number.isFinite(value) ? value ?? fallback : fallback));
}

export function getProfileRecommendedPowerValue(profile: Pick<PlayerProfile, "progressionV2" | "level" | "xp">): number {
  const syncedPower = safeInt(profile.progressionV2?.powerScore);
  if (syncedPower > 0) return syncedPower;
  return Math.max(1, safeInt(profile.level, 1) * 10 + Math.floor(safeInt(profile.xp) / 1000));
}

function normalizeStatus(playerPower: number, recommendedPower: number): RecommendedPowerStatusId {
  const delta = playerPower - recommendedPower;
  if (delta >= 30) return "easy";
  if (delta >= -20) return "fair";
  if (delta >= -60) return "hard";
  return "dangerous";
}

function getStatusLabel(status: RecommendedPowerStatusId): RecommendedPowerUiCard["statusLabel"] {
  if (status === "easy") return "EASY";
  if (status === "fair") return "FAIR";
  if (status === "hard") return "HARD";
  return "DANGEROUS";
}

function getStatusTone(status: RecommendedPowerStatusId): RecommendedPowerUiCard["tone"] {
  if (status === "easy") return "green";
  if (status === "fair") return "yellow";
  if (status === "hard") return "orange";
  return "red";
}

function getStatusColor(status: RecommendedPowerStatusId): { color: string; colorValue: number } {
  if (status === "easy") return { color: "#72ff57", colorValue: 0x72ff57 };
  if (status === "fair") return { color: "#ffeb72", colorValue: 0xffeb72 };
  if (status === "hard") return { color: "#ff9b42", colorValue: 0xff9b42 };
  return { color: "#ff4866", colorValue: 0xff4866 };
}

function getTacticalHint(status: RecommendedPowerStatusId): string {
  if (status === "easy") return "Safe cleanup fight. Good for replay, practice and farming once rewards are validated.";
  if (status === "fair") return "Target balance range. Your build should be ready if you avoid repeated mistakes.";
  if (status === "hard") return "Hard fight. Upgrade skills, guard better, or expect tighter punish windows.";
  return "Underpowered warning. Try more missions, XP, skill upgrades or earlier bosses first.";
}

export function createRecommendedPowerUiCardFromBoss(
  profile: Pick<PlayerProfile, "progressionV2" | "level" | "xp">,
  bossId: string,
): RecommendedPowerUiCard {
  const entry: BossRegistryEntry = getBossRegistryEntry(bossId);
  const playerPower = getProfileRecommendedPowerValue(profile);
  const recommendedPower = safeInt(entry.difficulty.recommendedPower);
  const difficultyScore = safeInt(entry.difficulty.total);
  const matchup = evaluateMatchup(playerPower, recommendedPower);
  const status = normalizeStatus(playerPower, recommendedPower);
  const { color, colorValue } = getStatusColor(status);
  const deltaPrefix = matchup.delta >= 0 ? "+" : "";

  return {
    contentId: entry.id,
    contentKind: entry.scopes.includes("weekly") ? "weekly_boss" : "campaign_boss",
    contentName: entry.name,
    playerPower,
    recommendedPower,
    difficultyScore,
    difficultyBand: entry.difficulty.band,
    difficultyLabel: `${entry.difficulty.band.toUpperCase()} ${difficultyScore}`,
    delta: matchup.delta,
    rawMatchupStatus: matchup.status,
    status,
    statusLabel: getStatusLabel(status),
    tone: getStatusTone(status),
    color,
    colorValue,
    shortLine: `YOUR ${playerPower} / REC ${recommendedPower}`,
    detailLine: `DIFFICULTY ${entry.difficulty.band.toUpperCase()} · SCORE ${difficultyScore} · DELTA ${deltaPrefix}${matchup.delta}`,
    tacticalHint: getTacticalHint(status),
    rankedEligiblePreview: matchup.rankedEligible && !entry.backendLocked,
    rewardMultiplierPreview: matchup.rewardMultiplier,
    backendValidationRequired: entry.backendLocked || status === "dangerous",
  };
}

export function getRecommendedPowerUiCard(
  profile: Pick<PlayerProfile, "progressionV2" | "level" | "xp">,
  bossId: string,
): RecommendedPowerUiCard {
  return createRecommendedPowerUiCardFromBoss(profile, bossId);
}

function getStatusWeight(status: RecommendedPowerStatusId): number {
  if (status === "easy") return 0;
  if (status === "fair") return 1;
  if (status === "hard") return 2;
  return 3;
}

function getWorstStatus(statuses: readonly RecommendedPowerStatusId[]): RecommendedPowerStatusId {
  return statuses.reduce<RecommendedPowerStatusId>((worst, status) => (getStatusWeight(status) > getStatusWeight(worst) ? status : worst), "easy");
}

function getBestStatus(statuses: readonly RecommendedPowerStatusId[]): RecommendedPowerStatusId {
  return statuses.reduce<RecommendedPowerStatusId>((best, status) => (getStatusWeight(status) < getStatusWeight(best) ? status : best), "dangerous");
}

export function getCampaignRecommendedPowerCards(
  profile: Pick<PlayerProfile, "progressionV2" | "level" | "xp">,
  chapterId: string,
): RecommendedPowerUiCard[] {
  return getCampaignBosses(chapterId).map((boss) => createRecommendedPowerUiCardFromBoss(profile, boss.id));
}

export function getCampaignRecommendedPowerSummary(
  profile: Pick<PlayerProfile, "progressionV2" | "level" | "xp"> & CampaignProfileState,
  chapterId: string,
): RecommendedPowerChapterSummary {
  const cards = getCampaignRecommendedPowerCards(profile, chapterId);
  const playerPower = getProfileRecommendedPowerValue(profile);
  const recommendedPowers = cards.map((card) => card.recommendedPower);
  const statuses = cards.map((card) => card.status);
  const minRecommendedPower = recommendedPowers.length ? Math.min(...recommendedPowers) : 0;
  const maxRecommendedPower = recommendedPowers.length ? Math.max(...recommendedPowers) : 0;
  const readyCount = cards.filter((card) => card.status === "easy" || card.status === "fair").length;
  const hardCount = cards.filter((card) => card.status === "hard").length;
  const dangerousCount = cards.filter((card) => card.status === "dangerous").length;

  return {
    chapterId,
    playerPower,
    minRecommendedPower,
    maxRecommendedPower,
    easiestStatus: statuses.length ? getBestStatus(statuses) : "easy",
    hardestStatus: statuses.length ? getWorstStatus(statuses) : "easy",
    readyCount,
    hardCount,
    dangerousCount,
    displayLine: `YOUR POWER ${playerPower} · REC ${minRecommendedPower}-${maxRecommendedPower} · READY ${readyCount}/${cards.length}`,
  };
}

export function createRecommendedPowerUiSnapshot(profile: PlayerProfile): RecommendedPowerUiSnapshot {
  const cards = CAMPAIGN_CHAPTERS.flatMap((chapter) => getCampaignRecommendedPowerCards(profile, chapter.id));
  const chapterSummaries = CAMPAIGN_CHAPTERS.map((chapter) => getCampaignRecommendedPowerSummary(profile, chapter.id));

  return {
    version: RECOMMENDED_POWER_UI_SYSTEM_VERSION,
    playerPower: getProfileRecommendedPowerValue(profile),
    cards,
    chapterSummaries,
    backendSubmitEnabled: false,
    localPreviewOnly: true,
    nextPatch: "v0.12.5-reward-tables",
  };
}
