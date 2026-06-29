import { DEFAULT_HERO_ID } from "./heroes";
import { DEFAULT_LOADOUT } from "./skills";
import { DEFAULT_SKIN_ID, STARTER_SKIN_IDS } from "./skins";
import { DEFAULT_STAGE_ID } from "./stages";

export interface PlayerProfile {
  version: number;
  heroId: string;
  selectedSkinId: string;
  unlockedSkinIds: string[];
  selectedSkillIds: typeof DEFAULT_LOADOUT;
  unlockedSkillIds: string[];
  selectedStageId: string;
  unlockedStageIds: string[];
  coins: number;
  xp: number;
  level: number;
  leakPoints: number;
  campaignProgress: Record<string, number>;
  bossProgress: Record<string, boolean>;
  bestScore: number;
  totalWins: number;
  totalLosses: number;
  settings: {
    soundEnabled: boolean;
    vibrationEnabled: boolean;
  };
}

export const PROFILE_STORAGE_KEY = "broke_leak_fighter_profile_v1";

export const DEFAULT_PLAYER_PROFILE: PlayerProfile = {
  version: 1,
  heroId: DEFAULT_HERO_ID,
  selectedSkinId: DEFAULT_SKIN_ID,
  unlockedSkinIds: STARTER_SKIN_IDS,
  selectedSkillIds: DEFAULT_LOADOUT,
  unlockedSkillIds: ["green_punch", "power_kick", "wallet_guard", "broke_dash"],
  selectedStageId: DEFAULT_STAGE_ID,
  unlockedStageIds: [DEFAULT_STAGE_ID],
  coins: 0,
  xp: 0,
  level: 1,
  leakPoints: 0,
  campaignProgress: { daily_leaks: 0 },
  bossProgress: {},
  bestScore: 0,
  totalWins: 0,
  totalLosses: 0,
  settings: {
    soundEnabled: true,
    vibrationEnabled: true,
  },
};

export function createDefaultProfile(): PlayerProfile {
  return structuredClone(DEFAULT_PLAYER_PROFILE);
}

export function normalizeProfile(profile: Partial<PlayerProfile> | null | undefined): PlayerProfile {
  const normalized = {
    ...createDefaultProfile(),
    ...(profile ?? {}),
    settings: {
      ...DEFAULT_PLAYER_PROFILE.settings,
      ...(profile?.settings ?? {}),
    },
    campaignProgress: {
      ...DEFAULT_PLAYER_PROFILE.campaignProgress,
      ...(profile?.campaignProgress ?? {}),
    },
    bossProgress: {
      ...DEFAULT_PLAYER_PROFILE.bossProgress,
      ...(profile?.bossProgress ?? {}),
    },
  };

  const unlockedSkinIds = Array.from(new Set([...STARTER_SKIN_IDS, ...(profile?.unlockedSkinIds ?? [])]));
  normalized.unlockedSkinIds = unlockedSkinIds;
  if (!unlockedSkinIds.includes(normalized.selectedSkinId)) {
    normalized.selectedSkinId = DEFAULT_SKIN_ID;
  }

  return normalized;
}

export function selectProfileSkin(profile: PlayerProfile, skinId: string): PlayerProfile {
  const normalized = normalizeProfile(profile);
  if (!normalized.unlockedSkinIds.includes(skinId)) return normalized;
  normalized.selectedSkinId = skinId;
  return normalized;
}

export function unlockProfileSkin(profile: PlayerProfile, skinId: string): PlayerProfile {
  const normalized = normalizeProfile(profile);
  if (!normalized.unlockedSkinIds.includes(skinId)) {
    normalized.unlockedSkinIds = [...normalized.unlockedSkinIds, skinId];
  }
  normalized.selectedSkinId = skinId;
  return normalized;
}

export function loadPlayerProfile(): PlayerProfile {
  if (typeof window === "undefined") return createDefaultProfile();
  const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
  if (!raw) return createDefaultProfile();

  try {
    return normalizeProfile(JSON.parse(raw) as Partial<PlayerProfile>);
  } catch {
    return createDefaultProfile();
  }
}

export function savePlayerProfile(profile: PlayerProfile): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(normalizeProfile(profile)));
}
