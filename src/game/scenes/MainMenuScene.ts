import Phaser from "phaser";
import { GAME_CONFIG, GAME_HEIGHT, GAME_WIDTH } from "../../config/game";
import { SCENE_KEYS } from "../../config/routes";
import { COLORS } from "../../config/theme";

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.menu);
  }

  create(): void {
    this.add.text(GAME_WIDTH / 2, 80, "LEAK BEAST", {
      fontFamily: "Arial",
      fontSize: "38px",
      color: "#f5fff1",
      fontStyle: "bold",
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 124, "ARENA", {
      fontFamily: "Arial",
      fontSize: "54px",
      color: "#39ff14",
      fontStyle: "bold",
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 178, GAME_CONFIG.tagline, {
      fontFamily: "Arial",
      fontSize: "15px",
      color: "#f5fff1",
      align: "center",
    }).setOrigin(0.5);

    this.add.image(GAME_WIDTH / 2, 310, "mascot-placeholder").setScale(2.1);

    const button = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 135, "PLAY PROTOTYPE", {
      fontFamily: "Arial",
      fontSize: "20px",
      color: "#050505",
      backgroundColor: "#39ff14",
      padding: { x: 34, y: 16 },
      fontStyle: "bold",
    }).setOrigin(0.5);

    button.setInteractive({ useHandCursor: true });
    button.on("pointerdown", () => this.scene.start(SCENE_KEYS.arena));

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 70, "v0.1 structure only", {
      fontFamily: "Arial",
      fontSize: "13px",
      color: "#88aa88",
    }).setOrigin(0.5);
  }
}
