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
    this.createBeastTexture("beast-bad-habit", COLORS.purple, 0xff3355);
    this.createBeastTexture("beast-fomo", 0x42ff2f, 0x050805);
    this.createBeastTexture("beast-scam", 0xff3b30, 0xffffff);
    this.createBeastTexture("beast-smoke-brute", 0x666666, 0x39ff14);
    this.createMiniBoss();
    this.createProjectile("scam-bolt", 0xff3355);
    this.createProjectile("boss-bolt", 0xb66cff);
    this.createSpark();
  }

  private createMascot(): void {
    const mascot = this.add.graphics();
    mascot.fillStyle(COLORS.green, 1);
    mascot.fillCircle(32, 24, 24);
    mascot.fillStyle(COLORS.black, 1);
    mascot.fillRoundedRect(8, 39, 48, 42, 12);
    mascot.fillStyle(0x1c1c1c, 1);
    mascot.fillRoundedRect(13, 48, 38, 26, 8);
    mascot.fillStyle(COLORS.white, 1);
    mascot.fillCircle(23, 18, 7);
    mascot.fillCircle(41, 18, 7);
    mascot.fillStyle(COLORS.black, 1);
    mascot.fillCircle(23, 18, 3);
    mascot.fillCircle(41, 18, 3);
    mascot.lineStyle(3, 0x8a00ff, 1);
    mascot.lineBetween(8, 26, 56, 26);
    mascot.generateTexture("mascot-placeholder", 64, 88);
    mascot.destroy();
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
