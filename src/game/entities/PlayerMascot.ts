import Phaser from "phaser";
import type { InputState } from "../types/game";

export class PlayerMascot {
  public readonly sprite: Phaser.Physics.Arcade.Sprite;

  public isAttacking = false;
  public isDodging = false;

  private speed = 230;
  private attackCooldownMs = 460;
  private dodgeCooldownMs = 720;
  private lastAttackAt = -9999;
  private lastDodgeAt = -9999;
  private attackStartedThisFrame = false;

  constructor(private scene: Phaser.Scene, x: number, y: number) {
    this.sprite = scene.physics.add.sprite(x, y, "mascot-placeholder");
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setSize(48, 62);
    this.sprite.setDepth(30);
  }

  update(input: InputState, delta: number): void {
    this.attackStartedThisFrame = false;

    const velocity = new Phaser.Math.Vector2(input.x, input.y);

    if (velocity.lengthSq() > 0) {
      velocity.normalize().scale(this.speed);
    }

    if (this.isDodging) {
      velocity.scale(1.85);
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

  canAttack(): boolean {
    return !this.isAttacking && Date.now() - this.lastAttackAt >= this.attackCooldownMs;
  }

  canDodge(): boolean {
    return !this.isDodging && Date.now() - this.lastDodgeAt >= this.dodgeCooldownMs;
  }

  private attack(): void {
    if (!this.canAttack()) return;

    this.lastAttackAt = Date.now();
    this.isAttacking = true;
    this.attackStartedThisFrame = true;
    this.sprite.setTint(0xffffff);
    this.sprite.setScale(1.08);

    this.scene.time.delayedCall(170, () => {
      if (!this.sprite.active) return;
      this.isAttacking = false;
      this.sprite.clearTint();
      this.sprite.setScale(1);
    });
  }

  private dodge(): void {
    if (!this.canDodge()) return;

    this.lastDodgeAt = Date.now();
    this.isDodging = true;
    this.sprite.setAlpha(0.5);
    this.sprite.setTint(0xb66cff);

    this.scene.time.delayedCall(230, () => {
      if (!this.sprite.active) return;
      this.isDodging = false;
      this.sprite.setAlpha(1);
      this.sprite.clearTint();
    });
  }
}
