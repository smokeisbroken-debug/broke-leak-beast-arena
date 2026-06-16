import Phaser from "phaser";
import { GAME_CONFIG, GAME_HEIGHT, GAME_WIDTH } from "../../config/game";
import { SCENE_KEYS } from "../../config/routes";

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.menu);
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#050805");
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x050805);
    this.add.circle(70, 120, 190, 0x123b10, 0.3);
    this.add.circle(GAME_WIDTH - 30, 70, 170, 0x40106b, 0.24);

    this.add.text(GAME_WIDTH / 2, 66, "LEAK BEAST", {
      fontFamily: "Arial",
      fontSize: "38px",
      color: "#f5fff1",
      fontStyle: "bold",
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 111, "ARENA", {
      fontFamily: "Arial",
      fontSize: "56px",
      color: "#39ff14",
      fontStyle: "bold",
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 164, GAME_CONFIG.tagline, {
      fontFamily: "Arial",
      fontSize: "15px",
      color: "#f5fff1",
      align: "center",
    }).setOrigin(0.5);

    this.add.image(GAME_WIDTH / 2, 295, "mascot-placeholder").setScale(2.12);

    this.add.text(GAME_WIDTH / 2, 426, "Roguelite arena combat", {
      fontFamily: "Arial",
      fontSize: "15px",
      color: "#b66cff",
      fontStyle: "bold",
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 454, "Clear waves. Choose upgrades. Break boss patterns.", {
      fontFamily: "Arial",
      fontSize: "13px",
      color: "#f5fff1",
      align: "center",
    }).setOrigin(0.5);

    const button = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 142, "PLAY ARENA", {
      fontFamily: "Arial",
      fontSize: "22px",
      color: "#050505",
      backgroundColor: "#39ff14",
      padding: { x: 52, y: 18 },
      fontStyle: "bold",
    }).setOrigin(0.5);

    button.setInteractive({ useHandCursor: true });
    button.on("pointerdown", () => this.scene.start(SCENE_KEYS.arena));

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 70, "v0.2.4 roguelite upgrade loop", {
      fontFamily: "Arial",
      fontSize: "13px",
      color: "#88aa88",
    }).setOrigin(0.5);
  }
}
