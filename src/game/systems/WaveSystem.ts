import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../../config/game";
import { applyLeakBeastBody, createLeakBeast } from "../entities/LeakBeast";
import type { AttackSpec, EnemyKind } from "../types/game";

interface HitResult {
  hits: number;
  defeated: number;
  bossHit: boolean;
  score: number;
}

interface BossHpBar {
  bg: Phaser.GameObjects.Rectangle;
  fill: Phaser.GameObjects.Rectangle;
  frame: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
}

type BossPattern = "charge" | "bolt_spread" | "shockwave" | "summon" | "rage_charge" | "smoke_ring";
type BossPhase = 1 | 2;

const ENEMY_ROTATION: EnemyKind[] = ["bad_habit", "bad_habit", "fomo", "scam", "smoke_brute"];

export class WaveSystem {
  public readonly group: Phaser.Physics.Arcade.Group;
  public readonly projectiles: Phaser.Physics.Arcade.Group;
  public currentWave = 1;
  public defeatedCount = 0;
  public bossActive = false;

  private spawnTimer = 0;
  private lastBossWave = 0;
  private hazards: Phaser.GameObjects.Arc[] = [];
  private shadows = new Map<Phaser.Physics.Arcade.Sprite, Phaser.GameObjects.Ellipse>();
  private bossHpBars = new Map<Phaser.Physics.Arcade.Sprite, BossHpBar>();
  private pendingBossRewardWave = 0;

  constructor(private scene: Phaser.Scene) {
    this.group = scene.physics.add.group();
    this.projectiles = scene.physics.add.group();
  }

  update(runElapsedMs: number, delta: number, targetX: number, targetY: number, paused = false): void {
    if (paused) return;

    const nextWave = Math.max(1, Math.floor(runElapsedMs / 18000) + 1);
    this.currentWave = nextWave;
    this.bossActive = this.hasActiveBoss();

    if (this.shouldSpawnMiniBoss()) {
      this.spawnBoss(targetX, targetY);
      this.lastBossWave = this.currentWave;
      this.bossActive = true;
    }

    this.spawnTimer += delta;
    const spawnEveryMs = this.getSpawnInterval(runElapsedMs);

    if (this.spawnTimer >= spawnEveryMs) {
      this.spawnTimer = 0;
      this.spawn(targetX, targetY, runElapsedMs);
    }

    const now = Date.now();
    this.updateEnemies(targetX, targetY, now);
    this.updateProjectiles();
    this.updateHazards(now);
  }

  spawnOpeningPack(targetX: number, targetY: number): void {
    // Landscape opening pack: enemies appear around the central arena, not under controls.
    this.spawn(targetX, targetY, 99999, "bad_habit");
    this.spawn(targetX, targetY, 99999, "bad_habit");
    this.spawn(targetX, targetY, 99999, "fomo");
    this.spawnTimer = 620;
  }

  defeatEnemy(enemy: Phaser.Physics.Arcade.Sprite): boolean {
    if (!enemy.active || !enemy.body) return false;

    const wasBoss = Boolean(enemy.getData("boss"));
    const score = Number(enemy.getData("score") ?? 0);

    this.spawnDeathPop(enemy.x, enemy.y, wasBoss ? 0xb66cff : 0x39ff14);
    this.spawnDeathBurst(enemy.x, enemy.y, wasBoss ? 0xb66cff : 0x39ff14, wasBoss);
    this.removeShadow(enemy);
    this.removeBossHpBar(enemy);
    enemy.disableBody(true, true);
    this.defeatedCount += 1;

    if (wasBoss) {
      this.bossActive = false;
      this.pendingBossRewardWave = this.currentWave;
      this.scene.cameras.main.shake(180, 0.004);
      this.showBossClear(enemy.x, enemy.y);
    }

    enemy.setData("lastScore", score);
    return true;
  }

  hitEnemiesInArc(originX: number, originY: number, attack: AttackSpec): HitResult {
    const result: HitResult = { hits: 0, defeated: 0, bossHit: false, score: 0 };
    const direction = attack.direction.clone();
    if (direction.lengthSq() <= 0) direction.set(1, 0);
    direction.normalize();
    const halfArc = Phaser.Math.DegToRad(attack.arcDegrees / 2);

    this.group.children.iterate((child) => {
      if (result.hits >= attack.maxTargets) return false;

      const beast = child as Phaser.Physics.Arcade.Sprite | null;
      if (!beast || !beast.active || !beast.body) return true;

      const toEnemy = new Phaser.Math.Vector2(beast.x - originX, beast.y - originY);
      const distance = toEnemy.length();
      if (distance > attack.range || distance <= 0) return true;

      toEnemy.normalize();
      const angle = Math.acos(Phaser.Math.Clamp(direction.dot(toEnemy), -1, 1));
      if (angle > halfArc) return true;

      result.hits += 1;
      const damageResult = this.damageEnemy(beast, attack.damage, direction, attack.knockback);
      result.score += damageResult.score;
      if (damageResult.defeated) result.defeated += 1;
      if (damageResult.bossHit) result.bossHit = true;

      return true;
    });

    return result;
  }

