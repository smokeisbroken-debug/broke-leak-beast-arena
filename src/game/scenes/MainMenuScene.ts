import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../../config/game";
import { SCENE_KEYS } from "../../config/routes";
import { requestAppFullscreen } from "../../app/AppShell";
import {
  formatSkinBonuses,
  getSkillById,
  getCampaignChapterForBoss,
  getDailyMissionStates,
  getSelectedCampaignBoss,
  getSkinById,
  getStageById,
  getStageModifierLabel,
  loadPlayerProfile,
} from "../data/gameRegistry";

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.menu);
  }

  create(): void {
    const profile = loadPlayerProfile();
    const activeSkin = getSkinById(profile.selectedSkinId);
    const activeStage = getStageById(profile.selectedStageId);
    const activeBoss = getSelectedCampaignBoss(profile);
    const activeChapter = getCampaignChapterForBoss(activeBoss.id);
    const activeSkills = {
      skill1: getSkillById(profile.selectedSkillIds.skill1),
      skill2: getSkillById(profile.selectedSkillIds.skill2),
      ultimate: getSkillById(profile.selectedSkillIds.ultimate),
    };
    const missionStates = getDailyMissionStates(profile);
    const claimableMissions = missionStates.filter((mission) => mission.completed && !mission.claimed).length;

    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "menu-start-screen")
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setDepth(0);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x020304, 0.16).setDepth(1);

    this.add.image(GAME_WIDTH / 2, 64, "start-logo")
      .setDisplaySize(220, 130)
      .setDepth(3);

    const hero = this.add.image(176, 248, activeSkin.previewKey)
      .setDisplaySize(196, 246)
      .setTint(activeSkin.tintColor)
      .setDepth(4);
    this.add.ellipse(176, 252, 142, 218, activeSkin.auraColor, 0.075).setDepth(3);
    this.tweens.add({ targets: hero, y: 238, duration: 1250, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });

    this.createStatusPanel(activeSkin, activeStage, activeBoss, activeChapter, activeSkills.skill1.name, activeSkills.skill2.name);

    const play = this.add.image(546, 298, "start-play-button")
      .setDisplaySize(248, 78)
      .setDepth(5)
      .setInteractive({ useHandCursor: true });
    play.on("pointerdown", async () => {
      await requestAppFullscreen(document.documentElement);
      this.scene.start(SCENE_KEYS.arena);
    });
    play.on("pointerover", () => play.setScale(1.025));
    play.on("pointerout", () => play.setScale(1));

    const nav = [
      { label: "CAMPAIGN", sub: activeChapter.name, x: 342, y: 350, color: activeChapter.color, route: SCENE_KEYS.campaign },
      { label: "SKINS", sub: activeSkin.name, x: 478, y: 350, color: activeSkin.auraColor, route: SCENE_KEYS.skinSelect },
      { label: "SKILLS", sub: `${activeSkills.skill1.name} / ${activeSkills.skill2.name}`, x: 614, y: 350, color: 0x72ff57, route: SCENE_KEYS.skillLoadout },
      { label: "STAGES", sub: activeStage.name, x: 750, y: 350, color: activeStage.color, route: SCENE_KEYS.stageSelect },
      { label: "MISSIONS", sub: claimableMissions > 0 ? `${claimableMissions} CLAIM` : "DAILY", x: 342, y: 396, color: 0xffeb72, route: SCENE_KEYS.missions },
      { label: "PROFILE", sub: `LV ${profile.level} · ${profile.coins} COINS`, x: 478, y: 396, color: 0xb66cff, route: SCENE_KEYS.profile },
      { label: "SETTINGS", sub: profile.settings.soundEnabled ? "SOUND ON" : "SOUND OFF", x: 614, y: 396, color: 0x8cdcff, route: SCENE_KEYS.settings },
      { label: "RESULTS", sub: `BEST ${profile.bestScore}`, x: 750, y: 396, color: 0xfcfff7, route: SCENE_KEYS.profile },
    ];

    nav.forEach((item) => this.createNavButton(item.x, item.y, item.label, item.sub, item.color, () => this.scene.start(item.route)));

    this.add.text(176, 388, `LEVEL ${profile.level} · COINS ${profile.coins}\nWINS ${profile.totalWins} · BEST ${profile.bestScore}`, {
      fontFamily: "Arial",
      fontSize: "12px",
      color: "#d7ffd0",
      align: "center",
      stroke: "#050805",
      strokeThickness: 3,
      lineSpacing: 2,
    }).setOrigin(0.5).setDepth(5);
  }

  private createStatusPanel(
    activeSkin: ReturnType<typeof getSkinById>,
    activeStage: ReturnType<typeof getStageById>,
    activeBoss: ReturnType<typeof getSelectedCampaignBoss>,
    activeChapter: ReturnType<typeof getCampaignChapterForBoss>,
    skill1Name: string,
    skill2Name: string,
  ): void {
    const panel = this.add.rectangle(548, 168, 410, 170, 0x050805, 0.76)
      .setStrokeStyle(2, activeSkin.auraColor, 0.36)
      .setDepth(4);

    this.add.text(panel.x, 106, "FULL GAME SHELL", {
      fontFamily: "Arial",
      fontSize: "13px",
      color: "#39ff14",
      fontStyle: "bold",
      stroke: "#050805",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(5);

    this.add.text(panel.x, 134, "Campaign → Loadout → Stage → Fight → Rewards", {
      fontFamily: "Arial",
      fontSize: "15px",
      color: "#f5fff1",
      fontStyle: "bold",
      align: "center",
      stroke: "#050805",
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(5);

    const lines = [
      `SKIN: ${activeSkin.name.toUpperCase()} · ${formatSkinBonuses(activeSkin)}`,
      `BOSS: ${activeBoss.name.toUpperCase()} · ${activeChapter.name.toUpperCase()}`,
      `STAGE: ${activeStage.name.toUpperCase()} · ${getStageModifierLabel(activeStage).toUpperCase()}`,
      `LOADOUT: ${skill1Name.toUpperCase()} / ${skill2Name.toUpperCase()}`,
    ];

    lines.forEach((line, index) => {
      this.add.text(panel.x, 174 + index * 22, line, {
        fontFamily: "Arial",
        fontSize: index === 0 ? "10px" : "9px",
        color: index === 0 ? activeSkin.uiColor : index === 1 ? activeChapter.uiColor : index === 2 ? activeStage.uiColor : "#d7ffd0",
        fontStyle: "bold",
        stroke: "#050805",
        strokeThickness: 3,
      }).setOrigin(0.5).setDepth(5);
    });
  }

  private createNavButton(x: number, y: number, label: string, subLabel: string, color: number, callback: () => void): void {
    const card = this.add.rectangle(x, y, 126, 38, 0x071107, 0.92)
      .setStrokeStyle(2, color, 0.55)
      .setDepth(5)
      .setInteractive({ useHandCursor: true });
    this.add.text(x, y - 6, label, {
      fontFamily: "Arial",
      fontSize: label.length > 7 ? "10px" : "12px",
      color: "#fcfff7",
      fontStyle: "bold",
      stroke: "#050805",
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(6);
    this.add.text(x, y + 10, subLabel.toUpperCase().slice(0, 24), {
      fontFamily: "Arial",
      fontSize: "7px",
      color: "#d7ffd0",
      fontStyle: "bold",
      stroke: "#050805",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(6);
    card.on("pointerdown", callback);
    card.on("pointerover", () => card.setScale(1.025));
    card.on("pointerout", () => card.setScale(1));
  }
}
