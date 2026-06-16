import Phaser from "phaser";
import { GAME_CONFIG, GAME_HEIGHT, GAME_WIDTH } from "../../config/game";
import { SCENE_KEYS } from "../../config/routes";

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.menu);
  }

  create(): void {
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "menu-start-screen")
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setDepth(0);

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x040507, 0.45).setDepth(1);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH - 20, GAME_HEIGHT - 24, 0x020304, 0.22)
      .setStrokeStyle(1, 0x39ff14, 0.22)
      .setDepth(2);

    this.add.text(GAME_WIDTH / 2, 66, "LEAK BEAST", {
      fontFamily: "Arial",
      fontSize: "38px",
      color: "#f5fff1",
      fontStyle: "bold",
      stroke: "#050805",
      strokeThickness: 5,
    }).setOrigin(0.5).setDepth(3);

    this.add.text(GAME_WIDTH / 2, 112, "ARENA", {
      fontFamily: "Arial",
      fontSize: "56px",
      color: "#39ff14",
      fontStyle: "bold",
      stroke: "#050805",
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(3);

    this.add.text(GAME_WIDTH / 2, 163, GAME_CONFIG.tagline, {
      fontFamily: "Arial",
      fontSize: "15px",
      color: "#f5fff1",
      align: "center",
      stroke: "#050805",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(3);

    const hero = this.add.sprite(GAME_WIDTH / 2, 305, "mascot-idle-front")
      .setScale(0.18)
      .setDepth(4);
    hero.play("mascot-idle-front-anim");

    this.tweens.add({
      targets: hero,
      y: 297,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.add.text(GAME_WIDTH / 2, 425, "Real asset visual base", {
      fontFamily: "Arial",
      fontSize: "15px",
      color: "#b66cff",
      fontStyle: "bold",
      stroke: "#050805",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(3);

    this.add.text(GAME_WIDTH / 2, 454, "New mascot art, VFX and arena backgrounds integrated.", {
      fontFamily: "Arial",
      fontSize: "12px",
      color: "#f5fff1",
      align: "center",
      stroke: "#050805",
      strokeThickness: 3,
      wordWrap: { width: GAME_WIDTH - 58 },
    }).setOrigin(0.5).setDepth(3);

    const button = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 142, "PLAY ARENA", {
      fontFamily: "Arial",
      fontSize: "22px",
      color: "#050505",
      backgroundColor: "#39ff14",
      padding: { x: 52, y: 18 },
      fontStyle: "bold",
    }).setOrigin(0.5).setDepth(4);

    button.setInteractive({ useHandCursor: true });
    button.on("pointerdown", () => this.scene.start(SCENE_KEYS.arena));

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 70, "v0.3.0 real asset integration / arena visual base", {
      fontFamily: "Arial",
      fontSize: "12px",
      color: "#b7d2b6",
      stroke: "#050805",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(3);
  }
}