  hitEnemiesNear(x: number, y: number, radius: number, damage: number, maxTargets = 99): HitResult {
    const result: HitResult = { hits: 0, defeated: 0, bossHit: false, score: 0 };

    this.group.children.iterate((child) => {
      if (result.hits >= maxTargets) return false;

      const beast = child as Phaser.Physics.Arcade.Sprite | null;
      if (!beast || !beast.active || !beast.body) return true;

      const distance = Phaser.Math.Distance.Between(x, y, beast.x, beast.y);
      if (distance > radius) return true;

      const dir = new Phaser.Math.Vector2(beast.x - x, beast.y - y);
      if (dir.lengthSq() <= 0) dir.set(1, 0);
      dir.normalize();

      result.hits += 1;
      const damageResult = this.damageEnemy(beast, damage, dir, 220);
      result.score += damageResult.score;
      if (damageResult.defeated) result.defeated += 1;
      if (damageResult.bossHit) result.bossHit = true;

      return true;
    });

    return result;
  }

  isPointInActiveHazard(x: number, y: number): boolean {
    return this.hazards.some((zone) => zone.active && Phaser.Math.Distance.Between(x, y, zone.x, zone.y) <= zone.radius);
  }

  clearAll(): void {
    this.shadows.forEach((shadow) => shadow.destroy());
    this.shadows.clear();
    this.bossHpBars.forEach((bar) => {
      bar.bg.destroy();
      bar.fill.destroy();
      bar.frame.destroy();
      bar.label.destroy();
    });
    this.bossHpBars.clear();
    this.group.clear(true, true);
    this.projectiles.clear(true, true);
    this.hazards.forEach((zone) => zone.destroy());
    this.hazards = [];
    this.pendingBossRewardWave = 0;
  }

  consumeBossRewardWave(): number {
    const wave = this.pendingBossRewardWave;
    this.pendingBossRewardWave = 0;
    return wave;
  }

  private damageEnemy(
    enemy: Phaser.Physics.Arcade.Sprite,
    damage: number,
    direction: Phaser.Math.Vector2,
    knockback: number,
  ): { defeated: boolean; bossHit: boolean; score: number } {
    const isBoss = Boolean(enemy.getData("boss"));
    const maxHp = Math.max(1, Number(enemy.getData("maxHp") ?? 1));
    const now = Date.now();

    if (isBoss && now < Number(enemy.getData("spawnInvulnerableUntil") ?? 0)) {
      this.showDamageNumber(
        "BLOCK",
        enemy.x,
        enemy.y - Number(enemy.getData("displayH") ?? enemy.displayHeight) * 0.46,
        "#d9a7ff",
        false,
      );
      return { defeated: false, bossHit: true, score: 0 };
    }

    const hp = Number(enemy.getData("hp") ?? 1) - damage;
    enemy.setData("hp", hp);
    enemy.setData("hitStunUntil", now + (isBoss ? 95 : 155));
    enemy.setVelocity(direction.x * knockback, direction.y * knockback);
    enemy.setTint(isBoss ? 0xffffff : 0x9cff8a);

    this.spawnHitSpark(enemy.x, enemy.y, isBoss ? 0xb66cff : 0x39ff14, isBoss);
    this.showDamageNumber(
      `-${damage}`,
      enemy.x,
      enemy.y - Number(enemy.getData("displayH") ?? enemy.displayHeight) * 0.46,
      isBoss ? "#d9a7ff" : "#d7ffd0",
      hp <= 0,
    );

    if (isBoss) {
      this.updateBossHpBar(enemy, hp, maxHp);
    }

    this.scene.time.delayedCall(isBoss ? 70 : 92, () => {
      if (enemy.active) enemy.clearTint();
    });

    if (hp <= 0) {
      const score = Number(enemy.getData("score") ?? 0);
      const defeated = this.defeatEnemy(enemy);
      return { defeated, bossHit: isBoss, score: defeated ? score : 0 };
    }

    return { defeated: false, bossHit: isBoss, score: isBoss ? 18 : 7 };
  }

  private updateEnemies(targetX: number, targetY: number, now: number): void {
    this.group.children.iterate((child) => {
      const beast = child as Phaser.Physics.Arcade.Sprite | null;
      if (!beast || !beast.active || !beast.body) return true;

      applyLeakBeastBody(beast);
      this.updateEnemyPresentation(beast);

      if (Number(beast.getData("hitStunUntil") ?? 0) > now) return true;

      const kind = beast.getData("kind") as EnemyKind;
      const speed = Number(beast.getData("speed") ?? 90);
      beast.setFlipX(targetX < beast.x);

      if (Boolean(beast.getData("boss"))) {
        this.updateBossPattern(beast, targetX, targetY, now, speed);
        return true;
      }

      if (kind === "fomo") {
        this.updateFomoCharge(beast, targetX, targetY, now, speed);
        return true;
      }

      if (kind === "scam") {
        this.updateScamShooter(beast, targetX, targetY, now, speed);
        return true;
      }

      if (kind === "smoke_brute") {
        this.updateSmokeBrute(beast, targetX, targetY, now, speed);
        return true;
      }

      this.updateBadHabitPressure(beast, targetX, targetY, speed);
      return true;
    });
  }

