import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../../config/game";
import type { InputState } from "../types/game";

export class MobileControls {
  private inputState: InputState = { x: 0, y: 0, attack: false, dodge: false, skill: false };
  private keys?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd?: Record<"left" | "right" | "up" | "down", Phaser.Input.Keyboard.Key>;
  private joystickBase: Phaser.GameObjects.Arc;
  private joystickKnob: Phaser.GameObjects.Arc;
  private joystickPointerId: number | null = null;
  private joystickCenter = new Phaser.Math.Vector2(88, GAME_HEIGHT - 88);
  private joystickRadius = 52;

  constructor(private scene: Phaser.Scene) {
    // Phaser keeps only one active touch pointer by default in some mobile browsers.
    // Extra pointers are required so the player can hold movement and tap attack/dodge at the same time.
    scene.input.addPointer(3);

    this.joystickBase = scene.add.circle(this.joystickCenter.x, this.joystickCenter.y, this.joystickRadius, 0x112211, 0.82)
      .setStrokeStyle(2, 0x39ff14, 0.55)
      .setDepth(80);
    this.joystickKnob = scene.add.circle(this.joystickCenter.x, this.joystickCenter.y, 22, 0x39ff14, 0.82)
      .setDepth(81);

    this.createButtons();
    this.createPointerControls();
    this.createKeyboardFallback();
  }

  getInputState(): InputState {
    this.applyKeyboardState();

    const snapshot = { ...this.inputState };
    this.inputState.attack = false;
    this.inputState.dodge = false;
    this.inputState.skill = false;
    return snapshot;
  }

  private createButtons(): void {
    this.createButton(GAME_WIDTH - 74, GAME_HEIGHT - 88, "ATTACK", 62, 0x39ff14, () => {
      this.inputState.attack = true;
    });

    this.createButton(GAME_WIDTH - 164, GAME_HEIGHT - 62, "DODGE", 48, 0x8a00ff, () => {
      this.inputState.dodge = true;
    });
  }

  private createButton(
    x: number,
    y: number,
    label: string,
    radius: number,
    color: number,
    callback: () => void,
  ): void {
    const circle = this.scene.add.circle(x, y, radius, color, 0.82)
      .setStrokeStyle(2, 0xffffff, 0.28)
      .setDepth(80)
      .setInteractive({ useHandCursor: true });

    const text = this.scene.add.text(x, y, label, {
      fontFamily: "Arial",
      fontSize: "13px",
      color: color === 0x39ff14 ? "#050505" : "#ffffff",
      fontStyle: "bold",
      align: "center",
    }).setOrigin(0.5).setDepth(81);

    const press = (pointer: Phaser.Input.Pointer) => {
      pointer.event?.preventDefault();
      callback();
    };

    circle.on("pointerdown", press);
    text.setInteractive({ useHandCursor: true });
    text.on("pointerdown", press);
  }

  private createPointerControls(): void {
    this.scene.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (pointer.x > GAME_WIDTH / 2 || pointer.y < GAME_HEIGHT - 180) return;

      this.joystickPointerId = pointer.id;
      this.updateJoystick(pointer.x, pointer.y);
    });

    this.scene.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (pointer.id !== this.joystickPointerId) return;
      this.updateJoystick(pointer.x, pointer.y);
    });

    this.scene.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
      if (pointer.id !== this.joystickPointerId) return;

      this.joystickPointerId = null;
      this.inputState.x = 0;
      this.inputState.y = 0;
      this.joystickKnob.setPosition(this.joystickCenter.x, this.joystickCenter.y);
    });
  }

  private updateJoystick(pointerX: number, pointerY: number): void {
    const vector = new Phaser.Math.Vector2(pointerX - this.joystickCenter.x, pointerY - this.joystickCenter.y);

    if (vector.length() > this.joystickRadius) {
      vector.normalize().scale(this.joystickRadius);
    }

    this.joystickKnob.setPosition(this.joystickCenter.x + vector.x, this.joystickCenter.y + vector.y);

    const normalized = vector.clone().scale(1 / this.joystickRadius);
    this.inputState.x = Phaser.Math.Clamp(normalized.x, -1, 1);
    this.inputState.y = Phaser.Math.Clamp(normalized.y, -1, 1);
  }

  private createKeyboardFallback(): void {
    const keyboard = this.scene.input.keyboard;
    if (!keyboard) return;

    this.keys = keyboard.createCursorKeys();
    this.wasd = {
      left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      up: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
    };

    keyboard.on("keydown-SPACE", () => (this.inputState.attack = true));
    keyboard.on("keydown-SHIFT", () => (this.inputState.dodge = true));
  }

  private applyKeyboardState(): void {
    if (!this.keys || !this.wasd) return;

    const left = this.keys.left?.isDown || this.wasd.left.isDown;
    const right = this.keys.right?.isDown || this.wasd.right.isDown;
    const up = this.keys.up?.isDown || this.wasd.up.isDown;
    const down = this.keys.down?.isDown || this.wasd.down.isDown;

    const x = (right ? 1 : 0) - (left ? 1 : 0);
    const y = (down ? 1 : 0) - (up ? 1 : 0);

    if (x !== 0 || y !== 0) {
      const vector = new Phaser.Math.Vector2(x, y).normalize();
      this.inputState.x = vector.x;
      this.inputState.y = vector.y;
    } else if (this.joystickPointerId === null) {
      this.inputState.x = 0;
      this.inputState.y = 0;
    }
  }
}
