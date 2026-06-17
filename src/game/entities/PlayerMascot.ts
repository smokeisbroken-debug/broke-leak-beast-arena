import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../../config/game";
import type { AttackSpec, InputState, PlayerUpgradeId, PlayerUpgradeState } from "../types/game";

const PLAYER_BASE_SCALE = 0.096;
const PLAYER_ATTACK_SCALE = 0.1;
const PLAYER_HEAVY_ATTACK_SCALE = 0.104;

export class PlayerMascot {
  public readonly sprite: Phaser.Physics.Arcade.Sprite;

  public isAttacking = false;
  public isDodging = false;
  public isPulseCasting = false;
  public isSlashCasting = false;
  public isShieldCasting = false;

  private baseSpeed = 245;
  private attackCooldownMs = 330;
  private dodgeCooldownMs = 780;
  private pulseCooldownMs = 5200;
  private shieldCooldownMs = 6200;
  private slashCooldownMs = 3600;

  private lastAttackAt = -9999;
  private lastDodgeAt = -9999;
  private lastPulseAt = -9999;
  private lastShieldAt = -9999;
  private lastSlashAt = -9999;
  private invincibleUntil = -9999;
  private slashDashUntil = -9999;

  private attackStartedThisFrame = false;
  private pulseStartedThisFrame = false;
  private shieldStartedThisFrame = false;
  private pendingAttackSpec: AttackSpec | null = null;
  private pendingSlashSpec: AttackSpec | null = null;

  private comboStep = 0;
  private lastComboAt = -9999;
  private readonly comboResetMs = 760;

  private shieldUntil = -9999;
  private shieldCharges = 0;
  private tempSpeedBoost = 0;
  private speedBoostUntil = -9999;
  private currentVisualKey = "";

  private facing = new Phaser.Math.Vector2(1, 0);
  private upgrades: PlayerUpgradeState = {
    damageBonus: 0,
    speedBonus: 0,
    maxHpBonus: 0,
    dodgeCooldownMultiplier: 1,
    skillPowerBonus: 0,
    attackCooldownMultiplier: 1,
    attackRangeBonus: 0,
    attackArcBonus: 0,
    pulseRadiusBonus: 0,
    shieldChargeBonus: 0,
    shieldDurationBonusMs: 0,
    bossDamageBonus: 0,
  };

  constructor(private scene: Phaser.Scene, x: number, y: number) {
    this.sprite = scene.physics.add.sprite(x, y, "mascot-idle-front");
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setScale(PLAYER_BASE_SCALE);
    this.sprite.setSize(360, 520);
    this.sprite.setDepth(26);
    this.playVisual("mascot-idle-front-anim");
  }

  update(input: InputState, _delta: number): void {
    this.attackStartedThisFrame = false;
    this.pulseStartedThisFrame = false;
    this.shieldStartedThisFrame = false;
    this.pendingAttackSpec = null;
    this.pendingSlashSpec = null;

    const now = Date.now();
    if (this.shieldCharges > 0 && now > this.shieldUntil) {
      this.shieldCharges = 0;
      if (!this.isDodging && !this.isAttacking && !this.isPulseCasting && !this.isSlashCasting) this.sprite.clearTint();
    }

    if (this.tempSpeedBoost > 0 && now > this.speedBoostUntil) {
      this.tempSpeedBoost = 0;
    }

    const velocity = new Phaser.Math.Vector2(input.x, input.y);

    if (velocity.lengthSq() > 0) {
      velocity.normalize();
      this.facing.copy(velocity);
    }

    const currentSpeed = this.baseSpeed + this.upgrades.speedBonus + this.tempSpeedBoost;
    const movement = velocity.clone().scale(currentSpeed);

    if (this.isDodging) {
      movement.copy(this.facing).scale(currentSpeed * 2.35);
    }

    if (this.isSlashCasting && now < this.slashDashUntil) {
      movement.copy(this.facing).scale(currentSpeed * 2.9);
    }

    this.sprite.setVelocity(movement.x, movement.y);

    if (input.attack) this.attack();
    if (input.slash) this.dashSlash();
    if (input.pulse) this.castPulse();
    if (input.shield) this.castShield();
    if (input.dodge) this.dodge();

    this.updateVisualState(velocity);
  }

  consumeAttackStarted(): AttackSpec | null {
    if (!this.attackStartedThisFrame || !this.pendingAttackSpec) return null;
    const spec = this.pendingAttackSpec;
    this.attackStartedThisFrame = false;
    this.pendingAttackSpec = null;
    return spec;
  }