  private updateBadHabitPressure(beast: Phaser.Physics.Arcade.Sprite, targetX: number, targetY: number, speed: number): void {
    // Bad Habit Beast is the pressure unit. It is predictable but keeps walking into the player's space.
    this.scene.physics.moveTo(beast, targetX, targetY, speed);
  }

  private updateFomoCharge(beast: Phaser.Physics.Arcade.Sprite, targetX: number, targetY: number, now: number, speed: number): void {
    const chargeUntil = Number(beast.getData("chargeUntil") ?? 0);

    if (chargeUntil > now) {
      const dirX = Number(beast.getData("chargeDirX") ?? 0);
      const dirY = Number(beast.getData("chargeDirY") ?? 0);
      beast.setVelocity(dirX * speed * 2.45, dirY * speed * 2.45);
      return;
    }

    const windupUntil = Number(beast.getData("windupUntil") ?? 0);
    if (windupUntil > now) {
      beast.setVelocity(0, 0);
      beast.setTint(0xff3355);
      return;
    }

    const nextChargeAt = Number(beast.getData("nextChargeAt") ?? 0);
    const distance = Phaser.Math.Distance.Between(beast.x, beast.y, targetX, targetY);

    if (nextChargeAt <= now && distance < 238) {
      const dir = new Phaser.Math.Vector2(targetX - beast.x, targetY - beast.y);
      if (dir.lengthSq() <= 0) dir.set(1, 0);
      dir.normalize();

      beast.setData("chargeDirX", dir.x);
      beast.setData("chargeDirY", dir.y);
      beast.setData("windupUntil", now + 520);
      beast.setData("chargeUntil", now + 1160);
      beast.setData("nextChargeAt", now + Phaser.Math.Between(2600, 3300));
      beast.setVelocity(0, 0);
      beast.setTint(0xff3355);
      this.showTelegraphLine(beast.x, beast.y, beast.x + dir.x * 190, beast.y + dir.y * 190, 0xff3355, 520);
      this.showEnemyWarning("CHARGE", beast.x, beast.y - 32, "#ff3355");
      return;
    }

    beast.clearTint();
    this.scene.physics.moveTo(beast, targetX, targetY, speed * 0.78);
  }

  private updateScamShooter(beast: Phaser.Physics.Arcade.Sprite, targetX: number, targetY: number, now: number, speed: number): void {
    const shotAt = Number(beast.getData("shotAt") ?? 0);
    const shotQueued = Boolean(beast.getData("shotQueued"));

    if (shotQueued) {
      beast.setVelocity(0, 0);
      beast.setTint(0xb66cff);
      if (now >= shotAt) {
        const shotX = Number(beast.getData("shotX") ?? targetX);
        const shotY = Number(beast.getData("shotY") ?? targetY);
        this.spawnProjectile(beast.x, beast.y, shotX, shotY, 190);
        beast.setData("shotQueued", false);
        beast.clearTint();
      }
      return;
    }

    const nextShotAt = Number(beast.getData("nextShotAt") ?? 0);
    const distance = Phaser.Math.Distance.Between(beast.x, beast.y, targetX, targetY);

    if (distance > 178) {
      this.scene.physics.moveTo(beast, targetX, targetY, speed * 0.64);
    } else if (distance < 104) {
      const away = new Phaser.Math.Vector2(beast.x - targetX, beast.y - targetY);
      if (away.lengthSq() <= 0) away.set(1, 0);
      away.normalize().scale(speed * 0.62);
      beast.setVelocity(away.x, away.y);
    } else {
      beast.setVelocity(0, 0);
    }

    if (nextShotAt <= now) {
      beast.setData("nextShotAt", now + Phaser.Math.Between(1800, 2500));
      beast.setData("shotQueued", true);
      beast.setData("shotAt", now + 480);
      beast.setData("shotX", targetX);
      beast.setData("shotY", targetY);
      this.showTelegraphLine(beast.x, beast.y, targetX, targetY, 0xb66cff, 480);
      this.showEnemyWarning("SHOT", beast.x, beast.y - 34, "#b66cff");
    }
  }

