import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../../config/game";
import { createLeakBeast } from "../entities/LeakBeast";
import type { AttackSpec, EnemyKind } from "../types/game";

interface HitResult {
  hits: number;
  defeated: number;
  bossHit: boolean;
  score: number;
}

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

  defeatEnemy(enemy: Phaser.Physics.Arcade.Sprite): boolean {
    if (!enemy.active || !enemy.body) return false;

    const wasBoss = Boolean(enemy.getData("boss"));
    const score = Number(enemy.getData("score") ?? 0);

    this.spawnDeathPop(enemy.x, enemy.y, wasBoss ? 0xb66cff : 0x39ff14);
    enemy.disableBody(true, true);
    this.defeatedCount += 1;

    if (wasBoss) this.bossActive = false;
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
    this.group.clear(true, true);
    this.projectiles.clear(true, true);
    this.hazards.forEach((zone) => zone.destroy());
    this.hazards = [];
  }

  private damageEnemy(
    enemy: Phaser.Physics.Arcade.Sprite,
    damage: number,
    direction: Phaser.Math.Vector2,
    knockback: number,
  ): { defeated: boolean; bossHit: boolean; score: number } {
    const isBoss = Boolean(enemy.getData("boss"));
    const hp = Number(enemy.getData("hp") ?? 1) - damage;
    enemy.setData("hp", hp);
    enemy.setData("hitStunUntil", Date.now() + 170);
    enemy.setVelocity(direction.x * knockback, direction.y * knockback);
    enemy.setTint(isBoss ? 0xffffff : 0x9cff8a);

    this.scene.time.delayedCall(85, () => {
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

      if (Number(beast.getData("hitStunUntil") ?? 0) > now) return true;

      const kind = beast.getData("kind") as EnemyKind;
      const speed = Number(beast.getData("speed") ?? 90);

      if (kind === "fomo" && !Boolean(beast.getData("boss"))) {
        this.updateFomoCharge(beast, targetX, targetY, now, speed);
        return true;
      }

      if (kind === "scam") {
        this.updateScamShooter(beast, targetX, targetY, now, speed);
      }

      if (kind === "smoke_brute") {
        this.updateSmokeBrute(beast, now);
      }

      if (Boolean(beast.getData("boss"))) {
        this.updateBossPattern(beast, targetX, targetY, now, speed);
        return true;
      }

      this.scene.physics.moveTo(beast, targetX, targetY, speed);
      return true;
    });
  }

  private updateFomoCharge(beast: Phaser.Physics.Arcade.Sprite, targetX: number, targetY: number, now: number, speed: number): void {
    const chargeUntil = Number(beast.getData("chargeUntil") ?? 0);

    if (chargeUntil > now) {
      this.scene.physics.moveTo(beast, targetX, targetY, speed * 2.05);
      return;
    }

    const nextChargeAt = Number(beast.getData("nextChargeAt") ?? 0);
    if (nextChargeAt <= now) {
      beast.setData("chargeUntil", now + 520);
      beast.setData("nextChargeAt", now + 2450);
      beast.setTint(0xffffff);
      this.scene.time.delayedCall(130, () => {
        if (beast.active) beast.clearTint();
      });
    }

    this.scene.physics.moveTo(beast, targetX, targetY, speed * 0.78);
  }

  private updateScamShooter(beast: Phaser.Physics.Arcade.Sprite, targetX: number, targetY: number, now: number, speed: number): void {
    const nextShotAt = Number(beast.getData("nextShotAt") ?? 0);
    const distance = Phaser.Math.Distance.Between(beast.x, beast.y, targetX, targetY);

    if (distance > 155) {
      this.scene.physics.moveTo(beast, targetX, targetY, speed * 0.7);
    } else {
      beast.setVelocity(0, 0);
    }

    if (nextShotAt <= now) {
      beast.setData("nextShotAt", now + Phaser.Math.Between(1600, 2300));
      this.spawnProjectile(beast.x, beast.y, targetX, targetY);
    }
  }

  private updateSmokeBrute(beast: Phaser.Physics.Arcade.Sprite, now: number): void {
    const nextSmokeAt = Number(beast.getData("nextSmokeAt") ?? 0);
    if (nextSmokeAt <= now) {
      beast.setData("nextSmokeAt", now + Phaser.Math.Between(2100, 3000));
      this.spawnHazard(beast.x, beast.y);
    }
  }

  private updateBossPattern(beast: Phaser.Physics.Arcade.Sprite, targetX: number, targetY: number, now: number, speed: number): void {
    const nextPatternAt = Number(beast.getData("nextPatternAt") ?? 0);
    if (nextPatternAt <= now) {
      beast.setData("nextPatternAt", now + 2300);
      const pattern = Phaser.Math.Between(0, 2);
      if (pattern === 0) {
        beast.setData("hitStunUntil", now + 620);
        this.scene.physics.moveTo(beast, targetX, targetY, speed * 3.2);
        this.spawnHazard(targetX, targetY, 54, 1200);
      } else if (pattern === 1) {
        this.spawnProjectile(beast.x, beast.y, targetX, targetY, 185, true);
        this.spawnProjectile(beast.x, beast.y, targetX + 90, targetY, 160, true);
        this.spawnProjectile(beast.x, beast.y, targetX - 90, targetY, 160, true);
      } else {
        this.spawn(targetX, targetY, 99999, "bad_habit");
        this.spawn(targetX, targetY, 99999, "fomo");
      }
      return;
    }

    this.scene.physics.moveTo(beast, targetX, targetY, speed * 0.72);
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
    const earlySafetyMs = runElapsedMs < 20000 ? 480 : 0;
    const bossSafetyMs = this.bossActive ? 340 : 0;
    return Math.max(580, 1450 - this.currentWave * 78 + earlySafetyMs + bossSafetyMs);
  }

  private shouldSpawnMiniBoss(): boolean {
    return this.currentWave >= 3 && this.currentWave % 3 === 0 && this.lastBossWave !== this.currentWave && !this.bossActive;
  }

  private spawn(targetX: number, targetY: number, runElapsedMs: number, forcedKind?: EnemyKind): void {
    const side = Phaser.Math.Between(0, 3);
    const margin = 32;

    const positions = [
      { x: Phaser.Math.Between(0, GAME_WIDTH), y: -margin },
      { x: GAME_WIDTH + margin, y: Phaser.Math.Between(100, GAME_HEIGHT - 152) },
      { x: Phaser.Math.Between(0, GAME_WIDTH), y: GAME_HEIGHT + margin },
      { x: -margin, y: Phaser.Math.Between(100, GAME_HEIGHT - 152) },
    ];

    const position = positions[side];
    const kind = forcedKind ?? this.pickEnemyKind(runElapsedMs);
    const beast = createLeakBeast(this.scene, position.x, position.y, { kind, wave: this.currentWave });
    this.scene.physics.moveTo(beast, targetX, targetY, Number(beast.getData("speed") ?? 90));
    this.group.add(beast);
  }

  private spawnBoss(targetX: number, targetY: number): void {
    const side = Phaser.Math.Between(0, 1);
    const x = side === 0 ? -62 : GAME_WIDTH + 62;
    const y = Phaser.Math.Between(150, GAME_HEIGHT - 200);
    const boss = createLeakBeast(this.scene, x, y, { boss: true, kind: "smoke_brute", wave: this.currentWave });
    boss.setData("nextPatternAt", Date.now() + 900);
    this.scene.physics.moveTo(boss, targetX, targetY, Number(boss.getData("speed") ?? 70));
    this.group.add(boss);
  }

  private spawnProjectile(x: number, y: number, targetX: number, targetY: number, speed = 165, boss = false): void {
    const projectile = this.scene.physics.add.sprite(x, y, boss ? "boss-bolt" : "scam-bolt");
    projectile.setData("damage", boss ? 2 : 1);
    projectile.setSize(boss ? 22 : 16, boss ? 22 : 16);
    projectile.setDepth(16);
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

  private spawnDeathPop(x: number, y: number, color: number): void {
    const pop = this.scene.add.circle(x, y, 8, color, 0.72).setDepth(25);
    this.scene.tweens.add({
      targets: pop,
      radius: 38,
      alpha: 0,
      duration: 220,
      onComplete: () => pop.destroy(),
    });
  }

  private pickEnemyKind(runElapsedMs: number): EnemyKind {
    if (runElapsedMs < 14000) return "bad_habit";
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
