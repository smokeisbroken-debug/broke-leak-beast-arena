import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../../config/game";
import { SCENE_KEYS } from "../../config/routes";
import { requestAppFullscreen } from "../../app/AppShell";
import { formatSkinBonuses, getSkinById, getStageById, getStageModifierLabel, loadPlayerProfile } from "../data/gameRegistry";

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.menu);
  }

  create(): void {
    const profile = loadPlayerProfile();
    const activeSkin = getSkinById(profile.selectedSkinId);
    const activeStage = getStageById(profile.selectedStageId);

    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "menu-start-screen")
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setDepth(0);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x020304, 0.10).setDepth(1);

    this.add.image(GAME_WIDTH / 2, 70, "start-logo")
      .setDisplaySize(246, 144)
      .setDepth(3);

    const hero = this.add.image(190, 252, activeSkin.previewKey)
      .setDisplaySize(202, 252)
      .setTint(activeSkin.tintColor)
      .setDepth(4);

    this.add.ellipse(190, 254, 148, 222, activeSkin.auraColor, 0.075).setDepth(3);

    this.tweens.add({ targets: hero, y: 242, duration: 1250, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });

    const objectivePanel = this.add.rectangle(548, 178, 350, 166, 0x050805, 0.74)
      .setStrokeStyle(2, activeSkin.auraColor, 0.34)
      .setDepth(4);

    this.add.text(objectivePanel.x, 122, "ARENA BATTLE", {
      fontFamily: "Arial",
      fontSize: "13px",
      color: "#39ff14",
      fontStyle: "bold",
      stroke: "#050805",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(5);

    this.add.text(objectivePanel.x, 152, "Choose skin\nPick active skills\nDefeat leak bosses", {
      fontFamily: "Arial",
      fontSize: "17px",
      color: "#f5fff1",
      align: "center",
      lineSpacing: 5,
      stroke: "#050805",
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(5);

    this.add.text(objectivePanel.x, 220, `ACTIVE: ${activeSkin.name.toUpperCase()}`, {
      fontFamily: "Arial",
      fontSize: "12px",
      color: activeSkin.uiColor,
      fontStyle: "bold",
      stroke: "#050805",
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(5);

    this.add.text(objectivePanel.x, 238, formatSkinBonuses(activeSkin), {
      fontFamily: "Arial",
      fontSize: "10px",
      color: "#d7ffd0",
      fontStyle: "bold",
      stroke: "#050805",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(5);

    this.add.text(objectivePanel.x, 258, `STAGE: ${activeStage.name.toUpperCase()} · ${getStageModifierLabel(activeStage).toUpperCase()}`, {
      fontFamily: "Arial",
      fontSize: "10px",
      color: activeStage.uiColor,
      fontStyle: "bold",
      stroke: "#050805",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(5);

    const play = this.add.image(545, 312, "start-play-button")
      .setDisplaySize(270, 88)
      .setDepth(5)
      .setInteractive({ useHandCursor: true });

    play.on("pointerdown", async () => {
      await requestAppFullscreen(document.documentElement);
      this.scene.start(SCENE_KEYS.arena);
    });
    play.on("pointerover", () => play.setScale(1.03));
    play.on("pointerout", () => play.setScale(1));

    const skinButton = this.add.rectangle(438, 376, 108, 34, 0x071107, 0.9)
      .setStrokeStyle(2, activeSkin.auraColor, 0.55)
      .setDepth(5)
      .setInteractive({ useHandCursor: true });
    this.add.text(438, 376, "SKINS", {
      fontFamily: "Arial",
      fontSize: "13px",
      color: "#fcfff7",
      fontStyle: "bold",
      stroke: "#050805",
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(6);
    skinButton.on("pointerdown", () => this.scene.start(SCENE_KEYS.skinSelect));

    const skillButton = this.add.rectangle(556, 376, 108, 34, 0x071107, 0.9)
      .setStrokeStyle(2, 0x72ff57, 0.55)
      .setDepth(5)
      .setInteractive({ useHandCursor: true });
    this.add.text(556, 376, "SKILLS", {
      fontFamily: "Arial",
      fontSize: "13px",
      color: "#fcfff7",
      fontStyle: "bold",
      stroke: "#050805",
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(6);
    skillButton.on("pointerdown", () => this.scene.start(SCENE_KEYS.skillLoadout));

    const stageButton = this.add.rectangle(674, 376, 108, 34, 0x071107, 0.9)
      .setStrokeStyle(2, activeStage.color, 0.55)
      .setDepth(5)
      .setInteractive({ useHandCursor: true });
    this.add.text(674, 376, "STAGES", {
      fontFamily: "Arial",
      fontSize: "13px",
      color: "#fcfff7",
      fontStyle: "bold",
      stroke: "#050805",
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(6);
    stageButton.on("pointerdown", () => this.scene.start(SCENE_KEYS.stageSelect));

    this.add.text(188, 392, `COINS: ${profile.coins} · LEVEL ${profile.level}`, {
      fontFamily: "Arial",
      fontSize: "12px",
      color: "#d7ffd0",
      align: "center",
      stroke: "#050805",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(5);
  }
}
