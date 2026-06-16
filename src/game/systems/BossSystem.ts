import { WEEKLY_BOSSES } from "../data/bosses";

export class BossSystem {
  getCurrentWeeklyBoss() {
    // Later: calculate from UTC week / backend.
    return WEEKLY_BOSSES[0];
  }
}
