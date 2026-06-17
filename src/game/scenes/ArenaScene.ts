import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH, WORLD_HEIGHT, WORLD_WIDTH } from "../../config/game";
import { SCENE_KEYS } from "../../config/routes";
import { requestAppFullscreen, toggleAppFullscreen } from "../../app/AppShell";
import { PlayerMascot } from "../entities/PlayerMascot";
import { createCollectible } from "../entities/Collectible";
import { WaveSystem } from "../systems/WaveSystem";
import { SfxSystem } from "../systems/SfxSystem";
import { MobileControls } from "../ui/MobileControls";
import { Hud } from "../ui/Hud";
import type { AttackSpec, PickupType, PlayerUpgradeId, RunResult } from "../types/game";

type UpgradeRarity = "core" | "rare" | "survival";

interface UpgradeOption {
  id: PlayerUpgradeId;
  title: string;
  description: string;
  rarity: UpgradeRarity;
  tag: string;
}

interface EnemyDefeatEvent {
  x: number;
  y: number;
  boss: boolean;
  kind: string;
  score: number;
}

const UPGRADE_POOL: UpgradeOption[] = [
  { id: "damage", title: "Razor Combo", description: "+1 damage on every combo hit", rarity: "core", tag: "DAMAGE" },
  { id: "attack_speed", title: "Quick Hands", description: "combo attacks recover faster", rarity: "core", tag: "COMBO" },
  { id: "wide_swing", title: "Wide Swing", description: "larger attack arc and range", rarity: "core", tag: "AREA" },
  { id: "speed", title: "Clean Footwork", description: "+movement speed for kiting", rarity: "core", tag: "MOVE" },
  { id: "dash", title: "Leak Step", description: "dodge cooldown reduced", rarity: "rare", tag: "DODGE" },
  { id: "pulse", title: "Safe Pulse+", description: "pulse hits harder and wider", rarity: "rare", tag: "SKILL" },
  { id: "shield_battery", title: "Shield Battery", description: "+1 shield block and longer shield", rarity: "survival", tag: "BLOCK" },
  { id: "heart", title: "Wallet HP", description: "+max HP and heal now", rarity: "survival", tag: "HP" },
  { id: "boss_breaker", title: "Boss Breaker", description: "skills hit harder for mini-boss waves", rarity: "rare", tag: "BOSS" },
];

export class ArenaScene extends Phaser.Scene {
  private player!: PlayerMascot;
  private waves!: WaveSystem;
  private controls!: MobileControls;
  private hud!: Hud;
  private countdownText!: Phaser.GameObjects.Text;
  private arenaBackground!: Phaser.GameObjects.Image;
  private arenaShade!: Phaser.GameObjects.Rectangle;
  private pauseButton!: Phaser.GameObjects.Container;
  private fullscreenButton!: Phaser.GameObjects.Container;
  private pauseOverlay?: Phaser.GameObjects.Container;
  private currentArenaBackgroundKey = "";
  private pickups!: Phaser.Physics.Arcade.Group;
  private sfx!: SfxSystem;

  private score = 0;
  private hp = 5;
  private activeElapsedMs = 0;
  private runFinished = false;
  private fightStarted = false;
  private fightPaused = false;
  private lastShownWave = 1;
  private lastUpgradeWave = 1;
  private upgradeChoicesTaken = 0;
  private nextUpgradeDefeatedTarget = 7;
  private upgradeOverlayActive = false;
  private contactDamageReadyAt = 0;
  private hazardDamageReadyAt = 0;
  private rangedDamageReadyAt = 0;
  private pickupsCollected = 0;
  private bossesBroken = 0;

  constructor() {
    super(SCENE_KEYS.arena);
  }

  create(): void {
    this.score = 0;
    this.hp = 5;
    this.activeElapsedMs = 0;
    this.runFinished = false;
    this.fightStarted = false;
    this.fightPaused = false;
    this.lastShownWave = 1;
    this.lastUpgradeWave = 1;
    this.upgradeChoicesTaken = 0;
    this.nextUpgradeDefeatedTarget = 7;
    this.upgradeOverlayActive = false;
    this.contactDamageReadyAt = 0;
    this.hazardDamageReadyAt = 0;
    this.rangedDamageReadyAt = 0;
    this.pickupsCollected = 0;
    this.bossesBroken = 0;
    this.currentArenaBackgroundKey = "";

    this.createArenaBackground();
    this.pickups = this.physics.add.group();
    this.sfx = new SfxSystem();

    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.player = new PlayerMascot(this, WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.startFollow(this.player.sprite, true, 0.14, 0.14);
    this.waves = new WaveSystem(this);
    this.controls = new MobileControls(this);
    this.hud = new Hud(this);
    this.createPauseButton();
    this.input.once("pointerdown", () => {
      this.sfx.unlock();
      void requestAppFullscreen(document.documentElement);
    });

    this.hud.update(this.getHudState());
    if (this.shouldShowFirstRunTutorial()) {
      this.showFirstRunTutorial();
    } else {
      this.createCountdown();
      this.startCountdown();
    }

    this.physics.add.overlap(
      this.player.sprite,
      this.waves.group,
      (_, enemy) => this.onEnemyContact(enemy as Phaser.Physics.Arcade.Sprite),
    );

    this.physics.add.overlap(
      this.player.sprite,
      this.waves.projectiles,
      (_, projectile) => this.onProjectileHit(projectile as Phaser.Physics.Arcade.Sprite),
    );

    this.physics.add.overlap(
      this.player.sprite,
      this.pickups,
      (_, collectible) => this.collectPickup(collectible as Phaser.Physics.Arcade.Sprite),
    );

    this.events.on("enemy-defeated", this.handleEnemyDefeated, this);
    this.events.on("player-ranged-hit", this.handlePlayerRangedHit, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.events.off("enemy-defeated", this.handleEnemyDefeated, this);
      this.events.off("player-ranged-hit", this.handlePlayerRangedHit, this);
    });
  }

