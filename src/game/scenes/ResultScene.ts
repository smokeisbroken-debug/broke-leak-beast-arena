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
    this.add.circle(80, 115, 190, 0x123b10, 0.28);
    this.add.circle(GAME_WIDTH - 30, 90, 170, 0x40106b, 0.25);

    this.add.text(GAME_WIDTH / 2, 82, this.result.leaksDefeated > 0 ? "RUN COMPLETE" : "TRY AGAIN", {
      fontFamily: "Arial",
      fontSize: "34px",
      color: "#39ff14",
      fontStyle: "bold",
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 122, "You fought the leaks.", {
      fontFamily: "Arial",
      fontSize: "15px",
      color: "#f5fff1",
      fontStyle: "bold",
    }).setOrigin(0.5);

    this.add.rectangle(GAME_WIDTH / 2, 308, GAME_WIDTH - 56, 286, 0x050805, 0.78)
      .setStrokeStyle(1, 0x39ff14, 0.28);

    const lines = [
      ["Leaks defeated", this.result.leaksDefeated.toString()],
      ["Final score", this.result.score.toString()],
      ["Survived", `${this.result.survivedSeconds}s`],
      ["Safe Points", `+${this.result.safePoints}`],
      ["Boss Damage", `+${this.result.bossDamage}`],
    ];

    lines.forEach(([label, value], index) => {
      const y = 205 + index * 48;
      this.add.text(72, y, label.toUpperCase(), {
        fontFamily: "Arial",
        fontSize: "13px",
        color: "#9cff8a",
        fontStyle: "bold",
      });

      this.add.text(GAME_WIDTH - 72, y - 4, value, {
        fontFamily: "Arial",
        fontSize: "24px",
        color: "#f5fff1",
        fontStyle: "bold",
      }).setOrigin(1, 0);
    });

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 230, "First playable loop. No backend rewards yet.", {
      fontFamily: "Arial",
      fontSize: "13px",
      color: "#88aa88",
      align: "center",
    }).setOrigin(0.5);

    const again = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 162, "PLAY AGAIN", {
      fontFamily: "Arial",
      fontSize: "20px",
      color: "#050505",
      backgroundColor: "#39ff14",
      padding: { x: 48, y: 16 },
      fontStyle: "bold",
    }).setOrigin(0.5);

    again.setInteractive({ useHandCursor: true });
    again.on("pointerdown", () => this.scene.start(SCENE_KEYS.arena));

    const menu = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 92, "BACK TO MENU", {
      fontFamily: "Arial",
      fontSize: "15px",
      color: "#f5fff1",
      fontStyle: "bold",
    }).setOrigin(0.5);

    menu.setInteractive({ useHandCursor: true });
    menu.on("pointerdown", () => this.scene.start(SCENE_KEYS.menu));
  }
}
