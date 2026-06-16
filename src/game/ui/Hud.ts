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
    scene.add.image(GAME_WIDTH / 2, 42, "combat-hud-panel")
      .setDisplaySize(360, 104)
      .setDepth(70)
      .setAlpha(0.98);

    const baseStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#f5fff1",
      fontStyle: "bold",
      stroke: "#050805",
      strokeThickness: 5,
    };

    this.scoreValue = scene.add.text(72, 25, "0", { ...baseStyle, fontSize: "17px" })
      .setOrigin(0.5)
      .setDepth(71);

    this.leaksValue = scene.add.text(72, 49, "0", { ...baseStyle, fontSize: "17px", color: "#8bff7d" })
      .setOrigin(0.5)
      .setDepth(71);

    this.waveValue = scene.add.text(GAME_WIDTH / 2, 36, "1", {
      ...baseStyle,
      fontSize: "30px",
      color: "#39ff14",
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(71);

    this.hpValue = scene.add.text(GAME_WIDTH - 76, 31, "5/5", { ...baseStyle, fontSize: "21px" })
      .setOrigin(0.5)
      .setDepth(71);

    this.timeValue = scene.add.text(GAME_WIDTH - 78, 54, "0s", {
      ...baseStyle,
      fontSize: "13px",
      color: "#cdb7ff",
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(71);

    this.statusText = scene.add.text(GAME_WIDTH / 2, 88, "", {
      fontFamily: "Arial",
      fontSize: "14px",
      color: "#d9d0ff",
      fontStyle: "bold",
      stroke: "#050805",
      strokeThickness: 5,
      align: "center",
    }).setOrigin(0.5).setDepth(71);

    this.progressText = scene.add.text(GAME_WIDTH / 2, 112, "", {
      fontFamily: "Arial",
      fontSize: "11px",
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