  private updateSmokeBrute(beast: Phaser.Physics.Arcade.Sprite, targetX: number, targetY: number, now: number, speed: number): void {
    const dropAt = Number(beast.getData("smokeDropAt") ?? 0);
    if (dropAt > 0) {
      beast.setVelocity(0, 0);
      beast.setTint(0xb66cff);
      if (now >= dropAt) {
        const smokeX = Number(beast.getData("smokeX") ?? beast.x);
        const smokeY = Number(beast.getData("smokeY") ?? beast.y);
        this.spawnHazard(smokeX, smokeY, 50, 2000);
        beast.setData("smokeDropAt", 0);
        beast.clearTint();
      }
      return;
    }

    const nextSmokeAt = Number(beast.getData("nextSmokeAt") ?? 0);
    if (nextSmokeAt <= now) {
      beast.setData("nextSmokeAt", now + Phaser.Math.Between(2500, 3400));
      beast.setData("smokeDropAt", now + 560);
      beast.setData("smokeX", beast.x);
      beast.setData("smokeY", beast.y);
      this.showTelegraphCircle(beast.x, beast.y, 50, 0xb66cff, 560);
      this.showEnemyWarning("SMOKE", beast.x, beast.y - 42, "#b66cff");
      return;
    }

    this.scene.physics.moveTo(beast, targetX, targetY, speed * 0.82);
  }

  private updateBossPattern(beast: Phaser.Physics.Arcade.Sprite, targetX: number, targetY: number, now: number, speed: number): void {
    const phase = this.updateBossPhase(beast, now);
    const style = (beast.getData("bossStyle") as "thorn" | "smoke" | undefined) ?? "thorn";
    const phaseSpeed = phase === 2 ? speed * 1.18 : speed;

    const chargeUntil = Number(beast.getData("chargeUntil") ?? 0);
    if (chargeUntil > now) {
      const dirX = Number(beast.getData("chargeDirX") ?? 0);
      const dirY = Number(beast.getData("chargeDirY") ?? 0);
      beast.setVelocity(dirX * phaseSpeed * (phase === 2 ? 4.15 : 3.45), dirY * phaseSpeed * (phase === 2 ? 4.15 : 3.45));
      return;
    }

    const patternFireAt = Number(beast.getData("patternFireAt") ?? 0);
    const queuedPattern = beast.getData("queuedPattern") as BossPattern | undefined;

    if (queuedPattern && patternFireAt > now) {
      beast.setVelocity(0, 0);
      beast.setTint(phase === 2 ? 0xffddff : 0xffffff);
      return;
    }

    if (queuedPattern && patternFireAt <= now) {
      this.executeBossPattern(beast, queuedPattern, targetX, targetY, now, phaseSpeed);
      beast.setData("queuedPattern", undefined);
      beast.setData("patternFireAt", 0);
      beast.setData("nextPatternAt", now + Phaser.Math.Between(phase === 2 ? 1450 : 2150, phase === 2 ? 2150 : 3000));
      beast.clearTint();
      return;
    }

    const nextPatternAt = Number(beast.getData("nextPatternAt") ?? 0);
    if (nextPatternAt <= now) {
      const pattern = this.pickBossPattern(style, phase);
      const windupMs = phase === 2 ? 470 : 650;
      beast.setData("queuedPattern", pattern);
      beast.setData("patternFireAt", now + windupMs);
      this.telegraphBossPattern(beast, pattern, targetX, targetY, windupMs);
      return;
    }

    const orbit = new Phaser.Math.Vector2(targetX - beast.x, targetY - beast.y);
    if (orbit.lengthSq() > 0) orbit.normalize();
    const distance = Phaser.Math.Distance.Between(beast.x, beast.y, targetX, targetY);

    if (distance < 112 && phase === 1) {
      beast.setVelocity(-orbit.x * phaseSpeed * 0.42, -orbit.y * phaseSpeed * 0.42);
    } else {
      this.scene.physics.moveTo(beast, targetX, targetY, phaseSpeed * (phase === 2 ? 0.78 : 0.62));
    }
  }

  private updateBossPhase(beast: Phaser.Physics.Arcade.Sprite, now: number): BossPhase {
    const hp = Number(beast.getData("hp") ?? 1);
    const maxHp = Math.max(1, Number(beast.getData("maxHp") ?? 1));
    const nextPhase: BossPhase = hp <= maxHp * 0.5 ? 2 : 1;
    const currentPhase = Number(beast.getData("bossPhase") ?? 1) as BossPhase;

    if (nextPhase === 2 && currentPhase !== 2) {
      beast.setData("bossPhase", 2);
      beast.setData("nextPatternAt", now + 520);
      beast.setData("patternFireAt", 0);
      beast.setData("queuedPattern", undefined);
      beast.setTint(0xffddff);
      this.spawnHitSpark(beast.x, beast.y, 0xb66cff, true);
      this.showTelegraphCircle(beast.x, beast.y, 100, 0xb66cff, 520);
      this.showEnemyWarning("PHASE 2", beast.x, beast.y - 66, "#d9a7ff");
      this.scene.cameras.main.shake(135, 0.0035);
      this.scene.time.delayedCall(180, () => {
        if (beast.active) beast.clearTint();
      });
    } else {
      beast.setData("bossPhase", nextPhase);
    }

    return nextPhase;
  }

