import Phaser from "phaser";
import { GAME_CONFIG, GAME_HEIGHT, GAME_WIDTH } from "../../config/game";
import { SCENE_KEYS } from "../../config/routes";
import {
  LEADERBOARD_DEFINITIONS,
  createLeaderboardAdapterSnapshot,
  createLeaderboardAdapterSubmitPreview,
  getLeaderboardDefinition,
  getWeeklyLeaderboardPreview,
  isWeeklyLeaderboardId,
  loadPlayerProfile,
  type LeaderboardId,
  type LocalLeaderboardMockRow,
} from "../data/gameRegistry";

export class LeaderboardScene extends Phaser.Scene {
  private selectedLeaderboardId: LeaderboardId = "global_power";
  private content?: Phaser.GameObjects.Container;

  constructor() {
    super(SCENE_KEYS.leaderboard);
  }

  create(): void {
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "menu-start-screen")
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setDepth(0);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x020304, 0.72).setDepth(1);

    this.add.text(GAME_WIDTH / 2, 23, "LEADERBOARDS", {
      fontFamily: "Arial",
      fontSize: "27px",
      color: "#72ff57",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(3);

    this.add.text(GAME_WIDTH / 2, 51, `${GAME_CONFIG.version} · ADAPTER READY · PUBLIC SUBMIT DISABLED`, {
      fontFamily: "Arial",
      fontSize: "10px",
      color: "#d7ffd0",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(3);

    this.createTabs();
    this.renderLeaderboard();
    this.createFooterButtons();
  }

  private createTabs(): void {
    LEADERBOARD_DEFINITIONS.forEach((definition, index) => {
      const x = 150 + index * 124;
      const isSelected = definition.id === this.selectedLeaderboardId;
      const color = this.getLeaderboardColor(definition.id);
      const tab = this.add.rectangle(x, 79, 112, 35, isSelected ? 0x112811 : 0x071107, isSelected ? 0.98 : 0.88)
        .setStrokeStyle(isSelected ? 3 : 2, color, isSelected ? 0.88 : 0.44)
        .setDepth(4)
        .setInteractive({ useHandCursor: true });

      this.add.text(x, 73, definition.shortTitle, {
        fontFamily: "Arial",
        fontSize: definition.shortTitle.length > 7 ? "9px" : "11px",
        color: isSelected ? "#72ff57" : "#fcfff7",
        fontStyle: "bold",
        stroke: "#041004",
        strokeThickness: 3,
      }).setOrigin(0.5).setDepth(5);

      this.add.text(x, 88, definition.scope.toUpperCase(), {
        fontFamily: "Arial",
        fontSize: "7px",
        color: "#d7ffd0",
        fontStyle: "bold",
        stroke: "#041004",
        strokeThickness: 2,
      }).setOrigin(0.5).setDepth(5);

      tab.on("pointerdown", () => {
        this.selectedLeaderboardId = definition.id;
        this.scene.restart();
      });
      tab.on("pointerover", () => tab.setAlpha(0.94));
      tab.on("pointerout", () => tab.setAlpha(1));
    });
  }

  private renderLeaderboard(): void {
    this.content?.destroy(true);
    this.content = this.add.container(0, 0).setDepth(3);

    const profile = loadPlayerProfile();
    const definition = getLeaderboardDefinition(this.selectedLeaderboardId);
    const adapterSnapshot = createLeaderboardAdapterSnapshot(this.selectedLeaderboardId, profile);
    const submitPreview = createLeaderboardAdapterSubmitPreview(this.selectedLeaderboardId, profile);
    const snapshot = adapterSnapshot.snapshot;
    const weeklyPreview = getWeeklyLeaderboardPreview(this.selectedLeaderboardId, profile);
    const playerEntry = snapshot.playerEntry;
    const color = this.getLeaderboardColor(this.selectedLeaderboardId);

    this.content.add(this.createPanel(206, 225, 318, 246, color));
    this.content.add(this.createPanel(622, 225, 486, 246, color));

    this.content.add(this.add.text(68, 115, definition.title.toUpperCase(), {
      fontFamily: "Arial", fontSize: "18px", color: "#72ff57", fontStyle: "bold", stroke: "#041004", strokeThickness: 5,
    }).setDepth(4));

    this.content.add(this.add.text(68, 143, definition.theme.toUpperCase(), {
      fontFamily: "Arial", fontSize: "9px", color: "#d7ffd0", fontStyle: "bold", stroke: "#041004", strokeThickness: 3,
      wordWrap: { width: 276 },
      lineSpacing: 2,
    }).setDepth(4));

    const statusLines = [
      `PERIOD: ${snapshot.periodKey}`,
      `METRIC: ${definition.metric.replace(/_/g, " ")}`,
      `RESET: ${definition.resetRule}`,
      `BACKEND: ${definition.backendStatus.replace(/_/g, " ")}`,
      `ADAPTER: ${adapterSnapshot.providerId.replace(/_/g, " ")}`,
      `SUBMIT: ${submitPreview.adapterSubmitLock.replace(/_/g, " ")}`,
    ];
    statusLines.forEach((line, index) => {
      this.content?.add(this.add.text(68, 200 + index * 18, line.toUpperCase(), {
        fontFamily: "Arial", fontSize: "10px", color: index >= 4 ? "#ffeb72" : "#fcfff7", fontStyle: "bold", stroke: "#041004", strokeThickness: 3,
      }).setDepth(4));
    });

    if (weeklyPreview) {
      this.content.add(this.add.text(68, 304, "WEEKLY WINDOW:", {
        fontFamily: "Arial", fontSize: "10px", color: "#8cdcff", fontStyle: "bold", stroke: "#041004", strokeThickness: 3,
      }).setDepth(4));
      [
        `RESET: ${weeklyPreview.resetNotice}`,
        `NEXT: ${weeklyPreview.period.nextResetAtIso.slice(0, 10)} ${weeklyPreview.period.nextResetAtIso.slice(11, 16)} UTC`,
        `LOCK: ${weeklyPreview.submitLock.replace(/_/g, " ")}`,
      ].forEach((line, index) => {
        this.content?.add(this.add.text(68, 321 + index * 14, line.toUpperCase(), {
          fontFamily: "Arial", fontSize: "8px", color: index === 2 ? "#ffeb72" : "#d7ffd0", fontStyle: "bold", stroke: "#041004", strokeThickness: 2,
          wordWrap: { width: 270 },
        }).setDepth(4));
      });
    }

    const requirements = submitPreview.requiredBeforeRemote.slice(0, weeklyPreview ? 2 : 3);
    const requirementsY = weeklyPreview ? 368 : 325;
    this.content.add(this.add.text(68, requirementsY, "PUBLIC SUBMIT REQUIRES:", {
      fontFamily: "Arial", fontSize: "10px", color: "#8cdcff", fontStyle: "bold", stroke: "#041004", strokeThickness: 3,
    }).setDepth(4));
    requirements.forEach((line, index) => {
      this.content?.add(this.add.text(68, requirementsY + 17 + index * 14, `• ${line}`.toUpperCase(), {
        fontFamily: "Arial", fontSize: "8px", color: "#d7ffd0", fontStyle: "bold", stroke: "#041004", strokeThickness: 2,
        wordWrap: { width: 270 },
      }).setDepth(4));
    });

    this.content.add(this.add.text(404, 113, "RANK", this.tableHeaderStyle()).setDepth(4));
    this.content.add(this.add.text(455, 113, "PLAYER", this.tableHeaderStyle()).setDepth(4));
    this.content.add(this.add.text(690, 113, "VALUE", this.tableHeaderStyle()).setDepth(4));
    this.content.add(this.add.text(790, 113, "STATUS", this.tableHeaderStyle()).setDepth(4));

    snapshot.entries.slice(0, 8).forEach((entry, index) => this.createLeaderboardRow(entry, 136 + index * 25));

    this.content.add(this.add.text(398, 348, playerEntry ? `YOUR RANK: #${playerEntry.rank} · ${this.formatValue(playerEntry.value, this.selectedLeaderboardId)}` : "YOUR RANK: N/A", {
      fontFamily: "Arial", fontSize: "13px", color: "#72ff57", fontStyle: "bold", stroke: "#041004", strokeThickness: 4,
    }).setDepth(4));

    this.content.add(this.add.text(398, 370, this.getSnapshotNotice(adapterSnapshot.notice), {
      fontFamily: "Arial", fontSize: "9px", color: adapterSnapshot.adapterReadiness.remoteRequired ? "#ffeb72" : "#d7ffd0", fontStyle: "bold", stroke: "#041004", strokeThickness: 3,
      wordWrap: { width: 430 },
    }).setDepth(4));
  }

  private createLeaderboardRow(entry: LocalLeaderboardMockRow, y: number): void {
    const rowColor = entry.isLocalPlayer ? 0x123512 : entry.backendLocked ? 0x1d1a08 : 0x071107;
    const strokeColor = entry.isLocalPlayer ? 0x72ff57 : entry.backendLocked ? 0xffeb72 : 0x8cdcff;
    const textColor = entry.isLocalPlayer ? "#72ff57" : "#fcfff7";
    const status = entry.isLocalPlayer ? "YOU" : entry.backendLocked ? "LOCKED" : "MOCK";

    this.content?.add(this.add.rectangle(622, y + 9, 442, 22, rowColor, 0.84)
      .setStrokeStyle(entry.isLocalPlayer ? 2 : 1, strokeColor, entry.isLocalPlayer ? 0.74 : 0.28)
      .setDepth(3));

    this.content?.add(this.add.text(405, y, `#${entry.rank}`, {
      fontFamily: "Arial", fontSize: "11px", color: textColor, fontStyle: "bold", stroke: "#041004", strokeThickness: 3,
    }).setDepth(4));
    this.content?.add(this.add.text(455, y, entry.displayName.toUpperCase().slice(0, 23), {
      fontFamily: "Arial", fontSize: "11px", color: textColor, fontStyle: "bold", stroke: "#041004", strokeThickness: 3,
    }).setDepth(4));
    this.content?.add(this.add.text(690, y, this.formatValue(entry.value, this.selectedLeaderboardId), {
      fontFamily: "Arial", fontSize: "11px", color: "#ffeb72", fontStyle: "bold", stroke: "#041004", strokeThickness: 3,
    }).setDepth(4));
    this.content?.add(this.add.text(790, y, status, {
      fontFamily: "Arial", fontSize: "9px", color: entry.backendLocked ? "#ffeb72" : "#d7ffd0", fontStyle: "bold", stroke: "#041004", strokeThickness: 3,
    }).setDepth(4));
  }


  private getSnapshotNotice(notice: string): string {
    if (!isWeeklyLeaderboardId(this.selectedLeaderboardId)) return notice;
    return `${notice} Weekly reset skeleton is active for preview only.`;
  }

  private createFooterButtons(): void {
    const items = [
      { label: "MISSIONS", x: 196, route: SCENE_KEYS.missions, color: 0xffeb72 },
      { label: "PROFILE", x: 336, route: SCENE_KEYS.profile, color: 0xb66cff },
      { label: "MENU", x: 476, route: SCENE_KEYS.menu, color: 0xfcfff7 },
      { label: "PLAY", x: 616, route: SCENE_KEYS.arena, color: 0x72ff57 },
      { label: "CAMPAIGN", x: 756, route: SCENE_KEYS.campaign, color: 0x8cdcff },
    ];
    items.forEach((item) => this.createFooterButton(item.x, item.label, item.color, () => this.scene.start(item.route)));
  }

  private createFooterButton(x: number, label: string, color: number, callback: () => void): void {
    const button = this.add.rectangle(x, GAME_HEIGHT - 25, 118, 30, 0x071107, 0.92)
      .setStrokeStyle(2, color, 0.55)
      .setDepth(10)
      .setInteractive({ useHandCursor: true });
    this.add.text(x, GAME_HEIGHT - 25, label, {
      fontFamily: "Arial", fontSize: "11px", color: "#fcfff7", fontStyle: "bold", stroke: "#041004", strokeThickness: 3,
    }).setOrigin(0.5).setDepth(11);
    button.on("pointerdown", callback);
    button.on("pointerover", () => button.setScale(1.025));
    button.on("pointerout", () => button.setScale(1));
  }

  private createPanel(x: number, y: number, width: number, height: number, color: number): Phaser.GameObjects.Rectangle {
    return this.add.rectangle(x, y, width, height, 0x071107, 0.9)
      .setStrokeStyle(2, color, 0.48)
      .setDepth(2);
  }

  private tableHeaderStyle(): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      fontFamily: "Arial",
      fontSize: "9px",
      color: "#8cdcff",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 3,
    };
  }

  private formatValue(value: number, leaderboardId: LeaderboardId): string {
    if (leaderboardId === "boss_damage" && value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 100000) return `${Math.round(value / 1000)}K`;
    return value.toLocaleString("en-US");
  }

  private getLeaderboardColor(leaderboardId: LeaderboardId): number {
    switch (leaderboardId) {
      case "global_power": return 0x72ff57;
      case "weekly_arena": return 0x8cdcff;
      case "task_points": return 0xffeb72;
      case "tournament": return 0xb66cff;
      case "duel_ranked": return 0xff7aeb;
      case "boss_damage": return 0xff6242;
      default: return 0xfcfff7;
    }
  }
}
