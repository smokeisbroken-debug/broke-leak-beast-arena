import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../../config/game";
import { SCENE_KEYS } from "../../config/routes";
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
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "result-screen")
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setDepth(0);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x040507, 0.58).setDepth(1);

    const grade = this.getGrade();

    this.add.text(GAME_WIDTH / 2, 44, this.result.leaksDefeated > 0 ? "RUN COMPLETE" : "TRY AGAIN", {
      fontFamily: "Arial", fontSize: "30px", color: "#39ff14", fontStyle: "bold", stroke: "#050805", strokeThickness: 5,
    }).setOrigin(0.5).setDepth(3);

    this.add.text(GAME_WIDTH / 2, 80, `Arena Grade: ${grade}`, {
      fontFamily: "Arial", fontSize: "16px", color: "#b66cff", fontStyle: "bold", stroke: "#050805", strokeThickness: 4,
    }).setOrigin(0.5).setDepth(3);

    this.add.rectangle(GAME_WIDTH / 2, 235, GAME_WIDTH - 100, 210, 0x050805, 0.82)
      .setStrokeStyle(1, 0x39ff14, 0.28)
      .setDepth(2);

    const lines = [
      ["Leaks defeated", this.result.leaksDefeated.toString()],
      ["Final score", this.result.score.toString()],
      ["Survived", `${this.result.survivedSeconds}s`],
      ["Safe Points", `+${this.result.safePoints}`],
      ["Boss Damage", `+${this.result.bossDamage}`],
      ["Build Upgrades", this.result.upgradesChosen.toString()],
    ];

    lines.forEach(([label, value], index) => {
      const col = index < 3 ? 0 : 1;
      const row = index % 3;
      const x = col === 0 ? 120 : GAME_WIDTH / 2 + 40;
      const y = 148 + row * 48;
      this.add.text(x, y, label.toUpperCase(), {
        fontFamily: "Arial", fontSize: "13px", color: "#9cff8a", fontStyle: "bold",
      }).setDepth(3);

      this.add.text(x + 220, y - 4, value, {
        fontFamily: "Arial", fontSize: "24px", color: "#f5fff1", fontStyle: "bold",
      }).setOrigin(1, 0).setDepth(3);
    });

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 92, "Prototype only. No backend rewards yet.", {
      fontFamily: "Arial", fontSize: "13px", color: "#d8e9d6", align: "center", stroke: "#050805", strokeThickness: 3,
    }).setOrigin(0.5).setDepth(3);

    const again = this.add.text(GAME_WIDTH / 2 - 110, GAME_HEIGHT - 46, "PLAY AGAIN", {
      fontFamily: "Arial", fontSize: "18px", color: "#050505", backgroundColor: "#39ff14", padding: { x: 26, y: 12 }, fontStyle: "bold",
    }).setOrigin(0.5).setDepth(4);
    again.setInteractive({ useHandCursor: true });
    again.on("pointerdown", () => this.scene.start(SCENE_KEYS.arena));

    const menu = this.add.text(GAME_WIDTH / 2 + 120, GAME_HEIGHT - 46, "BACK TO MENU", {
      fontFamily: "Arial", fontSize: "15px", color: "#f5fff1", fontStyle: "bold", stroke: "#050805", strokeThickness: 3,
    }).setOrigin(0.5).setDepth(4);
    menu.setInteractive({ useHandCursor: true });
    menu.on("pointerdown", () => this.scene.start(SCENE_KEYS.menu));
  }

  private getGrade(): string {
    if (this.result.score >= 2600 || this.result.survivedSeconds >= 90) return "S";
    if (this.result.score >= 1600 || this.result.survivedSeconds >= 60) return "A";
    if (this.result.score >= 900 || this.result.survivedSeconds >= 40) return "B";
    if (this.result.score >= 350 || this.result.survivedSeconds >= 20) return "C";
    return "D";
  }
}