  private pickBossPattern(style: "thorn" | "smoke", phase: BossPhase): BossPattern {
    if (style === "smoke") {
      return phase === 2
        ? Phaser.Math.RND.pick(["smoke_ring", "shockwave", "bolt_spread", "summon"] as BossPattern[])
        : Phaser.Math.RND.pick(["shockwave", "smoke_ring", "summon"] as BossPattern[]);
    }

    return phase === 2
      ? Phaser.Math.RND.pick(["rage_charge", "bolt_spread", "shockwave", "charge"] as BossPattern[])
      : Phaser.Math.RND.pick(["charge", "bolt_spread", "shockwave"] as BossPattern[]);
  }

  private telegraphBossPattern(
    beast: Phaser.Physics.Arcade.Sprite,
    pattern: BossPattern,
    targetX: number,
    targetY: number,
    durationMs: number,
  ): void {
    if (pattern === "charge" || pattern === "rage_charge") {
      const dir = new Phaser.Math.Vector2(targetX - beast.x, targetY - beast.y);
      if (dir.lengthSq() <= 0) dir.set(1, 0);
      dir.normalize();
      beast.setData("chargeDirX", dir.x);
      beast.setData("chargeDirY", dir.y);
      this.showTelegraphLine(beast.x, beast.y, beast.x + dir.x * (pattern === "rage_charge" ? 310 : 230), beast.y + dir.y * (pattern === "rage_charge" ? 310 : 230), 0xff3355, durationMs);
      this.showEnemyWarning(pattern === "rage_charge" ? "RAGE" : "CHARGE", beast.x, beast.y - 58, "#ff3355");
      return;
    }

    if (pattern === "bolt_spread") {
      this.showTelegraphLine(beast.x, beast.y, targetX, targetY, 0xb66cff, durationMs);
      this.showTelegraphLine(beast.x, beast.y, targetX + 85, targetY, 0xb66cff, durationMs);
      this.showTelegraphLine(beast.x, beast.y, targetX - 85, targetY, 0xb66cff, durationMs);
      this.showEnemyWarning("BOLTS", beast.x, beast.y - 58, "#b66cff");
      return;
    }

    if (pattern === "shockwave") {
      this.showTelegraphCircle(beast.x, beast.y, 92, 0xff3355, durationMs);
      this.showEnemyWarning("WAVE", beast.x, beast.y - 58, "#ff3355");
      return;
    }

    if (pattern === "smoke_ring") {
      this.showTelegraphCircle(targetX, targetY, 76, 0x7b42ff, durationMs);
      this.showTelegraphCircle(beast.x, beast.y, 66, 0x7b42ff, durationMs);
      this.showEnemyWarning("SMOKE RING", beast.x, beast.y - 58, "#b66cff");
      return;
    }

    this.showTelegraphCircle(targetX, targetY, 70, 0x39ff14, durationMs);
    this.showEnemyWarning("SUMMON", beast.x, beast.y - 58, "#39ff14");
  }

  private executeBossPattern(
    beast: Phaser.Physics.Arcade.Sprite,
    pattern: BossPattern,
    targetX: number,
    targetY: number,
    now: number,
    speed: number,
  ): void {
    if (pattern === "charge" || pattern === "rage_charge") {
      beast.setData("chargeUntil", now + (pattern === "rage_charge" ? 920 : 720));
      if (pattern === "rage_charge") {
        this.spawnProjectile(beast.x, beast.y, targetX, targetY, 175, true);
      }
      return;
    }

    if (pattern === "bolt_spread") {
      this.spawnProjectile(beast.x, beast.y, targetX, targetY, 205, true);
      this.spawnProjectile(beast.x, beast.y, targetX + 90, targetY, 175, true);
      this.spawnProjectile(beast.x, beast.y, targetX - 90, targetY, 175, true);

      if (Number(beast.getData("bossPhase") ?? 1) >= 2) {
        this.spawnProjectile(beast.x, beast.y, targetX, targetY - 70, 165, true);
        this.spawnProjectile(beast.x, beast.y, targetX, targetY + 70, 165, true);
      }
      return;
    }

    if (pattern === "shockwave") {
      this.spawnHazard(beast.x, beast.y, Number(beast.getData("bossPhase") ?? 1) >= 2 ? 104 : 86, 1550);
      const count = Number(beast.getData("bossPhase") ?? 1) >= 2 ? 8 : 6;
      for (let i = 0; i < count; i += 1) {
        const angle = (Math.PI * 2 * i) / count;
        this.spawnProjectile(beast.x, beast.y, beast.x + Math.cos(angle) * 170, beast.y + Math.sin(angle) * 170, 145, true);
      }
      return;
    }

    if (pattern === "smoke_ring") {
      this.spawnHazard(targetX, targetY, 62, 1900);
      const ringCount = 4;
      for (let i = 0; i < ringCount; i += 1) {
        const angle = (Math.PI * 2 * i) / ringCount;
        this.spawnHazard(targetX + Math.cos(angle) * 82, targetY + Math.sin(angle) * 54, 36, 1650);
      }
      return;
    }

    this.spawn(targetX, targetY, 99999, "bad_habit");
    this.spawn(targetX, targetY, 99999, "fomo");
    if (this.currentWave >= 4) this.spawn(targetX, targetY, 99999, "scam");
    beast.setVelocity(0, 0);
    beast.setData("hitStunUntil", now + 360);
    void speed;
  }

