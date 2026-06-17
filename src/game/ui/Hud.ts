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
    scene.add.image(GAME_WIDTH / 2, 39, "combat-hud-panel")
      .setDisplaySize(374, 68)
      .setDepth(70)
      .setAlpha(1);

    const valueStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#f5fff1",
      fontStyle: "bold",
      stroke: "#040604",
      strokeThickness: 5,
      shadow: { offsetX: 0, offsetY: 1, color: "#000000", blur: 0, fill: true },
      align: "center",
    };

    // Put values directly under / near the printed labels on the art.
    this.scoreValue = scene.add.text(71, 20, "0", { ...valueStyle, fontSize: "17px" })
      .setOrigin(0.5)
      .setDepth(71);

    this.leaksValue = scene.add.text(72, 47, "0", { ...valueStyle, fontSize: "17px", color: "#8bff7d" })
      .setOrigin(0.5)
      .setDepth(71);

    this.waveValue = scene.add.text(GAME_WIDTH / 2, 28, "1", {
      ...valueStyle,
      fontSize: "27px",
      color: "#39ff14",
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(71);

    this.hpValue = scene.add.text(342, 24, "5/5", { ...valueStyle, fontSize: "20px" })
      .setOrigin(0.5)
      .setDepth(71);

    this.timeValue = scene.add.text(342, 50, "0s", {
      ...valueStyle,
      fontSize: "13px",
      color: "#d9c8ff",
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(71);

    this.statusText = scene.add.text(GAME_WIDTH / 2, 82, "", {
      fontFamily: "Arial",
      fontSize: "12px",
      color: "#d9d0ff",
      fontStyle: "bold",
      stroke: "#050805",
      strokeThickness: 4,
      align: "center",
    }).setOrigin(0.5).setDepth(71);

    this.progressText = scene.add.text(GAME_WIDTH / 2, 100, "", {
      fontFamily: "Arial",
      fontSize: "11px",
      color: "#d7ffd0",
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
    } else if (state.comboStep > 0) {
      this.statusText.setText(`COMBO ${state.comboStep}/3`);
      this.statusText.setColor("#39ff14");
    } else if (state.shieldActive) {
      this.statusText.setText(`SHIELD x${state.shieldCharges}`);
      this.statusText.setColor("#39ff14");
    } else {
      this.statusText.setText("");
    }

    this.progressText.setText(`BUILD ${state.upgradeCount} • NEXT UPGRADE IN ${state.nextUpgradeIn}`);
    this.progressText.setColor(state.nextUpgradeIn > 0 ? "#d7ffd0" : "#39ff14");
  }
}
