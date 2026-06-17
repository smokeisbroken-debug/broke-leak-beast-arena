import Phaser from "phaser";
import { GAME_WIDTH } from "../../config/game";

interface HudState {
  hp: number;
  maxHp: number;
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
  private hpFill: Phaser.GameObjects.Rectangle;
  private nextFill: Phaser.GameObjects.Rectangle;
  private hpText: Phaser.GameObjects.Text;
  private scoreText: Phaser.GameObjects.Text;
  private leaksText: Phaser.GameObjects.Text;
  private waveText: Phaser.GameObjects.Text;
  private timeText: Phaser.GameObjects.Text;
  private statusText: Phaser.GameObjects.Text;
  private buildText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    scene.add.rectangle(GAME_WIDTH / 2, 36, GAME_WIDTH - 36, 62, 0x040706, 0.42)
      .setStrokeStyle(2, 0x39ff14, 0.12)
      .setDepth(69);

    scene.add.rectangle(118, 37, 210, 54, 0x050805, 0.66)
      .setStrokeStyle(2, 0x39ff14, 0.22)
      .setDepth(70);
    scene.add.image(42, 37, "mascot-idle-front")
      .setDisplaySize(36, 36)
      .setDepth(71);

    scene.add.text(66, 15, "WALLET HP", {
      fontFamily: "Arial", fontSize: "10px", color: "#d7ffd0", fontStyle: "bold",
      stroke: "#050805", strokeThickness: 3,
    }).setDepth(71);

    scene.add.rectangle(144, 28, 118, 10, 0x152115, 0.95).setDepth(71).setOrigin(0.5);
    this.hpFill = scene.add.rectangle(85, 28, 116, 8, 0x39ff14, 1).setOrigin(0, 0.5).setDepth(72);
    this.hpText = scene.add.text(204, 18, "5/5", {
      fontFamily: "Arial", fontSize: "12px", color: "#f5fff1", fontStyle: "bold",
      stroke: "#050805", strokeThickness: 3,
    }).setDepth(72);

    scene.add.text(66, 40, "UPGRADE", {
      fontFamily: "Arial", fontSize: "9px", color: "#cfc5ff", fontStyle: "bold",
      stroke: "#050805", strokeThickness: 3,
    }).setDepth(71);
    scene.add.rectangle(144, 49, 118, 8, 0x1a1330, 0.95).setDepth(71).setOrigin(0.5);
    this.nextFill = scene.add.rectangle(85, 49, 116, 6, 0xb66cff, 1).setOrigin(0, 0.5).setDepth(72);

    this.scoreText = scene.add.text(255, 15, "SCORE 0", {
      fontFamily: "Arial", fontSize: "15px", color: "#f5fff1", fontStyle: "bold",
      stroke: "#050805", strokeThickness: 4,
    }).setDepth(71);

    this.leaksText = scene.add.text(255, 36, "LEAKS 0", {
      fontFamily: "Arial", fontSize: "14px", color: "#8bff7d", fontStyle: "bold",
      stroke: "#050805", strokeThickness: 4,
    }).setDepth(71);

    this.waveText = scene.add.text(GAME_WIDTH / 2, 20, "WAVE 1", {
      fontFamily: "Arial", fontSize: "26px", color: "#39ff14", fontStyle: "bold",
      stroke: "#050805", strokeThickness: 5,
    }).setOrigin(0.5).setDepth(71);

    this.buildText = scene.add.text(GAME_WIDTH / 2, 43, "BUILD 0 · NEXT 7", {
      fontFamily: "Arial", fontSize: "13px", color: "#d7ffd0", fontStyle: "bold",
      stroke: "#050805", strokeThickness: 4,
    }).setOrigin(0.5).setDepth(71);

    this.timeText = scene.add.text(GAME_WIDTH - 114, 14, "0s", {
      fontFamily: "Arial", fontSize: "17px", color: "#d9c8ff", fontStyle: "bold",
      stroke: "#050805", strokeThickness: 4,
    }).setOrigin(1, 0).setDepth(71);

    this.statusText = scene.add.text(GAME_WIDTH - 114, 36, "", {
      fontFamily: "Arial", fontSize: "12px", color: "#d9d0ff", fontStyle: "bold",
      stroke: "#050805", strokeThickness: 4, align: "right",
    }).setOrigin(1, 0).setDepth(71);
  }

  update(state: HudState): void {
    const hpRatio = Phaser.Math.Clamp(state.hp / Math.max(1, state.maxHp), 0, 1);
    this.hpFill.width = Math.max(4, 116 * hpRatio);
    this.hpText.setText(`${Math.max(0, state.hp)}/${state.maxHp}`);

    const upgradeEvery = Math.max(7, state.nextUpgradeIn + 1);
    const progressRatio = Phaser.Math.Clamp((upgradeEvery - state.nextUpgradeIn) / upgradeEvery, 0, 1);
    this.nextFill.width = Math.max(5, 116 * progressRatio);

    this.scoreText.setText(`SCORE ${state.score}`);
    this.leaksText.setText(`LEAKS ${state.defeated}`);
    this.waveText.setText(`WAVE ${state.wave}`);
    this.buildText.setText(`BUILD ${state.upgradeCount} · NEXT ${state.nextUpgradeIn}`);
    this.timeText.setText(`${state.survivedSeconds}s`);

    if (state.bossActive) {
      this.statusText.setText("BOSS");
      this.statusText.setColor("#c98bff");
    } else if (state.comboStep > 0) {
      this.statusText.setText(`COMBO ${state.comboStep}`);
      this.statusText.setColor("#39ff14");
    } else if (state.shieldActive) {
      this.statusText.setText(`SHIELD x${state.shieldCharges}`);
      this.statusText.setColor("#39ff14");
    } else {
      const ready: string[] = [];
      if (state.slashReady) ready.push("SLASH");
      if (state.dodgeReady) ready.push("DASH");
      if (state.pulseReady) ready.push("PULSE");
      if (state.shieldReady) ready.push("SHIELD");
      this.statusText.setText(ready.slice(0, 2).join(" · "));
      this.statusText.setColor("#d9d0ff");
    }
  }
}
