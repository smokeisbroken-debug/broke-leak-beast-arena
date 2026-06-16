import Phaser from "phaser";

interface HudState {
  hp: number;
  score: number;
  wave: number;
}

export class Hud {
  private scoreText: Phaser.GameObjects.Text;
  private hpText: Phaser.GameObjects.Text;
  private waveText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.scoreText = scene.add.text(20, 58, "Score: 0", {
      fontFamily: "Arial",
      fontSize: "16px",
      color: "#f5fff1",
      fontStyle: "bold",
    });

    this.hpText = scene.add.text(20, 82, "HP: 5", {
      fontFamily: "Arial",
      fontSize: "16px",
      color: "#f5fff1",
      fontStyle: "bold",
    });

    this.waveText = scene.add.text(20, 106, "Wave: 1", {
      fontFamily: "Arial",
      fontSize: "16px",
      color: "#39ff14",
      fontStyle: "bold",
    });
  }

  update(state: HudState): void {
    this.scoreText.setText(`Score: ${state.score}`);
    this.hpText.setText(`HP: ${state.hp}`);
    this.waveText.setText(`Wave: ${state.wave}`);
  }
}