  private updateProjectiles(): void {
    this.projectiles.children.iterate((child) => {
      const projectile = child as Phaser.Physics.Arcade.Sprite | null;
      if (!projectile || !projectile.active || !projectile.body) return true;

      if (
        projectile.x < -40 ||
        projectile.x > GAME_WIDTH + 40 ||
        projectile.y < 60 ||
        projectile.y > GAME_HEIGHT + 40
      ) {
        projectile.disableBody(true, true);
      }

      return true;
    });
  }

  private updateHazards(now: number): void {
    this.hazards = this.hazards.filter((zone) => {
      const expiresAt = Number(zone.getData("expiresAt") ?? 0);
      if (expiresAt > now) return true;
      zone.destroy();
      return false;
    });
  }

  private getSpawnInterval(runElapsedMs: number): number {
    const earlySafetyMs = runElapsedMs < 9000 ? 220 : 0;
    const bossSafetyMs = this.bossActive ? 360 : 0;
    return Math.max(620, 1320 - this.currentWave * 68 + earlySafetyMs + bossSafetyMs);
  }

  private shouldSpawnMiniBoss(): boolean {
    return this.currentWave >= 3 && this.currentWave % 3 === 0 && this.lastBossWave !== this.currentWave && !this.bossActive;
  }

  private spawn(targetX: number, targetY: number, runElapsedMs: number, forcedKind?: EnemyKind): void {
    const side = Phaser.Math.Between(0, 3);
    const margin = 34;
    const topY = 96;
    const bottomY = GAME_HEIGHT - 126;
    const leftX = 128;
    const rightX = GAME_WIDTH - 128;

    const positions = [
      { x: Phaser.Math.Between(leftX, rightX), y: topY - margin },
      { x: rightX + margin, y: Phaser.Math.Between(topY, bottomY) },
      { x: Phaser.Math.Between(leftX, rightX), y: bottomY + margin },
      { x: leftX - margin, y: Phaser.Math.Between(topY, bottomY) },
    ];

    const position = positions[side];
    const kind = forcedKind ?? this.pickEnemyKind(runElapsedMs);
    const beast = createLeakBeast(this.scene, position.x, position.y, { kind, wave: this.currentWave });
    this.scene.physics.moveTo(beast, targetX, targetY, Number(beast.getData("speed") ?? 90));
    this.group.add(beast);
  }

  private spawnBoss(targetX: number, targetY: number): void {
    const side = Phaser.Math.Between(0, 1);
    const y = Phaser.Math.Between(132, GAME_HEIGHT - 138);
    const boss = createLeakBeast(this.scene, side === 0 ? 72 : GAME_WIDTH - 72, y, { boss: true, kind: "smoke_brute", wave: this.currentWave });
    const now = Date.now();

    boss.setData("bossPhase", 1);
    boss.setData("nextPatternAt", now + 1250);
    boss.setData("spawnInvulnerableUntil", now + 520);
    this.scene.physics.moveTo(boss, targetX, targetY, Number(boss.getData("speed") ?? 70));
    this.group.add(boss);
    this.showBossIntro(boss);
  }

  private spawnProjectile(x: number, y: number, targetX: number, targetY: number, speed = 165, boss = false): void {
    const projectile = this.scene.physics.add.sprite(x, y, boss ? "boss-bolt" : "scam-bolt");
    projectile.setData("damage", boss ? 2 : 1);
    projectile.setSize(boss ? 22 : 16, boss ? 22 : 16);
    projectile.setDepth(30);
    this.scene.physics.moveTo(projectile, targetX, targetY, speed);
    this.projectiles.add(projectile);
  }

  private spawnHazard(x: number, y: number, radius = 45, durationMs = 1800): void {
    const zone = this.scene.add.circle(x, y, radius, 0x7b42ff, 0.22)
      .setStrokeStyle(2, 0xb66cff, 0.35)
      .setDepth(6);
    zone.setData("expiresAt", Date.now() + durationMs);
    this.hazards.push(zone);

    this.scene.tweens.add({
      targets: zone,
      alpha: 0.06,
      duration: durationMs,
      onComplete: () => zone.destroy(),
    });
  }

  private updateEnemyPresentation(beast: Phaser.Physics.Arcade.Sprite): void {
    const isBoss = Boolean(beast.getData("boss"));
    beast.setDepth((isBoss ? 18 : 12) + beast.y / 1000);

    let shadow = this.shadows.get(beast);
    if (!shadow) {
      shadow = this.scene.add.ellipse(
        beast.x,
        beast.y + Number(beast.getData("displayH") ?? 52) * 0.38,
        Number(beast.getData("shadowW") ?? 40),
        Number(beast.getData("shadowH") ?? 12),
        0x000000,
        isBoss ? 0.34 : 0.25,
      ).setDepth(7);
      this.shadows.set(beast, shadow);
    }

    shadow.setPosition(beast.x, beast.y + Number(beast.getData("displayH") ?? 52) * 0.38);
    shadow.setDisplaySize(Number(beast.getData("shadowW") ?? 40), Number(beast.getData("shadowH") ?? 12));
    shadow.setAlpha(isBoss ? 0.34 : 0.25);

    if (isBoss) {
      this.updateBossHpBar(
        beast,
        Number(beast.getData("hp") ?? 1),
        Math.max(1, Number(beast.getData("maxHp") ?? 1)),
      );
    }
  }

