import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../../config/game";
import { SCENE_KEYS } from "../../config/routes";
import { requestAppFullscreen } from "../../app/AppShell";

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.menu);
  }

  create(): void {
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "menu-start-screen")
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setDepth(0);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x020304, 0.10).setDepth(1);

    this.add.image(GAME_WIDTH / 2, 70, "start-logo")
      .setDisplaySize(246, 144)
      .setDepth(3);

    const hero = this.add.image(190, 252, "start-hero-frog")
      .setDisplaySize(202, 252)
      .setDepth(4);

    this.tweens.add({ targets: hero, y: 242, duration: 1250, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });

    const objectivePanel = this.add.rectangle(548, 186, 312, 104, 0x050805, 0.72)
      .setStrokeStyle(2, 0x39ff14, 0.26)
      .setDepth(4);

    this.add.text(objectivePanel.x, 154, "PUBLIC PLAYTEST", {
      fontFamily: "Arial",
      fontSize: "13px",
      color: "#39ff14",
      fontStyle: "bold",
      stroke: "#050805",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(5);

    this.add.text(objectivePanel.x, 187, "Survive waves\nBreak the boss\nCollect safe drops", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#f5fff1",
      align: "center",
      lineSpacing: 5,
      stroke: "#050805",
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(5);

    const play = this.add.image(545, 312, "start-play-button")
      .setDisplaySize(270, 88)
      .setDepth(5)
      .setInteractive({ useHandCursor: true });

    play.on("pointerdown", async () => {
      await requestAppFullscreen(document.documentElement);
      this.scene.start(SCENE_KEYS.arena);
    });
    play.on("pointerover", () => play.setScale(1.03));
    play.on("pointerout", () => play.setScale(1));

    this.add.text(545, 375, "Best in landscape. Use browser if Telegram crops the screen.", {
      fontFamily: "Arial",
      fontSize: "12px",
      color: "#d7ffd0",
      align: "center",
      stroke: "#050805",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(5);
  }
}
