export const BALANCE = {
  run: {
    maxSoftDurationSeconds: 180,
    dailyFreeRuns: 5,
  },
  scoring: {
    survivePointPerSecond: 10,
    basicEnemyDefeat: 25,
    miniBossDefeat: 250,
  },
  rewards: {
    safePointRate: 0.08,
    bossDamageRate: 0.12,
  },
  arenaBattle: {
    targetFirstBossSeconds: [35, 55],
    targetMidBossSeconds: [50, 75],
    targetFinalBossSeconds: [70, 100],
    startingEnergy: 45,
    ultimateEnergy: 100,
    ultimateDurationMs: 5000,
    roundHeal: 14,
  },
};
