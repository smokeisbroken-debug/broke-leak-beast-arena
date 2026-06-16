import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../../config/game";
import { SCENE_KEYS } from "../../config/routes";
import { COLORS } from "../../config/theme";
import type { RunResult } from "../types/game";

export class ResultScene extends Phaser.Scene {
  private result!: RunResult;

  constructor() {
    super(SCENE_KEYS.result);
  }

  init(data: RunResult): void {
    this.result = data;
  }

  create(): void {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.bg);

    this.add.text(GAME_WIDTH / 2, 90, "RUN COMPLETE", {
      fontFamily: "Arial",
      fontSize: "34px",
      color: "#39ff14",
      fontStyle: "bold",
    }).setOrigin(0.5);

    const lines = [
      `Score: ${this.result.score}`,
      `Leaks defeated: ${this.result.leaksDefeated}`,
      `Survived: ${this.result.survivedSeconds}s`,
      `Safe Points: +${this.result.safePoints}`,
      `Boss Damage: +${this.result.bossDamage}`,
    ];

    this.add.text(54, 180, lines.join("\n"), {
      fontFamily: "Arial",
      fontSize: "22px",
      color: "#f5fff1",
      lineSpacing: 16,
    });

    const again = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 150, "PLAY AGAIN", {
      fontFamily: "Arial",
      fontSize: "20px",
      color: "#050505",
      backgroundColor: "#39ff14",
      padding: { x: 34, y: 16 },
      fontStyle: "bold",
    }).setOrigin(0.5);

    again.setInteractive({ useHandCursor: true });
    again.on("pointerdown", () => this.scene.start(SCENE_KEYS.arena));

    const menu = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 88, "BACK TO MENU", {
      fontFamily: "Arial",
      fontSize: "15px",
      color: "#f5fff1",
    }).setOrigin(0.5);

    menu.setInteractive({ useHandCursor: true });
    menu.on("pointerdown", () => this.scene.start(SCENE_KEYS.menu));
  }
}
