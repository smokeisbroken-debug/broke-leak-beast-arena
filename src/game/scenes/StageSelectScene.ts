import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../../config/game";
import { SCENE_KEYS } from "../../config/routes";
import {
  STAGES,
  getStageModifierLabel,
  getStageRarityColor,
  getStageUnlockLabel,
  isStageUnlocked,
  loadPlayerProfile,
  savePlayerProfile,
  selectProfileStage,
} from "../data/gameRegistry";
import type { PlayerProfile, StageDefinition } from "../data/gameRegistry";

export class StageSelectScene extends Phaser.Scene {
  private profile!: PlayerProfile;

  constructor() {
    super(SCENE_KEYS.stageSelect);
  }

  create(): void {
    this.profile = loadPlayerProfile();

    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "menu-start-screen")
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setDepth(0);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x020304, 0.64).setDepth(1);

    this.add.text(GAME_WIDTH / 2, 26, "STAGE SELECT", {
      fontFamily: "Arial",
      fontSize: "28px",
      color: "#72ff57",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(3);

    this.add.text(GAME_WIDTH / 2, 58, "MAPS CHANGE FIGHT RULES · HAZARDS ARE MECHANICS, NOT BACKGROUNDS", {
      fontFamily: "Arial",
      fontSize: "12px",
      color: "#fcfff7",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(3);

    STAGES.forEach((stage, index) => this.createStageCard(stage, index));

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

  private createStageCard(stage: StageDefinition, index: number): void {
    const col = index % 4;
    const row = Math.floor(index / 4);
    const x = 128 + col * 222;
    const y = 150 + row * 142;
    const unlocked = isStageUnlocked(this.profile, stage.id);
    const active = this.profile.selectedStageId === stage.id;
    const alpha = unlocked ? 0.9 : 0.56;
    const rarityColor = getStageRarityColor(stage);

    const card = this.add.rectangle(x, y, 202, 122, 0x061006, alpha)
      .setStrokeStyle(active ? 4 : 2, active ? 0x72ff57 : stage.color, active ? 0.98 : 0.42)
      .setDepth(4);

    this.add.rectangle(x, y - 43, 172, 5, stage.color, unlocked ? 0.86 : 0.28).setDepth(5);
    this.add.circle(x - 72, y - 12, 34, stage.color, unlocked ? 0.17 : 0.06)
      .setStrokeStyle(2, stage.color, unlocked ? 0.62 : 0.22)
      .setDepth(5);
    this.add.text(x - 72, y - 12, stage.modifier === "neutral" ? "BASE" : "MAP", {
      fontFamily: "Arial",
      fontSize: "10px",
      color: "#fcfff7",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(6);

    this.add.text(x - 30, y - 54, stage.name.toUpperCase(), {
      fontFamily: "Arial",
      fontSize: stage.name.length > 15 ? "11px" : "12px",
      color: unlocked ? stage.uiColor : "#8c968c",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 4,
    }).setOrigin(0, 0).setDepth(6);

    this.add.text(x - 30, y - 35, `${stage.rarity.toUpperCase()} · ${getStageModifierLabel(stage).toUpperCase()}`, {
      fontFamily: "Arial",
      fontSize: "9px",
      color: unlocked ? rarityColor : "#7c867c",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 3,
    }).setOrigin(0, 0).setDepth(6);

    this.add.text(x - 30, y - 17, stage.description, {
      fontFamily: "Arial",
      fontSize: "10px",
      color: unlocked ? "#d7ffd0" : "#8c968c",
      stroke: "#041004",
      strokeThickness: 3,
      wordWrap: { width: 136 },
      lineSpacing: 1,
    }).setOrigin(0, 0).setDepth(6);

    const hazardText = stage.hazardDamage > 0 ? `HAZARD ${stage.hazardDamage} HP` : "NO HAZARD";
    this.add.text(x - 30, y + 29, hazardText, {
      fontFamily: "Arial",
      fontSize: "10px",
      color: stage.hazardDamage > 0 ? "#ffeb72" : "#fcfff7",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 3,
    }).setOrigin(0, 0).setDepth(6);

    const buttonLabel = active ? "ACTIVE" : unlocked ? "SELECT" : getStageUnlockLabel(stage).toUpperCase();
    const button = this.add.rectangle(x + 42, y + 44, 104, 24, active ? 0x72ff57 : unlocked ? stage.color : 0x2a322a, active ? 0.96 : 0.72)
      .setStrokeStyle(2, active ? 0xfcfff7 : stage.color, active ? 0.7 : 0.35)
      .setDepth(6);
    const label = this.add.text(x + 42, y + 44, buttonLabel, {
      fontFamily: "Arial",
      fontSize: buttonLabel.length > 10 ? "8px" : "10px",
      color: active ? "#041004" : "#fcfff7",
      fontStyle: "bold",
      stroke: active ? "#72ff57" : "#041004",
      strokeThickness: active ? 0 : 3,
    }).setOrigin(0.5).setDepth(7);

    if (!active && unlocked) {
      card.setInteractive({ useHandCursor: true });
      button.setInteractive({ useHandCursor: true });
      label.setInteractive({ useHandCursor: true });
      const selectStage = () => {
        const nextProfile = selectProfileStage(loadPlayerProfile(), stage.id);
        savePlayerProfile(nextProfile);
        this.scene.restart();
      };
      card.on("pointerdown", selectStage);
      button.on("pointerdown", selectStage);
      label.on("pointerdown", selectStage);
    }
  }
}
