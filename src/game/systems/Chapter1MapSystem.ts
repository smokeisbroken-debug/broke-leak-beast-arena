import { getCampaignBossState, getCampaignBossUnlockLabel, getCampaignProgress, type CampaignProfileState } from "../data/campaigns";
import { getBossRegistryEntry } from "./BossRegistrySystem";
import type {
  Chapter1MapConnector,
  Chapter1MapNodeCard,
  Chapter1MapNodeDefinition,
  Chapter1MapNodeId,
  Chapter1MapNodeStatus,
  Chapter1MapSnapshot,
  Chapter1MapSystemDefinition,
} from "../types/Chapter1MapTypes";

export const CHAPTER_1_MAP_SYSTEM_VERSION = "0.12.1-chapter-1-map";

const DEFAULT_CHAPTER_1_PROFILE: CampaignProfileState = {
  level: 1,
  selectedCampaignId: "daily_leaks",
  selectedBossId: undefined,
  bossProgress: {},
  campaignProgress: {},
};

export const CHAPTER_1_MAP_SYSTEM_DEFINITION: Chapter1MapSystemDefinition = {
  version: CHAPTER_1_MAP_SYSTEM_VERSION,
  mapId: "daily_leaks_map",
  title: "Chapter 1 Map",
  goal: "Turn Daily Leaks into a readable first PvE map with intro, ordered boss nodes, tactical hints, reward previews, task links and leaderboard links before boss rewards become real.",
  backendSubmitEnabled: false,
  localPreviewOnly: true,
  rules: [
    "Chapter 1 map may select and preview bosses, but it must not change enemy HP, player damage or campaign rewards.",
    "Boss order remains deterministic: Impulse Buy Beast → Subscription Leech → Fast Food Ogre.",
    "Leak Points and trophies stay backend-locked until run validation and anti-cheat are added.",
    "Map node status is derived from existing local campaign progress only.",
  ],
  requiredBeforeLiveCampaignRewards: [
    "Boss Rewards patch with reward tables",
    "Recommended Power UI on boss cards",
    "Run validation payload",
    "Anti-cheat skeleton",
    "Cloud save / backend profile adapter",
  ],
};

const CHAPTER_1_NODE_DEFINITIONS: readonly Chapter1MapNodeDefinition[] = [
  {
    id: "daily_intro",
    type: "intro",
    order: 1,
    title: "Daily Leak Scan",
    shortLabel: "SCAN",
    objective: "Learn the first rule: every leak is a pattern before it is a boss.",
    recommendedPower: 20,
    themeTags: ["wallet_recovery"],
    taskCategories: ["combat", "skill"],
    leaderboardLinks: ["task_points"],
    rewardPreview: [],
    tacticalHint: "Start with movement, guard and short punish windows.",
    mapX: 0.06,
    mapY: 0.52,
  },
  {
    id: "impulse_buy_beast",
    type: "boss",
    order: 2,
    title: "Impulse Buy Beast",
    shortLabel: "IMPULSE",
    objective: "Survive fast FOMO bursts and punish after the leak overcommits.",
    bossId: "impulse_buy_beast",
    recommendedPower: getBossRegistryEntry("impulse_buy_beast").difficulty.recommendedPower,
    themeTags: ["impulse_control"],
    taskCategories: ["combat", "skill"],
    leaderboardLinks: ["weekly_arena", "task_points"],
    rewardPreview: [
      { id: "xp", label: "Mascot XP", amountLabel: "+starter", backendLocked: false },
      { id: "coins", label: "Coins", amountLabel: "+upgrade budget", backendLocked: false },
    ],
    tacticalHint: "Do not chase. Wait for windup, dash out, then slash.",
    mapX: 0.28,
    mapY: 0.28,
  },
  {
    id: "subscription_leech",
    type: "boss",
    order: 3,
    title: "Subscription Leech",
    shortLabel: "SUBS",
    objective: "Break recurring drains and learn to control energy pressure.",
    bossId: "subscription_leech",
    recommendedPower: getBossRegistryEntry("subscription_leech").difficulty.recommendedPower,
    themeTags: ["recurring_costs"],
    taskCategories: ["combat", "anti_leak"],
    leaderboardLinks: ["weekly_arena", "task_points"],
    rewardPreview: [
      { id: "xp", label: "Mascot XP", amountLabel: "+chapter", backendLocked: false },
      { id: "leak_points", label: "Leak Points", amountLabel: "+anti-leak score", backendLocked: true },
    ],
    tacticalHint: "Use shield during drain pressure, then counter with heavy hits.",
    mapX: 0.5,
    mapY: 0.52,
  },
  {
    id: "fast_food_ogre",
    type: "boss",
    order: 4,
    title: "Fast Food Ogre",
    shortLabel: "CRAVE",
    objective: "Beat heavy craving swings and finish the first wallet loop.",
    bossId: "fast_food_ogre",
    recommendedPower: getBossRegistryEntry("fast_food_ogre").difficulty.recommendedPower,
    themeTags: ["food_craving"],
    taskCategories: ["boss", "anti_leak"],
    leaderboardLinks: ["weekly_arena", "task_points"],
    rewardPreview: [
      { id: "xp", label: "Mascot XP", amountLabel: "+chapter", backendLocked: false },
      { id: "leak_points", label: "Leak Points", amountLabel: "+anti-leak score", backendLocked: true },
    ],
    tacticalHint: "Heavy attacks hit hard but are readable. Guard first, punish second.",
    mapX: 0.72,
    mapY: 0.28,
  },
  {
    id: "daily_clear_reward",
    type: "reward",
    order: 5,
    title: "Daily Leaks Cleared",
    shortLabel: "CLEAR",
    objective: "Unlock Chapter 2 pressure and prepare ranked/weekly progression.",
    recommendedPower: 80,
    themeTags: ["wallet_recovery"],
    taskCategories: ["boss", "anti_leak"],
    leaderboardLinks: ["task_points", "weekly_arena"],
    rewardPreview: [
      { id: "xp", label: "Mascot XP", amountLabel: "+chapter clear", backendLocked: false },
      { id: "coins", label: "Coins", amountLabel: "+starter chest", backendLocked: false },
      { id: "starter_trophy", label: "Starter Trophy", amountLabel: "chapter clear", backendLocked: true },
    ],
    tacticalHint: "Final chapter rewards stay preview-only until backend validation exists.",
    mapX: 0.94,
    mapY: 0.52,
  },
];

