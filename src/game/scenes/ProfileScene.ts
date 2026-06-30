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
  getMasterySummary,
  getSkillUpgradeSummary,
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
    const skillUpgradeSummary = getSkillUpgradeSummary(profile);
    const masterySummary = getMasterySummary(profile);
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

    this.createHeroCard(
      skin,
      profileV2.displayName,
      profile.level,
      profile.coins,
      profile.xp,
      xp.remaining,
      profileV2.progress.powerScore,
      profileV2.progress.evolutionName,
      profileV2.progress.evolutionTitle,
      profileV2.progress.nextEvolutionName,
      profileV2.progress.nextEvolutionRequirement,
    );
    this.createStatsCard(profile.totalWins, profile.totalLosses, profile.bestScore, completedMissions, claimableMissions, profileV2.multiplayer.taskPoints, profileV2.multiplayer.rankPoints);
    const skillLine = (skillId: string, name: string): string => {
      const state = skillUpgradeSummary.activeLoadout.find((item) => item.skillId === skillId);
      return `${name} LV ${state?.level ?? 1}/${state?.maxLevel ?? 10}`;
    };
    this.createLoadoutCard(
      stage.name,
      boss.name,
      skillLine(profile.selectedSkillIds.skill1, skills.skill1.name),
      skillLine(profile.selectedSkillIds.skill2, skills.skill2.name),
      skillLine(profile.selectedSkillIds.ultimate, skills.ultimate.name),
      profileV2.progress.skillUpgradePower,
      profileV2.progress.readySkillUpgrades,
    );
    this.createProgressCard(profile.unlockedSkinIds.length, profile.unlockedSkillIds.length, profile.unlockedStageIds.length, campaignProgress);
    const saveStatus = getSaveStatus();
    this.createResourceCard(
      profile.leakPoints,
      profile.skinShards,
      profile.skillCards,
      profileV2.multiplayer.tournamentPoints,
      profileV2.multiplayer.duelRating,
      masterySummary.totalBranchLevels,
      masterySummary.totalMaxBranchLevels,
      masterySummary.totalMasteryPower,
      masterySummary.availablePoints,
      masterySummary.nextUnlockBranch?.shortName,
      masterySummary.nextUnlockBranch?.unlockLabel,
      saveStatus.mainReadable,
      saveStatus.backupReadable,
    );
    this.createFooterButtons();
  }

  private createHeroCard(
    skin: ReturnType<typeof getSkinById>,
    displayName: string,
    level: number,
    coins: number,
    xp: number,
    xpRemaining: number,
    powerScore: number,
    evolutionName: string,
    evolutionTitle: string,
    nextEvolutionName?: string,
    nextEvolutionRequirement?: string,
  ): void {
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
    const nextEvolutionLine = nextEvolutionName ? `NEXT EVO: ${nextEvolutionName} (${nextEvolutionRequirement})` : "NEXT EVO: SEASON PRESTIGE";
    this.add.text(x, 342, `LV ${level} · POWER ${powerScore}\nXP ${xp} · NEXT ${xpRemaining} · COINS ${coins}\nEVO: ${evolutionName} · ${evolutionTitle}\n${nextEvolutionLine}`, {
      fontFamily: "Arial", fontSize: "10px", color: "#fcfff7", fontStyle: "bold", align: "center", stroke: "#041004", strokeThickness: 3,
      lineSpacing: 2,
      wordWrap: { width: 224 },
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

  private createLoadoutCard(stage: string, boss: string, skill1: string, skill2: string, ultimate: string, skillPower: number, readySkillUpgrades: number): void {
    this.createPanel(430, 288, 246, 138, "ACTIVE LOADOUT", 0xb66cff);
    this.writeLines(322, 268, [
      `SKILL POWER: ${skillPower} · READY: ${readySkillUpgrades}`,
      `S1: ${skill1}`,
      `S2: ${skill2}`,
      `ULT: ${ultimate}`,
      `STAGE: ${stage}`,
      `BOSS: ${boss}`,
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

  private createResourceCard(
    leakPoints: number,
    skinShards: number,
    skillCards: number,
    tournamentPoints: number,
    duelRating: number,
    masteryBranchTotal: number,
    masteryBranchMax: number,
    masteryPower: number,
    masteryAvailablePoints: number,
    nextMasteryName: string | undefined,
    nextMasteryRequirement: string | undefined,
    saveOk: boolean,
    backupOk: boolean,
  ): void {
    this.createPanel(700, 288, 266, 138, "RESOURCES / MASTERY", 0x8cdcff);
    const nextMasteryLine = nextMasteryName ? `NEXT ${nextMasteryName}: ${nextMasteryRequirement}` : "NEXT MASTERY: ALL BRANCHES OPEN";
    this.writeLines(576, 270, [
      `MASTERY: ${masteryBranchTotal}/${masteryBranchMax} · PWR ${masteryPower}`,
      `FREE POINTS: ${masteryAvailablePoints} · DUEL ${duelRating}`,
      `LEAK: ${leakPoints} · TP: ${tournamentPoints}`,
      `CARDS: ${skillCards} · SHARDS: ${skinShards}`,
      nextMasteryLine,
      `SAVE ${saveOk ? "OK" : "EMPTY"} · BACKUP ${backupOk ? "OK" : "EMPTY"}`,
    ], "#d7ffd0", 10);
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
