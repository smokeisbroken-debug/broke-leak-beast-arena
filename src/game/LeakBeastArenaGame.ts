import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../config/game";
import { COLORS } from "../config/theme";
import { BootScene } from "./scenes/BootScene";
import { PreloadScene } from "./scenes/PreloadScene";
import { MainMenuScene } from "./scenes/MainMenuScene";
import { SkinSelectScene } from "./scenes/SkinSelectScene";
import { SkillLoadoutScene } from "./scenes/SkillLoadoutScene";
import { StageSelectScene } from "./scenes/StageSelectScene";
import { CampaignScene } from "./scenes/CampaignScene";
import { MissionsScene } from "./scenes/MissionsScene";
import { LeaderboardScene } from "./scenes/LeaderboardScene";
import { TournamentScene } from "./scenes/TournamentScene";
import { DuelScene } from "./scenes/DuelScene";
import { DuelResultScene } from "./scenes/DuelResultScene";
import { ProfileScene } from "./scenes/ProfileScene";
import { SettingsScene } from "./scenes/SettingsScene";
import { ArenaScene } from "./scenes/ArenaScene";
import { ResultScene } from "./scenes/ResultScene";

export function createLeakBeastArenaGame(parent: string): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: COLORS.bg,
    render: {
      antialias: true,
      pixelArt: false,
      roundPixels: false,
      powerPreference: "high-performance",
    },
    physics: {
      default: "arcade",
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    scale: {
      // The canvas is stretched by CSS to the real mobile viewport.
      // This avoids Telegram/browser landscape windows becoming a small letterboxed box.
      mode: Phaser.Scale.NONE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      expandParent: true,
    },
    input: {
      activePointers: 6,
    },
    scene: [BootScene, PreloadScene, MainMenuScene, SkinSelectScene, SkillLoadoutScene, StageSelectScene, CampaignScene, MissionsScene, LeaderboardScene, TournamentScene, DuelScene, DuelResultScene, ProfileScene, SettingsScene, ArenaScene, ResultScene],
  });
}
