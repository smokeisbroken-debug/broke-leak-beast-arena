import Phaser from "phaser";
import { GAME_CONFIG, GAME_HEIGHT, GAME_WIDTH } from "../../config/game";
import { SCENE_KEYS } from "../../config/routes";
import {
  DUEL_DEFINITIONS,
  DUEL_MODIFIER_LABELS,
  createDuelContractPreview,
  createDuelSeedPreviewCard,
  createSampleDuelVersusPreview,
  loadPlayerProfile,
  type DuelDefinition,
  type DuelModeId,
  type DuelScoreBreakdownRow,
} from "../data/gameRegistry";

export class DuelScene extends Phaser.Scene {
  private selectedDuelId: DuelModeId = "leak_duel_async";
  private content?: Phaser.GameObjects.Container;

  constructor() {
    super(SCENE_KEYS.duel);
  }

  create(): void {
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "menu-start-screen")
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setDepth(0);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x020304, 0.74).setDepth(1);

    this.add.text(GAME_WIDTH / 2, 23, "LEAK DUEL", {
      fontFamily: "Arial",
      fontSize: "27px",
      color: "#72ff57",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(3);

    this.add.text(GAME_WIDTH / 2, 51, `${GAME_CONFIG.version} · 1 VS 1 SKELETON · BACKEND LOCKED`, {
      fontFamily: "Arial",
      fontSize: "10px",
      color: "#d7ffd0",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(3);

    this.createDuelTabs();
    this.renderContent();
    this.createFooterButtons();
  }

  private createDuelTabs(): void {
    DUEL_DEFINITIONS.forEach((definition, index) => {
      const x = 352 + index * 214;
      const selected = definition.id === this.selectedDuelId;
      const color = this.getDuelColor(definition);
      const tab = this.add.rectangle(x, 80, 190, 35, selected ? 0x112811 : 0x071107, selected ? 0.98 : 0.88)
        .setStrokeStyle(selected ? 3 : 2, color, selected ? 0.86 : 0.42)
        .setDepth(4)
        .setInteractive({ useHandCursor: true });

      this.add.text(x, 74, definition.shortTitle.toUpperCase(), {
        fontFamily: "Arial",
        fontSize: "12px",
        color: selected ? "#72ff57" : "#fcfff7",
        fontStyle: "bold",
        stroke: "#041004",
        strokeThickness: 3,
      }).setOrigin(0.5).setDepth(5);

      this.add.text(x, 90, definition.backendStatus.replace(/_/g, " ").toUpperCase(), {
        fontFamily: "Arial",
        fontSize: "8px",
        color: definition.backendStatus === "remote_required" ? "#ffeb72" : "#d7ffd0",
        fontStyle: "bold",
        stroke: "#041004",
        strokeThickness: 2,
      }).setOrigin(0.5).setDepth(5);

      tab.on("pointerdown", () => {
        this.selectedDuelId = definition.id;
        this.renderContent();
      });
      tab.on("pointerover", () => tab.setAlpha(0.94));
      tab.on("pointerout", () => tab.setAlpha(1));
    });
  }

  private renderContent(): void {
    this.content?.destroy(true);
    this.content = this.add.container(0, 0).setDepth(3);

    const profile = loadPlayerProfile();
    const definition = this.getSelectedDuel();
    const preview = createDuelContractPreview(definition.id);
    const seedCard = createDuelSeedPreviewCard({
      duelId: definition.id,
      matchType: definition.matchType,
      periodKey: preview.periodKey,
      playerAId: profile.identity.localPlayerId || "local-player-a",
      playerBId: "rival-preview",
      nonce: "scene-preview",
      source: definition.backendStatus === "remote_required" ? "backend_future" : "local_preview",
    });
    const versusPreview = createSampleDuelVersusPreview(preview.seed);
    const color = this.getDuelColor(definition);
    const modifierText = preview.seed.modifiers
      .map((modifierId) => DUEL_MODIFIER_LABELS[modifierId] ?? modifierId)
      .join(" + ");

    this.content.add(this.createPanel(218, 230, 330, 248, color));
    this.content.add(this.createPanel(632, 230, 488, 248, color));

    this.content.add(this.add.text(66, 112, definition.title.toUpperCase(), this.headerStyle("#72ff57")).setDepth(4));
    this.content.add(this.add.text(66, 139, definition.description.toUpperCase(), {
      fontFamily: "Arial",
      fontSize: "9px",
      color: "#d7ffd0",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 3,
      wordWrap: { width: 290 },
      lineSpacing: 2,
    }).setDepth(4));

    const leftRows = [
      `TYPE: ${definition.matchType}`,
      `ASYNC FIRST: ${definition.asyncFirst ? "yes" : "no"}`,
      `LEADERBOARD: ${definition.leaderboardId}`,
      `PERIOD: ${preview.periodKey}`,
      `SEED: ${preview.seed.seedKey}`,
      `STAGE: ${preview.seed.stageId}`,
      `BOSS: ${preview.seed.bossId ?? "none"}`,
      `TIMEBOX: ${preview.seed.durationSeconds}s`,
      `MODS: ${modifierText}`,
    ];
    leftRows.forEach((line, index) => {
      this.content?.add(this.add.text(66, 184 + index * 16, line.toUpperCase(), {
        fontFamily: "Arial",
        fontSize: index >= 4 ? "8px" : "9px",
        color: index >= 4 ? "#ffeb72" : "#fcfff7",
        fontStyle: "bold",
        stroke: "#041004",
        strokeThickness: 3,
        wordWrap: { width: 290 },
      }).setDepth(4));
    });

    this.content.add(this.add.text(66, 340, "SEED FAIRNESS", {
      fontFamily: "Arial",
      fontSize: "11px",
      color: "#8cdcff",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 3,
    }).setDepth(4));
    seedCard.rows.slice(0, 3).forEach((line, index) => {
      this.content?.add(this.add.text(66, 358 + index * 14, line.toUpperCase(), {
        fontFamily: "Arial",
        fontSize: "8px",
        color: "#d7ffd0",
        fontStyle: "bold",
        stroke: "#041004",
        strokeThickness: 2,
        wordWrap: { width: 290 },
      }).setDepth(4));
    });

    this.content.add(this.add.text(398, 112, "VERSUS SCORE PREVIEW", this.headerStyle("#ff7aeb")).setDepth(4));
    this.content.add(this.add.text(398, 139, "SAME SEED · SAME STAGE · SAME MODIFIERS · CAPPED SCORE", {
      fontFamily: "Arial",
      fontSize: "9px",
      color: "#d7ffd0",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 3,
      wordWrap: { width: 438 },
    }).setDepth(4));

    this.createParticipantCard(398, 178, versusPreview.playerA.displayName, versusPreview.playerA.score.totalScore, "#72ff57");
    this.createParticipantCard(638, 178, versusPreview.playerB.displayName, versusPreview.playerB.score.totalScore, "#ffeb72");

    this.content.add(this.add.text(398, 232, `OUTCOME: ${versusPreview.winnerLabel} · MARGIN ${versusPreview.scoreMargin} PTS`, {
      fontFamily: "Arial",
      fontSize: "12px",
      color: "#72ff57",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 4,
    }).setDepth(4));

    versusPreview.playerA.score.breakdown.slice(0, 5).forEach((row, index) => this.createScoreRow(row, 260 + index * 17));

    const statusRows = [
      `PUBLIC SUBMIT: ${preview.readiness.publicSubmitEnabled ? "enabled" : "locked"}`,
      `VALIDATION: ${preview.readiness.backendValidationRequired ? "backend required" : "local"}`,
      `REWARDS: ${preview.rewardPreview.claimEnabled ? "claim enabled" : "claim locked"}`,
      `NEXT: Duel result screen + run payload bridge`,
    ];
    statusRows.forEach((line, index) => {
      this.content?.add(this.add.text(640, 260 + index * 18, line.toUpperCase(), {
        fontFamily: "Arial",
        fontSize: "9px",
        color: index === 0 || index === 1 ? "#ffeb72" : "#d7ffd0",
        fontStyle: "bold",
        stroke: "#041004",
        strokeThickness: 3,
        wordWrap: { width: 230 },
      }).setDepth(4));
    });

    this.createPreviewButton(definition);
  }

  private getSelectedDuel(): DuelDefinition {
    return DUEL_DEFINITIONS.find((definition) => definition.id === this.selectedDuelId) ?? DUEL_DEFINITIONS[0];
  }

  private createParticipantCard(x: number, y: number, label: string, score: number, color: string): void {
    this.content?.add(this.add.rectangle(x + 94, y + 18, 188, 42, 0x071107, 0.9)
      .setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(color).color, 0.55)
      .setDepth(3));
    this.content?.add(this.add.text(x + 16, y + 8, label.toUpperCase(), {
      fontFamily: "Arial",
      fontSize: "10px",
      color,
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 3,
    }).setDepth(4));
    this.content?.add(this.add.text(x + 16, y + 24, `${score.toLocaleString("en-US")} PTS`, {
      fontFamily: "Arial",
      fontSize: "13px",
      color: "#fcfff7",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 4,
    }).setDepth(4));
  }

  private createScoreRow(row: DuelScoreBreakdownRow, y: number): void {
    this.content?.add(this.add.text(398, y, row.label.toUpperCase(), {
      fontFamily: "Arial",
      fontSize: "9px",
      color: "#fcfff7",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 3,
    }).setDepth(4));
    this.content?.add(this.add.text(568, y, `${row.rawValue} × ${row.weight}`, {
      fontFamily: "Arial",
      fontSize: "9px",
      color: "#d7ffd0",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 3,
    }).setDepth(4));
    this.content?.add(this.add.text(720, y, `${row.points.toLocaleString("en-US")} pts`.toUpperCase(), {
      fontFamily: "Arial",
      fontSize: "9px",
      color: row.points < 0 ? "#ff6242" : "#ffeb72",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 3,
    }).setDepth(4));
  }

  private createPreviewButton(definition: DuelDefinition): void {
    const enabled = definition.backendStatus !== "remote_required";
    const button = this.add.rectangle(747, 390, 176, 34, enabled ? 0x153015 : 0x221c08, 0.95)
      .setStrokeStyle(2, enabled ? 0x72ff57 : 0xffeb72, 0.72)
      .setDepth(5)
      .setInteractive({ useHandCursor: true });
    this.content?.add(button);
    this.content?.add(this.add.text(button.x, button.y, enabled ? "RUN PREVIEW" : "BACKEND LOCKED", {
      fontFamily: "Arial",
      fontSize: "10px",
      color: enabled ? "#72ff57" : "#ffeb72",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(6));

    button.on("pointerdown", () => {
      if (enabled) {
        this.scene.start(SCENE_KEYS.arena);
      }
    });
  }

  private createFooterButtons(): void {
    const items = [
      { label: "TOURNEY", x: 196, route: SCENE_KEYS.tournament, color: 0xb66cff },
      { label: "RANKS", x: 336, route: SCENE_KEYS.leaderboard, color: 0xff7aeb },
      { label: "MENU", x: 476, route: SCENE_KEYS.menu, color: 0xfcfff7 },
      { label: "PLAY", x: 616, route: SCENE_KEYS.arena, color: 0x72ff57 },
      { label: "PROFILE", x: 756, route: SCENE_KEYS.profile, color: 0xb66cff },
    ];
    items.forEach((item) => this.createFooterButton(item.x, item.label, item.color, () => this.scene.start(item.route)));
  }

  private createFooterButton(x: number, label: string, color: number, callback: () => void): void {
    const button = this.add.rectangle(x, GAME_HEIGHT - 25, 118, 30, 0x071107, 0.92)
      .setStrokeStyle(2, color, 0.55)
      .setDepth(10)
      .setInteractive({ useHandCursor: true });
    this.add.text(x, GAME_HEIGHT - 25, label, {
      fontFamily: "Arial",
      fontSize: "11px",
      color: "#fcfff7",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 3,
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

  private headerStyle(color: string): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      fontFamily: "Arial",
      fontSize: "16px",
      color,
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 5,
    };
  }

  private getDuelColor(definition: DuelDefinition): number {
    if (definition.backendStatus === "remote_required") return 0xffeb72;
    if (definition.matchType === "ranked") return 0xff7aeb;
    return 0x72ff57;
  }
}
