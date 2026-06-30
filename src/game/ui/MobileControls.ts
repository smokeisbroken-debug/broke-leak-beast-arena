import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../../config/game";
import type { InputState } from "../types/game";
import { getSkillById, loadPlayerProfile } from "../data/gameRegistry";

export class MobileControls {
  private inputState: InputState = { x: 0, y: 0, attack: false, dodge: false, pulse: false, shield: false, slash: false, skill1: false, skill2: false, ultimate: false };
  private keys?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd?: Record<"left" | "right" | "up" | "down", Phaser.Input.Keyboard.Key>;
  private keyboardPunch?: Phaser.Input.Keyboard.Key;
  private keyboardKick?: Phaser.Input.Keyboard.Key;
  private keyboardBlock?: Phaser.Input.Keyboard.Key;
  private keyboardDash?: Phaser.Input.Keyboard.Key;
  private keyboardSkill1?: Phaser.Input.Keyboard.Key;
  private keyboardSkill2?: Phaser.Input.Keyboard.Key;
  private keyboardUltimate?: Phaser.Input.Keyboard.Key;
  private joystickBase: Phaser.GameObjects.Image;
  private joystickKnob: Phaser.GameObjects.Arc;
  private joystickPointerId: number | null = null;
  private readonly joystickCenter = new Phaser.Math.Vector2(112, GAME_HEIGHT - 76);
  private readonly joystickRadius = 60;
  private readonly releaseAll = () => {
    this.joystickPointerId = null;
    this.inputState.x = 0;
    this.inputState.y = 0;
    this.inputState.shield = false;
    this.joystickKnob?.setPosition(this.joystickCenter.x, this.joystickCenter.y);
  };

  constructor(private scene: Phaser.Scene) {
    scene.input.addPointer(6);

    this.createControlBackplates();

    this.joystickBase = scene.add.image(this.joystickCenter.x, this.joystickCenter.y, "combat-joystick-base")
      .setDisplaySize(132, 132)
      .setAlpha(0.96)
      .setDepth(80)
      .setScrollFactor(0);

    this.joystickKnob = scene.add.circle(this.joystickCenter.x, this.joystickCenter.y, 22, 0x72ff57, 0.96)
      .setStrokeStyle(3, 0x041004, 0.8)
      .setDepth(81)
      .setScrollFactor(0);

    this.createButtons();
    this.createPointerControls();
    this.createKeyboardFallback();
    this.createLifecycleGuards();
  }

  getInputState(): InputState {
    this.applyKeyboardState();

    const snapshot = { ...this.inputState };
    snapshot.attack = snapshot.attack || Boolean(this.keyboardPunch?.isDown);
    snapshot.pulse = snapshot.pulse || Boolean(this.keyboardKick?.isDown);
    snapshot.shield = snapshot.shield || Boolean(this.keyboardBlock?.isDown);
    snapshot.dodge = snapshot.dodge || Boolean(this.keyboardDash?.isDown);
    snapshot.skill1 = snapshot.skill1 || Boolean(this.keyboardSkill1?.isDown);
    snapshot.skill2 = snapshot.skill2 || Boolean(this.keyboardSkill2?.isDown);
    snapshot.ultimate = snapshot.ultimate || Boolean(this.keyboardUltimate?.isDown);

    this.inputState.attack = false;
    this.inputState.dodge = false;
    this.inputState.pulse = false;
    this.inputState.slash = false;
    this.inputState.skill1 = false;
    this.inputState.skill2 = false;
    this.inputState.ultimate = false;
    // shield is intentionally not reset here: it is a hold button.
    return snapshot;
  }

  private createControlBackplates(): void {
    this.scene.add.circle(this.joystickCenter.x, this.joystickCenter.y, 82, 0x061006, 0.18)
      .setStrokeStyle(3, 0x72ff57, 0.18)
      .setDepth(78)
      .setScrollFactor(0);

    this.scene.add.circle(GAME_WIDTH - 116, GAME_HEIGHT - 86, 118, 0x061006, 0.14)
      .setStrokeStyle(3, 0xa45cff, 0.16)
      .setDepth(78)
      .setScrollFactor(0);
  }

  private createButtons(): void {
    const profile = loadPlayerProfile();
    const skill1 = getSkillById(profile.selectedSkillIds.skill1);
    const skill2 = getSkillById(profile.selectedSkillIds.skill2);
    const ultimate = getSkillById(profile.selectedSkillIds.ultimate);

    // Calibrated for landscape mobile: no button should sit outside the canvas edge.
    this.createActionButton(GAME_WIDTH - 166, GAME_HEIGHT - 82, 96, "PUNCH", "FAST", 0x72ff57, () => {
      this.inputState.attack = true;
    });

    this.createActionButton(GAME_WIDTH - 88, GAME_HEIGHT - 142, 78, "KICK", "POWER", 0xffeb72, () => {
      this.inputState.pulse = true;
    });

    this.createHoldButton(GAME_WIDTH - 88, GAME_HEIGHT - 38, 78, "BLOCK", "GUARD", 0x72ff57);

    this.createActionButton(GAME_WIDTH - 44, GAME_HEIGHT - 84, 78, "DASH", "EVADE", 0xa45cff, () => {
      this.inputState.dodge = true;
    });

    this.createActionButton(GAME_WIDTH - 214, GAME_HEIGHT - 176, 62, "S1", this.getShortSkillLabel(skill1.name), skill1.color, () => {
      this.inputState.skill1 = true;
    });

    this.createActionButton(GAME_WIDTH - 140, GAME_HEIGHT - 202, 62, "S2", this.getShortSkillLabel(skill2.name), skill2.color, () => {
      this.inputState.skill2 = true;
    });

    this.createActionButton(GAME_WIDTH - 66, GAME_HEIGHT - 176, 66, "ULT", this.getShortSkillLabel(ultimate.name), ultimate.color, () => {
      this.inputState.ultimate = true;
    });
  }