function getNodeStatus(profile: CampaignProfileState, node: Chapter1MapNodeDefinition): Chapter1MapNodeStatus {
  if (node.type === "intro") return "complete";
  if (node.type === "reward") {
    return profile.bossProgress.fast_food_ogre ? "available" : "locked";
  }
  if (!node.bossId) return "locked";
  const bossState = getCampaignBossState(profile, node.bossId);
  return bossState === "unlocked" ? "available" : bossState;
}

function getNodeUnlockLabel(profile: CampaignProfileState, node: Chapter1MapNodeDefinition, status: Chapter1MapNodeStatus): string {
  if (status === "complete") return "Cleared";
  if (status === "available") return node.type === "reward" ? "Ready after Chapter 1 clear" : "Ready";
  if (node.type === "reward") return "Clear Fast Food Ogre";
  if (!node.bossId) return "Locked";
  return getCampaignBossUnlockLabel(profile, node.bossId);
}

function getNodeCtaLabel(node: Chapter1MapNodeDefinition, status: Chapter1MapNodeStatus): string {
  if (node.type === "intro") return "LEARNED";
  if (node.type === "reward") return status === "available" ? "PREVIEW" : "LOCKED";
  if (status === "complete") return "REPLAY";
  return status === "available" ? "FIGHT" : "LOCKED";
}

function createNodeCard(profile: CampaignProfileState, node: Chapter1MapNodeDefinition): Chapter1MapNodeCard {
  const status = getNodeStatus(profile, node);
  return {
    ...node,
    status,
    unlockLabel: getNodeUnlockLabel(profile, node, status),
    ctaLabel: getNodeCtaLabel(node, status),
  };
}

function createConnectors(nodes: readonly Chapter1MapNodeCard[]): Chapter1MapConnector[] {
  return nodes.slice(0, -1).map((node, index) => {
    const nextNode = nodes[index + 1];
    return {
      fromNodeId: node.id,
      toNodeId: nextNode.id,
      label: node.status === "complete" ? "OPEN" : "NEXT",
      active: node.status === "complete" || nextNode.status === "available",
    };
  });
}

function getCurrentNodeId(nodes: readonly Chapter1MapNodeCard[]): Chapter1MapNodeId {
  return nodes.find((node) => node.status === "available")?.id ?? nodes[nodes.length - 1]?.id ?? "daily_intro";
}

export function createChapter1MapSnapshot(profile: CampaignProfileState = DEFAULT_CHAPTER_1_PROFILE): Chapter1MapSnapshot {
  const nodes = CHAPTER_1_NODE_DEFINITIONS.map((node) => createNodeCard(profile, node));
  const progress = getCampaignProgress(profile).daily_leaks ?? 0;
  const recommendedPowers = nodes.map((node) => node.recommendedPower);

  return {
    version: CHAPTER_1_MAP_SYSTEM_VERSION,
    mapId: "daily_leaks_map",
    chapterId: "daily_leaks",
    title: "Chapter 1 — Daily Leaks Map",
    subtitle: "Impulse → subscriptions → cravings. Same wallet theme, increasing pressure.",
    progressLabel: `${progress}/3 bosses cleared`,
    recommendedPowerMin: Math.min(...recommendedPowers),
    recommendedPowerMax: Math.max(...recommendedPowers),
    nodes,
    connectors: createConnectors(nodes),
    currentNodeId: getCurrentNodeId(nodes),
    backendSubmitEnabled: false,
    localPreviewOnly: true,
    nextPatch: "v0.12.5-reward-tables",
  };
}

export function getChapter1MapCurrentNode(profile: CampaignProfileState = DEFAULT_CHAPTER_1_PROFILE): Chapter1MapNodeCard {
  const snapshot = createChapter1MapSnapshot(profile);
  return snapshot.nodes.find((node) => node.id === snapshot.currentNodeId) ?? snapshot.nodes[0];
}

export function getChapter1MapReadinessSummary(profile: CampaignProfileState = DEFAULT_CHAPTER_1_PROFILE): string {
  const snapshot = createChapter1MapSnapshot(profile);
  const current = snapshot.nodes.find((node) => node.id === snapshot.currentNodeId);
  return `${snapshot.progressLabel} · Current: ${current?.shortLabel ?? "SCAN"} · Power ${snapshot.recommendedPowerMin}-${snapshot.recommendedPowerMax}`;
}
