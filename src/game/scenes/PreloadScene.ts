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
    const mascot = this.add.graphics();
    mascot.fillStyle(COLORS.green, 1);
    mascot.fillCircle(32, 26, 24);
    mascot.fillStyle(COLORS.black, 1);
    mascot.fillRoundedRect(8, 42, 48, 40, 12);
    mascot.fillStyle(COLORS.white, 1);
    mascot.fillCircle(23, 20, 7);
    mascot.fillCircle(41, 20, 7);
    mascot.fillStyle(COLORS.black, 1);
    mascot.fillCircle(23, 20, 3);
    mascot.fillCircle(41, 20, 3);
    mascot.generateTexture("mascot-placeholder", 64, 88);
    mascot.destroy();

    const beast = this.add.graphics();
    beast.fillStyle(COLORS.purple, 1);
    beast.fillCircle(28, 28, 24);
    beast.fillStyle(COLORS.white, 1);
    beast.fillCircle(20, 22, 4);
    beast.fillCircle(36, 22, 4);
    beast.fillStyle(COLORS.red, 1);
    beast.fillRect(18, 38, 22, 5);
    beast.generateTexture("leak-beast-placeholder", 56, 56);
    beast.destroy();
  }
}
