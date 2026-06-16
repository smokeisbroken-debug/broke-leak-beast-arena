import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../../config/game";
import { SCENE_KEYS } from "../../config/routes";

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.menu);
  }

  create(): void {
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "menu-start-screen")
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setDepth(0);

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x020304, 0.3).setDepth(1);

    this.add.image(GAME_WIDTH / 2, 112, "start-logo")
      .setDisplaySize(300, 176)
      .setDepth(3);

    const hero = this.add.image(GAME_WIDTH / 2, 292, "start-hero-frog")
      .setDisplaySize(172, 215)
      .setDepth(4);

    this.tweens.add({
      targets: hero,
      y: 282,
      duration: 1250,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    const play = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT - 210, "start-play-button")
      .setDisplaySize(278, 92)
      .setDepth(5)
      .setInteractive({ useHandCursor: true });

    play.on("pointerdown", () => this.scene.start(SCENE_KEYS.arena));
    play.on("pointerover", () => play.setScale(1.025));
    play.on("pointerout", () => play.setScale(1));

    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT - 142, "start-tagline")
      .setDisplaySize(300, 75)
      .setDepth(4);

    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT - 76, "start-feature-strip")
      .setDisplaySize(340, 85)
      .setDepth(4);

    const how = this.add.image(118, GAME_HEIGHT - 18, "start-how-to-play-button")
      .setDisplaySize(126, 42)
      .setDepth(4)
      .setAlpha(0.76);

    const rewards = this.add.image(272, GAME_HEIGHT - 18, "start-rewards-button")
      .setDisplaySize(126, 42)
      .setDepth(4)
      .setAlpha(0.76);

    how.setInteractive({ useHandCursor: true });
    rewards.setInteractive({ useHandCursor: true });

    this.add.text(GAME_WIDTH / 2, 30, "v0.3.1 visual base", {
      fontFamily: "Arial",
      fontSize: "11px",
      color: "#b7d2b6",
      stroke: "#050805",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(6);
  }
}