  private updateBossHpBar(beast: Phaser.Physics.Arcade.Sprite, hp: number, maxHp: number): void {
    const displayW = Number(beast.getData("displayW") ?? beast.displayWidth);
    const displayH = Number(beast.getData("displayH") ?? beast.displayHeight);
    const barW = Phaser.Math.Clamp(displayW * 0.86, 70, 104);
    const barY = beast.y - displayH * 0.58;
    const ratio = Phaser.Math.Clamp(hp / maxHp, 0, 1);

    let bar = this.bossHpBars.get(beast);
    if (!bar) {
      const bg = this.scene.add.rectangle(beast.x, barY, barW, 6, 0x21070c, 0.92)
        .setDepth(48);
      const fill = this.scene.add.rectangle(beast.x - barW / 2, barY, barW, 4, 0xff3355, 1)
        .setOrigin(0, 0.5)
        .setDepth(49);
      const frame = this.scene.add.rectangle(beast.x, barY, barW + 3, 8, 0x000000, 0)
        .setStrokeStyle(1, 0xf5fff1, 0.36)
        .setDepth(50);
      const label = this.scene.add.text(beast.x, barY - 11, "BOSS", {
        fontFamily: "Arial",
        fontSize: "9px",
        color: "#f5fff1",
        fontStyle: "bold",
        stroke: "#050805",
        strokeThickness: 3,
      }).setOrigin(0.5).setDepth(51);
      bar = { bg, fill, frame, label };
      this.bossHpBars.set(beast, bar);
    }

    const phase = Number(beast.getData("bossPhase") ?? 1);
    const style = ((beast.getData("bossStyle") as string | undefined) ?? "thorn").toUpperCase();

    bar.bg.setPosition(beast.x, barY).setDisplaySize(barW, 6);
    bar.frame.setPosition(beast.x, barY).setDisplaySize(barW + 3, 8);
    bar.fill.setPosition(beast.x - barW / 2, barY).setDisplaySize(Math.max(3, barW * ratio), 4);
    bar.fill.setFillStyle(ratio < 0.28 ? 0xff3355 : ratio < 0.58 ? 0xffb338 : 0x39ff14, 1);
    bar.label.setPosition(beast.x, barY - 11);
    bar.label.setText(`${style} BOSS · P${phase}`);
    bar.label.setColor(phase >= 2 ? "#d9a7ff" : "#f5fff1");
  }

  private removeBossHpBar(beast: Phaser.Physics.Arcade.Sprite): void {
    const bar = this.bossHpBars.get(beast);
    if (!bar) return;
    bar.bg.destroy();
    bar.fill.destroy();
    bar.frame.destroy();
    bar.label.destroy();
    this.bossHpBars.delete(beast);
  }

  private spawnHitSpark(x: number, y: number, color: number, heavy = false): void {
    const ring = this.scene.add.circle(x, y, heavy ? 13 : 8, color, 0.08)
      .setStrokeStyle(heavy ? 3 : 2, color, heavy ? 0.82 : 0.68)
      .setDepth(44);
    const core = this.scene.add.circle(x, y, heavy ? 5 : 3, 0xf5fff1, heavy ? 0.82 : 0.7)
      .setDepth(45);

    this.scene.tweens.add({
      targets: ring,
      radius: heavy ? 34 : 22,
      alpha: 0,
      duration: heavy ? 210 : 150,
      ease: "Cubic.easeOut",
      onComplete: () => ring.destroy(),
    });

    this.scene.tweens.add({
      targets: core,
      alpha: 0,
      scaleX: heavy ? 2.3 : 1.8,
      scaleY: heavy ? 2.3 : 1.8,
      duration: heavy ? 150 : 110,
      onComplete: () => core.destroy(),
    });
  }

