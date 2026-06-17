import Phaser from "phaser";
import { SCENE_KEYS } from "../../config/routes";
import { COLORS } from "../../config/theme";

const ARENA_BACKGROUND_KEYS = Array.from({ length: 10 }, (_, index) => `arena-bg-${String(index + 1).padStart(2, "0")}`);


const ENEMY_TEXTURE_SETS = {
  "enemy-imp": Array.from({ length: 10 }, (_, index) => `assets/enemies/enemy-imp-${String(index + 1).padStart(2, "0")}.png`),
  "enemy-runner": Array.from({ length: 10 }, (_, index) => `assets/enemies/enemy-runner-${String(index + 1).padStart(2, "0")}.png`),
  "enemy-brute": Array.from({ length: 10 }, (_, index) => `assets/enemies/enemy-brute-${String(index + 1).padStart(2, "0")}.png`),
  "enemy-beast": Array.from({ length: 10 }, (_, index) => `assets/enemies/enemy-beast-${String(index + 1).padStart(2, "0")}.png`),
  "boss-thorn": Array.from({ length: 10 }, (_, index) => `assets/enemies/boss-thorn-${String(index + 1).padStart(2, "0")}.png`),
  "boss-smoke": Array.from({ length: 10 }, (_, index) => `assets/enemies/boss-smoke-${String(index + 1).padStart(2, "0")}.png`),
} as const;

