import Phaser from "phaser";
import { GAME_CONFIG, GAME_HEIGHT, GAME_WIDTH } from "../../config/game";
import { SCENE_KEYS } from "../../config/routes";
import {
  TOURNAMENT_REGISTRY_FILTER_LABELS,
  createSampleTournamentLeaderboardSubmitPreview,
  createSampleTournamentRunResultPreview,
  createTournamentRegistrySnapshot,
  getTournamentDefinition,
  getTournamentRegistryCardsByFilter,
  loadPlayerProfile,
  type TournamentId,
  type TournamentRegistryCard,
  type TournamentRegistryFilterId,
  type TournamentScoreBreakdownRow,
} from "../data/gameRegistry";

const FILTERS: readonly TournamentRegistryFilterId[] = ["featured", "local_preview", "weekly", "backend_locked", "all"];

export class TournamentScene extends Phaser.Scene {
  private selectedFilterId: TournamentRegistryFilterId = "featured";
  private selectedTournamentId?: TournamentId;
  private content?: Phaser.GameObjects.Container;

  constructor() {
    super(SCENE_KEYS.tournament);
  }

  create(): void {
    const snapshot = createTournamentRegistrySnapshot();
    this.selectedTournamentId = this.selectedTournamentId ?? snapshot.featuredTournamentId;

    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "menu-start-screen")
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setDepth(0);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x020304, 0.74).setDepth(1);

    this.add.text(GAME_WIDTH / 2, 23, "TOURNAMENTS", {
      fontFamily: "Arial",
      fontSize: "27px",
      color: "#72ff57",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(3);

    this.add.text(GAME_WIDTH / 2, 51, `${GAME_CONFIG.version} · LOCAL PREVIEW · PUBLIC SUBMIT DISABLED`, {
      fontFamily: "Arial",
      fontSize: "10px",
      color: "#d7ffd0",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(3);

    this.createFilterTabs();
    this.renderContent();
    this.createFooterButtons();
  }

  private createFilterTabs(): void {
    FILTERS.forEach((filterId, index) => {
      const label = TOURNAMENT_REGISTRY_FILTER_LABELS[filterId];
      const x = 190 + index * 138;
      const selected = filterId === this.selectedFilterId;
      const button = this.add.rectangle(x, 80, 126, 34, selected ? 0x112811 : 0x071107, selected ? 0.98 : 0.88)
        .setStrokeStyle(selected ? 3 : 2, selected ? 0x72ff57 : 0x8cdcff, selected ? 0.86 : 0.42)
        .setDepth(4)
        .setInteractive({ useHandCursor: true });

      this.add.text(x, 80, label.toUpperCase(), {
        fontFamily: "Arial",
        fontSize: label.length > 12 ? "8px" : "10px",
        color: selected ? "#72ff57" : "#fcfff7",
        fontStyle: "bold",
        stroke: "#041004",
        strokeThickness: 3,
      }).setOrigin(0.5).setDepth(5);

      button.on("pointerdown", () => {
        this.selectedFilterId = filterId;
        const cards = getTournamentRegistryCardsByFilter(filterId);
        if (cards.length > 0 && !cards.some((card) => card.id === this.selectedTournamentId)) {
          this.selectedTournamentId = cards[0].id;
        }
        this.renderContent();
      });
      button.on("pointerover", () => button.setAlpha(0.94));
      button.on("pointerout", () => button.setAlpha(1));
    });
  }

  private renderContent(): void {
    this.content?.destroy(true);
    this.content = this.add.container(0, 0).setDepth(3);

    const profile = loadPlayerProfile();
    const snapshot = createTournamentRegistrySnapshot();
    const cards = getTournamentRegistryCardsByFilter(this.selectedFilterId);
    const selectedCard = this.getSelectedCard(cards, snapshot.cards);
    const tournament = getTournamentDefinition(selectedCard.id);
    const runResultPreview = createSampleTournamentRunResultPreview(selectedCard.id);
    const leaderboardLinkPreview = createSampleTournamentLeaderboardSubmitPreview(selectedCard.id);
    const scoreSnapshot = runResultPreview.scoreSnapshot;
    const color = this.getTournamentColor(selectedCard);

    this.content.add(this.createPanel(218, 230, 330, 248, color));
    this.content.add(this.createPanel(632, 230, 488, 248, color));

    this.content.add(this.add.text(66, 112, "EVENT LIST", this.headerStyle("#8cdcff")).setDepth(4));
    this.content.add(this.add.text(66, 132, `${cards.length} SHOWN · ${snapshot.localPreviewCount} LOCAL · ${snapshot.backendLockedCount} BACKEND LOCKED`, {
      fontFamily: "Arial",
      fontSize: "9px",
      color: "#d7ffd0",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 3,
    }).setDepth(4));

    cards.slice(0, 5).forEach((card, index) => this.createTournamentCard(card, 156 + index * 45));

    this.content.add(this.add.text(398, 112, selectedCard.title.toUpperCase(), this.headerStyle("#72ff57")).setDepth(4));
    this.content.add(this.add.text(398, 138, selectedCard.theme.toUpperCase(), {
      fontFamily: "Arial",
      fontSize: "9px",
      color: "#d7ffd0",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 3,
      wordWrap: { width: 440 },
      lineSpacing: 2,
    }).setDepth(4));

    const statusRows = [
      `MODE: ${selectedCard.modeId.replace(/_/g, " ")}`,
      `STATUS: ${selectedCard.status}`,
      `PERIOD: ${selectedCard.periodKey}`,
      `LEADERBOARD: ${selectedCard.leaderboardId}`,
      `RUN ID: ${runResultPreview.runId.replace("local-run:", "")}`,
      `RANK VALUE: ${leaderboardLinkPreview.value.toLocaleString("en-US")} pts`,
      `ADAPTER: ${leaderboardLinkPreview.providerId.replace(/_/g, " ")}`,
      `SUBMIT: ${leaderboardLinkPreview.publicSubmitEnabled ? "enabled" : "disabled"}`,
      `LOCK: ${leaderboardLinkPreview.adapterSubmitLock.replace(/_/g, " ")}`,
    ];
    statusRows.forEach((line, index) => {
      this.content?.add(this.add.text(398, 178 + index * 13, line.toUpperCase(), {
        fontFamily: "Arial",
        fontSize: index >= 6 ? "8px" : "9px",
        color: index >= 4 ? "#ffeb72" : "#fcfff7",
        fontStyle: "bold",
        stroke: "#041004",
        strokeThickness: 3,
        wordWrap: { width: 438 },
      }).setDepth(4));
    });

    this.content.add(this.add.text(398, 294, `LEADERBOARD PAYLOAD: ${leaderboardLinkPreview.value.toLocaleString("en-US")} TOURNAMENT POINTS`, {
      fontFamily: "Arial",
      fontSize: "13px",
      color: "#72ff57",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 4,
    }).setDepth(4));

    scoreSnapshot.breakdown.slice(0, 4).forEach((row, index) => this.createScoreRow(row, 318 + index * 17));

    const rewardText = tournament.participationRewards
      .map((reward) => `${reward.amount} ${reward.currencyId.replace(/_/g, " ")}`)
      .join(" · ");
    this.content.add(this.add.text(640, 318, "PARTICIPATION REWARD", {
      fontFamily: "Arial",
      fontSize: "10px",
      color: "#8cdcff",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 3,
    }).setDepth(4));
    this.content.add(this.add.text(640, 337, rewardText.toUpperCase(), {
      fontFamily: "Arial",
      fontSize: "9px",
      color: "#ffeb72",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 3,
      wordWrap: { width: 230 },
    }).setDepth(4));

    this.content.add(this.add.text(640, 370, `PAYLOAD: ${leaderboardLinkPreview.submissionStatus.replace(/_/g, " ").toUpperCase()}`, {
      fontFamily: "Arial",
      fontSize: "9px",
      color: "#d7ffd0",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 3,
      wordWrap: { width: 230 },
    }).setDepth(4));
    this.content.add(this.add.text(640, 386, `BUCKETS: RUN ${runResultPreview.result.points.toLocaleString("en-US")} + PARTICIPATION ${runResultPreview.result.participationPoints.toLocaleString("en-US")}`, {
      fontFamily: "Arial",
      fontSize: "8px",
      color: "#ffeb72",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 3,
      wordWrap: { width: 230 },
    }).setDepth(4));
    this.createPreviewButton(selectedCard);
  }

  private getSelectedCard(cards: TournamentRegistryCard[], allCards: TournamentRegistryCard[]): TournamentRegistryCard {
    const inFilter = cards.find((card) => card.id === this.selectedTournamentId);
    if (inFilter) return inFilter;
    const fallback = cards[0] ?? allCards.find((card) => card.id === this.selectedTournamentId) ?? allCards[0];
    this.selectedTournamentId = fallback.id;
    return fallback;
  }

  private createTournamentCard(card: TournamentRegistryCard, y: number): void {
    const selected = card.id === this.selectedTournamentId;
    const color = this.getTournamentColor(card);
    const row = this.add.rectangle(218, y, 296, 36, selected ? 0x123512 : 0x071107, selected ? 0.96 : 0.86)
      .setStrokeStyle(selected ? 3 : 1, color, selected ? 0.86 : 0.34)
      .setDepth(4)
      .setInteractive({ useHandCursor: true });

    this.content?.add(row);
    this.content?.add(this.add.text(82, y - 10, card.shortTitle.toUpperCase(), {
      fontFamily: "Arial",
      fontSize: "10px",
      color: selected ? "#72ff57" : "#fcfff7",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 3,
    }).setDepth(5));
    this.content?.add(this.add.text(82, y + 6, `${card.ctaLabel} · ${card.previewScore.toLocaleString("en-US")} PTS`, {
      fontFamily: "Arial",
      fontSize: "8px",
      color: card.localPreviewEnabled ? "#ffeb72" : "#8cdcff",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 2,
    }).setDepth(5));
    this.content?.add(this.add.text(260, y - 9, card.resetLabel.toUpperCase(), {
      fontFamily: "Arial",
      fontSize: "8px",
      color: "#d7ffd0",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 2,
    }).setDepth(5));
    this.content?.add(this.add.text(260, y + 7, card.backendValidationRequired ? "BACKEND LOCK" : "LOCAL ONLY", {
      fontFamily: "Arial",
      fontSize: "8px",
      color: card.backendValidationRequired ? "#ffeb72" : "#72ff57",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 2,
    }).setDepth(5));

    row.on("pointerdown", () => {
      this.selectedTournamentId = card.id;
      this.renderContent();
    });
    row.on("pointerover", () => row.setAlpha(0.94));
    row.on("pointerout", () => row.setAlpha(1));
  }

  private createScoreRow(row: TournamentScoreBreakdownRow, y: number): void {
    this.content?.add(this.add.text(398, y, row.label.toUpperCase(), {
      fontFamily: "Arial",
      fontSize: "9px",
      color: "#fcfff7",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 3,
    }).setDepth(4));
    this.content?.add(this.add.text(572, y, `${row.rawValue} × ${row.weight}`, {
      fontFamily: "Arial",
      fontSize: "9px",
      color: "#d7ffd0",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 3,
    }).setDepth(4));
    this.content?.add(this.add.text(724, y, `${row.points.toLocaleString("en-US")} pts`.toUpperCase(), {
      fontFamily: "Arial",
      fontSize: "9px",
      color: row.points < 0 ? "#ff6242" : "#ffeb72",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 3,
    }).setDepth(4));
  }

  private createPreviewButton(card: TournamentRegistryCard): void {
    const enabled = card.localPreviewEnabled;
    const button = this.add.rectangle(747, 390, 176, 34, enabled ? 0x153015 : 0x221c08, 0.95)
      .setStrokeStyle(2, enabled ? 0x72ff57 : 0xffeb72, 0.72)
      .setDepth(5)
      .setInteractive({ useHandCursor: true });
    const label = enabled ? "RESULT PREVIEW" : "BACKEND LOCKED";
    this.content?.add(button);
    this.content?.add(this.add.text(button.x, button.y, label, {
      fontFamily: "Arial",
      fontSize: "10px",
      color: enabled ? "#72ff57" : "#ffeb72",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(6));

    button.on("pointerdown", () => {
      // v0.11.2 still opens only a local arena preview; leaderboard submit payload is preview-only.
      this.scene.start(SCENE_KEYS.arena);
    });
  }

  private createFooterButtons(): void {
    const items = [
      { label: "MISSIONS", x: 196, route: SCENE_KEYS.missions, color: 0xffeb72 },
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

  private getTournamentColor(card: TournamentRegistryCard): number {
    switch (card.themeId) {
      case "no_spend": return 0x72ff57;
      case "anti_fomo": return 0xff7aeb;
      case "wallet_shield": return 0x8cdcff;
      case "boss_race": return 0xff6242;
      case "leak_hunter": return 0xffeb72;
      case "debt_pressure": return 0xb66cff;
      default: return 0xfcfff7;
    }
  }
}