  private showDamageNumber(text: string, x: number, y: number, color: string, defeated = false): void {
    const label = this.scene.add.text(x, y, text, {
      fontFamily: "Arial",
      fontSize: defeated ? "18px" : "14px",
      color,
      fontStyle: "bold",
      stroke: "#050805",
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(52);

    this.scene.tweens.add({
      targets: label,
      y: y - (defeated ? 30 : 22),
      x: x + Phaser.Math.Between(-8, 8),
      alpha: 0,
      scaleX: defeated ? 1.15 : 1,
      scaleY: defeated ? 1.15 : 1,
      duration: defeated ? 620 : 460,
      ease: "Cubic.easeOut",
      onComplete: () => label.destroy(),
    });
  }

  private spawnDeathBurst(x: number, y: number, color: number, heavy = false): void {
    const count = heavy ? 12 : 7;
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count + Phaser.Math.FloatBetween(-0.16, 0.16);
      const distance = Phaser.Math.Between(heavy ? 34 : 20, heavy ? 66 : 38);
      const particle = this.scene.add.circle(x, y, heavy ? 3 : 2, i % 2 === 0 ? color : 0xf5fff1, 0.82)
        .setDepth(46);

      this.scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance * 0.7,
        alpha: 0,
        duration: heavy ? 520 : 340,
        ease: "Cubic.easeOut",
        onComplete: () => particle.destroy(),
      });
    }
  }

  private removeShadow(beast: Phaser.Physics.Arcade.Sprite): void {
    const shadow = this.shadows.get(beast);
    if (!shadow) return;
    shadow.destroy();
    this.shadows.delete(beast);
  }

  private spawnDeathPop(x: number, y: number, color: number): void {
    const pop = this.scene.add.circle(x, y, 8, color, 0.42)
      .setStrokeStyle(2, color, 0.72)
      .setDepth(25);
    this.scene.tweens.add({
      targets: pop,
      radius: 42,
      alpha: 0,
      duration: 280,
      ease: "Cubic.easeOut",
      onComplete: () => pop.destroy(),
    });
  }

  private showTelegraphLine(x1: number, y1: number, x2: number, y2: number, color: number, durationMs: number): void {
    const line = this.scene.add.line(0, 0, x1, y1, x2, y2, color, 0.72)
      .setOrigin(0, 0)
      .setLineWidth(3)
      .setDepth(9);

    this.scene.tweens.add({
      targets: line,
      alpha: 0.12,
      duration: durationMs,
      yoyo: true,
      onComplete: () => line.destroy(),
    });
  }

  private showTelegraphCircle(x: number, y: number, radius: number, color: number, durationMs: number): void {
    const circle = this.scene.add.circle(x, y, radius, color, 0.14)
      .setStrokeStyle(3, color, 0.68)
      .setDepth(8);

    this.scene.tweens.add({
      targets: circle,
      alpha: 0.04,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: durationMs,
      yoyo: true,
      onComplete: () => circle.destroy(),
    });
  }

  private showBossIntro(boss: Phaser.Physics.Arcade.Sprite): void {
    const style = ((boss.getData("bossStyle") as string | undefined) ?? "thorn").toUpperCase();
    const label = this.scene.add.text(GAME_WIDTH / 2, 92, `${style} BOSS`, {
      fontFamily: "Arial",
      fontSize: "28px",
      color: "#d9a7ff",
      fontStyle: "bold",
      stroke: "#050805",
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(120);

    const sub = this.scene.add.text(GAME_WIDTH / 2, 122, "DODGE THE PATTERN · BREAK THE LEAK", {
      fontFamily: "Arial",
      fontSize: "12px",
      color: "#f5fff1",
      fontStyle: "bold",
      stroke: "#050805",
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(120);

    this.showTelegraphCircle(boss.x, boss.y, 120, 0xb66cff, 740);
    this.scene.cameras.main.shake(120, 0.0025);

    this.scene.tweens.add({
      targets: [label, sub],
      y: "-=22",
      alpha: 0,
      delay: 850,
      duration: 520,
      ease: "Cubic.easeOut",
      onComplete: () => {
        label.destroy();
        sub.destroy();
      },
    });
  }

  private showBossClear(x: number, y: number): void {
    const label = this.scene.add.text(GAME_WIDTH / 2, 92, "BOSS BROKEN", {
      fontFamily: "Arial",
      fontSize: "28px",
      color: "#39ff14",
      fontStyle: "bold",
      stroke: "#050805",
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(120);

    this.showTelegraphCircle(x, y, 138, 0x39ff14, 640);

    this.scene.tweens.add({
      targets: label,
      y: 66,
      alpha: 0,
      delay: 650,
      duration: 520,
      ease: "Cubic.easeOut",
      onComplete: () => label.destroy(),
    });
  }

  private showEnemyWarning(text: string, x: number, y: number, color: string): void {
    const label = this.scene.add.text(x, y, text, {
      fontFamily: "Arial",
      fontSize: "11px",
      color,
      fontStyle: "bold",
      stroke: "#050805",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(50);

    this.scene.tweens.add({
      targets: label,
      y: y - 16,
      alpha: 0,
      duration: 620,
      onComplete: () => label.destroy(),
    });
  }

  private pickEnemyKind(runElapsedMs: number): EnemyKind {
    if (runElapsedMs < 13000) return "bad_habit";
    if (this.currentWave < 2) return Phaser.Math.RND.pick(["bad_habit", "fomo"] as EnemyKind[]);
    return Phaser.Math.RND.pick(ENEMY_ROTATION);
  }

  private hasActiveBoss(): boolean {
    let active = false;

    this.group.children.iterate((child) => {
      const beast = child as Phaser.Physics.Arcade.Sprite | null;
      if (beast?.active && Boolean(beast.getData("boss"))) {
        active = true;
        return false;
      }

      return true;
    });

    return active;
  }
}
