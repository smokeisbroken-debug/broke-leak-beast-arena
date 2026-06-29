import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../../config/game";
import type { InputState } from "../types/game";

export class MobileControls {
  private inputState: InputState = { x: 0, y: 0, attack: false, dodge: false, pulse: false, shield: false, slash: false };
  private keys?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd?: Record<"left" | "right" | "up" | "down", Phaser.Input.Keyboard.Key>;
  private keyboardPunch?: Phaser.Input.Keyboard.Key;
  private keyboardKick?: Phaser.Input.Keyboard.Key;
  private keyboardBlock?: Phaser.Input.Keyboard.Key;
  private keyboardDash?: Phaser.Input.Keyboard.Key;
  private joystickBase: Phaser.GameObjects.Image;
  private joystickKnob: Phaser.GameObjects.Arc;
  private joystickPointerId: number | null = null;
  private readonly joystickCenter = new Phaser.Math.Vector2(126, GAME_HEIGHT - 88);
  private readonly joystickRadius = 72;

  constructor(private scene: Phaser.Scene) {
    scene.input.addPointer(6);

    this.createControlBackplates();

    this.joystickBase = scene.add.image(this.joystickCenter.x, this.joystickCenter.y, "combat-joystick-base")
      .setDisplaySize(162, 162)
      .setAlpha(0.96)
      .setDepth(80)
      .setScrollFactor(0);

    this.joystickKnob = scene.add.circle(this.joystickCenter.x, this.joystickCenter.y, 24, 0x72ff57, 0.96)
      .setStrokeStyle(3, 0x041004, 0.8)
      .setDepth(81)
      .setScrollFactor(0);

    this.createButtons();
    this.createPointerControls();
    this.createKeyboardFallback();
  }

  getInputState(): InputState {
    this.applyKeyboardState();

    const snapshot = { ...this.inputState };
    snapshot.attack = snapshot.attack || Boolean(this.keyboardPunch?.isDown);
    snapshot.pulse = snapshot.pulse || Boolean(this.keyboardKick?.isDown);
    snapshot.shield = snapshot.shield || Boolean(this.keyboardBlock?.isDown);
    snapshot.dodge = snapshot.dodge || Boolean(this.keyboardDash?.isDown);

    this.inputState.attack = false;
    this.inputState.dodge = false;
    this.inputState.pulse = false;
    this.inputState.slash = false;
    // shield is intentionally not reset here: it is a hold button.
    return snapshot;
  }

  private createControlBackplates(): void {
    this.scene.add.circle(this.joystickCenter.x, this.joystickCenter.y, 104, 0x061006, 0.24)
      .setStrokeStyle(3, 0x72ff57, 0.18)
      .setDepth(78)
      .setScrollFactor(0);

    this.scene.add.circle(GAME_WIDTH - 132, GAME_HEIGHT - 92, 150, 0x061006, 0.2)
      .setStrokeStyle(3, 0xa45cff, 0.16)
      .setDepth(78)
      .setScrollFactor(0);

    this.scene.add.text(GAME_WIDTH - 154, GAME_HEIGHT - 214, "ARENA CONTROLS", {
      fontFamily: "Arial",
      fontSize: "12px",
      color: "#fcfff7",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(81).setAlpha(0.84).setScrollFactor(0);
  }

  private createButtons(): void {
    this.createImageButton(GAME_WIDTH - 186, GAME_HEIGHT - 94, "combat-button-slash", 112, 112, "PUNCH", () => {
      this.inputState.attack = true;
    });

    this.createImageButton(GAME_WIDTH - 92, GAME_HEIGHT - 158, "combat-button-pulse", 96, 96, "KICK", () => {
      this.inputState.pulse = true;
    });

    this.createHoldButton(GAME_WIDTH - 92, GAME_HEIGHT - 42, "combat-button-shield", 96, 96, "BLOCK");

    this.createImageButton(GAME_WIDTH - 32, GAME_HEIGHT - 94, "combat-button-dash", 96, 96, "DASH", () => {
      this.inputState.dodge = true;
    });
  }

  private createImageButton(
    x: number,
    y: number,
    texture: string,
    width: number,
    height: number,
    label: string,
    callback: () => void,
  ): void {
    const hitZone = this.scene.add.circle(x, y, Math.max(width, height) * 0.54, 0x000000, 0.01)
      .setDepth(92)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });

    const button = this.scene.add.image(x, y, texture)
      .setDisplaySize(width, height)
      .setDepth(82)
      .setAlpha(0.96)
      .setScrollFactor(0);

    this.scene.add.text(x, y + height * 0.38, label, {
      fontFamily: "Arial",
      fontSize: label === "PUNCH" ? "14px" : "12px",
      color: "#fcfff7",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(83).setScrollFactor(0);

    hitZone.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      pointer.event?.preventDefault();
      callback();
      this.flashButton(button);
    });
  }

