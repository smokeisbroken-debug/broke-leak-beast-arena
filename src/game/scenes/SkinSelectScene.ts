import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../../config/game";
import { SCENE_KEYS } from "../../config/routes";
import {
  SKINS,
  canUnlockSkin,
  formatSkinBonuses,
  getSkinUnlockLabel,
  isSkinUnlocked,
  loadPlayerProfile,
  savePlayerProfile,
  selectProfileSkin,
  unlockProfileSkin,
} from "../data/gameRegistry";
import type { PlayerProfile, SkinDefinition } from "../data/gameRegistry";

export class SkinSelectScene extends Phaser.Scene {
  private profile!: PlayerProfile;

  constructor() {
    super(SCENE_KEYS.skinSelect);
  }

  create(): void {
    this.profile = loadPlayerProfile();

    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "menu-start-screen")
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setDepth(0);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x020304, 0.58).setDepth(1);

    this.add.text(GAME_WIDTH / 2, 26, "SKIN SELECT", {
      fontFamily: "Arial",
      fontSize: "28px",
      color: "#72ff57",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(3);

    this.add.text(GAME_WIDTH / 2, 58, `COINS: ${this.profile.coins}  ·  ACTIVE SKIN CHANGES REAL STATS`, {
      fontFamily: "Arial",
      fontSize: "12px",
      color: "#fcfff7",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(3);

    SKINS.forEach((skin, index) => this.createSkinCard(skin, index));

    const back = this.add.text(64, GAME_HEIGHT - 30, "BACK", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#fcfff7",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 4,
      backgroundColor: "#071107",
      padding: { x: 18, y: 8 },
    }).setOrigin(0.5).setDepth(10).setInteractive({ useHandCursor: true });
    back.on("pointerdown", () => this.scene.start(SCENE_KEYS.menu));
  }

  private createSkinCard(skin: SkinDefinition, index: number): void {
    const col = index % 4;
    const row = Math.floor(index / 4);
    const x = 128 + col * 222;
    const y = 148 + row * 142;
    const unlocked = isSkinUnlocked(this.profile, skin.id);
    const active = this.profile.selectedSkinId === skin.id;
    const unlockable = canUnlockSkin(this.profile, skin);
    const alpha = unlocked ? 0.9 : 0.64;

    const card = this.add.rectangle(x, y, 202, 122, 0x061006, alpha)
      .setStrokeStyle(active ? 4 : 2, active ? 0x72ff57 : skin.auraColor, active ? 0.98 : 0.38)
      .setDepth(4);

    this.add.circle(x - 68, y - 24, 36, skin.auraColor, unlocked ? 0.18 : 0.07)
      .setStrokeStyle(2, skin.auraColor, unlocked ? 0.55 : 0.25)
      .setDepth(5);

    const preview = this.add.image(x - 68, y - 25, skin.previewKey)
      .setDisplaySize(54, 72)
      .setTint(unlocked ? skin.tintColor : 0x5f675f)
      .setAlpha(unlocked ? 1 : 0.62)
      .setDepth(6);

    this.tweens.add({
      targets: preview,
      y: preview.y - 3,
      duration: 1050 + index * 70,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.add.text(x - 18, y - 54, skin.name.toUpperCase(), {
      fontFamily: "Arial",
      fontSize: skin.name.length > 13 ? "11px" : "12px",
      color: skin.uiColor,
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 4,
    }).setOrigin(0, 0).setDepth(6);

    this.add.text(x - 18, y - 35, skin.rarity.toUpperCase(), {
      fontFamily: "Arial",
      fontSize: "10px",
      color: "#fcfff7",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 3,
    }).setOrigin(0, 0).setDepth(6);

    this.add.text(x - 18, y - 17, formatSkinBonuses(skin), {
      fontFamily: "Arial",
      fontSize: "10px",
      color: "#d7ffd0",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 3,
      wordWrap: { width: 122 },
      lineSpacing: 1,
    }).setOrigin(0, 0).setDepth(6);

    const buttonLabel = active ? "ACTIVE" : unlocked ? "SELECT" : unlockable ? "UNLOCK" : getSkinUnlockLabel(skin).toUpperCase();
    const buttonColor = active ? 0x72ff57 : unlocked ? 0xa45cff : unlockable ? 0xffeb72 : 0x2a322a;
    const button = this.add.rectangle(x + 30, y + 44, 126, 24, buttonColor, active ? 0.95 : 0.76)
      .setStrokeStyle(2, active ? 0xfcfff7 : skin.auraColor, active ? 0.72 : 0.35)
      .setDepth(6);
    const label = this.add.text(x + 30, y + 44, buttonLabel, {
      fontFamily: "Arial",
      fontSize: buttonLabel.length > 13 ? "8px" : "10px",
      color: active ? "#041004" : "#fcfff7",
      fontStyle: "bold",
      stroke: active ? "#72ff57" : "#041004",
      strokeThickness: active ? 0 : 3,
      align: "center",
    }).setOrigin(0.5).setDepth(7);

    if (!active && (unlocked || unlockable)) {
      card.setInteractive({ useHandCursor: true });
      button.setInteractive({ useHandCursor: true });
      label.setInteractive({ useHandCursor: true });

      const selectOrUnlock = () => {
        let nextProfile = loadPlayerProfile();

        if (!isSkinUnlocked(nextProfile, skin.id) && canUnlockSkin(nextProfile, skin)) {
          if (skin.unlock.type === "coins" && typeof skin.unlock.value === "number") {
            nextProfile.coins = Math.max(0, nextProfile.coins - skin.unlock.value);
          }
          nextProfile = unlockProfileSkin(nextProfile, skin.id);
        }

        if (isSkinUnlocked(nextProfile, skin.id)) {
          nextProfile = selectProfileSkin(nextProfile, skin.id);
          savePlayerProfile(nextProfile);
          this.scene.restart();
        }
      };

      card.on("pointerdown", selectOrUnlock);
      button.on("pointerdown", selectOrUnlock);
      label.on("pointerdown", selectOrUnlock);
    }
  }
}
