import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../../config/game";
import { SCENE_KEYS } from "../../config/routes";
import { GAME_CONFIG } from "../../config/game";

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.menu);
  }

  create(): void {
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "menu-start-screen")
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setDepth(0);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x020304, 0.38).setDepth(1);

    this.add.image(GAME_WIDTH / 2, 66, "start-logo")
      .setDisplaySize(240, 140)
      .setDepth(3);

    const hero = this.add.image(200, 252, "start-hero-frog")
      .setDisplaySize(188, 236)
      .setDepth(4);

    this.tweens.add({ targets: hero, y: 242, duration: 1250, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });

    this.add.text(545, 146, "LEAK BEAST\nARENA", {
      fontFamily: "Arial", fontSize: "40px", color: "#39ff14", fontStyle: "bold", align: "center",
      stroke: "#050805", strokeThickness: 7,
    }).setOrigin(0.5).setDepth(5);

    this.add.text(545, 220, "Landscape combat build\nwith action skills and arena waves", {
      fontFamily: "Arial", fontSize: "18px", color: "#f5fff1", align: "center",
      stroke: "#050805", strokeThickness: 4,
    }).setOrigin(0.5).setDepth(5);

    const play = this.add.image(545, 308, "start-play-button")
      .setDisplaySize(260, 84)
      .setDepth(5)
      .setInteractive({ useHandCursor: true });

    play.on("pointerdown", () => this.scene.start(SCENE_KEYS.arena));
    play.on("pointerover", () => play.setScale(1.03));
    play.on("pointerout", () => play.setScale(1));

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 28, `v${GAME_CONFIG.version}`, {
      fontFamily: "Arial", fontSize: "12px", color: "#b7d2b6", stroke: "#050805", strokeThickness: 3,
    }).setOrigin(0.5).setDepth(6);
  }
}
