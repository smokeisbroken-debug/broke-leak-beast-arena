export interface MissionRewardBundle {
  xp: number;
  coins: number;
  leakPoints: number;
  skillCards?: number;
  skinShards?: number;
}

export type DailyMissionKind =
  | "fight"
  | "win"
  | "defeat_leaks"
  | "block"
  | "dodge"
  | "use_skill"
  | "use_ultimate"
  | "no_ultimate_win"
  | "no_hit_win"
  | "score_target";

export interface DailyMissionDefinition {
  id: string;
  title: string;
  description: string;
  kind: DailyMissionKind;
  target: number;
  reward: MissionRewardBundle;
  color: number;
  uiColor: string;
}

export interface DailyMissionFightStats {
  victory: boolean;
  score: number;
  leaksDefeated: number;
  survivedSeconds: number;
  bossesBroken: number;
  blocks: number;
  dodges: number;
  skillsUsed: number;
  ultimatesUsed: number;
  damageTaken: number;
  usedUltimate: boolean;
}

export interface DailyMissionState {
  definition: DailyMissionDefinition;
  progress: number;
  target: number;
  completed: boolean;
  claimed: boolean;
}

export const DAILY_MISSIONS: DailyMissionDefinition[] = [
  {
    id: "fight_once",
    title: "Enter the Arena",
    description: "Complete 1 fight today.",
    kind: "fight",
    target: 1,
    reward: { xp: 45, coins: 35, leakPoints: 5 },
    color: 0x72ff57,
    uiColor: "#72ff57",
  },
  {
    id: "win_once",
    title: "Protect the Wallet",
    description: "Win 1 campaign fight.",
    kind: "win",
    target: 1,
    reward: { xp: 70, coins: 55, leakPoints: 8 },
    color: 0xffeb72,
    uiColor: "#ffeb72",
  },
  {
    id: "break_three_leaks",
    title: "Break 3 Leaks",
    description: "Defeat 3 Leak Beasts across fights.",
    kind: "defeat_leaks",
    target: 3,
    reward: { xp: 75, coins: 70, leakPoints: 12, skillCards: 1 },
    color: 0xd9a7ff,
    uiColor: "#d9a7ff",
  },
  {
    id: "block_six",
    title: "Hold Guard",
    description: "Block 6 enemy attacks.",
    kind: "block",
    target: 6,
    reward: { xp: 55, coins: 45, leakPoints: 8 },
    color: 0x39ff14,
    uiColor: "#39ff14",
  },
  {
    id: "use_three_skills",
    title: "Use Skills",
    description: "Cast 3 active skills.",
    kind: "use_skill",
    target: 3,
    reward: { xp: 60, coins: 45, leakPoints: 10, skillCards: 1 },
    color: 0x6cf0ff,
    uiColor: "#6cf0ff",
  },
  {
    id: "ultimate_once",
    title: "Ultimate Budget",
    description: "Activate Ultimate once.",
    kind: "use_ultimate",
    target: 1,
    reward: { xp: 80, coins: 65, leakPoints: 12 },
    color: 0xff8a3d,
    uiColor: "#ffb06c",
  },
  {
    id: "no_ultimate_win",
    title: "Discipline Win",
    description: "Win without using Ultimate.",
    kind: "no_ultimate_win",
    target: 1,
    reward: { xp: 110, coins: 90, leakPoints: 18, skinShards: 1 },
    color: 0xff4866,
    uiColor: "#ff9aaa",
  },
  {
    id: "score_1500",
    title: "High Score Leak Hunt",
    description: "Finish a fight with 1500+ score.",
    kind: "score_target",
    target: 1,
    reward: { xp: 90, coins: 80, leakPoints: 15 },
    color: 0xa45cff,
    uiColor: "#d9a7ff",
  },
];

export function getDailyMissionDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getDailyMissionIncrement(mission: DailyMissionDefinition, stats: DailyMissionFightStats): number {
  switch (mission.kind) {
    case "fight": return 1;
    case "win": return stats.victory ? 1 : 0;
    case "defeat_leaks": return stats.leaksDefeated;
    case "block": return stats.blocks;
    case "dodge": return stats.dodges;
    case "use_skill": return stats.skillsUsed;
    case "use_ultimate": return stats.ultimatesUsed;
    case "no_ultimate_win": return stats.victory && !stats.usedUltimate ? 1 : 0;
    case "no_hit_win": return stats.victory && stats.damageTaken <= 0 ? 1 : 0;
    case "score_target": return stats.score >= 1500 ? 1 : 0;
    default: return 0;
  }
}

export function formatMissionReward(reward: MissionRewardBundle): string {
  const parts = [`+${reward.xp} XP`, `+${reward.coins} coins`, `+${reward.leakPoints} LP`];
  if (reward.skillCards) parts.push(`+${reward.skillCards} skill card`);
  if (reward.skinShards) parts.push(`+${reward.skinShards} skin shard`);
  return parts.join(" · ");
}
