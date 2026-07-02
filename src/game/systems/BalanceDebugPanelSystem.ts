import type { PlayerProfile } from "../data/playerProfile";
import { getBossRegistrySummary } from "./BossRegistrySystem";
import { getCatchUpMechanicSummary } from "./CatchUpMechanicSystem";
import { getLocalLeaderboardMockSummary } from "./LocalLeaderboardMockSystem";
import { createRecommendedPowerUiSnapshot, getProfileRecommendedPowerValue } from "./RecommendedPowerUiSystem";
import { getRewardTableCatalogSummary } from "./RewardTableSystem";
import { getSoftCapCatalogSummary } from "./SoftCapSystem";
import { getUpgradeCostCatalogSummary } from "./UpgradeCostSystem";
import type { LeaderboardId } from "../types/LeaderboardTypes";
import type {
  BalanceDebugLeaderboardPreview,
  BalanceDebugMetricCard,
  BalanceDebugPanelSnapshot,
  BalanceDebugPanelSystemDefinition,
  BalanceDebugRiskRow,
  BalanceDebugStatus,
  BalanceDebugTone,
} from "../types/BalanceDebugPanelTypes";

export const BALANCE_DEBUG_PANEL_SYSTEM_VERSION = "0.12.9-balance-debug-panel";

export const BALANCE_DEBUG_PANEL_SYSTEM_DEFINITION: BalanceDebugPanelSystemDefinition = {
  version: BALANCE_DEBUG_PANEL_SYSTEM_VERSION,
  goal: "Expose one internal balance snapshot for player power, boss difficulty, rewards, upgrade costs, soft caps, catch-up rules and leaderboard previews before multiplayer adapters go live.",
  localPreviewOnly: true,
  backendSubmitEnabled: false,
  rules: [
    "Balance Debug Panel is internal preview only and must not mutate profile, rewards, power, missions or leaderboard state.",
    "Leaderboard, tournament, duel and boss values shown here are diagnostics until backend validation and anti-cheat exist.",
    "Reward and upgrade rows remain governed by their own claim/spend locks; this panel only aggregates risk signals.",
    "Any dangerous power gap, over-cap preview or backend-locked reward should be visible before live multiplayer work starts.",
  ],
  requiredBeforeLiveBalance: [
    "Multiplayer Adapter",
    "Cloud Save Adapter",
    "Run Validation Payload",
    "Anti-Cheat Skeleton",
    "Backend Config Layer",
  ],
};

function toneToColor(tone: BalanceDebugTone): { color: string; colorValue: number } {
  if (tone === "green") return { color: "#72ff57", colorValue: 0x72ff57 };
  if (tone === "yellow") return { color: "#ffeb72", colorValue: 0xffeb72 };
  if (tone === "orange") return { color: "#ff9b42", colorValue: 0xff9b42 };
  if (tone === "red") return { color: "#ff4866", colorValue: 0xff4866 };
  return { color: "#8cdcff", colorValue: 0x8cdcff };
}

function statusLabel(status: BalanceDebugStatus): string {
  if (status === "ok") return "OK";
  if (status === "watch") return "WATCH";
  if (status === "locked") return "LOCKED";
  return "RISK";
}

function createCard(input: Omit<BalanceDebugMetricCard, "statusLabel" | "color" | "colorValue">): BalanceDebugMetricCard {
  const { color, colorValue } = toneToColor(input.tone);
  return {
    ...input,
    statusLabel: statusLabel(input.status),
    color,
    colorValue,
  };
}

function formatInt(value: number): string {
  return Math.max(0, Math.floor(value || 0)).toLocaleString("en-US");
}

function formatLeaderboardValue(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 100000) return `${Math.round(value / 1000)}K`;
  return formatInt(value);
}

function getReadinessTone(dangerousCount: number, hardCount: number): BalanceDebugTone {
  if (dangerousCount > 0) return "red";
  if (hardCount > 0) return "orange";
  return "green";
}

