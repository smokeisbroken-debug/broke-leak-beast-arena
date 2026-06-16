import Phaser from "phaser";
import type { InputState } from "../types/game";

export class PlayerMascot {
  public readonly sprite: Phaser.Physics.Arcade.Sprite;

  public isAttacking = false;
  public isDodging = false;

  private speed = 230;
  private attackCooldownMs = 420;
  private dodgeCooldownMs = 650;
  private lastAttackAt = 0;
  private lastDodgeAt = 0;
  private attackStartedThisFrame = false;

  constructor(private scene: Phaser.Scene, x: number, y: number) {
    this.sprite = scene.physics.add.sprite(x, y, "mascot-placeholder");
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setSize(46, 58);
  }

  update(input: InputState, delta: number): void {
    this.attackStartedThisFrame = false;

    const velocity = new Phaser.Math.Vector2(input.x, input.y);

    if (velocity.lengthSq() > 0) {
      velocity.normalize().scale(this.speed);
    }

    if (this.isDodging) {
      velocity.scale(1.7);
    }

    this.sprite.setVelocity(velocity.x, velocity.y);

    if (input.attack) this.attack();
    if (input.dodge) this.dodge();

    // Keep delta referenced for future animation smoothing.
    void delta;
  }

  consumeAttackStarted(): boolean {
    const didStart = this.attackStartedThisFrame;
    this.attackStartedThisFrame = false;
    return didStart;
  }

  private attack(): void {
    const now = Date.now();
    if (this.isAttacking || now - this.lastAttackAt < this.attackCooldownMs) return;

    this.lastAttackAt = now;
    this.isAttacking = true;
    this.attackStartedThisFrame = true;
    this.sprite.setTint(0xffffff);

    this.scene.time.delayedCall(180, () => {
      if (!this.sprite.active) return;
      this.isAttacking = false;
      this.sprite.clearTint();
    });
  }

  private dodge(): void {
    const now = Date.now();
    if (this.isDodging || now - this.lastDodgeAt < this.dodgeCooldownMs) return;

    this.lastDodgeAt = now;
    this.isDodging = true;
    this.sprite.setAlpha(0.55);

    this.scene.time.delayedCall(220, () => {
      if (!this.sprite.active) return;
      this.isDodging = false;
      this.sprite.setAlpha(1);
    });
  }
}
