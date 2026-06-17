import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../../config/game";
import type { InputState } from "../types/game";

export class MobileControls {
  private inputState: InputState = { x: 0, y: 0, attack: false, dodge: false, pulse: false, shield: false, slash: false };
  private attackToggled = false;
  private attackButton?: Phaser.GameObjects.Image;
  private attackIndicator?: Phaser.GameObjects.Arc;
  private keys?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd?: Record<"left" | "right" | "up" | "down", Phaser.Input.Keyboard.Key>;
  private keyboardAttack?: Phaser.Input.Keyboard.Key;
  private joystickBase: Phaser.GameObjects.Image;
  private joystickKnob: Phaser.GameObjects.Arc;
  private joystickPointerId: number | null = null;
  private readonly joystickCenter = new Phaser.Math.Vector2(104, GAME_HEIGHT - 82);
  private readonly joystickRadius = 50;

  constructor(private scene: Phaser.Scene) {
    scene.input.addPointer(6);

    this.createControlBackplates();

    this.joystickBase = scene.add.image(this.joystickCenter.x, this.joystickCenter.y, "combat-joystick-base")
      .setDisplaySize(112, 112)
      .setAlpha(0.96)
      .setDepth(80);

    this.joystickKnob = scene.add.circle(this.joystickCenter.x, this.joystickCenter.y, 17, 0x39ff14, 0.95)
      .setStrokeStyle(2, 0x071107, 0.72)
      .setDepth(81);

    this.createButtons();
    this.createPointerControls();
    this.createKeyboardFallback();
  }

  getInputState(): InputState {
    this.applyKeyboardState();

    const snapshot = {
      ...this.inputState,
      attack: this.attackToggled || Boolean(this.keyboardAttack?.isDown) || this.inputState.attack,
    };

    this.inputState.attack = false;
    this.inputState.dodge = false;
    this.inputState.pulse = false;
    this.inputState.shield = false;
    this.inputState.slash = false;
    return snapshot;
  }

  private createControlBackplates(): void {
    this.scene.add.circle(this.joystickCenter.x, this.joystickCenter.y, 72, 0x050805, 0.28)
      .setStrokeStyle(2, 0x39ff14, 0.12)
      .setDepth(78);

    this.scene.add.circle(GAME_WIDTH - 112, GAME_HEIGHT - 86, 88, 0x050805, 0.24)
      .setStrokeStyle(2, 0xb66cff, 0.12)
      .setDepth(78);
  }

  private createButtons(): void {
    // Right-side diamond. Main action is closest to thumb center, support skills around it.
    this.createImageButton(GAME_WIDTH - 168, GAME_HEIGHT - 84, "combat-button-slash", 68, 68, "SLASH", () => {
      this.inputState.slash = true;
    });

    this.createImageButton(GAME_WIDTH - 106, GAME_HEIGHT - 138, "combat-button-shield", 58, 58, "SHIELD", () => {
      this.inputState.shield = true;
    });

    this.createImageButton(GAME_WIDTH - 106, GAME_HEIGHT - 50, "combat-button-pulse", 60, 60, "PULSE", () => {
      this.inputState.pulse = true;
    });

    this.createImageButton(GAME_WIDTH - 42, GAME_HEIGHT - 84, "combat-button-dash", 66, 66, "DASH", () => {
      this.inputState.dodge = true;
    });

    this.createAttackToggleButton(GAME_WIDTH - 228, GAME_HEIGHT - 48, 56);
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
    const hitZone = this.scene.add.circle(x, y, Math.max(width, height) * 0.56, 0x000000, 0.001)
      .setDepth(79)
      .setInteractive({ useHandCursor: true });

    const image = this.scene.add.image(x, y, texture)
      .setDisplaySize(width, height)
      .setDepth(80);

    this.scene.add.text(x, y + height * 0.45, label, {
      fontFamily: "Arial",
      fontSize: "9px",
      color: "#f5fff1",
      fontStyle: "bold",
      stroke: "#050805",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(81).setAlpha(0.82);

    hitZone.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      pointer.event?.preventDefault();
      callback();
      this.flashButton(image);
    });
  }

  private createAttackToggleButton(x: number, y: number, size: number): void {
    const hitZone = this.scene.add.circle(x, y, size * 0.62, 0x000000, 0.001)
      .setDepth(79)
      .setInteractive({ useHandCursor: true });

    this.attackButton = this.scene.add.image(x, y, "combat-button-auto")
      .setDisplaySize(size, size)
      .setDepth(80)
      .setAlpha(0.9);

    this.attackIndicator = this.scene.add.circle(x + size * 0.3, y + size * 0.3, 5, 0xff3355, 0.95)
      .setStrokeStyle(2, 0x050805, 0.75)
      .setDepth(81);

    this.scene.add.text(x, y + size * 0.48, "AUTO", {
      fontFamily: "Arial",
      fontSize: "9px",
      color: "#f5fff1",
      fontStyle: "bold",
      stroke: "#050805",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(81).setAlpha(0.86);

    hitZone.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      pointer.event?.preventDefault();
      this.attackToggled = !this.attackToggled;
      this.refreshAttackToggleVisual();
      this.scene.tweens.add({ targets: this.attackButton, alpha: this.attackToggled ? 1 : 0.9, duration: 60 });
    });

    this.refreshAttackToggleVisual();
  }

  private refreshAttackToggleVisual(): void {
    if (!this.attackButton || !this.attackIndicator) return;
    this.attackButton.setScale(1);
    this.attackButton.setDisplaySize(56, 56);
    this.attackButton.setAlpha(this.attackToggled ? 1 : 0.9);
    this.attackIndicator.setFillStyle(this.attackToggled ? 0x39ff14 : 0xff3355, 0.95);
  }

  private createPointerControls(): void {
    const updateJoystick = (pointer: Phaser.Input.Pointer) => {
      const vector = new Phaser.Math.Vector2(pointer.x - this.joystickCenter.x, pointer.y - this.joystickCenter.y);
      if (vector.length() > this.joystickRadius) vector.setLength(this.joystickRadius);
      this.joystickKnob.setPosition(this.joystickCenter.x + vector.x, this.joystickCenter.y + vector.y);

      if (vector.length() < 5) {
        this.inputState.x = 0;
        this.inputState.y = 0;
      } else {
        const normalized = vector.clone().normalize();
        this.inputState.x = normalized.x;
        this.inputState.y = normalized.y;
      }
    };

    this.scene.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (pointer.x > GAME_WIDTH * 0.38 || pointer.y < GAME_HEIGHT * 0.46) return;
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

    this.keyboardAttack = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z).on("down", () => { this.inputState.slash = true; });
    keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X).on("down", () => { this.inputState.pulse = true; });
    keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C).on("down", () => { this.inputState.shield = true; });
    keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT).on("down", () => { this.inputState.dodge = true; });
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
    this.scene.tweens.add({
      targets: target,
      alpha: Math.max(0.72, originalAlpha - 0.2),
      duration: 64,
      yoyo: true,
      onComplete: () => target.setAlpha(originalAlpha),
    });
  }
}
