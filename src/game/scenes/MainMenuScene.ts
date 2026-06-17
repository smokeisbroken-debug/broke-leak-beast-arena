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
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x020304, 0.26).setDepth(1);

    this.add.image(GAME_WIDTH / 2, 70, "start-logo")
      .setDisplaySize(246, 144)
      .setDepth(3);

    const hero = this.add.image(192, 252, "start-hero-frog")
      .setDisplaySize(196, 244)
      .setDepth(4);

    this.tweens.add({ targets: hero, y: 242, duration: 1250, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });

    const play = this.add.image(545, 302, "start-play-button")
      .setDisplaySize(260, 84)
      .setDepth(5)
      .setInteractive({ useHandCursor: true });

    play.on("pointerdown", async () => {
      await requestAppFullscreen(document.documentElement);
      this.scene.start(SCENE_KEYS.arena);
    });
    play.on("pointerover", () => play.setScale(1.03));
    play.on("pointerout", () => play.setScale(1));
  }
}
