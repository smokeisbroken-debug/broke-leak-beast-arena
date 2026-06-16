import Phaser from "phaser";
import { SCENE_KEYS } from "../../config/routes";

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.boot);
  }

  create(): void {
    // Later: load saved settings, Telegram initData, feature flags.
    this.scene.start(SCENE_KEYS.preload);
  }
}
