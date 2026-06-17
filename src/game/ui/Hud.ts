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

  constructor(scene: Phaser.Scene) {
    scene.add.rectangle(148, 48, 250, 72, 0x050805, 0.46)
      .setStrokeStyle(2, 0x39ff14, 0.24)
      .setDepth(70);
    scene.add.image(50, 48, "mascot-idle-front")
      .setDisplaySize(50, 50)
      .setDepth(71);

    scene.add.text(84, 18, "WALLET HP", {
      fontFamily: "Arial", fontSize: "12px", color: "#d7ffd0", fontStyle: "bold",
      stroke: "#050805", strokeThickness: 3,
    }).setDepth(71);

    scene.add.rectangle(150, 37, 126, 12, 0x152115, 0.95).setDepth(71).setOrigin(0.5);
    this.hpFill = scene.add.rectangle(87, 37, 124, 10, 0x39ff14, 1).setOrigin(0, 0.5).setDepth(72);
    this.hpText = scene.add.text(215, 26, "5/5", {
      fontFamily: "Arial", fontSize: "13px", color: "#f5fff1", fontStyle: "bold",
      stroke: "#050805", strokeThickness: 3,
    }).setDepth(72);

    scene.add.text(84, 48, "NEXT UPGRADE", {
      fontFamily: "Arial", fontSize: "10px", color: "#cfc5ff", fontStyle: "bold",
      stroke: "#050805", strokeThickness: 3,
    }).setDepth(71);
    scene.add.rectangle(150, 63, 126, 9, 0x1a1330, 0.95).setDepth(71).setOrigin(0.5);
    this.nextFill = scene.add.rectangle(87, 63, 124, 7, 0xb66cff, 1).setOrigin(0, 0.5).setDepth(72);

    this.scoreText = scene.add.text(304, 18, "SCORE 0", {
      fontFamily: "Arial", fontSize: "16px", color: "#f5fff1", fontStyle: "bold",
      stroke: "#050805", strokeThickness: 4,
    }).setDepth(71);

    this.leaksText = scene.add.text(304, 42, "LEAKS 0", {
      fontFamily: "Arial", fontSize: "15px", color: "#8bff7d", fontStyle: "bold",
      stroke: "#050805", strokeThickness: 4,
    }).setDepth(71);

    this.waveText = scene.add.text(GAME_WIDTH / 2, 28, "WAVE 1", {
      fontFamily: "Arial", fontSize: "24px", color: "#39ff14", fontStyle: "bold",
      stroke: "#050805", strokeThickness: 5,
    }).setOrigin(0.5).setDepth(71);

    this.timeText = scene.add.text(GAME_WIDTH - 110, 22, "TIME 0s", {
      fontFamily: "Arial", fontSize: "16px", color: "#d9c8ff", fontStyle: "bold",
      stroke: "#050805", strokeThickness: 4,
    }).setOrigin(1, 0).setDepth(71);

    this.statusText = scene.add.text(GAME_WIDTH / 2, 58, "", {
      fontFamily: "Arial", fontSize: "13px", color: "#d9d0ff", fontStyle: "bold",
      stroke: "#050805", strokeThickness: 4, align: "center",
    }).setOrigin(0.5).setDepth(71);
  }

  update(state: HudState): void {
    const hpRatio = Phaser.Math.Clamp(state.hp / Math.max(1, state.maxHp), 0, 1);
    this.hpFill.width = 124 * hpRatio;
    this.hpText.setText(`${Math.max(0, state.hp)}/${state.maxHp}`);

    const progressRatio = Phaser.Math.Clamp((7 - Math.min(7, state.nextUpgradeIn)) / 7, 0, 1);
    this.nextFill.width = Math.max(6, 124 * progressRatio);

    this.scoreText.setText(`SCORE ${state.score}`);
    this.leaksText.setText(`LEAKS ${state.defeated}`);
    this.waveText.setText(`WAVE ${state.wave}`);
    this.timeText.setText(`TIME ${state.survivedSeconds}s`);

    if (state.bossActive) {
      this.statusText.setText("MINI-BOSS ACTIVE");
      this.statusText.setColor("#c98bff");
    } else if (state.comboStep > 0) {
      this.statusText.setText(`COMBO ${state.comboStep}/3`);
      this.statusText.setColor("#39ff14");
    } else if (state.shieldActive) {
      this.statusText.setText(`SHIELD READY x${state.shieldCharges}`);
      this.statusText.setColor("#39ff14");
    } else {
      const ready: string[] = [];
      if (state.slashReady) ready.push("SLASH");
      if (state.dodgeReady) ready.push("DASH");
      if (state.pulseReady) ready.push("PULSE");
      if (state.shieldReady) ready.push("SHIELD");
      this.statusText.setText(ready.join(" · "));
      this.statusText.setColor("#d9d0ff");
    }
  }
}
