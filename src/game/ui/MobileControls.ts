import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../../config/game";
import type { InputState } from "../types/game";

export class MobileControls {
  private inputState: InputState = { x: 0, y: 0, attack: false, dodge: false, skill: false };

  constructor(private scene: Phaser.Scene) {
    this.createButtons();
    this.createKeyboardFallback();
  }

  getInputState(): InputState {
    const snapshot = { ...this.inputState };
    this.inputState.attack = false;
    this.inputState.dodge = false;
    this.inputState.skill = false;
    return snapshot;
  }

  private createButtons(): void {
    this.createButton(68, GAME_HEIGHT - 76, "MOVE", () => {
      this.inputState.x = this.inputState.x === 0 ? 1 : -this.inputState.x;
    });

    this.createButton(GAME_WIDTH - 142, GAME_HEIGHT - 76, "ATTACK", () => {
      this.inputState.attack = true;
    });

    this.createButton(GAME_WIDTH - 58, GAME_HEIGHT - 76, "DODGE", () => {
      this.inputState.dodge = true;
    });
  }

  private createButton(x: number, y: number, label: string, callback: () => void): Phaser.GameObjects.Text {
    const button = this.scene.add.text(x, y, label, {
      fontFamily: "Arial",
      fontSize: "13px",
      color: "#050505",
      backgroundColor: "#39ff14",
      padding: { x: 12, y: 11 },
      fontStyle: "bold",
    }).setOrigin(0.5);

    button.setInteractive({ useHandCursor: true });
    button.on("pointerdown", callback);
    return button;
  }

  private createKeyboardFallback(): void {
    const keyboard = this.scene.input.keyboard;
    if (!keyboard) return;

    keyboard.on("keydown-LEFT", () => (this.inputState.x = -1));
    keyboard.on("keydown-RIGHT", () => (this.inputState.x = 1));
    keyboard.on("keydown-UP", () => (this.inputState.y = -1));
    keyboard.on("keydown-DOWN", () => (this.inputState.y = 1));
    keyboard.on("keyup", () => {
      this.inputState.x = 0;
      this.inputState.y = 0;
    });
    keyboard.on("keydown-SPACE", () => (this.inputState.attack = true));
    keyboard.on("keydown-SHIFT", () => (this.inputState.dodge = true));
  }
}
