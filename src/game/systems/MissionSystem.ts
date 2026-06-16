import { DAILY_MISSIONS } from "../data/missions";

export class MissionSystem {
  getTodayMissions() {
    // Later: rotate by date and user profile.
    return DAILY_MISSIONS.slice(0, 3);
  }
}
