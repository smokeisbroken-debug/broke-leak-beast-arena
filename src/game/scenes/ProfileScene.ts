import Phaser from "phaser";
import { GAME_CONFIG, GAME_HEIGHT, GAME_WIDTH } from "../../config/game";
import { SCENE_KEYS } from "../../config/routes";
import {
  CAMPAIGN_CHAPTERS,
  SKILLS,
  SKINS,
  STAGES,
  getSkillById,
  getCampaignProgress,
  getDailyMissionStates,
  getSelectedCampaignBoss,
  getSkinById,
  getStageById,
  getSaveStatus,
  getPlayerProfileV2Summary,
  getXpProgress,
  loadPlayerProfile,
} from "../data/gameRegistry";

export class ProfileScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.profile);
  }

  create(): void {
    const profile = loadPlayerProfile();
    const skin = getSkinById(profile.selectedSkinId);
    const stage = getStageById(profile.selectedStageId);
    const boss = getSelectedCampaignBoss(profile);
    const skills = {
      skill1: getSkillById(profile.selectedSkillIds.skill1),
      skill2: getSkillById(profile.selectedSkillIds.skill2),
      ultimate: getSkillById(profile.selectedSkillIds.ultimate),
    };
    const xp = getXpProgress(profile.xp);
    const profileV2 = getPlayerProfileV2Summary(profile);
    const campaignProgress = getCampaignProgress(profile);
    const missionStates = getDailyMissionStates(profile);
    const completedMissions = missionStates.filter((mission) => mission.completed).length;
    const claimableMissions = missionStates.filter((mission) => mission.completed && !mission.claimed).length;

    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "menu-start-screen")
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setDepth(0);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x020304, 0.66).setDepth(1);

    this.add.text(GAME_WIDTH / 2, 24, "PLAYER PROFILE", {
      fontFamily: "Arial", fontSize: "28px", color: "#72ff57", fontStyle: "bold", stroke: "#041004", strokeThickness: 6,
    }).setOrigin(0.5).setDepth(3);

    this.add.text(GAME_WIDTH / 2, 54, `PROFILE V2 · POWER ${profileV2.progress.powerScore} · ${GAME_CONFIG.version}`, {
      fontFamily: "Arial", fontSize: "11px", color: "#d7ffd0", fontStyle: "bold", stroke: "#041004", strokeThickness: 3,
    }).setOrigin(0.5).setDepth(3);

    this.createHeroCard(skin, profileV2.displayName, profile.level, profile.coins, profile.xp, xp.remaining, profileV2.progress.powerScore);
    this.createStatsCard(profile.totalWins, profile.totalLosses, profile.bestScore, completedMissions, claimableMissions, profileV2.multiplayer.taskPoints, profileV2.multiplayer.rankPoints);
    this.createLoadoutCard(skin.name, stage.name, boss.name, skills.skill1.name, skills.skill2.name, skills.ultimate.name);
    this.createProgressCard(profile.unlockedSkinIds.length, profile.unlockedSkillIds.length, profile.unlockedStageIds.length, campaignProgress);
    const saveStatus = getSaveStatus();
    this.createResourceCard(
      profile.leakPoints,
      profile.skinShards,
      profile.skillCards,
      profileV2.multiplayer.tournamentPoints,
      profileV2.multiplayer.duelRating,
      saveStatus.mainReadable,
      saveStatus.backupReadable,
    );
    this.createFooterButtons();
  }

  private createHeroCard(skin: ReturnType<typeof getSkinById>, displayName: string, level: number, coins: number, xp: number, xpRemaining: number, powerScore: number): void {
    const x = 164;
    this.add.rectangle(x, 194, 250, 246, 0x071107, 0.88)
      .setStrokeStyle(2, skin.auraColor, 0.48)
      .setDepth(2);
    this.add.ellipse(x, 196, 122, 178, skin.auraColor, 0.08).setDepth(3);
    this.add.image(x, 188, skin.previewKey)
      .setDisplaySize(138, 176)
      .setTint(skin.tintColor)
      .setDepth(4);

    this.add.text(x, 300, displayName.toUpperCase(), {
      fontFamily: "Arial", fontSize: "13px", color: "#fcfff7", fontStyle: "bold", stroke: "#041004", strokeThickness: 4,
    }).setOrigin(0.5).setDepth(4);
    this.add.text(x, 318, skin.name.toUpperCase(), {
      fontFamily: "Arial", fontSize: "12px", color: skin.uiColor, fontStyle: "bold", stroke: "#041004", strokeThickness: 4,
    }).setOrigin(0.5).setDepth(4);
    this.add.text(x, 342, `LV ${level} · POWER ${powerScore}\nXP ${xp} · NEXT ${xpRemaining}\nCOINS ${coins}`, {
      fontFamily: "Arial", fontSize: "12px", color: "#fcfff7", fontStyle: "bold", align: "center", stroke: "#041004", strokeThickness: 3,
      lineSpacing: 3,
    }).setOrigin(0.5).setDepth(4);
  }

  private createStatsCard(wins: number, losses: number, bestScore: number, completedMissions: number, claimableMissions: number, taskPoints: number, rankPoints: number): void {
    this.createPanel(430, 142, 246, 124, "PROFILE STATS V2", 0x72ff57);
    const lines = [
      `WINS: ${wins} / LOSSES: ${losses}`,
      `BEST SCORE: ${bestScore}`,
      `MISSIONS DONE: ${completedMissions}`,
      `CLAIMABLE: ${claimableMissions}`,
      `TASK PTS: ${taskPoints} · RANK PTS: ${rankPoints}`,
    ];
    this.writeLines(322, 130, lines, "#fcfff7");
  }

  private createLoadoutCard(skin: string, stage: string, boss: string, skill1: string, skill2: string, ultimate: string): void {
    this.createPanel(430, 288, 246, 138, "ACTIVE LOADOUT", 0xb66cff);
    this.writeLines(322, 268, [
      `SKIN: ${skin}`,
      `STAGE: ${stage}`,
      `BOSS: ${boss}`,
      `S1: ${skill1}`,
      `S2: ${skill2}`,
      `ULT: ${ultimate}`,
    ], "#d7ffd0", 10);
  }

  private createProgressCard(unlockedSkins: number, unlockedSkills: number, unlockedStages: number, campaignProgress: Record<string, number>): void {
    this.createPanel(700, 142, 266, 124, "UNLOCK PROGRESS", 0xffeb72);
    const cleared = CAMPAIGN_CHAPTERS.reduce((sum, chapter) => sum + (campaignProgress[chapter.id] ?? 0), 0);
    this.writeLines(576, 130, [
      `SKINS: ${unlockedSkins}/${SKINS.length}`,
      `SKILLS: ${unlockedSkills}/${SKILLS.length}`,
      `STAGES: ${unlockedStages}/${STAGES.length}`,
      `BOSSES CLEARED: ${cleared}`,
      `CHAPTERS: ${CAMPAIGN_CHAPTERS.length}`,
    ], "#fcfff7");
  }

  private createResourceCard(leakPoints: number, skinShards: number, skillCards: number, tournamentPoints: number, duelRating: number, saveOk: boolean, backupOk: boolean): void {
    this.createPanel(700, 288, 266, 138, "RESOURCES / SAVE V2", 0x8cdcff);
    this.writeLines(576, 274, [
      `LEAK: ${leakPoints} · TP: ${tournamentPoints}`,
      `DUEL RATING: ${duelRating}`,
      `SKIN SHARDS: ${skinShards}`,
      `SKILL CARDS: ${skillCards}`,
      `SAVE ${saveOk ? "OK" : "EMPTY"} · BACKUP ${backupOk ? "OK" : "EMPTY"}`,
    ], "#d7ffd0", 11);
  }

  private createPanel(x: number, y: number, w: number, h: number, title: string, color: number): void {
    this.add.rectangle(x, y, w, h, 0x071107, 0.9)
      .setStrokeStyle(2, color, 0.42)
      .setDepth(2);
    this.add.text(x, y - h / 2 + 16, title, {
      fontFamily: "Arial", fontSize: "13px", color: "#72ff57", fontStyle: "bold", stroke: "#041004", strokeThickness: 4,
    }).setOrigin(0.5).setDepth(3);
  }

  private writeLines(x: number, y: number, lines: string[], color: string, fontSize = 11): void {
    lines.forEach((line, index) => {
      this.add.text(x, y + index * 19, line.toUpperCase(), {
        fontFamily: "Arial", fontSize: `${fontSize}px`, color, fontStyle: "bold", stroke: "#041004", strokeThickness: 3,
      }).setDepth(3);
    });
  }

  private createFooterButtons(): void {
    const items = [
      { label: "PLAY", x: 180, route: SCENE_KEYS.arena, color: 0x72ff57 },
      { label: "CAMPAIGN", x: 300, route: SCENE_KEYS.campaign, color: 0xb66cff },
      { label: "SKINS", x: 420, route: SCENE_KEYS.skinSelect, color: 0x72ff57 },
      { label: "SKILLS", x: 540, route: SCENE_KEYS.skillLoadout, color: 0xffeb72 },
      { label: "MISSIONS", x: 660, route: SCENE_KEYS.missions, color: 0x8cdcff },
      { label: "MENU", x: 780, route: SCENE_KEYS.menu, color: 0xfcfff7 },
    ];
    items.forEach((item) => this.createFooterButton(item.x, item.label, item.color, () => this.scene.start(item.route)));
  }

  private createFooterButton(x: number, label: string, color: number, callback: () => void): void {
    const button = this.add.rectangle(x, GAME_HEIGHT - 30, 106, 32, 0x071107, 0.92)
      .setStrokeStyle(2, color, 0.55)
      .setDepth(10)
      .setInteractive({ useHandCursor: true });
    this.add.text(x, GAME_HEIGHT - 30, label, {
      fontFamily: "Arial", fontSize: "11px", color: "#fcfff7", fontStyle: "bold", stroke: "#041004", strokeThickness: 3,
    }).setOrigin(0.5).setDepth(11);
    button.on("pointerdown", callback);
  }
}
