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
}

export class Hud {
  private scoreText: Phaser.GameObjects.Text;
  private hpText: Phaser.GameObjects.Text;
  private waveText: Phaser.GameObjects.Text;
  private defeatedText: Phaser.GameObjects.Text;
  private timeText: Phaser.GameObjects.Text;
  private bossText: Phaser.GameObjects.Text;
  private cooldownText: Phaser.GameObjects.Text;
  private skillText: Phaser.GameObjects.Text;
  private comboText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    scene.add.rectangle(GAME_WIDTH / 2, 42, GAME_WIDTH - 24, 76, 0x050805, 0.78)
      .setStrokeStyle(1, 0x39ff14, 0.25)
      .setDepth(70);

    this.waveText = scene.add.text(GAME_WIDTH / 2, 14, "WAVE 1", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#39ff14",
      fontStyle: "bold",
    }).setOrigin(0.5).setDepth(71);

    this.scoreText = scene.add.text(18, 16, "Score 0", {
      fontFamily: "Arial",
      fontSize: "14px",
      color: "#f5fff1",
      fontStyle: "bold",
    }).setDepth(71);

    this.hpText = scene.add.text(GAME_WIDTH - 18, 16, "HP ♥♥♥♥♥", {
      fontFamily: "Arial",
      fontSize: "14px",
      color: "#f5fff1",
      fontStyle: "bold",
    }).setOrigin(1, 0).setDepth(71);

    this.defeatedText = scene.add.text(18, 40, "Leaks 0", {
      fontFamily: "Arial",
      fontSize: "13px",
      color: "#9cff8a",
      fontStyle: "bold",
    }).setDepth(71);

    this.timeText = scene.add.text(GAME_WIDTH - 18, 40, "0s", {
      fontFamily: "Arial",
      fontSize: "13px",
      color: "#9cff8a",
      fontStyle: "bold",
    }).setOrigin(1, 0).setDepth(71);

    this.bossText = scene.add.text(GAME_WIDTH / 2, 62, "", {
      fontFamily: "Arial",
      fontSize: "12px",
      color: "#b66cff",
      fontStyle: "bold",
    }).setOrigin(0.5).setDepth(71);

    this.cooldownText = scene.add.text(GAME_WIDTH / 2, 86, "", {
      fontFamily: "Arial",
      fontSize: "12px",
      color: "#88aa88",
      fontStyle: "bold",
    }).setOrigin(0.5).setDepth(71);

    this.skillText = scene.add.text(GAME_WIDTH / 2, 106, "", {
      fontFamily: "Arial",
      fontSize: "12px",
      color: "#9cff8a",
      fontStyle: "bold",
    }).setOrigin(0.5).setDepth(71);

    this.comboText = scene.add.text(GAME_WIDTH / 2, 126, "", {
      fontFamily: "Arial",
      fontSize: "12px",
      color: "#39ff14",
      fontStyle: "bold",
    }).setOrigin(0.5).setDepth(71);
  }

  update(state: HudState): void {
    this.scoreText.setText(`Score ${state.score}`);
    this.hpText.setText(`HP ${"♥".repeat(Math.max(0, state.hp))}`);
    this.waveText.setText(`WAVE ${state.wave}`);
    this.defeatedText.setText(`Leaks ${state.defeated}`);
    this.timeText.setText(`${state.survivedSeconds}s`);
    this.bossText.setText(state.bossActive ? "MINI-BOSS ACTIVE" : "Hold attack. Aim with movement. Use skills." );

    const attack = state.attackReady ? "HOLD ATK" : "ATK…";
    const dodge = state.dodgeReady ? "DASH" : "DASH…";
    this.cooldownText.setText(`${attack}  ·  ${dodge}`);
    this.cooldownText.setColor(state.attackReady && state.dodgeReady ? "#9cff8a" : "#88aa88");

    const slash = state.slashReady ? "SLASH" : "SLASH…";
    const pulse = state.pulseReady ? "PULSE" : "PULSE…";
    const shield = state.shieldActive ? `SHIELD x${state.shieldCharges}` : state.shieldReady ? "SHIELD" : "SHIELD…";
    this.skillText.setText(`${slash}  ·  ${pulse}  ·  ${shield}`);
    this.skillText.setColor(state.shieldActive ? "#39ff14" : "#9cff8a");

    this.comboText.setText(state.comboStep > 0 ? `COMBO ${state.comboStep}/3` : "Dash Slash + Shield added");
  }
}
