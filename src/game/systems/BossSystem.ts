import { WEEKLY_BOSSES } from "../data/bosses";
import { createBossRegistrySnapshot, getBossRegistryEntry, getBossRegistrySummary } from "./BossRegistrySystem";

export class BossSystem {
  getCurrentWeeklyBoss() {
    // Later: calculate from UTC week / backend.
    return WEEKLY_BOSSES[0];
  }

  getRegistrySnapshot() {
    return createBossRegistrySnapshot();
  }

  getRegistrySummary() {
    return getBossRegistrySummary();
  }

  getRegistryEntry(bossId: string) {
    return getBossRegistryEntry(bossId);
  }
}
