import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../config/game";
import { COLORS } from "../config/theme";
import { BootScene } from "./scenes/BootScene";
import { PreloadScene } from "./scenes/PreloadScene";
import { MainMenuScene } from "./scenes/MainMenuScene";
import { ArenaScene } from "./scenes/ArenaScene";
import { ResultScene } from "./scenes/ResultScene";

export function createLeakBeastArenaGame(parent: string): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: COLORS.bg,
    physics: {
      default: "arcade",
      arcade: {
        gravity: { y: 0 },
        debug: false,
      },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [BootScene, PreloadScene, MainMenuScene, ArenaScene, ResultScene],
  });
}
