import type { InputState } from "../types/game";

export function emptyInputState(): InputState {
  return { x: 0, y: 0, attack: false, dodge: false, pulse: false, shield: false, slash: false };
}
