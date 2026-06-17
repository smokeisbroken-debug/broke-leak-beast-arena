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
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x040507, 0.42).setDepth(1);

    const grade = this.getGrade();
    const bossesBroken = this.result.bossesBroken ?? 0;
    const pickupsCollected = this.result.pickupsCollected ?? 0;

    this.add.text(GAME_WIDTH / 2, 42, this.result.leaksDefeated > 0 ? "RUN COMPLETE" : "TRY AGAIN", {
      fontFamily: "Arial", fontSize: "30px", color: "#39ff14", fontStyle: "bold", stroke: "#050805", strokeThickness: 5,
    }).setOrigin(0.5).setDepth(3);

    this.add.text(GAME_WIDTH / 2, 77, `Arena Grade: ${grade}`, {
      fontFamily: "Arial", fontSize: "16px", color: "#b66cff", fontStyle: "bold", stroke: "#050805", strokeThickness: 4,
    }).setOrigin(0.5).setDepth(3);

    this.add.rectangle(GAME_WIDTH / 2, 224, GAME_WIDTH - 90, 210, 0x050805, 0.84)
      .setStrokeStyle(2, 0x39ff14, 0.28)
      .setDepth(2);

    const lines = [
      ["Leaks broken", this.result.leaksDefeated.toString()],
      ["Survived", `${this.result.survivedSeconds}s`],
      ["Bosses broken", bossesBroken.toString()],
      ["Final score", this.result.score.toString()],
      ["Pickups", pickupsCollected.toString()],
      ["Safe Points", `+${this.result.safePoints}`],
    ];

    lines.forEach(([label, value], index) => {
      const col = index < 3 ? 0 : 1;
      const row = index % 3;
      const x = col === 0 ? 116 : GAME_WIDTH / 2 + 48;
      const y = 137 + row * 52;
      this.add.text(x, y, label.toUpperCase(), {
        fontFamily: "Arial", fontSize: "12px", color: "#9cff8a", fontStyle: "bold",
      }).setDepth(3);

      this.add.text(x + 224, y - 4, value, {
        fontFamily: "Arial", fontSize: "24px", color: "#f5fff1", fontStyle: "bold",
      }).setOrigin(1, 0).setDepth(3);
    });

    const shareButton = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 92, 250, 42, 0x071107, 0.94)
      .setStrokeStyle(2, 0xb66cff, 0.55)
      .setDepth(4)
      .setInteractive({ useHandCursor: true });
    const shareText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 92, "COPY RESULT", {
      fontFamily: "Arial", fontSize: "15px", color: "#f5fff1", fontStyle: "bold", stroke: "#050805", strokeThickness: 3,
    }).setOrigin(0.5).setDepth(5);

    shareButton.on("pointerdown", async () => {
      const copied = await this.copyResultText();
      shareText.setText(copied ? "RESULT COPIED" : "COPY FAILED");
      this.time.delayedCall(1300, () => shareText.setText("COPY RESULT"));
    });

    const again = this.add.text(GAME_WIDTH / 2 - 116, GAME_HEIGHT - 42, "PLAY AGAIN", {
      fontFamily: "Arial", fontSize: "18px", color: "#050505", backgroundColor: "#39ff14", padding: { x: 26, y: 12 }, fontStyle: "bold",
    }).setOrigin(0.5).setDepth(4);
    again.setInteractive({ useHandCursor: true });
    again.on("pointerdown", () => this.scene.start(SCENE_KEYS.arena));

    const menu = this.add.text(GAME_WIDTH / 2 + 126, GAME_HEIGHT - 42, "BACK TO MENU", {
      fontFamily: "Arial", fontSize: "15px", color: "#f5fff1", fontStyle: "bold", stroke: "#050805", strokeThickness: 3,
    }).setOrigin(0.5).setDepth(4);
    menu.setInteractive({ useHandCursor: true });
    menu.on("pointerdown", () => this.scene.start(SCENE_KEYS.menu));
  }

  private getShareText(): string {
    const bossesBroken = this.result.bossesBroken ?? 0;
    const pickupsCollected = this.result.pickupsCollected ?? 0;
    return [
      "I survived Leak Beast Arena.",
      `Score: ${this.result.score}`,
      `Time: ${this.result.survivedSeconds}s`,
      `Leaks broken: ${this.result.leaksDefeated}`,
      `Bosses broken: ${bossesBroken}`,
      `Pickups: ${pickupsCollected}`,
      "https://broke-leak-beast-arena.vercel.app/",
      "$BROKE",
    ].join("\n");
  }

  private async copyResultText(): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(this.getShareText());
      return true;
    } catch {
      return false;
    }
  }

  private getGrade(): string {
    if ((this.result.bossesBroken ?? 0) >= 2 || this.result.score >= 3200 || this.result.survivedSeconds >= 100) return "S";
    if ((this.result.bossesBroken ?? 0) >= 1 || this.result.score >= 1900 || this.result.survivedSeconds >= 70) return "A";
    if (this.result.score >= 1000 || this.result.survivedSeconds >= 45) return "B";
    if (this.result.score >= 350 || this.result.survivedSeconds >= 20) return "C";
    return "D";
  }
}
