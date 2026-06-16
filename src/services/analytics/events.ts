export type GameAnalyticsEvent =
  | "game_opened"
  | "run_started"
  | "run_finished"
  | "mission_completed"
  | "boss_damage_dealt";

export function trackGameEvent(event: GameAnalyticsEvent, payload: Record<string, unknown> = {}): void {
  // Later: connect to analytics provider or backend.
  console.info("[game-event]", event, payload);
}
