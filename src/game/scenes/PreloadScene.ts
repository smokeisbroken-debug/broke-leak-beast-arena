import Phaser from "phaser";
import { SCENE_KEYS } from "../../config/routes";
import { COLORS } from "../../config/theme";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.preload);
  }

  preload(): void {
    this.createGeneratedPlaceholderTextures();
  }

  create(): void {
    this.scene.start(SCENE_KEYS.menu);
  }

  private createGeneratedPlaceholderTextures(): void {
    this.createMascot();
    this.createBeastTexture("beast-bad-habit", {
      body: 0x7a32ff,
      glow: 0xd93cff,
      eye: 0xffec5c,
      mouth: 0xff3355,
      horn: 0x39ff14,
      mark: "B",
    });
    this.createBeastTexture("beast-fomo", {
      body: 0x39ff14,
      glow: 0xb7ff3d,
      eye: 0x050805,
      mouth: 0xff3b30,
      horn: 0xffffff,
      mark: "F",
    });
    this.createBeastTexture("beast-scam", {
      body: 0xff173d,
      glow: 0xff7a00,
      eye: 0xffffff,
      mouth: 0x050805,
      horn: 0xffd43b,
      mark: "!",
    });
    this.createBeastTexture("beast-smoke-brute", {
      body: 0x5f6870,
      glow: 0xb66cff,
      eye: 0x39ff14,
      mouth: 0x101010,
      horn: 0x8a00ff,
      mark: "S",
    });
    this.createMiniBoss();
    this.createSpark();
  }

  private createMascot(): void {
    const mascot = this.add.graphics();

    // Shadow / glow.
    mascot.fillStyle(0x39ff14, 0.16);
    mascot.fillEllipse(48, 88, 74, 22);

    // Feet.
    mascot.fillStyle(0x39ff14, 1);
    mascot.fillRoundedRect(14, 78, 26, 13, 8);
    mascot.fillRoundedRect(56, 78, 26, 13, 8);

    // Hoodie/body.
    mascot.fillStyle(0x111611, 1);
    mascot.fillRoundedRect(21, 45, 54, 44, 14);
    mascot.lineStyle(4, 0x39ff14, 0.78);
    mascot.strokeRoundedRect(21, 45, 54, 44, 14);

    // Chest logo.
    mascot.fillStyle(0x39ff14, 1);
    mascot.fillRoundedRect(36, 60, 24, 12, 5);
    mascot.fillStyle(0x050805, 1);
    mascot.fillCircle(42, 66, 2.5);
    mascot.fillCircle(54, 66, 2.5);

    // Head.
    mascot.fillStyle(0x39ff14, 1);
    mascot.fillCircle(48, 33, 30);
    mascot.fillStyle(0x0f2a0f, 1);
    mascot.fillCircle(48, 43, 18);

    // Eyes.
    mascot.fillStyle(0xf5fff1, 1);
    mascot.fillCircle(36, 23, 8);
    mascot.fillCircle(60, 23, 8);
    mascot.fillStyle(0x050805, 1);
    mascot.fillCircle(36, 23, 4);
    mascot.fillCircle(60, 23, 4);
    mascot.fillStyle(0x39ff14, 1);
    mascot.fillCircle(38, 21, 1.6);
    mascot.fillCircle(62, 21, 1.6);

    // Mask / visor.
    mascot.lineStyle(4, 0x8a00ff, 1);
    mascot.lineBetween(18, 34, 78, 34);
    mascot.lineStyle(2, 0xf5fff1, 0.5);
    mascot.lineBetween(31, 49, 65, 49);

    // Shield wallet badge.
    mascot.fillStyle(0x8a00ff, 1);
    mascot.fillRoundedRect(62, 48, 20, 24, 7);
    mascot.lineStyle(2, 0xf5fff1, 0.8);
    mascot.strokeRoundedRect(62, 48, 20, 24, 7);
    mascot.fillStyle(0x39ff14, 1);
    mascot.fillCircle(72, 60, 3);

    mascot.generateTexture("mascot-placeholder", 96, 104);
    mascot.destroy();
  }

  private createBeastTexture(
    key: string,
    colors: { body: number; glow: number; eye: number; mouth: number; horn: number; mark: string },
  ): void {
    const beast = this.add.graphics();

    beast.fillStyle(colors.glow, 0.18);
    beast.fillCircle(34, 34, 34);

    beast.fillStyle(colors.horn, 1);
    beast.fillTriangle(13, 16, 21, 2, 28, 19);
    beast.fillTriangle(55, 16, 47, 2, 40, 19);

    beast.fillStyle(colors.body, 1);
    beast.fillCircle(34, 35, 27);
    beast.fillStyle(0x050805, 0.2);
    beast.fillCircle(27, 28, 9);
    beast.fillCircle(43, 28, 9);

    beast.fillStyle(colors.eye, 1);
    beast.fillCircle(27, 28, 4.6);
    beast.fillCircle(43, 28, 4.6);

    beast.fillStyle(colors.mouth, 1);
    beast.fillRoundedRect(22, 46, 24, 7, 3);

    beast.lineStyle(3, colors.glow, 0.88);
    beast.strokeCircle(34, 35, 27);

    beast.fillStyle(0x050805, 0.78);
    beast.fillCircle(52, 51, 11);
    beast.fillStyle(0xf5fff1, 1);
    beast.fillRoundedRect(48, 46, 8, 10, 3);

    beast.generateTexture(key, 68, 68);
    beast.destroy();

    // Tiny badge texture for future visual identity use. Kept generated, no asset files required.
    const badge = this.add.text(0, 0, colors.mark, {
      fontFamily: "Arial",
      fontSize: "15px",
      color: "#39ff14",
      fontStyle: "bold",
    });
    badge.destroy();
  }

  private createMiniBoss(): void {
    const boss = this.add.graphics();

    boss.fillStyle(0x8a00ff, 0.18);
    boss.fillCircle(64, 65, 64);
    boss.fillStyle(0x17002a, 1);
    boss.fillCircle(64, 64, 52);
    boss.lineStyle(6, 0x39ff14, 0.95);
    boss.strokeCircle(64, 64, 52);

    boss.fillStyle(0x8a00ff, 1);
    boss.fillCircle(64, 66, 43);
    boss.fillStyle(0x050805, 0.72);
    boss.fillCircle(47, 55, 13);
    boss.fillCircle(81, 55, 13);
    boss.fillStyle(0x39ff14, 1);
    boss.fillCircle(47, 55, 6);
    boss.fillCircle(81, 55, 6);

    boss.fillStyle(0xff3355, 1);
    boss.fillRoundedRect(43, 85, 42, 10, 4);
    boss.fillStyle(0xf5fff1, 1);
    boss.fillTriangle(50, 85, 55, 96, 60, 85);
    boss.fillTriangle(70, 85, 75, 96, 80, 85);

    boss.lineStyle(8, 0xffd43b, 1);
    boss.lineBetween(25, 28, 6, 7);
    boss.lineBetween(103, 28, 122, 7);
    boss.lineStyle(4, 0x39ff14, 1);
    boss.lineBetween(18, 106, 4, 124);
    boss.lineBetween(110, 106, 124, 124);

    boss.generateTexture("mini-boss-placeholder", 128, 132);
    boss.destroy();
  }

  private createSpark(): void {
    const spark = this.add.graphics();
    spark.fillStyle(0x39ff14, 1);
    spark.fillCircle(12, 12, 8);
    spark.lineStyle(3, 0xffffff, 0.9);
    spark.lineBetween(12, 0, 12, 24);
    spark.lineBetween(0, 12, 24, 12);
    spark.generateTexture("hit-spark", 24, 24);
    spark.destroy();
  }
}
