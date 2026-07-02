import Phaser from "phaser";
import { GAME_CONFIG, GAME_HEIGHT, GAME_WIDTH } from "../../config/game";
import { SCENE_KEYS } from "../../config/routes";
import {
  createBalanceDebugPanelSnapshot,
  getBalanceDebugCriticalRiskCount,
  getBalanceDebugLockedCount,
  loadPlayerProfile,
  type BalanceDebugMetricCard,
  type BalanceDebugRiskRow,
  type BalanceDebugTone,
} from "../data/gameRegistry";

export class BalanceDebugScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.balanceDebug);
  }

  create(): void {
    const profile = loadPlayerProfile();
    const snapshot = createBalanceDebugPanelSnapshot(profile);
    const riskCount = getBalanceDebugCriticalRiskCount(snapshot);
    const lockedCount = getBalanceDebugLockedCount(snapshot);

    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "menu-start-screen")
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setDepth(0);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x020304, 0.78).setDepth(1);

    this.add.text(GAME_WIDTH / 2, 22, "BALANCE DEBUG PANEL", {
      fontFamily: "Arial",
      fontSize: "25px",
      color: "#72ff57",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(3);

    this.add.text(GAME_WIDTH / 2, 50, `${GAME_CONFIG.version} · LOCAL PREVIEW ONLY · BACKEND SUBMIT OFF`, {
      fontFamily: "Arial",
      fontSize: "10px",
      color: "#d7ffd0",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(3);

    this.createSummaryStrip(snapshot.playerPower, riskCount, lockedCount);
    snapshot.cards.forEach((card, index) => this.createMetricCard(card, index));
    this.createRiskPanel(snapshot.riskRows);
    this.createFooterButtons();
  }

  private createSummaryStrip(playerPower: number, riskCount: number, lockedCount: number): void {
    const panel = this.add.rectangle(GAME_WIDTH / 2, 78, 790, 34, 0x071107, 0.88)
      .setStrokeStyle(2, riskCount > 0 ? 0xff4866 : lockedCount > 0 ? 0xffeb72 : 0x72ff57, 0.48)
      .setDepth(2);

    this.add.text(panel.x, panel.y, `PLAYER POWER ${playerPower} · RISKS ${riskCount} · LOCKED SIGNALS ${lockedCount} · NEXT v0.13.0 MULTIPLAYER ADAPTER`, {
      fontFamily: "Arial",
      fontSize: "11px",
      color: riskCount > 0 ? "#ff4866" : lockedCount > 0 ? "#ffeb72" : "#72ff57",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(3);
  }

  private createMetricCard(card: BalanceDebugMetricCard, index: number): void {
    const column = index % 4;
    const row = Math.floor(index / 4);
    const x = 117 + column * 228;
    const y = 143 + row * 112;
    const width = 206;
    const height = 94;

    this.add.rectangle(x, y, width, height, 0x071107, 0.9)
      .setStrokeStyle(2, card.colorValue, card.status === "risk" ? 0.74 : 0.46)
      .setDepth(3);

    this.add.text(x - 94, y - 39, card.title.toUpperCase(), {
      fontFamily: "Arial",
      fontSize: card.title.length > 16 ? "8px" : "9px",
      color: card.color,
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 3,
    }).setDepth(4);

    this.add.text(x + 94, y - 39, card.statusLabel, {
      fontFamily: "Arial",
      fontSize: "8px",
      color: card.backendLocked ? "#ffeb72" : card.color,
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 3,
    }).setOrigin(1, 0).setDepth(4);

    this.add.text(x - 94, y - 18, card.valueLabel.toUpperCase(), {
      fontFamily: "Arial",
      fontSize: "13px",
      color: "#fcfff7",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 4,
    }).setDepth(4);

    this.add.text(x - 94, y + 1, card.detailLabel.toUpperCase(), {
      fontFamily: "Arial",
      fontSize: "7px",
      color: "#d7ffd0",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 2,
      wordWrap: { width: width - 18 },
    }).setDepth(4);

    card.rows.slice(0, 3).forEach((rowItem, rowIndex) => {
      const textY = y + 24 + rowIndex * 14;
      this.add.text(x - 94, textY, rowItem.label.toUpperCase().slice(0, 18), {
        fontFamily: "Arial",
        fontSize: "7px",
        color: "#8cdcff",
        fontStyle: "bold",
        stroke: "#041004",
        strokeThickness: 2,
      }).setDepth(4);
      this.add.text(x + 94, textY, rowItem.value.toUpperCase().slice(0, 18), {
        fontFamily: "Arial",
        fontSize: "7px",
        color: this.getToneColor(rowItem.tone),
        fontStyle: "bold",
        stroke: "#041004",
        strokeThickness: 2,
      }).setOrigin(1, 0).setDepth(4);
    });
  }

  private createRiskPanel(rows: readonly BalanceDebugRiskRow[]): void {
    const y = 342;
    const panel = this.add.rectangle(GAME_WIDTH / 2, y, 790, 104, 0x071107, 0.9)
      .setStrokeStyle(2, 0x8cdcff, 0.38)
      .setDepth(3);

    this.add.text(78, y - 42, "RISK / LOCK CHECKLIST", {
      fontFamily: "Arial",
      fontSize: "12px",
      color: "#8cdcff",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 4,
    }).setDepth(4);

    rows.slice(0, 4).forEach((row, index) => {
      const rowY = y - 18 + index * 22;
      this.add.text(78, rowY, `${row.status.toUpperCase()} · ${row.label.toUpperCase()}`, {
        fontFamily: "Arial",
        fontSize: "8px",
        color: this.getToneColor(row.tone),
        fontStyle: "bold",
        stroke: "#041004",
        strokeThickness: 3,
      }).setDepth(4);
      this.add.text(278, rowY, row.detail.toUpperCase().slice(0, 62), {
        fontFamily: "Arial",
        fontSize: "8px",
        color: "#fcfff7",
        fontStyle: "bold",
        stroke: "#041004",
        strokeThickness: 3,
      }).setDepth(4);
      this.add.text(278, rowY + 10, row.action.toUpperCase().slice(0, 82), {
        fontFamily: "Arial",
        fontSize: "7px",
        color: "#d7ffd0",
        fontStyle: "bold",
        stroke: "#041004",
        strokeThickness: 2,
      }).setDepth(4);
    });

    this.add.text(panel.x, y + 49, "DIAGNOSTIC ONLY: NO PROFILE, REWARD, POWER OR LEADERBOARD MUTATION", {
      fontFamily: "Arial",
      fontSize: "8px",
      color: "#ffeb72",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(4);
  }

  private createFooterButtons(): void {
    const buttons = [
      { label: "CAMPAIGN", x: 196, route: SCENE_KEYS.campaign, color: 0x8cdcff },
      { label: "LEADERBOARD", x: 348, route: SCENE_KEYS.leaderboard, color: 0xff7aeb },
      { label: "PROFILE", x: 500, route: SCENE_KEYS.profile, color: 0xb66cff },
      { label: "MENU", x: 652, route: SCENE_KEYS.menu, color: 0xfcfff7 },
    ];
    buttons.forEach((button) => this.createFooterButton(button.x, button.label, button.color, () => this.scene.start(button.route)));
  }

  private createFooterButton(x: number, label: string, color: number, callback: () => void): void {
    const button = this.add.rectangle(x, GAME_HEIGHT - 24, 134, 30, 0x071107, 0.92)
      .setStrokeStyle(2, color, 0.55)
      .setDepth(10)
      .setInteractive({ useHandCursor: true });
    this.add.text(x, GAME_HEIGHT - 24, label, {
      fontFamily: "Arial",
      fontSize: "10px",
      color: "#fcfff7",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(11);
    button.on("pointerdown", callback);
    button.on("pointerover", () => button.setScale(1.025));
    button.on("pointerout", () => button.setScale(1));
  }

  private getToneColor(tone: BalanceDebugTone): string {
    if (tone === "green") return "#72ff57";
    if (tone === "yellow") return "#ffeb72";
    if (tone === "orange") return "#ff9b42";
    if (tone === "red") return "#ff4866";
    return "#8cdcff";
  }
}
