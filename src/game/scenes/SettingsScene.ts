import Phaser from "phaser";
import { GAME_CONFIG, GAME_HEIGHT, GAME_WIDTH } from "../../config/game";
import { SCENE_KEYS } from "../../config/routes";
import {
  createDefaultProfile,
  exportPlayerSave,
  getSaveStatus,
  importPlayerSave,
  loadPlayerProfile,
  restoreBackupProfile,
  savePlayerProfile,
  type PlayerProfile,
} from "../data/gameRegistry";

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

    this.add.text(GAME_WIDTH / 2, 24, "SETTINGS / SAVE", {
      fontFamily: "Arial", fontSize: "30px", color: "#72ff57", fontStyle: "bold", stroke: "#041004", strokeThickness: 6,
    }).setOrigin(0.5).setDepth(3);

    this.add.text(GAME_WIDTH / 2, 54, `BUILD ${GAME_CONFIG.version}`, {
      fontFamily: "Arial", fontSize: "12px", color: "#d7ffd0", fontStyle: "bold", stroke: "#041004", strokeThickness: 3,
    }).setOrigin(0.5).setDepth(3);

    const saveStatus = getSaveStatus();
    const saveLine = `SAVE ${saveStatus.mainReadable ? "OK" : saveStatus.hasMainSave ? "DAMAGED" : "EMPTY"} · BACKUP ${saveStatus.backupReadable ? "OK" : saveStatus.hasBackupSave ? "DAMAGED" : "EMPTY"}`;
    this.statusText = this.add.text(GAME_WIDTH / 2, 82, saveLine, {
      fontFamily: "Arial", fontSize: "12px", color: "#fcfff7", fontStyle: "bold", stroke: "#041004", strokeThickness: 3,
    }).setOrigin(0.5).setDepth(3);

    this.createSettingsCards();
    this.createFooterButtons();
  }

  private createSettingsCards(): void {
    this.createToggleCard(224, 138, "SOUND", this.profile.settings.soundEnabled, () => this.toggleSound());
    this.createToggleCard(696, 138, "VIBRATION", this.profile.settings.vibrationEnabled, () => this.toggleVibration());

    this.createActionCard(224, 226, "EXPORT SAVE", "Copy full save file with checksum", 0x8cdcff, () => void this.copySave());
    this.createActionCard(696, 226, "IMPORT SAVE", "Paste exported save JSON", 0xb66cff, () => this.importSave());

    this.createActionCard(224, 314, "RESTORE BACKUP", "Recover previous local save", 0xffeb72, () => this.restoreBackup());
    this.createActionCard(696, 314, this.resetArmed ? "CONFIRM RESET" : "RESET PROFILE", this.resetArmed ? "Tap again to erase local progress" : "Double tap guard", 0xff4866, () => this.handleReset());
  }

  private createToggleCard(x: number, y: number, label: string, enabled: boolean, callback: () => void): void {
    this.createActionCard(x, y, `${label}: ${enabled ? "ON" : "OFF"}`, enabled ? "Tap to disable" : "Tap to enable", enabled ? 0x72ff57 : 0xff4866, callback);
  }

  private createActionCard(x: number, y: number, title: string, desc: string, color: number, callback: () => void): void {
    const card = this.add.rectangle(x, y, 330, 72, 0x071107, 0.92)
      .setStrokeStyle(2, color, 0.56)
      .setDepth(3)
      .setInteractive({ useHandCursor: true });
    this.add.text(x, y - 13, title, {
      fontFamily: "Arial", fontSize: "15px", color: "#fcfff7", fontStyle: "bold", stroke: "#041004", strokeThickness: 4,
    }).setOrigin(0.5).setDepth(4);
    this.add.text(x, y + 15, desc, {
      fontFamily: "Arial", fontSize: "11px", color: "#d7ffd0", fontStyle: "bold", stroke: "#041004", strokeThickness: 3,
      align: "center",
      wordWrap: { width: 286 },
    }).setOrigin(0.5).setDepth(4);
    card.on("pointerdown", callback);
  }

  private toggleSound(): void {
    const profile = loadPlayerProfile();
    savePlayerProfile({ ...profile, settings: { ...profile.settings, soundEnabled: !profile.settings.soundEnabled } });
    this.scene.restart();
  }

  private toggleVibration(): void {
    const profile = loadPlayerProfile();
    savePlayerProfile({ ...profile, settings: { ...profile.settings, vibrationEnabled: !profile.settings.vibrationEnabled } });
    this.scene.restart();
  }

  private async copySave(): Promise<void> {
    try {
      await navigator.clipboard.writeText(exportPlayerSave());
      this.statusText.setText("SAVE EXPORTED TO CLIPBOARD");
      this.statusText.setColor("#8cdcff");
    } catch {
      this.statusText.setText("EXPORT FAILED");
      this.statusText.setColor("#ff4866");
    }
  }

  private importSave(): void {
    const raw = window.prompt("Paste $BROKE Leak Fighter save JSON");
    if (!raw) {
      this.statusText.setText("IMPORT CANCELLED");
      return;
    }

    const result = importPlayerSave(raw);
    if (!result.ok) {
      this.statusText.setText(result.error ?? "IMPORT FAILED");
      this.statusText.setColor("#ff4866");
      return;
    }

    this.statusText.setText(result.warning ? `IMPORTED · ${result.warning}` : "SAVE IMPORTED");
    this.statusText.setColor("#72ff57");
    this.time.delayedCall(650, () => this.scene.restart());
  }

  private restoreBackup(): void {
    if (!restoreBackupProfile()) {
      this.statusText.setText("NO READABLE BACKUP");
      this.statusText.setColor("#ff4866");
      return;
    }
    this.statusText.setText("BACKUP RESTORED");
    this.statusText.setColor("#ffeb72");
    this.time.delayedCall(650, () => this.scene.restart());
  }

  private handleReset(): void {
    if (!this.resetArmed) {
      this.resetArmed = true;
      this.statusText.setText("RESET ARMED. TAP RESET PROFILE AGAIN TO ERASE LOCAL PROFILE.");
      this.statusText.setColor("#ff9aaa");
      this.time.delayedCall(2600, () => {
        this.resetArmed = false;
        if (this.scene.isActive()) {
          this.statusText.setText("RESET CANCELLED");
          this.statusText.setColor("#fcfff7");
        }
      });
      return;
    }

    savePlayerProfile(createDefaultProfile());
    this.statusText.setText("PROFILE RESET");
    this.statusText.setColor("#ffeb72");
    this.time.delayedCall(650, () => this.scene.restart());
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
