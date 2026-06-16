import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../../config/game";
import type { InputState } from "../types/game";

export class MobileControls {
  private inputState: InputState = { x: 0, y: 0, attack: false, dodge: false, pulse: false, shield: false, slash: false };
  private attackToggled = false;
  private attackButton?: Phaser.GameObjects.Image;
  private attackLabel?: Phaser.GameObjects.Text;
  private keys?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd?: Record<"left" | "right" | "up" | "down", Phaser.Input.Keyboard.Key>;
  private keyboardAttack?: Phaser.Input.Keyboard.Key;
  private joystickBase: Phaser.GameObjects.Image;
  private joystickKnob: Phaser.GameObjects.Arc;
  private joystickPointerId: number | null = null;
  private joystickCenter = new Phaser.Math.Vector2(72, GAME_HEIGHT - 76);
  private joystickRadius = 48;

  constructor(private scene: Phaser.Scene) {
    scene.input.addPointer(5);

    this.joystickBase = scene.add.image(this.joystickCenter.x, this.joystickCenter.y, "combat-joystick-base")
      .setDisplaySize(96, 96)
      .setAlpha(0.86)
      .setDepth(80);

    this.joystickKnob = scene.add.circle(this.joystickCenter.x, this.joystickCenter.y, 17, 0x39ff14, 0.82)
      .setStrokeStyle(2, 0x071107, 0.6)
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

  private createButtons(): void {
    this.createAttackToggleButton(GAME_WIDTH - 62, GAME_HEIGHT - 68, 94);

    this.createImageButton(GAME_WIDTH - 146, GAME_HEIGHT - 62, "combat-button-dash", 78, 78, () => {
      this.inputState.dodge = true;
    });

    this.createImageButton(GAME_WIDTH - 139, GAME_HEIGHT - 138, "combat-button-slash", 74, 74, () => {
      this.inputState.slash = true;
    });

    this.createImageButton(GAME_WIDTH - 60, GAME_HEIGHT - 145, "combat-button-shield", 72, 72, () => {
      this.inputState.shield = true;
    });

    this.createImageButton(GAME_WIDTH - 29, GAME_HEIGHT - 92, "combat-button-pulse", 72, 72, () => {
      this.inputState.pulse = true;
    });
  }

  private createImageButton(
    x: number,
    y: number,
    texture: string,
    width: number,
    height: number,
    callback: () => void,
  ): void {
    const image = this.scene.add.image(x, y, texture)
      .setDisplaySize(width, height)
      .setDepth(80)
      .setInteractive({ useHandCursor: true });

    const press = (pointer: Phaser.Input.Pointer) => {
      pointer.event?.preventDefault();
      callback();
      this.flashButton(image);
    };

    image.on("pointerdown", press);
  }

  private createAttackToggleButton(x: number, y: number, size: number): void {
    this.attackButton = this.scene.add.image(x, y, "combat-button-auto")
      .setDisplaySize(size, size)
      .setDepth(80)
      .setInteractive({ useHandCursor: true });

    this.attackLabel = this.scene.add.text(x, y + 23, "AUTO\nOFF", {
      fontFamily: "Arial",
      fontSize: "12px",
      color: "#39ff14",
      fontStyle: "bold",
      align: "center",
      stroke: "#050805",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(81).setInteractive({ useHandCursor: true });

    const toggle = (pointer: Phaser.Input.Pointer) => {
      pointer.event?.preventDefault();
      this.attackToggled = !this.attackToggled;
      this.refreshAttackToggleVisual();
    };

    this.attackButton.on("pointerdown", toggle);
    this.attackLabel.on("pointerdown", toggle);
  }

  private refreshAttackToggleVisual(): void {
    if (!this.attackButton || !this.attackLabel) return;
    this.attackLabel.setText(this.attackToggled ? "AUTO\nON" : "AUTO\nOFF");
    this.attackButton.setAlpha(this.attackToggled ? 1 : 0.78);
    this.attackButton.setScale(this.attackToggled ? 1.05 : 1);
  }

  private createPointerControls(): void {
    const updateJoystick = (pointer: Phaser.Input.Pointer) => {
      const vector = new Phaser.Math.Vector2(pointer.x - this.joystickCenter.x, pointer.y - this.joystickCenter.y);
      if (vector.length() > this.joystickRadius) {
        vector.setLength(this.joystickRadius);
      }

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
      if (pointer.x > GAME_WIDTH * 0.55) return;
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
    this.scene.tweens.add({
      targets: target,
      scaleX: target.scaleX * 1.07,
      scaleY: target.scaleY * 1.07,
      duration: 80,
      yoyo: true,
    });
  }
}