  private getShortSkillLabel(name: string): string {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 4)
      .toUpperCase();
  }

  private createActionButton(
    x: number,
    y: number,
    size: number,
    label: string,
    subLabel: string,
    color: number,
    callback: () => void,
  ): void {
    const hitZone = this.scene.add.circle(x, y, size * 0.56, 0x000000, 0.01)
      .setDepth(94)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });

    const glow = this.scene.add.circle(x, y, size * 0.52, color, 0.16)
      .setStrokeStyle(3, color, 0.72)
      .setDepth(82)
      .setScrollFactor(0);
    const base = this.scene.add.circle(x, y, size * 0.44, 0x061006, 0.88)
      .setStrokeStyle(4, color, 0.92)
      .setDepth(83)
      .setScrollFactor(0);
    const title = this.scene.add.text(x, y - 5, label, {
      fontFamily: "Arial",
      fontSize: label.length > 5 ? "16px" : label.length <= 3 ? "18px" : "19px",
      color: "#fcfff7",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 5,
    }).setOrigin(0.5).setDepth(85).setScrollFactor(0);
    const sub = this.scene.add.text(x, y + size * 0.26, subLabel, {
      fontFamily: "Arial",
      fontSize: "9px",
      color: "#d7ffd0",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(85).setScrollFactor(0);

    hitZone.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      pointer.event?.preventDefault();
      callback();
      this.flashButton([glow, base, title, sub]);
    });
  }

  private createHoldButton(x: number, y: number, size: number, label: string, subLabel: string, color: number): void {
    const hitZone = this.scene.add.circle(x, y, size * 0.56, 0x000000, 0.01)
      .setDepth(94)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });

    const glow = this.scene.add.circle(x, y, size * 0.52, color, 0.14)
      .setStrokeStyle(3, color, 0.68)
      .setDepth(82)
      .setScrollFactor(0);
    const base = this.scene.add.circle(x, y, size * 0.44, 0x061006, 0.88)
      .setStrokeStyle(4, color, 0.86)
      .setDepth(83)
      .setScrollFactor(0);
    const title = this.scene.add.text(x, y - 5, label, {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#fcfff7",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 5,
    }).setOrigin(0.5).setDepth(85).setScrollFactor(0);
    const sub = this.scene.add.text(x, y + size * 0.26, subLabel, {
      fontFamily: "Arial",
      fontSize: "9px",
      color: "#d7ffd0",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(85).setScrollFactor(0);

    const setPressed = (pressed: boolean) => {
      this.inputState.shield = pressed;
      glow.setAlpha(pressed ? 0.26 : 0.14);
      base.setStrokeStyle(pressed ? 5 : 4, color, pressed ? 1 : 0.86);
      base.setScale(pressed ? 1.05 : 1);
      glow.setScale(pressed ? 1.08 : 1);
      title.setScale(pressed ? 1.03 : 1);
    };

    hitZone.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      pointer.event?.preventDefault();
      setPressed(true);
    });
    hitZone.on("pointerup", () => setPressed(false));
    hitZone.on("pointerout", () => setPressed(false));
    hitZone.on("pointerupoutside", () => setPressed(false));
    this.scene.input.on("pointerup", () => setPressed(false));
    this.scene.input.on("pointerupoutside", () => setPressed(false));
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
      if (pointer.x > GAME_WIDTH * 0.32 || pointer.y < GAME_HEIGHT * 0.48) return;
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
    this.keyboardSkill1 = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    this.keyboardSkill2 = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.keyboardUltimate = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
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
      return;
    }

    if (this.joystickPointerId === null) {
      this.inputState.x = 0;
      this.inputState.y = 0;
    }
  }

  private createLifecycleGuards(): void {
    if (typeof window !== "undefined") {
      window.addEventListener("blur", this.releaseAll);
      document.addEventListener("visibilitychange", this.releaseAll);
    }

    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.releaseAll();
      if (typeof window !== "undefined") {
        window.removeEventListener("blur", this.releaseAll);
        document.removeEventListener("visibilitychange", this.releaseAll);
      }
    });
  }

  private flashButton(targets: Phaser.GameObjects.GameObject[]): void {
    this.scene.tweens.add({
      targets,
      scaleX: 1.06,
      scaleY: 1.06,
      duration: 64,
      yoyo: true,
      onComplete: () => {
        targets.forEach((target) => {
          const scalable = target as Phaser.GameObjects.GameObject & { setScale?: (x: number, y?: number) => void };
          scalable.setScale?.(1);
        });
      },
    });
  }

}
