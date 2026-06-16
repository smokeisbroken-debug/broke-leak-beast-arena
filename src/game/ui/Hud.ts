import Phaser from "phaser";
import { GAME_WIDTH } from "../../config/game";

interface HudState {
  hp: number;
  score: number;
  wave: number;
  defeated: number;
  survivedSeconds: number;
  bossActive: boolean;
  attackReady: boolean;
  dodgeReady: boolean;
  pulseReady: boolean;
  shieldReady: boolean;
  slashReady: boolean;
  shieldActive: boolean;
  shieldCharges: number;
  comboStep: number;
  upgradeCount: number;
  nextUpgradeIn: number;
}

export class Hud {
  private scoreValue: Phaser.GameObjects.Text;
  private leaksValue: Phaser.GameObjects.Text;
  private waveValue: Phaser.GameObjects.Text;
  private hpValue: Phaser.GameObjects.Text;
  private timeValue: Phaser.GameObjects.Text;
  private statusText: Phaser.GameObjects.Text;
  private progressText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    scene.add.image(GAME_WIDTH / 2, 44, "combat-hud-panel")
      .setDisplaySize(360, 120)
      .setDepth(70)
      .setAlpha(0.98);

    this.scoreValue = scene.add.text(82, 30, "0", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#f5fff1",
      fontStyle: "bold",
      stroke: "#050805",
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(71);

    this.leaksValue = scene.add.text(82, 65, "0", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#8bff7d",
      fontStyle: "bold",
      stroke: "#050805",
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(71);

    this.waveValue = scene.add.text(GAME_WIDTH / 2, 42, "1", {
      fontFamily: "Arial",
      fontSize: "34px",
      color: "#39ff14",
      fontStyle: "bold",
      stroke: "#050805",
      strokeThickness: 5,
    }).setOrigin(0.5).setDepth(71);

    this.hpValue = scene.add.text(GAME_WIDTH - 98, 34, "5/5", {
      fontFamily: "Arial",
      fontSize: "20px",
      color: "#f5fff1",
      fontStyle: "bold",
      stroke: "#050805",
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(71);

    this.timeValue = scene.add.text(GAME_WIDTH - 98, 66, "0s", {
      fontFamily: "Arial",
      fontSize: "14px",
      color: "#cdb7ff",
      fontStyle: "bold",
      stroke: "#050805",
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(71);

    this.statusText = scene.add.text(GAME_WIDTH / 2, 88, "", {
      fontFamily: "Arial",
      fontSize: "11px",
      color: "#d9d0ff",
      fontStyle: "bold",
      stroke: "#050805",
      strokeThickness: 4,
      align: "center",
    }).setOrigin(0.5).setDepth(71);

    this.progressText = scene.add.text(GAME_WIDTH / 2, 109, "", {
      fontFamily: "Arial",
      fontSize: "10px",
      color: "#9fd39a",
      fontStyle: "bold",
      stroke: "#050805",
      strokeThickness: 4,
      align: "center",
    }).setOrigin(0.5).setDepth(71);
  }

  update(state: HudState): void {
    this.scoreValue.setText(String(state.score));
    this.leaksValue.setText(String(state.defeated));
    this.waveValue.setText(String(state.wave));
    this.hpValue.setText(`${Math.max(0, state.hp)}/5`);
    this.timeValue.setText(`${state.survivedSeconds}s`);

    if (state.bossActive) {
      this.statusText.setText("MINI-BOSS ACTIVE");
      this.statusText.setColor("#c98bff");
    } else if (state.shieldActive) {
      this.statusText.setText(`SHIELD READY x${state.shieldCharges}`);
      this.statusText.setColor("#39ff14");
    } else if (state.comboStep > 0) {
      this.statusText.setText(`COMBO ${state.comboStep}/3`);
      this.statusText.setColor("#39ff14");
    } else {
      const ready: string[] = [];
      if (state.slashReady) ready.push("SLASH");
      if (state.dodgeReady) ready.push("DASH");
      if (state.pulseReady) ready.push("PULSE");
      if (state.shieldReady) ready.push("SHIELD");
      this.statusText.setText(ready.length ? ready.join(" · ") : "RECOVERING");
      this.statusText.setColor(ready.length ? "#d9d0ff" : "#90a890");
    }

    this.progressText.setText(
      state.nextUpgradeIn > 0
        ? `BUILD ${state.upgradeCount} · NEXT UPGRADE IN ${state.nextUpgradeIn}`
        : `BUILD ${state.upgradeCount} · UPGRADE READY`
    );
    this.progressText.setColor(state.nextUpgradeIn > 0 ? "#9fd39a" : "#39ff14");
  }
}
