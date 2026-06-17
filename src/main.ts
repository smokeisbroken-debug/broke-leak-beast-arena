import "./styles/global.css";
import { bindGameViewportSync, mountAppShell } from "./app/AppShell";
import { createLeakBeastArenaGame } from "./game/LeakBeastArenaGame";

mountAppShell();
const game = createLeakBeastArenaGame("game-root");
bindGameViewportSync(game);