  consumeSlashStarted(): AttackSpec | null {
    if (!this.pendingSlashSpec) return null;
    const spec = this.pendingSlashSpec;
    this.pendingSlashSpec = null;
    return spec;
  }

  consumePulseStarted(): boolean {
    const didStart = this.pulseStartedThisFrame;
    this.pulseStartedThisFrame = false;
    return didStart;
  }

  consumeShieldStarted(): boolean {
    const didStart = this.shieldStartedThisFrame;
    this.shieldStartedThisFrame = false;
    return didStart;
  }

  canAttack(): boolean {
    return !this.isAttacking && Date.now() - this.lastAttackAt >= this.attackCooldownMs * this.upgrades.attackCooldownMultiplier;
  }

  canDodge(): boolean {
    return !this.isDodging && Date.now() - this.lastDodgeAt >= this.dodgeCooldownMs * this.upgrades.dodgeCooldownMultiplier;
  }

  canPulse(): boolean {
    return !this.isPulseCasting && Date.now() - this.lastPulseAt >= this.pulseCooldownMs;
  }

  canShield(): boolean {
    return !this.isShieldCasting && Date.now() - this.lastShieldAt >= this.shieldCooldownMs;
  }

  canSlash(): boolean {
    return !this.isSlashCasting && Date.now() - this.lastSlashAt >= this.slashCooldownMs;
  }

  getCooldownState() {
    return {
      attackReady: this.canAttack(),
      dodgeReady: this.canDodge(),
      pulseReady: this.canPulse(),
      shieldReady: this.canShield(),
      slashReady: this.canSlash(),
      shieldActive: this.isShieldActive(),
      shieldCharges: this.shieldCharges,
    };
  }

  getComboStep(): number {
    return Date.now() - this.lastComboAt > this.comboResetMs ? 0 : this.comboStep;
  }

  getFacing(): Phaser.Math.Vector2 {
    return this.facing.clone();
  }

  setFacing(direction: Phaser.Math.Vector2): void {
    if (direction.lengthSq() <= 0) return;
    this.facing.copy(direction.clone().normalize());
  }

  getPulsePower(): number {
    return 2 + this.upgrades.skillPowerBonus;
  }

  getPulseRadius(): number {
    return 142 + this.upgrades.pulseRadiusBonus;
  }

  getSlashPower(): number {
    return 3 + this.upgrades.damageBonus + Math.floor(this.upgrades.skillPowerBonus / 2);
  }

  getBossDamageBonus(): number {
    return this.upgrades.bossDamageBonus;
  }

  getShieldCapacity(): number {
    return 2 + this.upgrades.shieldChargeBonus;
  }

  getMaxHpBonus(): number {
    return this.upgrades.maxHpBonus;
  }


  grantShieldPickup(charges = 1, durationMs = 2200): void {
    this.shieldCharges = Math.max(this.shieldCharges, charges);
    this.shieldUntil = Math.max(this.shieldUntil, Date.now() + durationMs);
    this.invincibleUntil = Math.max(this.invincibleUntil, Date.now() + 120);
    this.sprite.setTint(0x39ff14);
    this.scene.time.delayedCall(180, () => {
      if (!this.sprite.active || this.isShieldActive() || this.isDodging || this.isAttacking || this.isPulseCasting || this.isSlashCasting) return;
      this.sprite.clearTint();
    });
  }

  reduceCooldowns(ms: number): void {
    this.lastAttackAt -= ms;
    this.lastDodgeAt -= ms;
    this.lastPulseAt -= ms;
    this.lastShieldAt -= ms;
    this.lastSlashAt -= ms;
  }

  applySpeedBoost(amount = 48, durationMs = 3500): void {
    this.tempSpeedBoost = Math.max(this.tempSpeedBoost, amount);
    this.speedBoostUntil = Math.max(this.speedBoostUntil, Date.now() + durationMs);
    this.sprite.setTint(0xfff17d);
    this.scene.time.delayedCall(180, () => {
      if (!this.sprite.active || this.isShieldActive() || this.isDodging || this.isAttacking || this.isPulseCasting || this.isSlashCasting) return;
      this.sprite.clearTint();
    });
  }

  get isInvincible(): boolean {
    return Date.now() < this.invincibleUntil;
  }