  update(_time: number, delta: number): void {
    if (this.runFinished) return;

    if (!this.fightStarted || this.fightPaused) {
      this.hud.update(this.getHudState());
      return;
    }

    const input = this.controls.getInputState();
    if (input.attack || input.slash) {
      const aimDirection = this.waves.getNearestEnemyDirection(this.player.sprite.x, this.player.sprite.y);
      if (aimDirection) this.player.setFacing(aimDirection);
    }
    this.player.update(input, delta);
    if (this.player.keepInsideArena()) {
      this.cameras.main.centerOn(this.player.sprite.x, this.player.sprite.y);
    }

    const attack = this.player.consumeAttackStarted();
    if (attack) {
      this.resolvePlayerAttack(attack);
    }

    const slash = this.player.consumeSlashStarted();
    if (slash) {
      this.resolveDashSlash(slash);
    }

    if (this.player.consumePulseStarted()) {
      this.resolveSafePulse();
    }

    if (this.player.consumeShieldStarted()) {
      this.resolveLeakShield();
    }

    this.activeElapsedMs += delta;
    this.waves.update(this.activeElapsedMs, delta, this.player.sprite.x, this.player.sprite.y, this.fightPaused);
    this.checkHazardDamage();

    if (this.waves.currentWave !== this.lastShownWave) {
      this.lastShownWave = this.waves.currentWave;
      this.updateArenaBackgroundForWave(this.lastShownWave);
      this.showWaveBanner(this.lastShownWave);

      if (this.lastShownWave >= 2 && this.lastShownWave % 2 === 0 && this.lastUpgradeWave !== this.lastShownWave) {
        this.time.delayedCall(450, () => this.showUpgradeChoice(`Wave ${this.lastShownWave} cleared`));
      }
    }

    this.score += Math.floor(delta / 120);

    const bossRewardWave = this.waves.consumeBossRewardWave();
    if (bossRewardWave > 0 && !this.upgradeOverlayActive && !this.fightPaused) {
      this.time.delayedCall(420, () => this.showUpgradeChoice(`Boss wave ${bossRewardWave} cleared`));
    } else {
      this.maybeOfferDefeatUpgrade();
    }

    this.cullExpiredPickups();
    this.hud.update(this.getHudState());
  }

  private createArenaBackground(): void {
    this.arenaBackground = this.add.image(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, "arena-bg-01")
      .setDisplaySize(WORLD_WIDTH, WORLD_HEIGHT)
      .setDepth(0);

    this.arenaShade = this.add.rectangle(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_WIDTH, WORLD_HEIGHT, 0x103010, 0.08)
      .setDepth(1);

    // Clean battlefield: no big guide circles over the arena.
    // The world is now 2 screens wide and 2 screens tall; camera follows the mascot.
    this.add.rectangle(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_WIDTH, WORLD_HEIGHT, 0x72ff57, 0.018)
      .setDepth(2);

    this.updateArenaBackgroundForWave(1);
  }

  private fixed<T extends Phaser.GameObjects.GameObject>(obj: T): T {
    const fixedObj = obj as T & { setScrollFactor?: (x: number, y?: number) => T };
    fixedObj.setScrollFactor?.(0);
    return obj;
  }

  private createPauseButton(): void {
    const fullBg = this.fixed(this.add.circle(GAME_WIDTH - 86, 34, 18, 0x050805, 0.72))
      .setStrokeStyle(2, 0xb66cff, 0.3);
    const fullIcon = this.fixed(this.add.text(GAME_WIDTH - 86, 34, "⛶", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#f5fff1",
      fontStyle: "bold",
      stroke: "#050805",
      strokeThickness: 4,
    })).setOrigin(0.5);

    this.fullscreenButton = this.fixed(this.add.container(0, 0, [fullBg, fullIcon])).setDepth(85);
    fullBg.setInteractive({ useHandCursor: true });
    fullBg.on("pointerdown", () => {
      void toggleAppFullscreen(document.documentElement);
    });

    const bg = this.fixed(this.add.circle(GAME_WIDTH - 34, 34, 20, 0x050805, 0.72))
      .setStrokeStyle(2, 0x39ff14, 0.3);
    const bars = this.fixed(this.add.text(GAME_WIDTH - 34, 34, "II", {
      fontFamily: "Arial",
      fontSize: "20px",
      color: "#f5fff1",
      fontStyle: "bold",
      stroke: "#050805",
      strokeThickness: 4,
    })).setOrigin(0.5);

