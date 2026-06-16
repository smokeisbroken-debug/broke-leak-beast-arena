import "./styles/global.css";
import { mountAppShell } from "./app/AppShell";
import { createLeakBeastArenaGame } from "./game/LeakBeastArenaGame";

mountAppShell();
createLeakBeastArenaGame("game-root");
