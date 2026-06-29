import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../../config/game";
import { SCENE_KEYS } from "../../config/routes";
import {
  claimDailyMissionReward,
  formatMissionReward,
  getDailyMissionStates,
  getXpProgress,
  loadPlayerProfile,
  savePlayerProfile,
} from "../data/gameRegistry";
import type { DailyMissionState, PlayerProfile } from "../data/gameRegistry";

export class MissionsScene extends Phaser.Scene {
  private profile!: PlayerProfile;
  private statusText!: Phaser.GameObjects.Text;

  constructor() {
    super(SCENE_KEYS.missions);
  }

  create(): void {
    this.profile = loadPlayerProfile();

    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "menu-start-screen")
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setDepth(0);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x020304, 0.66).setDepth(1);

    this.add.text(GAME_WIDTH / 2, 24, "DAILY MISSIONS", {
      fontFamily: "Arial",
      fontSize: "28px",
      color: "#72ff57",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(3);

    const xp = getXpProgress(this.profile.xp);
    this.add.text(GAME_WIDTH / 2, 56, `LEVEL ${this.profile.level} · COINS ${this.profile.coins} · XP TO NEXT ${xp.remaining} · CLAIMS ${this.profile.totalMissionClaims}`, {
      fontFamily: "Arial",
      fontSize: "12px",
      color: "#fcfff7",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(3);

    this.statusText = this.add.text(GAME_WIDTH / 2, 78, "Complete missions in fights, then claim rewards here.", {
      fontFamily: "Arial",
      fontSize: "11px",
      color: "#d7ffd0",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(3);

    this.createMissionCards();
    this.createFooterButtons();
  }

  private createMissionCards(): void {
    const states = getDailyMissionStates(this.profile);
    states.forEach((state, index) => this.createMissionCard(state, index));
  }

  private createMissionCard(state: DailyMissionState, index: number): void {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = col === 0 ? 250 : 670;
    const y = 132 + row * 70;
    const mission = state.definition;
    const ratio = Math.min(1, state.progress / Math.max(1, state.target));
    const completed = state.completed;
    const claimed = state.claimed;
    const cardColor = claimed ? 0x1d261d : completed ? 0x071607 : 0x061006;
    const strokeAlpha = claimed ? 0.22 : completed ? 0.88 : 0.44;

    const card = this.add.rectangle(x, y, 382, 58, cardColor, 0.92)
      .setStrokeStyle(completed && !claimed ? 3 : 2, mission.color, strokeAlpha)
      .setDepth(4);

    this.add.text(x - 176, y - 23, mission.title.toUpperCase(), {
      fontFamily: "Arial",
      fontSize: "12px",
      color: claimed ? "#8c968c" : mission.uiColor,
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 4,
    }).setDepth(5);

    this.add.text(x - 176, y - 6, mission.description, {
      fontFamily: "Arial",
      fontSize: "9px",
      color: claimed ? "#879287" : "#d7ffd0",
      stroke: "#041004",
      strokeThickness: 3,
      wordWrap: { width: 218 },
    }).setDepth(5);

    this.add.rectangle(x - 58, y + 18, 236, 8, 0x1b251b, 1).setDepth(5);
    this.add.rectangle(x - 176, y + 18, 234 * ratio, 6, mission.color, claimed ? 0.38 : 0.92)
      .setOrigin(0, 0.5)
      .setDepth(6);

    this.add.text(x + 66, y + 7, `${state.progress}/${state.target}`, {
      fontFamily: "Arial",
      fontSize: "11px",
      color: "#fcfff7",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(6);

    this.add.text(x + 52, y - 22, formatMissionReward(mission.reward).toUpperCase(), {
      fontFamily: "Arial",
      fontSize: "8px",
      color: "#ffeb72",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 3,
      wordWrap: { width: 126 },
      align: "center",
    }).setOrigin(0.5, 0).setDepth(5);

    const buttonLabel = claimed ? "CLAIMED" : completed ? "CLAIM" : "OPEN";
    const buttonColor = claimed ? 0x273027 : completed ? mission.color : 0x243024;
    const button = this.add.rectangle(x + 156, y + 13, 80, 24, buttonColor, claimed ? 0.55 : 0.86)
      .setStrokeStyle(2, mission.color, claimed ? 0.25 : 0.62)
      .setDepth(6);
    const label = this.add.text(x + 156, y + 13, buttonLabel, {
      fontFamily: "Arial",
      fontSize: "10px",
      color: claimed ? "#9aa69a" : completed ? "#041004" : "#fcfff7",
      fontStyle: "bold",
      stroke: completed && !claimed ? mission.uiColor : "#041004",
      strokeThickness: completed && !claimed ? 0 : 3,
    }).setOrigin(0.5).setDepth(7);

    if (completed && !claimed) {
      card.setInteractive({ useHandCursor: true });
      button.setInteractive({ useHandCursor: true });
      label.setInteractive({ useHandCursor: true });
      const claim = () => this.claimMission(mission.id);
      card.on("pointerdown", claim);
      button.on("pointerdown", claim);
      label.on("pointerdown", claim);
    }
  }

  private claimMission(missionId: string): void {
    const application = claimDailyMissionReward(loadPlayerProfile(), missionId);
    savePlayerProfile(application.profile);
    this.statusText.setText(application.claimed ? `CLAIMED: ${application.rewardLabel.toUpperCase()}` : "MISSION NOT READY");
    this.statusText.setColor(application.claimed ? "#ffeb72" : "#fcfff7");
    this.cameras.main.flash(70, 114, 255, 87, false);
    this.time.delayedCall(450, () => this.scene.restart());
  }

  private createFooterButtons(): void {
    const play = this.add.text(GAME_WIDTH / 2 - 120, GAME_HEIGHT - 30, "PLAY", {
      fontFamily: "Arial",
      fontSize: "16px",
      color: "#041004",
      backgroundColor: "#72ff57",
      padding: { x: 24, y: 9 },
      fontStyle: "bold",
    }).setOrigin(0.5).setDepth(10).setInteractive({ useHandCursor: true });
    play.on("pointerdown", () => this.scene.start(SCENE_KEYS.arena));

    const back = this.add.text(GAME_WIDTH / 2 + 92, GAME_HEIGHT - 30, "BACK TO MENU", {
      fontFamily: "Arial",
      fontSize: "14px",
      color: "#fcfff7",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 4,
      backgroundColor: "#071107",
      padding: { x: 20, y: 9 },
    }).setOrigin(0.5).setDepth(10).setInteractive({ useHandCursor: true });
    back.on("pointerdown", () => this.scene.start(SCENE_KEYS.menu));
  }
}
