import Phaser from "phaser";
import type { InputState } from "../types/game";

export interface PlayerUpdateResult {
  attackStarted: boolean;
  dodgeStarted: boolean;
}

export class PlayerMascot {
  public readonly sprite: Phaser.Physics.Arcade.Sprite;

  public isAttacking = false;
  public isDodging = false;

  private speed = 238;
  private attackCooldownMs = 430;
  private dodgeCooldownMs = 760;
  private lastAttackAt = -9999;
  private lastDodgeAt = -9999;

  constructor(private scene: Phaser.Scene, x: number, y: number) {
    this.sprite = scene.physics.add.sprite(x, y, "mascot-placeholder");
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setSize(44, 56);
    this.sprite.setDepth(20);
  }

  update(input: InputState, delta: number): PlayerUpdateResult {
    const velocity = new Phaser.Math.Vector2(input.x, input.y);

    if (velocity.lengthSq() > 0) {
      velocity.normalize().scale(this.isDodging ? this.speed * 1.85 : this.speed);
    }

    this.sprite.setVelocity(velocity.x, velocity.y);

    if (velocity.x !== 0) {
      this.sprite.setFlipX(velocity.x < 0);
    }

    const attackStarted = input.attack ? this.tryAttack() : false;
    const dodgeStarted = input.dodge ? this.tryDodge() : false;

    // Keep delta referenced for future animation smoothing.
    void delta;

    return { attackStarted, dodgeStarted };
  }

  private tryAttack(): boolean {
    const now = this.scene.time.now;
    if (now - this.lastAttackAt < this.attackCooldownMs) return false;

    this.lastAttackAt = now;
    this.isAttacking = true;
    this.sprite.setTint(0xffffff);
    this.sprite.setScale(1.08);

    this.scene.time.delayedCall(165, () => {
      this.isAttacking = false;
      this.sprite.clearTint();
      this.sprite.setScale(1);
    });

    return true;
  }

  private tryDodge(): boolean {
    const now = this.scene.time.now;
    if (now - this.lastDodgeAt < this.dodgeCooldownMs) return false;

    this.lastDodgeAt = now;
    this.isDodging = true;
    this.sprite.setAlpha(0.58);
    this.sprite.setScale(0.92);

    this.scene.time.delayedCall(240, () => {
      this.isDodging = false;
      this.sprite.setAlpha(1);
      this.sprite.setScale(1);
    });

    return true;
  }
}
