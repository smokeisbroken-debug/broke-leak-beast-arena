import Phaser from "phaser";
import { GAME_CONFIG, GAME_HEIGHT, GAME_WIDTH } from "../../config/game";
import { SCENE_KEYS } from "../../config/routes";
import { createDefaultProfile, loadPlayerProfile, savePlayerProfile, type PlayerProfile } from "../data/gameRegistry";

export class SettingsScene extends Phaser.Scene {
  private profile!: PlayerProfile;
  private statusText!: Phaser.GameObjects.Text;
  private resetArmed = false;

  constructor() {
    super(SCENE_KEYS.settings);
  }

  create(): void {
    this.profile = loadPlayerProfile();

    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "menu-start-screen")
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setDepth(0);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x020304, 0.68).setDepth(1);

    this.add.text(GAME_WIDTH / 2, 28, "SETTINGS", {
      fontFamily: "Arial", fontSize: "30px", color: "#72ff57", fontStyle: "bold", stroke: "#041004", strokeThickness: 6,
    }).setOrigin(0.5).setDepth(3);

    this.add.text(GAME_WIDTH / 2, 60, `BUILD ${GAME_CONFIG.version}`, {
      fontFamily: "Arial", fontSize: "12px", color: "#d7ffd0", fontStyle: "bold", stroke: "#041004", strokeThickness: 3,
    }).setOrigin(0.5).setDepth(3);

    this.statusText = this.add.text(GAME_WIDTH / 2, 88, "Configure prototype options. Save reset is guarded by double tap.", {
      fontFamily: "Arial", fontSize: "12px", color: "#fcfff7", fontStyle: "bold", stroke: "#041004", strokeThickness: 3,
    }).setOrigin(0.5).setDepth(3);

    this.createSettingsCards();
    this.createFooterButtons();
  }

  private createSettingsCards(): void {
    this.createToggleCard(286, 156, "SOUND", this.profile.settings.soundEnabled, () => this.toggleSound());
    this.createToggleCard(634, 156, "VIBRATION", this.profile.settings.vibrationEnabled, () => this.toggleVibration());
    this.createActionCard(286, 270, "EXPORT SAVE", "Copy profile JSON to clipboard", 0x8cdcff, () => void this.copySave());
    this.createActionCard(634, 270, this.resetArmed ? "CONFIRM RESET" : "RESET PROFILE", this.resetArmed ? "Tap again to erase local progress" : "Requires two taps", 0xff4866, () => this.handleReset());
  }

  private createToggleCard(x: number, y: number, label: string, enabled: boolean, callback: () => void): void {
    this.createActionCard(x, y, `${label}: ${enabled ? "ON" : "OFF"}`, enabled ? "Tap to disable" : "Tap to enable", enabled ? 0x72ff57 : 0xff4866, callback);
  }

  private createActionCard(x: number, y: number, title: string, desc: string, color: number, callback: () => void): void {
    const card = this.add.rectangle(x, y, 296, 84, 0x071107, 0.92)
      .setStrokeStyle(2, color, 0.56)
      .setDepth(3)
      .setInteractive({ useHandCursor: true });
    this.add.text(x, y - 14, title, {
      fontFamily: "Arial", fontSize: "16px", color: "#fcfff7", fontStyle: "bold", stroke: "#041004", strokeThickness: 4,
    }).setOrigin(0.5).setDepth(4);
    this.add.text(x, y + 16, desc, {
      fontFamily: "Arial", fontSize: "11px", color: "#d7ffd0", fontStyle: "bold", stroke: "#041004", strokeThickness: 3,
      align: "center",
      wordWrap: { width: 250 },
    }).setOrigin(0.5).setDepth(4);
    card.on("pointerdown", callback);
  }

  private toggleSound(): void {
    this.profile = { ...loadPlayerProfile(), settings: { ...loadPlayerProfile().settings, soundEnabled: !loadPlayerProfile().settings.soundEnabled } };
    savePlayerProfile(this.profile);
    this.statusText.setText(`SOUND ${this.profile.settings.soundEnabled ? "ON" : "OFF"}`);
    this.scene.restart();
  }

  private toggleVibration(): void {
    this.profile = { ...loadPlayerProfile(), settings: { ...loadPlayerProfile().settings, vibrationEnabled: !loadPlayerProfile().settings.vibrationEnabled } };
    savePlayerProfile(this.profile);
    this.statusText.setText(`VIBRATION ${this.profile.settings.vibrationEnabled ? "ON" : "OFF"}`);
    this.scene.restart();
  }

  private async copySave(): Promise<void> {
    try {
      await navigator.clipboard.writeText(JSON.stringify(loadPlayerProfile(), null, 2));
      this.statusText.setText("SAVE COPIED");
      this.statusText.setColor("#8cdcff");
    } catch {
      this.statusText.setText("COPY FAILED");
      this.statusText.setColor("#ff4866");
    }
  }

  private handleReset(): void {
    if (!this.resetArmed) {
      this.resetArmed = true;
      this.statusText.setText("RESET ARMED. TAP CONFIRM RESET TO ERASE LOCAL PROFILE.");
      this.statusText.setColor("#ff9aaa");
      this.time.delayedCall(2500, () => {
        this.resetArmed = false;
        if (this.scene.isActive()) this.scene.restart();
      });
      this.scene.restart();
      return;
    }

    savePlayerProfile(createDefaultProfile());
    this.statusText.setText("PROFILE RESET");
    this.statusText.setColor("#ffeb72");
    this.scene.restart();
  }

  private createFooterButtons(): void {
    this.createFooterButton(GAME_WIDTH / 2 - 118, "PROFILE", 0xb66cff, () => this.scene.start(SCENE_KEYS.profile));
    this.createFooterButton(GAME_WIDTH / 2 + 8, "MENU", 0x72ff57, () => this.scene.start(SCENE_KEYS.menu));
    this.createFooterButton(GAME_WIDTH / 2 + 134, "PLAY", 0xffeb72, () => this.scene.start(SCENE_KEYS.arena));
  }

  private createFooterButton(x: number, label: string, color: number, callback: () => void): void {
    const button = this.add.rectangle(x, GAME_HEIGHT - 32, 112, 34, 0x071107, 0.92)
      .setStrokeStyle(2, color, 0.58)
      .setDepth(10)
      .setInteractive({ useHandCursor: true });
    this.add.text(x, GAME_HEIGHT - 32, label, {
      fontFamily: "Arial", fontSize: "12px", color: "#fcfff7", fontStyle: "bold", stroke: "#041004", strokeThickness: 3,
    }).setOrigin(0.5).setDepth(11);
    button.on("pointerdown", callback);
  }
}
