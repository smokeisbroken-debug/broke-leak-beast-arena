import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../../config/game";
import { createLeakBeast } from "../entities/LeakBeast";
import type { EnemyKind } from "../types/game";

interface HitResult {
  hits: number;
  defeated: number;
  bossHit: boolean;
}

const ENEMY_ROTATION: EnemyKind[] = ["bad_habit", "bad_habit", "fomo", "scam", "smoke_brute"];

export class WaveSystem {
  public readonly group: Phaser.Physics.Arcade.Group;
  public currentWave = 1;
  public defeatedCount = 0;
  public bossActive = false;

  private spawnTimer = 0;
  private lastBossWave = 0;

  constructor(private scene: Phaser.Scene) {
    this.group = scene.physics.add.group();
  }

  update(runElapsedMs: number, delta: number, targetX: number, targetY: number): void {
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

    this.group.children.iterate((child) => {
      const beast = child as Phaser.Physics.Arcade.Sprite | null;
      if (!beast || !beast.active || !beast.body) return true;

      const speed = Number(beast.getData("speed") ?? 90);
      this.scene.physics.moveTo(beast, targetX, targetY, speed);
      return true;
    });
  }

  defeatEnemy(enemy: Phaser.Physics.Arcade.Sprite): boolean {
    if (!enemy.active || !enemy.body) return false;

    const wasBoss = Boolean(enemy.getData("boss"));
    enemy.disableBody(true, true);
    this.defeatedCount += 1;

    if (wasBoss) this.bossActive = false;
    return true;
  }

  hitEnemiesNear(x: number, y: number, radius: number, maxTargets = 3): HitResult {
    const result: HitResult = { hits: 0, defeated: 0, bossHit: false };

    this.group.children.iterate((child) => {
      if (result.hits >= maxTargets) return false;

      const beast = child as Phaser.Physics.Arcade.Sprite | null;
      if (!beast || !beast.active || !beast.body) return true;

      const distance = Phaser.Math.Distance.Between(x, y, beast.x, beast.y);
      if (distance > radius) return true;

      result.hits += 1;
      const isBoss = Boolean(beast.getData("boss"));
      if (isBoss) result.bossHit = true;

      const damage = isBoss ? 2 : 1;
      const hp = Number(beast.getData("hp") ?? 1) - damage;
      beast.setData("hp", hp);
      beast.setTint(isBoss ? 0xffffff : 0x9cff8a);

      this.scene.time.delayedCall(80, () => {
        if (beast.active) beast.clearTint();
      });

      if (hp <= 0 && this.defeatEnemy(beast)) {
        result.defeated += 1;
      }

      return true;
    });

    return result;
  }

  private getSpawnInterval(runElapsedMs: number): number {
    const earlySafetyMs = runElapsedMs < 20000 ? 420 : 0;
    const bossSafetyMs = this.bossActive ? 280 : 0;
    return Math.max(620, 1420 - this.currentWave * 85 + earlySafetyMs + bossSafetyMs);
  }

  private shouldSpawnMiniBoss(): boolean {
    return this.currentWave >= 3 && this.currentWave % 3 === 0 && this.lastBossWave !== this.currentWave && !this.bossActive;
  }

  private spawn(targetX: number, targetY: number, runElapsedMs: number): void {
    const side = Phaser.Math.Between(0, 3);
    const margin = 32;

    const positions = [
      { x: Phaser.Math.Between(0, GAME_WIDTH), y: -margin },
      { x: GAME_WIDTH + margin, y: Phaser.Math.Between(92, GAME_HEIGHT - 142) },
      { x: Phaser.Math.Between(0, GAME_WIDTH), y: GAME_HEIGHT + margin },
      { x: -margin, y: Phaser.Math.Between(92, GAME_HEIGHT - 142) },
    ];

    const position = positions[side];
    const kind = this.pickEnemyKind(runElapsedMs);
    const beast = createLeakBeast(this.scene, position.x, position.y, { kind, wave: this.currentWave });
    this.scene.physics.moveTo(beast, targetX, targetY, Number(beast.getData("speed") ?? 90));
    this.group.add(beast);
  }

  private spawnBoss(targetX: number, targetY: number): void {
    const side = Phaser.Math.Between(0, 1);
    const x = side === 0 ? -58 : GAME_WIDTH + 58;
    const y = Phaser.Math.Between(140, GAME_HEIGHT - 190);
    const boss = createLeakBeast(this.scene, x, y, { boss: true, kind: "smoke_brute", wave: this.currentWave });
    this.scene.physics.moveTo(boss, targetX, targetY, Number(boss.getData("speed") ?? 70));
    this.group.add(boss);
  }

  private pickEnemyKind(runElapsedMs: number): EnemyKind {
    if (runElapsedMs < 15000) return "bad_habit";
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