    this.pauseButton = this.fixed(this.add.container(0, 0, [bg, bars])).setDepth(85);
    bg.setInteractive({ useHandCursor: true });
    bg.on("pointerdown", () => this.togglePauseState());
  }

  private togglePauseState(): void {
    if (!this.fightStarted || this.runFinished || this.upgradeOverlayActive) return;

    this.fightPaused = !this.fightPaused;

    if (this.fightPaused) {
      this.physics.pause();
      const dim = this.fixed(this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.45));
      const panel = this.fixed(this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 260, 118, 0x050805, 0.9))
        .setStrokeStyle(2, 0x39ff14, 0.35);
      const title = this.fixed(this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 18, "PAUSED", {
        fontFamily: "Arial", fontSize: "28px", color: "#39ff14", fontStyle: "bold", stroke: "#050805", strokeThickness: 5,
      })).setOrigin(0.5);
      const hint = this.fixed(this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20, "Tap pause again to continue", {
        fontFamily: "Arial", fontSize: "14px", color: "#f5fff1", stroke: "#050805", strokeThickness: 3,
      })).setOrigin(0.5);
      this.pauseOverlay = this.fixed(this.add.container(0, 0, [dim, panel, title, hint])).setDepth(149);
    } else {
      this.physics.resume();
      this.pauseOverlay?.destroy(true);
      this.pauseOverlay = undefined;
    }
  }

  private updateArenaBackgroundForWave(wave: number): void {
    const index = Phaser.Math.Clamp(Math.floor((wave - 1) / 2) + 1, 1, 10);
    const nextKey = `arena-bg-${String(index).padStart(2, "0")}`;
    if (this.currentArenaBackgroundKey === nextKey) return;
    this.currentArenaBackgroundKey = nextKey;
    this.arenaBackground.setTexture(nextKey);

    const shadeAlpha = wave % 3 === 0 ? 0.12 : 0.08;
    this.arenaShade.setFillStyle(0x103010, shadeAlpha);
  }

  private createCountdown(): void {
    this.countdownText = this.fixed(this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 18, "3", {
      fontFamily: "Arial",
      fontSize: "72px",
      color: "#39ff14",
      fontStyle: "bold",
      stroke: "#050805",
      strokeThickness: 8,
    })).setOrigin(0.5).setDepth(120);
  }

  private getHudState() {
    const cooldowns = this.player?.getCooldownState() ?? {
      attackReady: true,
      dodgeReady: true,
      pulseReady: true,
      shieldReady: true,
      slashReady: true,
      shieldActive: false,
      shieldCharges: 0,
    };

    return {
      hp: this.hp,
      maxHp: 5 + (this.player?.getMaxHpBonus() ?? 0),
      score: this.score,
      wave: this.waves?.currentWave ?? 1,
      defeated: this.waves?.defeatedCount ?? 0,
      survivedSeconds: Math.floor(this.activeElapsedMs / 1000),
      bossActive: Boolean(this.waves?.bossActive),
      comboStep: this.player?.getComboStep() ?? 0,
      upgradeCount: this.upgradeChoicesTaken,
      nextUpgradeIn: Math.max(0, this.nextUpgradeDefeatedTarget - (this.waves?.defeatedCount ?? 0)),
      ...cooldowns,
    };
  }

  private startCountdown(): void {
    const steps = ["3", "2", "1", "FIGHT"];
    steps.forEach((label, index) => {
      this.time.delayedCall(index * 700, () => {
        this.countdownText.setText(label);
        this.countdownText.setScale(label === "FIGHT" ? 0.9 : 1.15);
        this.tweens.add({
          targets: this.countdownText,
          scale: label === "FIGHT" ? 1.06 : 0.92,
          duration: 240,
          yoyo: true,
        });
      });
    });

    this.time.delayedCall(steps.length * 700, () => {
      this.fightStarted = true;
      this.activeElapsedMs = 0;
      this.waves.spawnOpeningPack(this.player.sprite.x, this.player.sprite.y);
      this.showFloatingText("OPENING WAVE", GAME_WIDTH / 2, 84, "#39ff14");
      this.tweens.add({
        targets: this.countdownText,
        alpha: 0,
        duration: 260,
        onComplete: () => this.countdownText.destroy(),
      });
    });
  }



  private shouldShowFirstRunTutorial(): boolean {
    try {
      return window.localStorage.getItem("lba-playtest-tutorial-seen") !== "yes";
    } catch {
      return true;
    }
  }

  private markTutorialSeen(): void {
    try {
      window.localStorage.setItem("lba-playtest-tutorial-seen", "yes");
    } catch {
      // Local storage can be blocked in some WebViews. The tutorial can still start normally.
    }
  }

  private showFirstRunTutorial(): void {
    this.fightStarted = false;
    this.fightPaused = true;

    const objects: Phaser.GameObjects.GameObject[] = [];
    const add = <T extends Phaser.GameObjects.GameObject>(obj: T): T => {
      this.fixed(obj);
      objects.push(obj);
      return obj;
    };

    add(this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.62).setDepth(170));
    add(this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH - 90, GAME_HEIGHT - 74, 0x061006, 0.96)
      .setStrokeStyle(2, 0x39ff14, 0.46)
      .setDepth(171));

    add(this.add.text(GAME_WIDTH / 2, 64, "SURVIVE THE LEAK", {
      fontFamily: "Arial",
      fontSize: "28px",
      color: "#39ff14",
      fontStyle: "bold",
      stroke: "#050805",
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(172));

    add(this.add.text(GAME_WIDTH / 2, 95, "First public playtest", {
      fontFamily: "Arial",
      fontSize: "13px",
      color: "#d7ffd0",
      fontStyle: "bold",
      stroke: "#050805",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(172));

    const cards = [
      { title: "MOVE", body: "Use the left joystick\nto kite enemies", color: 0x39ff14 },
      { title: "FIGHT", body: "SLASH hits forward\nPULSE clears space", color: 0xb66cff },
      { title: "SURVIVE", body: "DASH avoids danger\nSHIELD blocks hits", color: 0x7dffb5 },
      { title: "COLLECT", body: "Pick up drops\nand break the boss", color: 0xfff17d },
    ];

    cards.forEach((card, index) => {
      const x = 146 + index * 170;
      const y = 206;
      add(this.add.rectangle(x, y, 148, 126, 0x050805, 0.9)
        .setStrokeStyle(2, card.color, 0.48)
        .setDepth(172));
      add(this.add.circle(x, y - 38, 18, card.color, 0.18)
        .setStrokeStyle(2, card.color, 0.7)
        .setDepth(173));
      add(this.add.text(x, y - 4, card.title, {
        fontFamily: "Arial",
        fontSize: "16px",
        color: "#f5fff1",
        fontStyle: "bold",
        stroke: "#050805",
        strokeThickness: 4,
      }).setOrigin(0.5).setDepth(173));
      add(this.add.text(x, y + 35, card.body, {
        fontFamily: "Arial",
        fontSize: "12px",
        color: "#d7ffd0",
        align: "center",
        lineSpacing: 3,
        stroke: "#050805",
        strokeThickness: 3,
      }).setOrigin(0.5).setDepth(173));
    });

    const start = add(this.add.rectangle(GAME_WIDTH / 2, 365, 240, 48, 0x39ff14, 0.96)
      .setStrokeStyle(2, 0xf5fff1, 0.35)
      .setDepth(173)
      .setInteractive({ useHandCursor: true }));
    add(this.add.text(GAME_WIDTH / 2, 365, "START RUN", {
      fontFamily: "Arial",
      fontSize: "19px",
      color: "#050805",
      fontStyle: "bold",
    }).setOrigin(0.5).setDepth(174));

    start.on("pointerdown", () => {
      this.sfx.unlock();
      this.markTutorialSeen();
      objects.forEach((obj) => obj.destroy());
      this.fightPaused = false;
      this.createCountdown();
      this.startCountdown();
    });
  }

  private handleEnemyDefeated(event: EnemyDefeatEvent): void {
    const dropRoll = Phaser.Math.FloatBetween(0, 1);
    const maxHp = 5 + this.player.getMaxHpBonus();
    const missingHp = maxHp - this.hp;

    if (event.boss) {
      this.bossesBroken += 1;
      this.spawnPickup("safe_point", event.x - 18, event.y - 8, 110);
      this.spawnPickup("cooldown", event.x + 18, event.y - 6);
      this.spawnPickup(missingHp >= 2 ? "heart" : "speed", event.x, event.y + 10);
      if (Phaser.Math.Between(0, 1) === 1) this.spawnPickup("shield", event.x + Phaser.Math.Between(-22, 22), event.y + 14);
      return;
    }

    if (dropRoll < 0.38) {
      this.spawnPickup("safe_point", event.x, event.y, 24 + Math.floor(event.score * 0.15));
      return;
    }

    if (missingHp >= 2 && dropRoll < 0.5) {
      this.spawnPickup("heart", event.x, event.y);
      return;
    }

    if (dropRoll < 0.6) {
      this.spawnPickup("shield", event.x, event.y);
      return;
    }

    if (dropRoll < 0.69) {
      this.spawnPickup("cooldown", event.x, event.y);
      return;
    }

    if (dropRoll < 0.78) {
      this.spawnPickup("speed", event.x, event.y);
    }
  }

  private spawnPickup(type: PickupType, x: number, y: number, value = 1): void {
    createCollectible(this, this.pickups, x, y, type, value);
  }

  private collectPickup(collectible: Phaser.Physics.Arcade.Sprite): void {
    if (!collectible.active) return;
    const type = String(collectible.getData("type")) as PickupType;
    const value = Number(collectible.getData("value") ?? 1);
    const shadow = collectible.getData("shadow") as Phaser.GameObjects.GameObject | undefined;
    shadow?.destroy();

    collectible.disableBody(true, true);
    this.pickupsCollected += 1;

    this.sfx.playPickup();

    switch (type) {
      case "safe_point":
        this.score += value;
        this.showFloatingText(`SAFE +${value}`, this.player.sprite.x, this.player.sprite.y - 64, "#39ff14");
        break;
      case "heart":
        this.hp = Math.min(this.hp + 1, 5 + this.player.getMaxHpBonus());
        this.showFloatingText("+1 HP", this.player.sprite.x, this.player.sprite.y - 64, "#ff88aa");
        break;
      case "shield":
        this.player.grantShieldPickup(1, 2500);
        this.showFloatingText("SHIELD", this.player.sprite.x, this.player.sprite.y - 64, "#7dffb5");
        break;
      case "cooldown":
        this.player.reduceCooldowns(1400);
        this.showFloatingText("COOLDOWN", this.player.sprite.x, this.player.sprite.y - 64, "#d6a8ff");
        break;
      case "speed":
        this.player.applySpeedBoost(46, 3600);
        this.showFloatingText("SPEED", this.player.sprite.x, this.player.sprite.y - 64, "#fff17d");
        break;
      default:
        break;
    }

    this.showPickupBurst(this.player.sprite.x, this.player.sprite.y, type);
  }

  private showPickupBurst(x: number, y: number, type: PickupType): void {
    const color = type === "heart" ? 0xff6688 : type === "shield" ? 0x7dffb5 : type === "cooldown" ? 0xb66cff : type === "speed" ? 0xfff17d : 0x39ff14;
    const ring = this.add.circle(x, y, 8, color, 0.08).setStrokeStyle(3, color, 0.85).setDepth(40);
    this.tweens.add({
      targets: ring,
      radius: 28,
      alpha: 0,
      duration: 220,
      onComplete: () => ring.destroy(),
    });
  }

  private cullExpiredPickups(): void {
    this.pickups.children.iterate((child) => {
      const collectible = child as Phaser.Physics.Arcade.Sprite | null;
      if (!collectible || !collectible.active) return true;
      const shadow = collectible.getData("shadow") as Phaser.GameObjects.Ellipse | undefined;
      if (shadow?.active) shadow.setPosition(collectible.x, collectible.y + 12);
      if (Date.now() > Number(collectible.getData("expireAt") ?? 0)) {
        shadow?.destroy();
        collectible.disableBody(true, true);
      }
      return true;
    });
  }

  private resolvePlayerAttack(attack: AttackSpec): void {
    this.sfx.playSword(attack.comboStep >= 3);
    this.showAttackArc(attack);

    const hitResult = this.waves.hitEnemiesInArc(this.player.sprite.x, this.player.sprite.y, attack);
    if (hitResult.hits <= 0) {
      return;
    }

    const points = hitResult.score + hitResult.hits * 6 + (attack.comboStep === 3 ? 28 : 0);
    this.score += points;
    this.cameras.main.flash(42, 57, 255, 20, false);
    if (attack.comboStep === 3 || hitResult.bossHit) this.cameras.main.shake(45, 0.0014);
    this.showFloatingText(
      `HIT x${hitResult.hits} +${points}`,
      this.player.sprite.x,
      this.player.sprite.y - 64,
      hitResult.bossHit ? "#b66cff" : "#39ff14",
    );
    if (hitResult.defeated > 0) this.maybeOfferDefeatUpgrade();
  }

  private resolveDashSlash(attack: AttackSpec): void {
    this.sfx.playDashSlash();
    this.showDashSlash(attack);
    const hitResult = this.waves.hitEnemiesInArc(this.player.sprite.x, this.player.sprite.y, attack);
    const points = hitResult.score + hitResult.hits * 18 + (hitResult.bossHit ? 55 : 0);
    this.score += points;

    if (hitResult.hits > 0) {
      this.cameras.main.shake(hitResult.bossHit ? 95 : 64, hitResult.bossHit ? 0.003 : 0.0019);
      this.showFloatingText(`SLASH x${hitResult.hits} +${points}`, this.player.sprite.x, this.player.sprite.y - 70, "#39ff14");
    }
    if (hitResult.defeated > 0) this.maybeOfferDefeatUpgrade();
  }

  private resolveSafePulse(): void {
    this.sfx.playPulse();
    this.showSafePulse();
    const damage = this.player.getPulsePower();
    const hitResult = this.waves.hitEnemiesNear(this.player.sprite.x, this.player.sprite.y, this.player.getPulseRadius(), damage, 12);
    const points = hitResult.score + hitResult.hits * 12 + (hitResult.bossHit ? 40 : 0);
    this.score += points;

    if (hitResult.hits > 0) {
      this.cameras.main.shake(hitResult.bossHit ? 90 : 58, hitResult.bossHit ? 0.0028 : 0.0016);
    }
    this.showFloatingText(hitResult.hits > 0 ? `PULSE x${hitResult.hits} +${points}` : "PULSE", this.player.sprite.x, this.player.sprite.y - 70, "#39ff14");
    if (hitResult.defeated > 0) this.maybeOfferDefeatUpgrade();
  }

  private resolveLeakShield(): void {
    this.sfx.playShield();
    this.showLeakShield();
    this.showFloatingText(`SHIELD x${this.player.getShieldCapacity()}`, this.player.sprite.x, this.player.sprite.y - 70, "#39ff14");
  }

  private onEnemyContact(enemy: Phaser.Physics.Arcade.Sprite): void {
    if (this.runFinished || !this.fightStarted || this.fightPaused || !enemy.active) return;
    if (this.player.isInvincible) return;

    const now = Date.now();
    if (now < this.contactDamageReadyAt) return;
    this.contactDamageReadyAt = now + 620;

    const damage = Boolean(enemy.getData("boss")) ? 2 : Number(enemy.getData("contactDamage") ?? 1);
    this.damagePlayer(damage, damage > 1 ? "BIG HIT" : "HIT");

    const push = new Phaser.Math.Vector2(this.player.sprite.x - enemy.x, this.player.sprite.y - enemy.y);
    if (push.lengthSq() <= 0) push.set(1, 0);
    push.normalize().scale(265);
    this.player.sprite.setVelocity(push.x, push.y);
  }

  private handlePlayerRangedHit(payload: { damage: number; label?: string }): void {
    if (this.runFinished || !this.fightStarted || this.fightPaused) return;
    const now = Date.now();
    if (now < this.rangedDamageReadyAt) return;
    this.rangedDamageReadyAt = now + 260;
    this.damagePlayer(payload.damage, payload.label ?? "SHOT");
  }

  private onProjectileHit(projectile: Phaser.Physics.Arcade.Sprite): void {
    if (this.runFinished || !this.fightStarted || this.fightPaused || !projectile.active) return;
    projectile.disableBody(true, true);
    if (this.player.isInvincible) {
      this.showFloatingText("DODGED", this.player.sprite.x, this.player.sprite.y - 58, "#b66cff");
      return;
    }

    this.damagePlayer(Number(projectile.getData("damage") ?? 1), "SCAM HIT");
  }

  private checkHazardDamage(): void {
    if (this.player.isInvincible || !this.waves.isPointInActiveHazard(this.player.sprite.x, this.player.sprite.y)) return;

    const now = Date.now();
    if (now < this.hazardDamageReadyAt) return;
    this.hazardDamageReadyAt = now + 900;
    this.damagePlayer(1, "SMOKE");
  }

  private damagePlayer(amount: number, label: string): void {
    if (this.player.tryBlockDamage()) {
      this.sfx.playBlock();
      this.cameras.main.shake(70, 0.003);
      this.showBlockFlash();
      this.showFloatingText("BLOCK", this.player.sprite.x, this.player.sprite.y - 62, "#39ff14");
      return;
    }

    this.hp -= amount;
    this.sfx.playHit(amount > 1);
    this.player.flashHit();
    this.cameras.main.flash(70, 255, 51, 85, false);
    this.cameras.main.shake(105, 0.0042);
    this.showFloatingText(`-${amount} HP`, this.player.sprite.x, this.player.sprite.y - 58, "#ff3355");
    this.showFloatingText(label, this.player.sprite.x, this.player.sprite.y - 78, "#ff9aaa");

    if (this.hp <= 0) {
      this.finishRun();
    }
  }

  private showAttackArc(attack: AttackSpec): void {
    const direction = attack.direction.clone().normalize();
    const centerX = this.player.sprite.x + direction.x * (attack.range * 0.48);
    const centerY = this.player.sprite.y + direction.y * (attack.range * 0.42);
    const frame = attack.comboStep === 3 ? 2 : 1;
    const fx = this.add.image(centerX, centerY, "arena-vfx-sheet", frame)
      .setScale(attack.comboStep === 3 ? 0.24 : 0.2)
      .setRotation(direction.angle())
      .setDepth(30)
      .setAlpha(0.95);

    const streak = this.add.line(0, 0, this.player.sprite.x, this.player.sprite.y, centerX, centerY, 0x39ff14, attack.comboStep === 3 ? 0.72 : 0.46)
      .setOrigin(0, 0)
      .setLineWidth(attack.comboStep === 3 ? 5 : 3)
      .setDepth(36);

    this.tweens.add({
      targets: streak,
      alpha: 0,
      duration: 120,
      onComplete: () => streak.destroy(),
    });

    this.tweens.add({
      targets: fx,
      scaleX: fx.scaleX * 1.18,
      scaleY: fx.scaleY * 1.18,
      alpha: 0,
      duration: 170,
      onComplete: () => fx.destroy(),
    });
  }

  private showDashSlash(attack: AttackSpec): void {
    const direction = attack.direction.clone().normalize();
    const midX = this.player.sprite.x + direction.x * 86;
    const midY = this.player.sprite.y + direction.y * 86;
    const endX = this.player.sprite.x + direction.x * 170;
    const endY = this.player.sprite.y + direction.y * 170;

    const trail = this.add.image(midX, midY, "arena-vfx-sheet", 5)
      .setScale(0.26)
      .setRotation(direction.angle())
      .setDepth(37)
      .setAlpha(0.92);
    const impact = this.add.image(endX, endY, "arena-vfx-sheet", 2)
      .setScale(0.24)
      .setRotation(direction.angle())
      .setDepth(38);
    const line = this.add.line(0, 0, this.player.sprite.x, this.player.sprite.y, endX, endY, 0x39ff14, 0.74)
      .setOrigin(0, 0)
      .setLineWidth(5)
      .setDepth(39);

    this.tweens.add({
      targets: [trail, impact, line],
      alpha: 0,
      duration: 230,
      onComplete: () => {
        trail.destroy();
        impact.destroy();
      },
    });
  }

  private showSafePulse(): void {
    const logicRadius = this.player.getPulseRadius();
    const visualRadius = Math.min(76, Math.max(44, logicRadius * 0.34));
    const ring = this.add.circle(this.player.sprite.x, this.player.sprite.y, 10, 0x39ff14, 0.08)
      .setStrokeStyle(5, 0x78ff62, 0.82)
      .setDepth(35);
    const innerRing = this.add.circle(this.player.sprite.x, this.player.sprite.y, 8, 0xbfff8d, 0.04)
      .setStrokeStyle(2, 0xf5fff1, 0.36)
      .setDepth(36);
    const glow = this.add.circle(this.player.sprite.x, this.player.sprite.y, 8, 0xbfff8d, 0.22)
      .setDepth(34);

    this.tweens.add({
      targets: ring,
      radius: visualRadius,
      alpha: 0,
      duration: 220,
      ease: "Cubic.easeOut",
      onComplete: () => ring.destroy(),
    });

    this.tweens.add({
      targets: innerRing,
      radius: visualRadius * 0.72,
      alpha: 0,
      duration: 190,
      ease: "Cubic.easeOut",
      onComplete: () => innerRing.destroy(),
    });

    this.tweens.add({
      targets: glow,
      radius: visualRadius * 0.55,
      alpha: 0,
      duration: 210,
      ease: "Cubic.easeOut",
      onComplete: () => glow.destroy(),
    });
  }

  private showLeakShield(): void {
    const shield = this.add.circle(this.player.sprite.x, this.player.sprite.y, 20, 0x39ff14, 0.04)
      .setStrokeStyle(3, 0x39ff14, 0.42)
      .setDepth(34);

    this.tweens.add({
      targets: shield,
      radius: 26,
      alpha: 0.12,
      duration: 2850,
      onUpdate: () => {
        if (!this.player?.sprite.active) return;
        shield.setPosition(this.player.sprite.x, this.player.sprite.y);
      },
      onComplete: () => shield.destroy(),
    });
  }

  private showBlockFlash(): void {
    const block = this.add.image(this.player.sprite.x, this.player.sprite.y, "arena-vfx-sheet", 8)
      .setScale(0.18)
      .setDepth(36)
      .setAlpha(0.9);
    const guard = this.add.circle(this.player.sprite.x, this.player.sprite.y, 22, 0x39ff14, 0.03)
      .setStrokeStyle(4, 0x39ff14, 0.65)
      .setDepth(37);

    this.tweens.add({
      targets: [block, guard],
      scaleX: 1.35,
      scaleY: 1.35,
      alpha: 0,
      duration: 220,
      onComplete: () => {
        block.destroy();
        guard.destroy();
      },
    });
  }

  private showWaveBanner(wave: number): void {
    const isBossWave = wave % 3 === 0;
    const text = this.fixed(this.add.text(GAME_WIDTH / 2, 86, isBossWave ? `WAVE ${wave}: BOSS` : `WAVE ${wave}`, {
      fontFamily: "Arial",
      fontSize: isBossWave ? "20px" : "20px",
      color: isBossWave ? "#b66cff" : "#39ff14",
      fontStyle: "bold",
      stroke: "#050805",
      strokeThickness: 5,
    })).setOrigin(0.5).setDepth(100);

    this.tweens.add({
      targets: text,
      y: 64,
      alpha: 0,
      duration: 1150,
      ease: "Cubic.easeOut",
      onComplete: () => text.destroy(),
    });
  }

  private maybeOfferDefeatUpgrade(): void {
    if (this.runFinished || this.fightPaused || this.upgradeOverlayActive) return;
    if ((this.waves?.defeatedCount ?? 0) < this.nextUpgradeDefeatedTarget) return;
    this.showUpgradeChoice(`${this.nextUpgradeDefeatedTarget} leaks defeated`);
  }

  private showUpgradeChoice(reason: string): void {
    if (this.runFinished || this.fightPaused || this.upgradeOverlayActive) return;
    if (this.waves?.currentWave) this.lastUpgradeWave = this.waves.currentWave;
    this.upgradeOverlayActive = true;
    this.fightPaused = true;
    this.physics.pause();

    const overlayObjects: Phaser.GameObjects.GameObject[] = [];
    const add = <T extends Phaser.GameObjects.GameObject>(obj: T): T => {
      this.fixed(obj);
      overlayObjects.push(obj);
      return obj;
    };

    add(this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.66).setDepth(150));
    add(this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH - 74, GAME_HEIGHT - 70, 0x061006, 0.98)
      .setStrokeStyle(2, 0x39ff14, 0.52)
      .setDepth(151));
    add(this.add.rectangle(GAME_WIDTH / 2, 84, GAME_WIDTH - 132, 58, 0x0b190b, 0.82)
      .setStrokeStyle(1, 0xb66cff, 0.25)
      .setDepth(151));

    add(this.add.text(GAME_WIDTH / 2, 66, "CHOOSE UPGRADE", {
      fontFamily: "Arial",
      fontSize: "28px",
      color: "#39ff14",
      fontStyle: "bold",
      stroke: "#050805",
      strokeThickness: 5,
    }).setOrigin(0.5).setDepth(152));

    add(this.add.text(GAME_WIDTH / 2, 100, reason.toUpperCase(), {
      fontFamily: "Arial",
      fontSize: "12px",
      color: "#d7ffd0",
      fontStyle: "bold",
      stroke: "#050805",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(152));

    const options = this.pickUpgradeOptions();
    const cardWidth = 206;
    const cardHeight = 198;
    const startX = GAME_WIDTH / 2 - cardWidth - 20;
    const cardY = 250;

    options.forEach((option, index) => {
      const x = startX + index * (cardWidth + 20);
      const stroke = this.getUpgradeStroke(option.rarity);
      const fill = this.getUpgradeFill(option.rarity);
      const labelColor = this.getUpgradeTextColor(option.rarity);

      const glow = add(this.add.circle(x, cardY - 48, 68, stroke, 0.08).setDepth(151));
      const card = add(this.add.rectangle(x, cardY, cardWidth, cardHeight, fill, 0.98)
        .setStrokeStyle(2, stroke, 0.72)
        .setDepth(152)
        .setInteractive({ useHandCursor: true }));

      add(this.add.text(x - cardWidth / 2 + 16, cardY - 84, option.rarity.toUpperCase(), {
        fontFamily: "Arial",
        fontSize: "10px",
        color: labelColor,
        fontStyle: "bold",
        stroke: "#050805",
        strokeThickness: 3,
      }).setDepth(153));

      add(this.add.circle(x, cardY - 46, 32, stroke, 0.16)
        .setStrokeStyle(2, stroke, 0.58)
        .setDepth(153));
      add(this.add.text(x, cardY - 47, this.getUpgradeIcon(option.id), {
        fontFamily: "Arial",
        fontSize: "20px",
        color: "#f5fff1",
        fontStyle: "bold",
        stroke: "#050805",
        strokeThickness: 4,
      }).setOrigin(0.5).setDepth(154));

      add(this.add.text(x, cardY - 6, option.title.toUpperCase(), {
        fontFamily: "Arial",
        fontSize: "15px",
        color: "#f5fff1",
        fontStyle: "bold",
        stroke: "#050805",
        strokeThickness: 4,
        align: "center",
        wordWrap: { width: cardWidth - 28 },
      }).setOrigin(0.5).setDepth(154));

      add(this.add.text(x, cardY + 31, option.description, {
        fontFamily: "Arial",
        fontSize: "11px",
        color: "#d7ffd0",
        align: "center",
        wordWrap: { width: cardWidth - 26 },
        lineSpacing: 2,
      }).setOrigin(0.5, 0).setDepth(154));

      const pickBg = add(this.add.rectangle(x, cardY + 80, cardWidth - 54, 30, stroke, 0.95)
        .setDepth(154)
        .setInteractive({ useHandCursor: true }));
      add(this.add.text(x, cardY + 80, "PICK", {
        fontFamily: "Arial",
        fontSize: "14px",
        color: "#050805",
        fontStyle: "bold",
      }).setOrigin(0.5).setDepth(155));

      const choose = () => {
        const message = this.player.applyUpgrade(option.id);
        this.upgradeChoicesTaken += 1;
        this.nextUpgradeDefeatedTarget += 7 + Math.min(5, this.upgradeChoicesTaken * 2);

        if (option.id === "heart") {
          this.hp = Math.min(this.hp + 2, 5 + this.player.getMaxHpBonus());
        }

        overlayObjects.forEach((obj) => obj.destroy());
        this.physics.resume();
        this.upgradeOverlayActive = false;
        this.fightPaused = false;
        this.showUpgradeToast(option.title, message);
        this.hud.update(this.getHudState());
      };

      card.on("pointerdown", choose);
      pickBg.on("pointerdown", choose);
      card.on("pointerover", () => {
        this.tweens.add({ targets: [card, glow], scaleX: 1.035, scaleY: 1.035, duration: 90 });
      });
      card.on("pointerout", () => {
        this.tweens.add({ targets: [card, glow], scaleX: 1, scaleY: 1, duration: 90 });
      });
    });
  }

  private getUpgradeStroke(rarity: UpgradeRarity): number {
    if (rarity === "rare") return 0xb66cff;
    if (rarity === "survival") return 0xff6688;
    return 0x39ff14;
  }

  private getUpgradeFill(rarity: UpgradeRarity): number {
    if (rarity === "rare") return 0x160926;
    if (rarity === "survival") return 0x21090f;
    return 0x0d210d;
  }

  private getUpgradeTextColor(rarity: UpgradeRarity): string {
    if (rarity === "rare") return "#d6a8ff";
    if (rarity === "survival") return "#ff9aaa";
    return "#9cff8a";
  }

  private getUpgradeIcon(id: PlayerUpgradeId): string {
    switch (id) {
      case "damage": return "DMG";
      case "speed": return "SPD";
      case "dash": return "DASH";
      case "pulse": return "AOE";
      case "heart": return "HP";
      case "attack_speed": return "ATK";
      case "wide_swing": return "ARC";
      case "shield_battery": return "DEF";
      case "boss_breaker": return "BOSS";
      default: return "UP";
    }
  }

  private pickUpgradeOptions(): UpgradeOption[] {
    const pool = [...UPGRADE_POOL];
    const rareCount = this.upgradeChoicesTaken >= 1 ? 1 : 0;
    const rareOptions = Phaser.Utils.Array.Shuffle(pool.filter((option) => option.rarity === "rare")).slice(0, rareCount);
    const remaining = Phaser.Utils.Array.Shuffle(pool.filter((option) => !rareOptions.includes(option)));
    return Phaser.Utils.Array.Shuffle([...rareOptions, ...remaining]).slice(0, 3);
  }

  private showUpgradeToast(title: string, message: string): void {
    const panel = this.fixed(this.add.rectangle(GAME_WIDTH / 2, 86, 426, 60, 0x071107, 0.95))
      .setStrokeStyle(2, 0x39ff14, 0.5)
      .setDepth(155);
    const icon = this.fixed(this.add.circle(GAME_WIDTH / 2 - 178, 86, 19, 0x39ff14, 0.14))
      .setStrokeStyle(2, 0x39ff14, 0.6)
      .setDepth(156);
    const iconText = this.fixed(this.add.text(GAME_WIDTH / 2 - 178, 86, "UP", {
      fontFamily: "Arial",
      fontSize: "10px",
      color: "#39ff14",
      fontStyle: "bold",
      stroke: "#050805",
      strokeThickness: 3,
    })).setOrigin(0.5).setDepth(157);
    const titleText = this.fixed(this.add.text(GAME_WIDTH / 2 - 144, 76, title.toUpperCase(), {
      fontFamily: "Arial",
      fontSize: "14px",
      color: "#39ff14",
      fontStyle: "bold",
      stroke: "#050805",
      strokeThickness: 3,
    })).setOrigin(0, 0.5).setDepth(156);
    const bodyText = this.fixed(this.add.text(GAME_WIDTH / 2 - 144, 98, message, {
      fontFamily: "Arial",
      fontSize: "11px",
      color: "#f5fff1",
      align: "left",
      wordWrap: { width: 320 },
    })).setOrigin(0, 0.5).setDepth(156);

    this.tweens.add({
      targets: [panel, icon, iconText, titleText, bodyText],
      y: "-=18",
      alpha: 0,
      delay: 1150,
      duration: 520,
      onComplete: () => {
        panel.destroy();
        icon.destroy();
        iconText.destroy();
        titleText.destroy();
        bodyText.destroy();
      },
    });
  }

  private showFloatingText(text: string, x: number, y: number, color: string): void {
    const label = this.add.text(x, y, text, {
      fontFamily: "Arial",
      fontSize: "14px",
      color,
      fontStyle: "bold",
      stroke: "#050805",
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(160);

    this.tweens.add({
      targets: label,
      y: y - 28,
      alpha: 0,
      duration: 760,
      onComplete: () => label.destroy(),
    });
  }

  private finishRun(): void {
    if (this.runFinished) return;
    this.runFinished = true;
    this.sfx.playGameOver();
    this.pauseOverlay?.destroy(true);
    this.waves.clearAll();
    this.physics.pause();

    const result: RunResult = {
      score: this.score,
      leaksDefeated: this.waves.defeatedCount,
      survivedSeconds: Math.floor(this.activeElapsedMs / 1000),
      bossDamage: Math.floor(this.score * 0.14),
      safePoints: Math.floor(this.score * 0.08),
      upgradesChosen: this.upgradeChoicesTaken,
      pickupsCollected: this.pickupsCollected,
      bossesBroken: this.bossesBroken,
    };

    this.scene.start(SCENE_KEYS.result, result);
  }
}
