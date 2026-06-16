import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../../config/game";
import type { InputState } from "../types/game";

export class MobileControls {
  private inputState: InputState = { x: 0, y: 0, attack: false, dodge: false, pulse: false, shield: false, slash: false };
  private attackHeld = false;
  private keys?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd?: Record<"left" | "right" | "up" | "down", Phaser.Input.Keyboard.Key>;
  private keyboardAttack?: Phaser.Input.Keyboard.Key;
  private joystickBase: Phaser.GameObjects.Arc;
  private joystickKnob: Phaser.GameObjects.Arc;
  private joystickPointerId: number | null = null;
  private joystickCenter = new Phaser.Math.Vector2(72, GAME_HEIGHT - 76);
  private joystickRadius = 44;

  constructor(private scene: Phaser.Scene) {
    // Phaser keeps only one active touch pointer by default in some mobile browsers.
    // Extra pointers are required so the player can hold movement and tap skills at the same time.
    scene.input.addPointer(5);

    this.joystickBase = scene.add.circle(this.joystickCenter.x, this.joystickCenter.y, this.joystickRadius, 0x112211, 0.55)
      .setStrokeStyle(2, 0x39ff14, 0.42)
      .setDepth(80);
    this.joystickKnob = scene.add.circle(this.joystickCenter.x, this.joystickCenter.y, 18, 0x39ff14, 0.82)
      .setDepth(81);

    this.createButtons();
    this.createPointerControls();
    this.createKeyboardFallback();
  }

  getInputState(): InputState {
    this.applyKeyboardState();

    const snapshot = {
      ...this.inputState,
      attack: this.attackHeld || Boolean(this.keyboardAttack?.isDown) || this.inputState.attack,
    };

    this.inputState.attack = false;
    this.inputState.dodge = false;
    this.inputState.pulse = false;
    this.inputState.shield = false;
    this.inputState.slash = false;
    return snapshot;
  }

  private createButtons(): void {
    // Compact combat cluster. The arena field stays visible, while the player still has
    // one main held attack and three timing skills.
    this.createHoldButton(GAME_WIDTH - 64, GAME_HEIGHT - 68, "HOLD\nATK", 50, 0x39ff14, (held) => {
      this.attackHeld = held;
      if (held) this.inputState.attack = true;
    });

    this.createTapButton(GAME_WIDTH - 150, GAME_HEIGHT - 62, "DASH", 32, 0x8a00ff, () => {
      this.inputState.dodge = true;
    });

    this.createTapButton(GAME_WIDTH - 132, GAME_HEIGHT - 130, "SLASH", 30, 0x39ff14, () => {
      this.inputState.slash = true;
    });

    this.createTapButton(GAME_WIDTH - 60, GAME_HEIGHT - 146, "SHIELD", 29, 0x123b10, () => {
      this.inputState.shield = true;
    });

    this.createTapButton(GAME_WIDTH - 28, GAME_HEIGHT - 88, "PULSE", 29, 0xb66cff, () => {
      this.inputState.pulse = true;
    });
  }

  private createTapButton(
    x: number,
    y: number,
    label: string,
    radius: number,
    color: number,
    callback: () => void,
  ): void {
    const circle = this.scene.add.circle(x, y, radius, color, 0.74)
      .setStrokeStyle(2, 0xffffff, 0.22)
      .setDepth(80)
      .setInteractive({ useHandCursor: true });

    const text = this.scene.add.text(x, y, label, {
      fontFamily: "Arial",
      fontSize: "10px",
      color: color === 0x39ff14 ? "#050505" : "#ffffff",
      fontStyle: "bold",
      align: "center",
    }).setOrigin(0.5).setDepth(81).setInteractive({ useHandCursor: true });

    const press = (pointer: Phaser.Input.Pointer) => {
      pointer.event?.preventDefault();
      callback();
      this.flashButton(circle);
    };

    circle.on("pointerdown", press);
    text.on("pointerdown", press);
  }

  private createHoldButton(
    x: number,
    y: number,
    label: string,
    radius: number,
    color: number,
    callback: (held: boolean) => void,
  ): void {
    const circle = this.scene.add.circle(x, y, radius, color, 0.82)
      .setStrokeStyle(3, 0xffffff, 0.25)
      .setDepth(80)
      .setInteractive({ useHandCursor: true });

    const text = this.scene.add.text(x, y, label, {
      fontFamily: "Arial",
      fontSize: "11px",
      color: "#050505",
      fontStyle: "bold",
      align: "center",
    }).setOrigin(0.5).setDepth(81).setInteractive({ useHandCursor: true });

    const down = (pointer: Phaser.Input.Pointer) => {
      pointer.event?.preventDefault();
      callback(true);
      circle.setScale(1.06);
    };
    const up = (pointer?: Phaser.Input.Pointer) => {
      pointer?.event?.preventDefault();
      callback(false);
      circle.setScale(1);
    };

    circle.on("pointerdown", down);
    text.on("pointerdown", down);
    circle.on("pointerup", up);
    text.on("pointerup", up);
    circle.on("pointerout", up);
    text.on("pointerout", up);
    this.scene.input.on("pointerup", up);
  }

  private flashButton(circle: Phaser.GameObjects.Arc): void {
    circle.setScale(1.08);
    this.scene.time.delayedCall(90, () => {
      if (circle.active) circle.setScale(1);
    });
  }

  private createPointerControls(): void {
    this.scene.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      // Left half is a virtual movement zone, not only the visible joystick.
      // This makes the arena feel closer to a real mobile action game.
      if (pointer.x > GAME_WIDTH * 0.52 || pointer.y < 86 || pointer.y > GAME_HEIGHT - 18) return;

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
    this.keyboardAttack = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    keyboard.on("keydown-SHIFT", () => (this.inputState.dodge = true));
    keyboard.on("keydown-Q", () => (this.inputState.slash = true));
    keyboard.on("keydown-E", () => (this.inputState.pulse = true));
    keyboard.on("keydown-R", () => (this.inputState.shield = true));
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
