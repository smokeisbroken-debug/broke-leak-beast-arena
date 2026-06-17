import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../../config/game";
import type { InputState } from "../types/game";

export class MobileControls {
  private inputState: InputState = { x: 0, y: 0, attack: false, dodge: false, pulse: false, shield: false, slash: false };
  private attackToggled = false;
  private attackBufferedUntil = 0;
  private attackButton?: Phaser.GameObjects.Image;
  private attackIndicator?: Phaser.GameObjects.Arc;
  private keys?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd?: Record<"left" | "right" | "up" | "down", Phaser.Input.Keyboard.Key>;
  private keyboardAttack?: Phaser.Input.Keyboard.Key;
  private joystickBase: Phaser.GameObjects.Image;
  private joystickKnob: Phaser.GameObjects.Arc;
  private joystickPointerId: number | null = null;
  private readonly joystickCenter = new Phaser.Math.Vector2(128, GAME_HEIGHT - 88);
  private readonly joystickRadius = 72;
  private readonly autoButtonSize = 84;

  constructor(private scene: Phaser.Scene) {
    scene.input.addPointer(6);

    this.createControlBackplates();

    this.joystickBase = scene.add.image(this.joystickCenter.x, this.joystickCenter.y, "combat-joystick-base")
      .setDisplaySize(160, 160)
      .setAlpha(0.97)
      .setDepth(80);

    this.joystickKnob = scene.add.circle(this.joystickCenter.x, this.joystickCenter.y, 24, 0x72ff57, 0.96)
      .setStrokeStyle(3, 0x071107, 0.76)
      .setDepth(81);

    this.createButtons();
    this.createPointerControls();
    this.createKeyboardFallback();
  }

  getInputState(): InputState {
    this.applyKeyboardState();

    const manualAttackBuffered = Date.now() < this.attackBufferedUntil;
    const snapshot = {
      ...this.inputState,
      attack: this.attackToggled || Boolean(this.keyboardAttack?.isDown) || this.inputState.attack || manualAttackBuffered,
    };

    this.inputState.attack = false;
    this.inputState.dodge = false;
    this.inputState.pulse = false;
    this.inputState.shield = false;
    this.inputState.slash = false;
    return snapshot;
  }

  private createControlBackplates(): void {
    this.scene.add.circle(this.joystickCenter.x, this.joystickCenter.y, 102, 0x061306, 0.24)
      .setStrokeStyle(3, 0x39ff14, 0.16)
      .setDepth(78);

    this.scene.add.circle(GAME_WIDTH - 132, GAME_HEIGHT - 92, 142, 0x061306, 0.22)
      .setStrokeStyle(3, 0xb66cff, 0.14)
      .setDepth(78);

    this.scene.add.text(GAME_WIDTH - 162, GAME_HEIGHT - 204, "SKILLS", {
      fontFamily: "Arial",
      fontSize: "12px",
      color: "#d7ffd0",
      fontStyle: "bold",
      stroke: "#050805",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(81).setAlpha(0.78);
  }

  private createButtons(): void {
    // Main sword swing is now a direct ATTACK button. It works even when the player is not moving.
    this.createImageButton(GAME_WIDTH - 182, GAME_HEIGHT - 92, "combat-button-slash", 114, 114, "ATTACK", () => {
      this.queueAttack();
    });

    this.createImageButton(GAME_WIDTH - 104, GAME_HEIGHT - 160, "combat-button-shield", 94, 94, "SHIELD", () => {
      this.inputState.shield = true;
    });

    this.createImageButton(GAME_WIDTH - 104, GAME_HEIGHT - 42, "combat-button-pulse", 94, 94, "PULSE", () => {
      this.inputState.pulse = true;
    });

    this.createImageButton(GAME_WIDTH - 36, GAME_HEIGHT - 92, "combat-button-dash", 98, 98, "DASH", () => {
      this.inputState.dodge = true;
    });

    this.createAttackToggleButton(GAME_WIDTH - 260, GAME_HEIGHT - 46, this.autoButtonSize);
  }

  private queueAttack(): void {
    this.inputState.attack = true;
    this.attackBufferedUntil = Date.now() + 180;
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
    const hitZone = this.scene.add.circle(x, y, Math.max(width, height) * 0.64, 0x000000, 0.001)
      .setDepth(79)
      .setInteractive({ useHandCursor: true });

    const image = this.scene.add.image(x, y, texture)
      .setDisplaySize(width, height)
      .setDepth(80);

    this.scene.add.text(x, y + height * 0.42, label, {
      fontFamily: "Arial",
      fontSize: label === "ATTACK" ? "12px" : "11px",
      color: "#f5fff1",
      fontStyle: "bold",
      stroke: "#050805",
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(81).setAlpha(0.9);

    hitZone.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      pointer.event?.preventDefault();
      callback();
      this.flashButton(image);
    });
  }

  private createAttackToggleButton(x: number, y: number, size: number): void {
    const hitZone = this.scene.add.circle(x, y, size * 0.7, 0x000000, 0.001)
      .setDepth(79)
      .setInteractive({ useHandCursor: true });

    this.attackButton = this.scene.add.image(x, y, "combat-button-auto")
      .setDisplaySize(size, size)
      .setDepth(80)
      .setAlpha(0.9);

    this.attackIndicator = this.scene.add.circle(x + size * 0.3, y + size * 0.3, 6, 0xff3355, 0.95)
      .setStrokeStyle(2, 0x050805, 0.75)
      .setDepth(81);

    this.scene.add.text(x, y + size * 0.46, "AUTO", {
      fontFamily: "Arial",
      fontSize: "11px",
      color: "#f5fff1",
      fontStyle: "bold",
      stroke: "#050805",
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(81).setAlpha(0.9);

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
    this.attackButton.setDisplaySize(this.autoButtonSize, this.autoButtonSize);
    this.attackButton.setAlpha(this.attackToggled ? 1 : 0.9);
    this.attackIndicator.setPosition(this.attackButton.x + this.autoButtonSize * 0.28, this.attackButton.y + this.autoButtonSize * 0.28);
    this.attackIndicator.setFillStyle(this.attackToggled ? 0x39ff14 : 0xff3355, 0.95);
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
      if (pointer.x > GAME_WIDTH * 0.43 || pointer.y < GAME_HEIGHT * 0.42) return;
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
    keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z).on("down", () => { this.queueAttack(); });
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
    const originalScaleX = target.scaleX;
    const originalScaleY = target.scaleY;
    this.scene.tweens.add({
      targets: target,
      alpha: Math.max(0.72, originalAlpha - 0.18),
      scaleX: originalScaleX * 1.04,
      scaleY: originalScaleY * 1.04,
      duration: 64,
      yoyo: true,
      onComplete: () => {
        target.setAlpha(originalAlpha);
        target.setScale(originalScaleX, originalScaleY);
      },
    });
  }
}