  isShieldActive(): boolean {
    return this.shieldCharges > 0 && Date.now() < this.shieldUntil;
  }

  tryBlockDamage(): boolean {
    if (!this.isShieldActive()) return false;

    this.shieldCharges = Math.max(0, this.shieldCharges - 1);
    this.invincibleUntil = Math.max(this.invincibleUntil, Date.now() + 260);
    this.sprite.setTint(0x39ff14);
    this.scene.time.delayedCall(120, () => {
      if (!this.sprite.active || this.isShieldActive() || this.isDodging || this.isAttacking || this.isPulseCasting || this.isSlashCasting) return;
      this.sprite.clearTint();
    });

    if (this.shieldCharges <= 0) {
      this.shieldUntil = -9999;
    }

    return true;
  }

  applyUpgrade(id: PlayerUpgradeId): string {
    switch (id) {
      case "damage":
        this.upgrades.damageBonus += 1;
        return "Razor Combo: attack damage increased";
      case "speed":
        this.upgrades.speedBonus += 18;
        return "Clean Footwork: movement speed increased";
      case "dash":
        this.upgrades.dodgeCooldownMultiplier = Math.max(0.52, this.upgrades.dodgeCooldownMultiplier - 0.12);
        return "Leak Step: dodge cooldown reduced";
      case "pulse":
        this.upgrades.skillPowerBonus += 1;
        this.upgrades.pulseRadiusBonus += 10;
        return "Safe Pulse+: pulse damage and radius increased";
      case "heart":
        this.upgrades.maxHpBonus += 1;
        return "Wallet HP: max HP increased";
      case "attack_speed":
        this.upgrades.attackCooldownMultiplier = Math.max(0.64, this.upgrades.attackCooldownMultiplier - 0.08);
        return "Quick Hands: combo attacks faster";
      case "wide_swing":
        this.upgrades.attackRangeBonus += 12;
        this.upgrades.attackArcBonus += 8;
        return "Wide Swing: attack area increased";
      case "shield_battery":
        this.upgrades.shieldChargeBonus += 1;
        this.upgrades.shieldDurationBonusMs += 450;
        return "Shield Battery: shield lasts longer";
      case "boss_breaker":
        this.upgrades.bossDamageBonus += 1;
        this.upgrades.skillPowerBonus += 1;
        return "Boss Breaker: more damage to bosses";
      default:
        return "Upgrade applied";
    }
  }

