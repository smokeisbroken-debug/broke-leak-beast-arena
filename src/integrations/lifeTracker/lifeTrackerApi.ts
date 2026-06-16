export interface LifeTrackerGameProfile {
  walletHp: number;
  leakScore: number;
  streakDays: number;
  cleanDay: boolean;
}

export async function getMockLifeTrackerProfile(): Promise<LifeTrackerGameProfile> {
  // Later: replace with authenticated Life Tracker API call.
  return {
    walletHp: 80,
    leakScore: 72,
    streakDays: 3,
    cleanDay: false,
  };
}

export function calculateGameBonuses(profile: LifeTrackerGameProfile) {
  return {
    maxHpBonus: profile.walletHp >= 75 ? 1 : 0,
    scoreMultiplier: profile.streakDays >= 7 ? 1.2 : profile.streakDays >= 3 ? 1.1 : 1,
    startShield: profile.cleanDay,
  };
}