  private createHoldButton(x: number, y: number, texture: string, width: number, height: number, label: string): void {
    const hitZone = this.scene.add.circle(x, y, Math.max(width, height) * 0.54, 0x000000, 0.01)
      .setDepth(92)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });

    const button = this.scene.add.image(x, y, texture)
      .setDisplaySize(width, height)
      .setDepth(82)
      .setAlpha(0.94)
      .setScrollFactor(0);

    this.scene.add.text(x, y + height * 0.38, label, {
      fontFamily: "Arial",
      fontSize: "12px",
      color: "#fcfff7",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(83).setScrollFactor(0);

    hitZone.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      pointer.event?.preventDefault();
      this.inputState.shield = true;
      button.setAlpha(1);
      button.setScale(1.05);
    });
    hitZone.on("pointerup", () => {
      this.inputState.shield = false;
      button.setAlpha(0.94);
      button.setScale(1);
    });
    hitZone.on("pointerout", () => {
      this.inputState.shield = false;
      button.setAlpha(0.94);
      button.setScale(1);
    });
  }

  private createPointerControls(): void {
    const updateJoystick = (pointer: Phaser.Input.Pointer) => {
      const vector = new Phaser.Math.Vector2(pointer.x - this.joystickCenter.x, pointer.y - this.joystickCenter.y);
      if (vector.length() > this.joystickRadius) vector.setLength(this.joystickRadius);
      this.joystickKnob.setPosition(this.joystickCenter.x + vector.x, this.joystickCenter.y + vector.y);

      if (vector.length() < 6) {
        this.inputState.x = 0;
        this.inputState.y = 0;
      } else {
        const normalized = vector.clone().normalize();
        this.inputState.x = normalized.x;
        this.inputState.y = normalized.y;
      }
    };

    this.scene.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (pointer.x > GAME_WIDTH * 0.44 || pointer.y < GAME_HEIGHT * 0.42) return;
      this.joystickPointerId = pointer.id;
      updateJoystick(pointer);
    });

    this.scene.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (this.joystickPointerId !== pointer.id) return;
      updateJoystick(pointer);
    });

    const release = (pointer: Phaser.Input.Pointer) => {
      if (this.joystickPointerId !== pointer.id) return;
      this.joystickPointerId = null;
      this.inputState.x = 0;
      this.inputState.y = 0;
      this.joystickKnob.setPosition(this.joystickCenter.x, this.joystickCenter.y);
    };

    this.scene.input.on("pointerup", release);
    this.scene.input.on("pointerupoutside", release);
  }

  private createKeyboardFallback(): void {
    this.keys = this.scene.input.keyboard?.createCursorKeys();
    const keyboard = this.scene.input.keyboard;
    if (!keyboard) return;

    this.wasd = {
      left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      up: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
    };

    this.keyboardPunch = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.keyboardKick = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    this.keyboardBlock = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C);
    this.keyboardDash = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE).on("down", () => { this.inputState.attack = true; });
  }

  private applyKeyboardState(): void {
    const left = Boolean(this.keys?.left?.isDown || this.wasd?.left.isDown);
    const right = Boolean(this.keys?.right?.isDown || this.wasd?.right.isDown);
    const up = Boolean(this.keys?.up?.isDown || this.wasd?.up.isDown);
    const down = Boolean(this.keys?.down?.isDown || this.wasd?.down.isDown);

    const x = (right ? 1 : 0) - (left ? 1 : 0);
    const y = (down ? 1 : 0) - (up ? 1 : 0);

    if (x !== 0 || y !== 0) {
      const vector = new Phaser.Math.Vector2(x, y).normalize();
      this.inputState.x = vector.x;
      this.inputState.y = vector.y;
    }
  }

  private flashButton(target: Phaser.GameObjects.Image): void {
    const originalAlpha = target.alpha;
    const originalScaleX = target.scaleX;
    const originalScaleY = target.scaleY;
    this.scene.tweens.add({
      targets: target,
      alpha: Math.max(0.72, originalAlpha - 0.18),
      scaleX: originalScaleX * 1.05,
      scaleY: originalScaleY * 1.05,
      duration: 64,
      yoyo: true,
      onComplete: () => {
        target.setAlpha(originalAlpha);
        target.setScale(originalScaleX, originalScaleY);
      },
    });
  }
}