function getReadinessStatus(dangerousCount: number, hardCount: number): BalanceDebugStatus {
  if (dangerousCount > 0) return "risk";
  if (hardCount > 0) return "watch";
  return "ok";
}

function createLeaderboardPreviews(profile: PlayerProfile): BalanceDebugLeaderboardPreview[] {
  const summary = getLocalLeaderboardMockSummary(profile);
  return (Object.entries(summary) as [LeaderboardId, number][]).map(([leaderboardId, value]) => ({
    leaderboardId,
    value,
    displayLine: `${leaderboardId.replace(/_/g, " ").toUpperCase()} · ${formatLeaderboardValue(value)} · LOCAL MOCK`,
    backendLocked: leaderboardId !== "global_power",
  }));
}

export function createBalanceDebugPanelSnapshot(profile: PlayerProfile, date = new Date()): BalanceDebugPanelSnapshot {
  const playerPower = getProfileRecommendedPowerValue(profile);
  const recommendedPowerSnapshot = createRecommendedPowerUiSnapshot(profile);
  const dangerousCount = recommendedPowerSnapshot.cards.filter((card) => card.status === "dangerous").length;
  const hardCount = recommendedPowerSnapshot.cards.filter((card) => card.status === "hard").length;
  const readyCount = recommendedPowerSnapshot.cards.filter((card) => card.status === "easy" || card.status === "fair").length;
  const bossSummary = getBossRegistrySummary();
  const rewardSummary = getRewardTableCatalogSummary();
  const upgradeSummary = getUpgradeCostCatalogSummary();
  const softCapSummary = getSoftCapCatalogSummary();
  const catchUpSummary = getCatchUpMechanicSummary({
    playerLevel: profile.level,
    playerPower,
    recommendedPower: bossSummary.maxRecommendedPower,
    daysInactive: 0,
    eventProgressPercent: 25,
    duelRunsCompleted: 0,
  });
  const leaderboardPreviews = createLeaderboardPreviews(profile);
  const backendLockedLeaderboardCount = leaderboardPreviews.filter((preview) => preview.backendLocked).length;

  const cards: BalanceDebugMetricCard[] = [
    createCard({
      id: "player_power",
      title: "Player Power",
      valueLabel: formatInt(playerPower),
      detailLabel: `Level ${profile.level} · XP ${formatInt(profile.xp)} · Coins ${formatInt(profile.coins)}`,
      status: playerPower > 0 ? "ok" : "watch",
      tone: playerPower > 0 ? "green" : "yellow",
      backendLocked: false,
      rows: [
        { label: "Level", value: formatInt(profile.level), tone: "green" },
        { label: "XP", value: formatInt(profile.xp), tone: "blue" },
        { label: "Power source", value: profile.progressionV2?.powerScore ? "Profile V2" : "Fallback", tone: profile.progressionV2?.powerScore ? "green" : "yellow" },
      ],
    }),
    createCard({
      id: "campaign_readiness",
      title: "Campaign Readiness",
      valueLabel: `${readyCount}/${recommendedPowerSnapshot.cards.length} ready`,
      detailLabel: `${hardCount} hard · ${dangerousCount} dangerous · guidance only`,
      status: getReadinessStatus(dangerousCount, hardCount),
      tone: getReadinessTone(dangerousCount, hardCount),
      backendLocked: dangerousCount > 0,
      rows: [
        { label: "Ready fights", value: formatInt(readyCount), tone: "green" },
        { label: "Hard fights", value: formatInt(hardCount), tone: hardCount > 0 ? "orange" : "green" },
        { label: "Dangerous fights", value: formatInt(dangerousCount), tone: dangerousCount > 0 ? "red" : "green" },
      ],
    }),
    createCard({
      id: "boss_difficulty",
      title: "Boss Difficulty",
      valueLabel: `${bossSummary.minRecommendedPower}-${bossSummary.maxRecommendedPower} rec`,
      detailLabel: `${bossSummary.totalBossCount} bosses · ${bossSummary.backendLockedCount} backend locked`,
      status: bossSummary.backendLockedCount > 0 ? "locked" : "ok",
      tone: bossSummary.backendLockedCount > 0 ? "yellow" : "green",
      backendLocked: bossSummary.backendLockedCount > 0,
      rows: [
        { label: "Campaign bosses", value: formatInt(bossSummary.campaignBossCount), tone: "blue" },
        { label: "Weekly bosses", value: formatInt(bossSummary.weeklyBossCount), tone: "yellow" },
        { label: "Local preview", value: formatInt(bossSummary.localPreviewCount), tone: "green" },
      ],
    }),
    createCard({
      id: "reward_tables",
      title: "Reward Tables",
      valueLabel: `${rewardSummary.rowCount} rows`,
      detailLabel: `${rewardSummary.localClaimableRowCount} local · ${rewardSummary.backendLockedRowCount} backend locked`,
      status: rewardSummary.backendLockedRowCount > 0 ? "locked" : "ok",
      tone: rewardSummary.backendLockedRowCount > 0 ? "yellow" : "green",
      backendLocked: rewardSummary.backendLockedRowCount > 0,
      rows: [
        { label: "Tables", value: formatInt(rewardSummary.tableCount), tone: "blue" },
        { label: "Preview only", value: formatInt(rewardSummary.previewOnlyRowCount), tone: "yellow" },
        { label: "Ranked sensitive", value: formatInt(rewardSummary.rankedSensitiveRowCount), tone: rewardSummary.rankedSensitiveRowCount > 0 ? "orange" : "green" },
      ],
    }),
    createCard({
      id: "upgrade_costs",
      title: "Upgrade Costs",
      valueLabel: `${upgradeSummary.rowCount} rows`,
      detailLabel: `${upgradeSummary.localSpendReadyRowCount} local spend · ${upgradeSummary.backendLockedRowCount} backend locked`,
      status: upgradeSummary.backendLockedRowCount > 0 ? "locked" : "ok",
      tone: upgradeSummary.backendLockedRowCount > 0 ? "yellow" : "green",
      backendLocked: upgradeSummary.backendLockedRowCount > 0,
      rows: [
        { label: "Catalogs", value: formatInt(upgradeSummary.catalogCount), tone: "blue" },
        { label: "Preview only", value: formatInt(upgradeSummary.previewOnlyRowCount), tone: "yellow" },
        { label: "Rank/seasonal", value: formatInt(upgradeSummary.rankedOrSeasonalRowCount), tone: upgradeSummary.rankedOrSeasonalRowCount > 0 ? "orange" : "green" },
      ],
    }),
    createCard({
      id: "soft_caps",
      title: "Soft Caps",
      valueLabel: `${softCapSummary.rowCount} caps`,
      detailLabel: `${softCapSummary.overCapCount} over-cap · ${softCapSummary.backendLockedCount} backend locked`,
      status: softCapSummary.overCapCount > 0 ? "risk" : softCapSummary.backendLockedCount > 0 ? "locked" : "ok",
      tone: softCapSummary.overCapCount > 0 ? "red" : softCapSummary.backendLockedCount > 0 ? "yellow" : "green",
      backendLocked: softCapSummary.backendLockedCount > 0,
      rows: [
        { label: "Local clamp ready", value: formatInt(softCapSummary.localClampReadyCount), tone: "green" },
        { label: "Warning only", value: formatInt(softCapSummary.warningOnlyCount), tone: "yellow" },
        { label: "Rank sensitive", value: formatInt(softCapSummary.rankedSensitiveCount), tone: softCapSummary.rankedSensitiveCount > 0 ? "orange" : "green" },
      ],
    }),
    createCard({
      id: "catch_up",
      title: "Catch-up Mechanics",
      valueLabel: `${catchUpSummary.eligiblePreviewCount}/${catchUpSummary.mechanicCount} eligible`,
      detailLabel: `max x${catchUpSummary.maxMultiplier.toFixed(2)} · ranked value blocked`,
      status: catchUpSummary.rankedSensitiveCount > 0 ? "watch" : "ok",
      tone: catchUpSummary.rankedSensitiveCount > 0 ? "orange" : "green",
      backendLocked: catchUpSummary.backendLockedCount > 0,
      rows: [
        { label: "Local safe later", value: formatInt(catchUpSummary.localSafeLaterCount), tone: "green" },
        { label: "Backend locked", value: formatInt(catchUpSummary.backendLockedCount), tone: catchUpSummary.backendLockedCount > 0 ? "yellow" : "green" },
        { label: "Rank sensitive", value: formatInt(catchUpSummary.rankedSensitiveCount), tone: catchUpSummary.rankedSensitiveCount > 0 ? "orange" : "green" },
      ],
    }),
    createCard({
      id: "leaderboard_preview",
      title: "Leaderboard Preview",
      valueLabel: `${leaderboardPreviews.length} boards`,
      detailLabel: `${backendLockedLeaderboardCount} backend locked · local mock only`,
      status: backendLockedLeaderboardCount > 0 ? "locked" : "ok",
      tone: backendLockedLeaderboardCount > 0 ? "yellow" : "green",
      backendLocked: backendLockedLeaderboardCount > 0,
      rows: leaderboardPreviews.slice(0, 3).map((preview) => ({
        label: preview.leaderboardId.replace(/_/g, " ").toUpperCase(),
        value: formatLeaderboardValue(preview.value),
        tone: preview.backendLocked ? "yellow" : "green",
      })),
    }),
  ];

  const riskRows: BalanceDebugRiskRow[] = [
    {
      id: "ranked_submit_lock",
      label: "Ranked submit lock",
      detail: `${backendLockedLeaderboardCount} leaderboard previews require backend validation before public scoring.`,
      status: backendLockedLeaderboardCount > 0 ? "locked" : "ok",
      tone: backendLockedLeaderboardCount > 0 ? "yellow" : "green",
      action: "Keep submit local/mock until Multiplayer Adapter, Run Validation and Anti-Cheat are ready.",
    },
    {
      id: "dangerous_power_gap",
      label: "Dangerous power gap",
      detail: `${dangerousCount} campaign/boss cards are dangerous for current player power.`,
      status: dangerousCount > 0 ? "risk" : "ok",
      tone: dangerousCount > 0 ? "red" : "green",
      action: dangerousCount > 0 ? "Do not hard-gate yet; show warnings and tune early progression rewards." : "No dangerous power gap in current preview.",
    },
    {
      id: "soft_cap_pressure",
      label: "Soft cap pressure",
      detail: `${softCapSummary.overCapCount} soft-cap rows are over cap in preview.`,
      status: softCapSummary.overCapCount > 0 ? "risk" : "ok",
      tone: softCapSummary.overCapCount > 0 ? "red" : "green",
      action: "Keep cap enforcement as preview until backend config and validation exist.",
    },
    {
      id: "reward_claim_lock",
      label: "Reward claim lock",
      detail: `${rewardSummary.backendLockedRowCount} reward rows require backend validation.`,
      status: rewardSummary.backendLockedRowCount > 0 ? "locked" : "ok",
      tone: rewardSummary.backendLockedRowCount > 0 ? "yellow" : "green",
      action: "Only local-safe rewards may claim before cloud save and anti-cheat.",
    },
  ];

  return {
    version: BALANCE_DEBUG_PANEL_SYSTEM_VERSION,
    generatedAtIso: date.toISOString(),
    playerPower,
    cards,
    riskRows,
    leaderboardPreviews,
    localPreviewOnly: true,
    backendSubmitEnabled: false,
    nextPatch: "v0.13.0-multiplayer-adapter",
  };
}

export function getBalanceDebugCriticalRiskCount(snapshot: BalanceDebugPanelSnapshot): number {
  return snapshot.riskRows.filter((row) => row.status === "risk").length;
}

export function getBalanceDebugLockedCount(snapshot: BalanceDebugPanelSnapshot): number {
  return snapshot.cards.filter((card) => card.backendLocked).length + snapshot.riskRows.filter((row) => row.status === "locked").length;
}
