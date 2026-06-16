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
  private scoreText: Phaser.GameObjects.Text;
  private hpText: Phaser.GameObjects.Text;
  private waveText: Phaser.GameObjects.Text;
  private defeatedText: Phaser.GameObjects.Text;
  private timeText: Phaser.GameObjects.Text;
  private bossText: Phaser.GameObjects.Text;
  private comboText: Phaser.GameObjects.Text;
  private upgradeText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    scene.add.image(GAME_WIDTH / 2, 43, "combat-hud-panel")
      .setDisplaySize(GAME_WIDTH - 12, 126)
      .setDepth(70)
      .setAlpha(0.96);

    this.waveText = scene.add.text(GAME_WIDTH / 2, 14, "WAVE 1", {
      fontFamily: "Arial",
      fontSize: "16px",
      color: "#39ff14",
      fontStyle: "bold",
      stroke: "#050805",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(71);

    this.scoreText = scene.add.text(23, 18, "Score 0", {
      fontFamily: "Arial",
      fontSize: "12px",
      color: "#f5fff1",
      fontStyle: "bold",
      stroke: "#050805",
      strokeThickness: 2,
    }).setDepth(71);

    this.hpText = scene.add.text(GAME_WIDTH - 22, 18, "HP ♥♥♥♥♥", {
      fontFamily: "Arial",
      fontSize: "12px",
      color: "#f5fff1",
      fontStyle: "bold",
      stroke: "#050805",
      strokeThickness: 2,
    }).setOrigin(1, 0).setDepth(71);

    this.defeatedText = scene.add.text(23, 42, "Leaks 0", {
      fontFamily: "Arial",
      fontSize: "11px",
      color: "#9cff8a",
      fontStyle: "bold",
      stroke: "#050805",
      strokeThickness: 2,
    }).setDepth(71);

    this.timeText = scene.add.text(GAME_WIDTH - 22, 42, "0s", {
      fontFamily: "Arial",
      fontSize: "11px",
      color: "#9cff8a",
      fontStyle: "bold",
      stroke: "#050805",
      strokeThickness: 2,
    }).setOrigin(1, 0).setDepth(71);

    this.bossText = scene.add.text(GAME_WIDTH / 2, 43, "", {
      fontFamily: "Arial",
      fontSize: "11px",
      color: "#b66cff",
      fontStyle: "bold",
      stroke: "#050805",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(71);

    this.comboText = scene.add.text(GAME_WIDTH / 2, 65, "", {
      fontFamily: "Arial",
      fontSize: "10px",
      color: "#39ff14",
      fontStyle: "bold",
      stroke: "#050805",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(71);

    this.upgradeText = scene.add.text(GAME_WIDTH / 2, 82, "BUILD 0", {
      fontFamily: "Arial",
      fontSize: "9px",
      color: "#88aa88",
      fontStyle: "bold",
      stroke: "#050805",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(71);
  }

  update(state: HudState): void {
    this.scoreText.setText(`Score ${state.score}`);
    this.hpText.setText(`HP ${"♥".repeat(Math.max(0, state.hp))}`);
    this.waveText.setText(`WAVE ${state.wave}`);
    this.defeatedText.setText(`Leaks ${state.defeated}`);
    this.timeText.setText(`${state.survivedSeconds}s`);

    if (state.bossActive) {
      this.bossText.setText("MINI-BOSS ACTIVE");
      this.bossText.setColor("#b66cff");
    } else if (state.shieldActive) {
      this.bossText.setText(`SHIELD x${state.shieldCharges}`);
      this.bossText.setColor("#39ff14");
    } else {
      this.bossText.setText("");
    }

    const combo = state.comboStep > 0 ? `COMBO ${state.comboStep}/3` : "";
    const ready = [
      state.slashReady ? "SLASH" : "",
      state.pulseReady ? "PULSE" : "",
      state.shieldReady || state.shieldActive ? "SHIELD" : "",
    ].filter(Boolean).join(" · ");

    this.comboText.setText(combo || ready);
    this.comboText.setColor(combo ? "#39ff14" : "#d9d0ff");

    this.upgradeText.setText(state.nextUpgradeIn > 0
      ? `BUILD ${state.upgradeCount} · NEXT UPGRADE IN ${state.nextUpgradeIn}`
      : `BUILD ${state.upgradeCount} · UPGRADE READY`);
    this.upgradeText.setColor(state.nextUpgradeIn > 0 ? "#b7d2b6" : "#39ff14");
  }
}
