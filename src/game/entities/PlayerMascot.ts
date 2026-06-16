import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../../config/game";
import type { AttackSpec, InputState, PlayerUpgradeState } from "../types/game";

export class PlayerMascot {
  public readonly sprite: Phaser.Physics.Arcade.Sprite;

  public isAttacking = false;
  public isDodging = false;
  public isSkillCasting = false;

  private baseSpeed = 230;
  private attackCooldownMs = 330;
  private dodgeCooldownMs = 780;
  private skillCooldownMs = 5200;

  private lastAttackAt = -9999;
  private lastDodgeAt = -9999;
  private lastSkillAt = -9999;
  private invincibleUntil = -9999;

  private attackStartedThisFrame = false;
  private skillStartedThisFrame = false;
  private pendingAttackSpec: AttackSpec | null = null;

  private comboStep = 0;
  private lastComboAt = -9999;
  private readonly comboResetMs = 720;

  private facing = new Phaser.Math.Vector2(1, 0);
  private upgrades: PlayerUpgradeState = {
    damageBonus: 0,
    speedBonus: 0,
    maxHpBonus: 0,
    dodgeCooldownMultiplier: 1,
    skillPowerBonus: 0,
  };

  constructor(private scene: Phaser.Scene, x: number, y: number) {
    this.sprite = scene.physics.add.sprite(x, y, "mascot-placeholder");
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setSize(46, 58);
    this.sprite.setDepth(24);
  }

  update(input: InputState, _delta: number): void {
    this.attackStartedThisFrame = false;
    this.skillStartedThisFrame = false;
    this.pendingAttackSpec = null;

    const velocity = new Phaser.Math.Vector2(input.x, input.y);

    if (velocity.lengthSq() > 0) {
      velocity.normalize();
      this.facing.copy(velocity);
    }

    const currentSpeed = this.baseSpeed + this.upgrades.speedBonus;
    const movement = velocity.clone().scale(currentSpeed);

    if (this.isDodging) {
      movement.copy(this.facing).scale(currentSpeed * 2.35);
    }

    this.sprite.setVelocity(movement.x, movement.y);

    if (input.attack) this.attack();
    if (input.skill) this.castSkill();
    if (input.dodge) this.dodge();
  }

  consumeAttackStarted(): AttackSpec | null {
    if (!this.attackStartedThisFrame || !this.pendingAttackSpec) return null;
    const spec = this.pendingAttackSpec;
    this.attackStartedThisFrame = false;
    this.pendingAttackSpec = null;
    return spec;
  }

  consumeSkillStarted(): boolean {
    const didStart = this.skillStartedThisFrame;
    this.skillStartedThisFrame = false;
    return didStart;
  }

  canAttack(): boolean {
    return !this.isAttacking && Date.now() - this.lastAttackAt >= this.attackCooldownMs;
  }

  canDodge(): boolean {
    return !this.isDodging && Date.now() - this.lastDodgeAt >= this.dodgeCooldownMs * this.upgrades.dodgeCooldownMultiplier;
  }

  canSkill(): boolean {
    return !this.isSkillCasting && Date.now() - this.lastSkillAt >= this.skillCooldownMs;
  }

  getCooldownState() {
    return {
      attackReady: this.canAttack(),
      dodgeReady: this.canDodge(),
      skillReady: this.canSkill(),
    };
  }

  getComboStep(): number {
    return Date.now() - this.lastComboAt > this.comboResetMs ? 0 : this.comboStep;
  }

  getFacing(): Phaser.Math.Vector2 {
    return this.facing.clone();
  }

  getSkillPower(): number {
    return 2 + this.upgrades.skillPowerBonus;
  }

  getMaxHpBonus(): number {
    return this.upgrades.maxHpBonus;
  }

  get isInvincible(): boolean {
    return Date.now() < this.invincibleUntil;
  }

  applyUpgrade(id: string): string {
    switch (id) {
      case "damage":
        this.upgrades.damageBonus += 1;
        return "Combo damage increased";
      case "speed":
        this.upgrades.speedBonus += 18;
        return "Movement speed increased";
      case "dash":
        this.upgrades.dodgeCooldownMultiplier = Math.max(0.58, this.upgrades.dodgeCooldownMultiplier - 0.12);
        return "Dodge cooldown reduced";
      case "pulse":
        this.upgrades.skillPowerBonus += 1;
        return "Safe Pulse damage increased";
      case "heart":
        this.upgrades.maxHpBonus += 1;
        return "Max HP increased";
      default:
        return "Upgrade applied";
    }
  }

  flashHit(): void {
    this.sprite.setTint(0xff3355);
    this.scene.time.delayedCall(110, () => {
      if (!this.sprite.active || this.isDodging || this.isSkillCasting) return;
      this.sprite.clearTint();
    });
  }

  private attack(): void {
    if (!this.canAttack()) return;

    const now = Date.now();
    this.lastAttackAt = now;

    if (now - this.lastComboAt > this.comboResetMs) {
      this.comboStep = 0;
    }

    this.comboStep = (this.comboStep % 3) + 1;
    this.lastComboAt = now;

    const comboStep = this.comboStep;
    const baseDamage = comboStep === 3 ? 3 : 1;
    const range = comboStep === 1 ? 86 : comboStep === 2 ? 104 : 126;
    const arcDegrees = comboStep === 3 ? 112 : 82;

    this.pendingAttackSpec = {
      comboStep,
      damage: baseDamage + this.upgrades.damageBonus,
      range,
      arcDegrees,
      knockback: comboStep === 3 ? 260 : 150,
      maxTargets: comboStep === 3 ? 5 : 3,
      direction: this.facing.clone(),
    };

    this.isAttacking = true;
    this.attackStartedThisFrame = true;
    this.sprite.setTint(comboStep === 3 ? 0xb66cff : 0xffffff);
    this.sprite.setScale(comboStep === 3 ? 1.14 : 1.07);

    this.scene.time.delayedCall(comboStep === 3 ? 210 : 145, () => {
      if (!this.sprite.active) return;
      this.isAttacking = false;
      if (!this.isDodging && !this.isSkillCasting) this.sprite.clearTint();
      this.sprite.setScale(1);
    });
  }

  private dodge(): void {
    if (!this.canDodge()) return;

    this.lastDodgeAt = Date.now();
    this.isDodging = true;
    this.invincibleUntil = Date.now() + 360;
    this.sprite.setAlpha(0.52);
    this.sprite.setTint(0xb66cff);

    this.scene.time.delayedCall(260, () => {
      if (!this.sprite.active) return;
      this.isDodging = false;
      this.sprite.setAlpha(1);
      if (!this.isAttacking && !this.isSkillCasting) this.sprite.clearTint();
    });
  }

  private castSkill(): void {
    if (!this.canSkill()) return;

    this.lastSkillAt = Date.now();
    this.isSkillCasting = true;
    this.skillStartedThisFrame = true;
    this.invincibleUntil = Math.max(this.invincibleUntil, Date.now() + 180);
    this.sprite.setTint(0x39ff14);

    this.scene.time.delayedCall(250, () => {
      if (!this.sprite.active) return;
      this.isSkillCasting = false;
      if (!this.isAttacking && !this.isDodging) this.sprite.clearTint();
    });
  }

  keepInsideArena(): void {
    this.sprite.x = Phaser.Math.Clamp(this.sprite.x, 24, GAME_WIDTH - 24);
    this.sprite.y = Phaser.Math.Clamp(this.sprite.y, 96, GAME_HEIGHT - 132);
  }
}