  flashHit(): void {
    this.playVisual("mascot-hurt-anim");
    this.sprite.setTint(0xff3355);
    this.scene.time.delayedCall(110, () => {
      if (!this.sprite.active || this.isDodging || this.isPulseCasting || this.isSlashCasting || this.isShieldActive()) return;
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
    const range = (comboStep === 1 ? 86 : comboStep === 2 ? 104 : 126) + this.upgrades.attackRangeBonus;
    const arcDegrees = (comboStep === 3 ? 112 : 82) + this.upgrades.attackArcBonus;

    this.pendingAttackSpec = {
      comboStep,
      damage: baseDamage + this.upgrades.damageBonus,
      range,
      arcDegrees,
      knockback: comboStep === 3 ? 260 : 150,
      maxTargets: comboStep === 3 ? 5 : 3,
      direction: this.facing.clone(),
      kind: "combo",
    };

    this.isAttacking = true;
    this.attackStartedThisFrame = true;
    this.sprite.setTint(comboStep === 3 ? 0xb66cff : 0xffffff);
    this.sprite.setScale(comboStep === 3 ? PLAYER_HEAVY_ATTACK_SCALE : PLAYER_ATTACK_SCALE);
    this.playVisual("mascot-attack-anim");

    this.scene.time.delayedCall(comboStep === 3 ? 210 : 145, () => {
      if (!this.sprite.active) return;
      this.isAttacking = false;
      if (!this.isDodging && !this.isPulseCasting && !this.isSlashCasting && !this.isShieldActive()) this.sprite.clearTint();
      this.sprite.setScale(PLAYER_BASE_SCALE);
    });
  }

  private dodge(): void {
    if (!this.canDodge()) return;

    this.lastDodgeAt = Date.now();
    this.isDodging = true;
    this.invincibleUntil = Date.now() + 360;
    this.sprite.setAlpha(0.52);
    this.sprite.setTint(0xb66cff);
    this.playVisual("mascot-dash-anim");

    this.scene.time.delayedCall(260, () => {
      if (!this.sprite.active) return;
      this.isDodging = false;
      this.sprite.setAlpha(1);
      if (!this.isAttacking && !this.isPulseCasting && !this.isSlashCasting && !this.isShieldActive()) this.sprite.clearTint();
    });
  }

  private dashSlash(): void {
    if (!this.canSlash()) return;

    this.lastSlashAt = Date.now();
    this.isSlashCasting = true;
    this.slashDashUntil = Date.now() + 255;
    this.invincibleUntil = Math.max(this.invincibleUntil, Date.now() + 230);
    this.comboStep = 0;

    this.pendingSlashSpec = {
      comboStep: 0,
      damage: this.getSlashPower(),
      range: 188,
      arcDegrees: 58,
      knockback: 390,
      maxTargets: 7,
      direction: this.facing.clone(),
      kind: "dash_slash",
    };

    this.sprite.setTint(0x39ff14);
    this.sprite.setScale(PLAYER_HEAVY_ATTACK_SCALE);
    this.playVisual("mascot-attack-anim");

    this.scene.time.delayedCall(285, () => {
      if (!this.sprite.active) return;
      this.isSlashCasting = false;
      this.sprite.setScale(PLAYER_BASE_SCALE);
      if (!this.isAttacking && !this.isDodging && !this.isPulseCasting && !this.isShieldActive()) this.sprite.clearTint();
    });
  }

  private castPulse(): void {
    if (!this.canPulse()) return;

    this.lastPulseAt = Date.now();
    this.isPulseCasting = true;
    this.pulseStartedThisFrame = true;
    this.invincibleUntil = Math.max(this.invincibleUntil, Date.now() + 180);
    this.sprite.setTint(0x39ff14);
    this.playVisual(this.shouldUseBackPose() ? "mascot-pulse-back-anim" : "mascot-pulse-front-anim");

    this.scene.time.delayedCall(250, () => {
      if (!this.sprite.active) return;
      this.isPulseCasting = false;
      if (!this.isAttacking && !this.isDodging && !this.isSlashCasting && !this.isShieldActive()) this.sprite.clearTint();
    });
  }

  private castShield(): void {
    if (!this.canShield()) return;

    this.lastShieldAt = Date.now();
    this.isShieldCasting = true;
    this.shieldStartedThisFrame = true;
    this.shieldCharges = this.getShieldCapacity();
    this.shieldUntil = Date.now() + 2600 + this.upgrades.shieldDurationBonusMs;
    this.invincibleUntil = Math.max(this.invincibleUntil, Date.now() + 160);
    this.sprite.setTint(0x39ff14);
    this.playVisual(this.shouldUseBackPose() ? "mascot-pulse-back-anim" : "mascot-pulse-front-anim");

    this.scene.time.delayedCall(240, () => {
      if (!this.sprite.active) return;
      this.isShieldCasting = false;
    });
  }

  keepInsideArena(): void {
    this.sprite.x = Phaser.Math.Clamp(this.sprite.x, 70, GAME_WIDTH - 70);
    this.sprite.y = Phaser.Math.Clamp(this.sprite.y, 96, GAME_HEIGHT - 82);
  }

  private updateVisualState(velocity: Phaser.Math.Vector2): void {
    const moving = velocity.lengthSq() > 0.02;
    const facingBack = this.shouldUseBackPose();

    if (this.isPulseCasting || this.isShieldCasting) {
      this.playVisual(facingBack ? "mascot-pulse-back-anim" : "mascot-pulse-front-anim");
    } else if (this.isSlashCasting || this.isAttacking) {
      this.playVisual("mascot-attack-anim");
    } else if (this.isDodging) {
      this.playVisual("mascot-dash-anim");
    } else if (moving) {
      this.playVisual(facingBack ? "mascot-run-back-anim" : "mascot-run-front-anim");
    } else {
      this.playVisual(facingBack ? "mascot-idle-back-anim" : "mascot-idle-front-anim");
    }

    if (Math.abs(this.facing.x) > 0.1) {
      this.sprite.setFlipX(this.facing.x < 0);
    }
  }

  private shouldUseBackPose(): boolean {
    return this.facing.y < -0.55 && Math.abs(this.facing.x) < 0.4;
  }

  private playVisual(animationKey: string): void {
    if (this.currentVisualKey === animationKey) return;
    this.currentVisualKey = animationKey;
    this.sprite.play(animationKey, true);
  }
}