const MASCOT_TEXTURES = [
  ["mascot-idle-front", "assets/mascot/frog-idle-front.png"],
  ["mascot-idle-back", "assets/mascot/frog-idle-back.png"],
  ["mascot-run-01", "assets/mascot/frog-run-01.png"],
  ["mascot-run-back", "assets/mascot/frog-run-back.png"],
  ["mascot-run-02", "assets/mascot/frog-run-02.png"],
  ["mascot-run-03", "assets/mascot/frog-run-03.png"],
  ["mascot-slash-01", "assets/mascot/frog-slash-01.png"],
  ["mascot-dash-01", "assets/mascot/frog-dash-01.png"],
  ["mascot-slash-02", "assets/mascot/frog-slash-02.png"],
  ["mascot-cast-pulse-01", "assets/mascot/frog-cast-pulse-01.png"],
  ["mascot-run-04", "assets/mascot/frog-run-04.png"],
  ["mascot-back-step-01", "assets/mascot/frog-back-step-01.png"],
  ["mascot-run-05", "assets/mascot/frog-run-05.png"],
  ["mascot-run-06", "assets/mascot/frog-run-06.png"],
  ["mascot-cast-pulse-02", "assets/mascot/frog-cast-pulse-02.png"],
  ["mascot-slash-03", "assets/mascot/frog-slash-03.png"],
  ["mascot-hurt-01", "assets/mascot/frog-hurt-01.png"],
  ["mascot-cast-pulse-back", "assets/mascot/frog-cast-pulse-back.png"],
  ["mascot-cast-pulse-03", "assets/mascot/frog-cast-pulse-03.png"],
  ["mascot-dash-02", "assets/mascot/frog-dash-02.png"],
] as const;

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.preload);
  }

  preload(): void {
    this.loadVisualAssets();
    this.createGeneratedPlaceholderTextures();
  }

  create(): void {
    this.createMascotAnimations();
    this.createEnemyAnimations();
    this.scene.start(SCENE_KEYS.menu);
  }

  private loadVisualAssets(): void {
    ARENA_BACKGROUND_KEYS.forEach((key, index) => {
      this.load.image(key, `assets/backgrounds/arena-level-${String(index + 1).padStart(2, "0")}.png`);
    });

    this.load.image("menu-start-screen", "assets/backgrounds/menu-start-screen.png");
    this.load.image("result-screen", "assets/backgrounds/result-screen.png");

    this.load.image("start-page-full", "assets/ui/start-page-full.png");
    this.load.image("start-logo", "assets/ui/start-logo.png");
    this.load.image("start-hero-frog", "assets/ui/start-hero-frog.png");
    this.load.image("start-play-button", "assets/ui/start-play-button.png");
    this.load.image("start-how-to-play-button", "assets/ui/start-how-to-play-button.png");
    this.load.image("start-rewards-button", "assets/ui/start-rewards-button.png");
    this.load.image("start-tagline", "assets/ui/start-tagline.png");
    this.load.image("start-feature-strip", "assets/ui/start-feature-strip.png");

    this.load.image("combat-hud-panel", "assets/ui/combat-hud-panel.png?v=038");
    this.load.image("combat-joystick-base", "assets/ui/combat-joystick-base.png?v=038");
    this.load.image("combat-button-slash", "assets/ui/combat-button-slash.png?v=038");
    this.load.image("combat-button-dash", "assets/ui/combat-button-dash.png?v=038");
    this.load.image("combat-button-pulse", "assets/ui/combat-button-pulse.png?v=038");
    this.load.image("combat-button-shield", "assets/ui/combat-button-shield.png?v=038");
    this.load.image("combat-button-auto", "assets/ui/combat-button-auto.png?v=038");
    this.load.image("combat-control-strip", "assets/ui/combat-control-strip.png?v=038");
    Object.entries(ENEMY_TEXTURE_SETS).forEach(([prefix, paths]) => {
      paths.forEach((path, index) => {
        this.load.image(`${prefix}-${String(index + 1).padStart(2, "0")}`, path);
      });
    });

    this.load.spritesheet("arena-vfx-sheet", "assets/vfx/arena-vfx-sheet.png", {
      frameWidth: 418,
      frameHeight: 418,
    });

    MASCOT_TEXTURES.forEach(([key, path]) => {
      this.load.image(key, path);
    });
  }

  private createMascotAnimations(): void {
    if (!this.anims.exists("mascot-idle-front-anim")) {
      this.anims.create({
        key: "mascot-idle-front-anim",
        frames: [{ key: "mascot-idle-front" }, { key: "mascot-run-04" }],
        frameRate: 3,
        repeat: -1,
      });
    }

    if (!this.anims.exists("mascot-idle-back-anim")) {
      this.anims.create({
        key: "mascot-idle-back-anim",
        frames: [{ key: "mascot-idle-back" }, { key: "mascot-back-step-01" }],
        frameRate: 3,
        repeat: -1,
      });
    }

    if (!this.anims.exists("mascot-run-front-anim")) {
      this.anims.create({
        key: "mascot-run-front-anim",
        frames: [
          { key: "mascot-run-01" },
          { key: "mascot-run-02" },
          { key: "mascot-run-03" },
          { key: "mascot-run-05" },
        ],
        frameRate: 11,
        repeat: -1,
      });
    }

    if (!this.anims.exists("mascot-run-back-anim")) {
      this.anims.create({
        key: "mascot-run-back-anim",
        frames: [{ key: "mascot-run-back" }, { key: "mascot-back-step-01" }],
        frameRate: 7,
        repeat: -1,
      });
    }

    if (!this.anims.exists("mascot-attack-anim")) {
      this.anims.create({
        key: "mascot-attack-anim",
        frames: [{ key: "mascot-slash-01" }, { key: "mascot-slash-02" }, { key: "mascot-slash-03" }],
        frameRate: 14,
        repeat: 0,
      });
    }

    if (!this.anims.exists("mascot-dash-anim")) {
      this.anims.create({
        key: "mascot-dash-anim",
        frames: [{ key: "mascot-dash-01" }, { key: "mascot-dash-02" }],
        frameRate: 18,
        repeat: -1,
      });
    }

    if (!this.anims.exists("mascot-pulse-front-anim")) {
      this.anims.create({
        key: "mascot-pulse-front-anim",
        frames: [{ key: "mascot-cast-pulse-01" }, { key: "mascot-cast-pulse-02" }, { key: "mascot-cast-pulse-03" }],
        frameRate: 10,
        repeat: 0,
      });
    }

    if (!this.anims.exists("mascot-pulse-back-anim")) {
      this.anims.create({
        key: "mascot-pulse-back-anim",
        frames: [{ key: "mascot-cast-pulse-back" }, { key: "mascot-cast-pulse-back" }],
        frameRate: 8,
        repeat: 0,
      });
    }

    if (!this.anims.exists("mascot-hurt-anim")) {
      this.anims.create({
        key: "mascot-hurt-anim",
        frames: [{ key: "mascot-hurt-01" }],
        frameRate: 1,
        repeat: 0,
      });
    }
  }

  private createEnemyAnimations(): void {
    const create = (key: string, prefix: string, frameRate: number) => {
      if (this.anims.exists(key)) return;
      this.anims.create({
        key,
        frames: Array.from({ length: 10 }, (_, index) => ({
          key: `${prefix}-${String(index + 1).padStart(2, "0")}`,
        })),
        frameRate,
        repeat: -1,
      });
    };

    create("enemy-bad-habit-move", "enemy-imp", 8);
    create("enemy-fomo-move", "enemy-runner", 12);
    create("enemy-scam-move", "enemy-beast", 9);
    create("enemy-smoke-brute-move", "enemy-brute", 6);
    create("boss-thorn-move", "boss-thorn", 6);
    create("boss-smoke-move", "boss-smoke", 6);
  }

  private createGeneratedPlaceholderTextures(): void {
    this.createBeastTexture("beast-bad-habit", COLORS.purple, 0xff3355);
    this.createBeastTexture("beast-fomo", 0x42ff2f, 0x050805);
    this.createBeastTexture("beast-scam", 0xff3b30, 0xffffff);
    this.createBeastTexture("beast-smoke-brute", 0x666666, 0x39ff14);
    this.createMiniBoss();
    this.createProjectile("scam-bolt", 0xff3355);
    this.createProjectile("boss-bolt", 0xb66cff);
    this.createSpark();
  }

  private createBeastTexture(key: string, color: number, mouthColor: number): void {
    const beast = this.add.graphics();
    beast.fillStyle(color, 1);
    beast.fillCircle(28, 28, 24);
    beast.fillStyle(0x101010, 0.45);
    beast.fillCircle(20, 19, 7);
    beast.fillCircle(36, 19, 7);
    beast.fillStyle(0xffffff, 1);
    beast.fillCircle(20, 19, 4);
    beast.fillCircle(36, 19, 4);
    beast.fillStyle(mouthColor, 1);
    beast.fillRoundedRect(17, 37, 22, 6, 2);
    beast.generateTexture(key, 56, 56);
    beast.destroy();
  }

  private createMiniBoss(): void {
    const boss = this.add.graphics();
    boss.fillStyle(0x8a00ff, 1);
    boss.fillCircle(48, 50, 42);
    boss.fillStyle(0x050805, 0.62);
    boss.fillCircle(34, 39, 10);
    boss.fillCircle(62, 39, 10);
    boss.fillStyle(0x39ff14, 1);
    boss.fillCircle(34, 39, 5);
    boss.fillCircle(62, 39, 5);
    boss.fillStyle(0xff3355, 1);
    boss.fillRoundedRect(30, 66, 36, 8, 3);
    boss.lineStyle(6, 0x39ff14, 1);
    boss.lineBetween(17, 17, 2, 0);
    boss.lineBetween(79, 17, 94, 0);
    boss.generateTexture("mini-boss-placeholder", 96, 100);
    boss.destroy();
  }

  private createProjectile(key: string, color: number): void {
    const bolt = this.add.graphics();
    bolt.fillStyle(color, 1);
    bolt.fillCircle(12, 12, 10);
    bolt.fillStyle(0xffffff, 0.82);
    bolt.fillCircle(9, 8, 3);
    bolt.lineStyle(2, color, 0.7);
    bolt.lineBetween(2, 12, 22, 12);
    bolt.generateTexture(key, 24, 24);
    bolt.destroy();
  }

  private createSpark(): void {
    const spark = this.add.graphics();
    spark.fillStyle(0x39ff14, 1);
    spark.fillCircle(8, 8, 8);
    spark.generateTexture("hit-spark", 16, 16);
    spark.destroy();
  }
}
