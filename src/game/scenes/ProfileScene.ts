import Phaser from "phaser";
import { GAME_CONFIG, GAME_HEIGHT, GAME_WIDTH } from "../../config/game";
import { SCENE_KEYS } from "../../config/routes";
import {
  getProgressionDashboard,
  getSaveStatus,
  getSelectedCampaignBoss,
  getSkinById,
  getStageById,
  loadPlayerProfile,
  type EvolutionUiRow,
  type MasteryProgressionUiRow,
  type PowerBreakdownUiRow,
  type ProgressionGoalUiRow,
  type ProgressionMeterRow,
  type ProgressionUiRowTone,
  type SkillProgressionUiRow,
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
    const dashboard = getProgressionDashboard(profile);
    const saveStatus = getSaveStatus();

    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "menu-start-screen")
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setDepth(0);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x020304, 0.68).setDepth(1);

    this.add.text(GAME_WIDTH / 2, 22, dashboard.title, {
      fontFamily: "Arial", fontSize: "27px", color: "#72ff57", fontStyle: "bold", stroke: "#041004", strokeThickness: 6,
    }).setOrigin(0.5).setDepth(3);

    this.add.text(GAME_WIDTH / 2, 51, `${dashboard.subtitle} · ${GAME_CONFIG.version}`.toUpperCase(), {
      fontFamily: "Arial", fontSize: "10px", color: "#d7ffd0", fontStyle: "bold", stroke: "#041004", strokeThickness: 3,
    }).setOrigin(0.5).setDepth(3);

    this.createHeroCard(
      skin,
      profile.identity.displayName,
      profile.level,
      profile.xp,
      profile.coins,
      profile.leakPoints,
      dashboard.powerScore,
      dashboard.evolutionRows.find((row) => row.status === "current"),
      stage.name,
      boss.name,
    );
    this.createPowerCard(dashboard.powerRows, dashboard.xpRows[0]);
    this.createGoalsCard(dashboard.nextGoals);
    this.createEvolutionCard(dashboard.evolutionRows);
    this.createSkillMasteryCard(dashboard.activeSkillRows, dashboard.upgradeCandidateRows, dashboard.masteryRows);
    this.createFooterStatus(saveStatus.mainReadable, saveStatus.backupReadable);
    this.createFooterButtons();
  }

  private createHeroCard(
    skin: ReturnType<typeof getSkinById>,
    displayName: string,
    level: number,
    xp: number,
    coins: number,
    leakPoints: number,
    powerScore: number,
    currentEvolution: EvolutionUiRow | undefined,
    stageName: string,
    bossName: string,
  ): void {
    const x = 150;
    this.add.rectangle(x, 204, 248, 260, 0x071107, 0.9)
      .setStrokeStyle(2, skin.auraColor, 0.52)
      .setDepth(2);
    this.add.ellipse(x, 182, 126, 170, skin.auraColor, 0.08).setDepth(3);
    this.add.image(x, 170, skin.previewKey)
      .setDisplaySize(132, 168)
      .setTint(skin.tintColor)
      .setDepth(4);

    this.add.text(x, 276, (displayName || "Broke Fighter").toUpperCase(), {
      fontFamily: "Arial", fontSize: "13px", color: "#fcfff7", fontStyle: "bold", stroke: "#041004", strokeThickness: 4,
    }).setOrigin(0.5).setDepth(4);
    this.add.text(x, 296, `${currentEvolution?.name ?? "Broke Rookie"} · ${skin.name}`.toUpperCase(), {
      fontFamily: "Arial", fontSize: "11px", color: skin.uiColor, fontStyle: "bold", stroke: "#041004", strokeThickness: 4,
    }).setOrigin(0.5).setDepth(4);

    this.writeLines(42, 318, [
      `LV ${level} · POWER ${powerScore}`,
      `XP ${xp} · COINS ${coins} · LEAK ${leakPoints}`,
      `STAGE: ${stageName}`,
      `BOSS: ${bossName}`,
    ], "#fcfff7", 10, 18);
  }

  private createPowerCard(powerRows: readonly PowerBreakdownUiRow[], xpRow: ProgressionMeterRow | undefined): void {
    this.createPanel(430, 141, 250, 128, "POWER / LEVEL", 0x72ff57);
    if (xpRow) {
      this.add.text(318, 101, `${xpRow.label} · ${xpRow.detail}`.toUpperCase(), {
        fontFamily: "Arial", fontSize: "10px", color: "#fcfff7", fontStyle: "bold", stroke: "#041004", strokeThickness: 3,
      }).setDepth(3);
      this.createMeter(318, 120, 214, xpRow.percent, this.getToneColor(xpRow.tone));
    }

    powerRows.slice(0, 5).forEach((row, index) => {
      const y = 144 + index * 18;
      this.add.text(318, y, row.label, {
        fontFamily: "Arial", fontSize: "9px", color: "#d7ffd0", fontStyle: "bold", stroke: "#041004", strokeThickness: 3,
      }).setDepth(3);
      this.createMeter(386, y + 4, 96, row.percent, this.getToneColor(row.tone));
      this.add.text(490, y, row.detail, {
        fontFamily: "Arial", fontSize: "9px", color: "#fcfff7", fontStyle: "bold", stroke: "#041004", strokeThickness: 3,
      }).setDepth(3);
    });
  }

  private createGoalsCard(goals: readonly ProgressionGoalUiRow[]): void {
    this.createPanel(704, 141, 276, 128, "NEXT GOALS", 0xffeb72);
    goals.slice(0, 5).forEach((goal, index) => {
      const y = 102 + index * 22;
      const color = this.getToneColor(goal.tone);
      this.add.circle(586, y + 5, 4, color, 0.92).setDepth(3);
      this.add.text(596, y, goal.label.toUpperCase(), {
        fontFamily: "Arial", fontSize: "10px", color: "#fcfff7", fontStyle: "bold", stroke: "#041004", strokeThickness: 3,
      }).setDepth(3);
      this.add.text(596, y + 11, goal.detail.toUpperCase(), {
        fontFamily: "Arial", fontSize: "8px", color: "#d7ffd0", fontStyle: "bold", stroke: "#041004", strokeThickness: 2,
      }).setDepth(3);
    });
  }

  private createEvolutionCard(rows: readonly EvolutionUiRow[]): void {
    this.createPanel(430, 294, 250, 136, "MASCOT EVOLUTION", 0xb66cff);
    rows.slice(0, 6).forEach((row, index) => {
      const y = 257 + index * 18;
      const color = row.status === "current" ? "#72ff57" : row.status === "unlocked" ? "#8cdcff" : "#7f8a78";
      const marker = row.status === "current" ? "▶" : row.status === "unlocked" ? "✓" : "×";
      this.add.text(316, y, `${marker} T${row.tier} ${row.name}`.toUpperCase(), {
        fontFamily: "Arial", fontSize: "9px", color, fontStyle: "bold", stroke: "#041004", strokeThickness: 3,
      }).setDepth(3);
      this.add.text(458, y, `PWR ${row.powerValue}`.toUpperCase(), {
        fontFamily: "Arial", fontSize: "9px", color: "#fcfff7", fontStyle: "bold", stroke: "#041004", strokeThickness: 3,
      }).setDepth(3);
      this.add.text(316, y + 9, row.status === "locked" ? row.requirement.toUpperCase() : row.title.toUpperCase(), {
        fontFamily: "Arial", fontSize: "7px", color: "#d7ffd0", fontStyle: "bold", stroke: "#041004", strokeThickness: 2,
      }).setDepth(3);
    });
  }

  private createSkillMasteryCard(
    activeSkills: readonly SkillProgressionUiRow[],
    candidates: readonly SkillProgressionUiRow[],
    masteryRows: readonly MasteryProgressionUiRow[],
  ): void {
    this.createPanel(704, 294, 276, 136, "SKILLS / MASTERY", 0x8cdcff);
    const loadoutRows = activeSkills.slice(-3);
    loadoutRows.forEach((row, index) => {
      const y = 255 + index * 18;
      this.add.text(578, y, `${row.role}: ${row.name}`.toUpperCase(), {
        fontFamily: "Arial", fontSize: "9px", color: "#fcfff7", fontStyle: "bold", stroke: "#041004", strokeThickness: 3,
      }).setDepth(3);
      this.add.text(738, y, `LV ${row.level}/${row.maxLevel} P${row.powerValue}`.toUpperCase(), {
        fontFamily: "Arial", fontSize: "9px", color: row.status === "ready" ? "#72ff57" : "#d7ffd0", fontStyle: "bold", stroke: "#041004", strokeThickness: 3,
      }).setDepth(3);
    });

    const candidate = candidates[0];
    this.add.text(578, 314, candidate ? `NEXT UPGRADE: ${candidate.name}`.toUpperCase() : "NEXT UPGRADE: WAITING FOR CARDS", {
      fontFamily: "Arial", fontSize: "9px", color: candidate?.status === "ready" ? "#72ff57" : "#ffeb72", fontStyle: "bold", stroke: "#041004", strokeThickness: 3,
    }).setDepth(3);
    this.add.text(578, 326, candidate ? candidate.costLabel.toUpperCase() : "UPGRADE FLOW LOCKED", {
      fontFamily: "Arial", fontSize: "8px", color: "#d7ffd0", fontStyle: "bold", stroke: "#041004", strokeThickness: 2,
    }).setDepth(3);

    masteryRows.slice(0, 6).forEach((row, index) => {
      const x = 582 + (index % 3) * 86;
      const y = 354 + Math.floor(index / 3) * 22;
      const color = row.status === "locked" ? "#7f8a78" : row.status === "active" ? "#72ff57" : "#8cdcff";
      this.add.text(x, y, `${row.shortName} ${row.level}/${row.maxLevel}`.toUpperCase(), {
        fontFamily: "Arial", fontSize: "8px", color, fontStyle: "bold", stroke: "#041004", strokeThickness: 2,
      }).setDepth(3);
      this.add.text(x, y + 10, row.status === "locked" ? row.unlockLabel.toUpperCase() : `PWR ${row.powerValue}`.toUpperCase(), {
        fontFamily: "Arial", fontSize: "7px", color: "#d7ffd0", fontStyle: "bold", stroke: "#041004", strokeThickness: 2,
      }).setDepth(3);
    });
  }

  private createFooterStatus(saveOk: boolean, backupOk: boolean): void {
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 62, `PROGRESSION UI ONLY · COMBAT BONUSES LOCKED · SAVE ${saveOk ? "OK" : "EMPTY"} · BACKUP ${backupOk ? "OK" : "EMPTY"}`, {
      fontFamily: "Arial", fontSize: "9px", color: "#d7ffd0", fontStyle: "bold", stroke: "#041004", strokeThickness: 3,
    }).setOrigin(0.5).setDepth(4);
  }

  private createPanel(x: number, y: number, w: number, h: number, title: string, color: number): void {
    this.add.rectangle(x, y, w, h, 0x071107, 0.9)
      .setStrokeStyle(2, color, 0.44)
      .setDepth(2);
    this.add.text(x, y - h / 2 + 16, title, {
      fontFamily: "Arial", fontSize: "12px", color: "#72ff57", fontStyle: "bold", stroke: "#041004", strokeThickness: 4,
    }).setOrigin(0.5).setDepth(3);
  }

  private createMeter(x: number, y: number, width: number, percent: number, color: number): void {
    const fillWidth = Math.max(2, Math.floor(width * Math.max(0, Math.min(100, percent)) / 100));
    this.add.rectangle(x, y, width, 6, 0x1a2a1a, 0.92).setOrigin(0, 0.5).setDepth(3);
    this.add.rectangle(x, y, fillWidth, 6, color, 0.86).setOrigin(0, 0.5).setDepth(4);
  }

  private getToneColor(tone: ProgressionUiRowTone): number {
    switch (tone) {
      case "ready": return 0x72ff57;
      case "active": return 0x8cdcff;
      case "locked": return 0xff9a3d;
      case "capped": return 0xffeb72;
      case "future":
      default:
        return 0xb66cff;
    }
  }

  private writeLines(x: number, y: number, lines: string[], color: string, fontSize = 11, step = 19): void {
    lines.forEach((line, index) => {
      this.add.text(x, y + index * step, line.toUpperCase(), {
        fontFamily: "Arial", fontSize: `${fontSize}px`, color, fontStyle: "bold", stroke: "#041004", strokeThickness: 3,
      }).setDepth(3);
    });
  }

  private createFooterButtons(): void {
    const items = [
      { label: "PLAY", x: 130, route: SCENE_KEYS.arena, color: 0x72ff57 },
      { label: "CAMPAIGN", x: 240, route: SCENE_KEYS.campaign, color: 0xb66cff },
      { label: "SKINS", x: 350, route: SCENE_KEYS.skinSelect, color: 0x72ff57 },
      { label: "SKILLS", x: 460, route: SCENE_KEYS.skillLoadout, color: 0xffeb72 },
      { label: "MISSIONS", x: 570, route: SCENE_KEYS.missions, color: 0x8cdcff },
      { label: "RANKS", x: 680, route: SCENE_KEYS.leaderboard, color: 0xff7aeb },
      { label: "MENU", x: 790, route: SCENE_KEYS.menu, color: 0xfcfff7 },
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
