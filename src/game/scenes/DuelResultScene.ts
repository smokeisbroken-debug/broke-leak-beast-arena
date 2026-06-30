import Phaser from "phaser";
import { GAME_CONFIG, GAME_HEIGHT, GAME_WIDTH } from "../../config/game";
import { SCENE_KEYS } from "../../config/routes";
import {
  createDuelLeaderboardSubmitPreviewFromResult,
  createDuelResultPreview,
  DUEL_MODIFIER_LABELS,
  type DuelLeaderboardSubmitPreview,
  type DuelModeId,
  type DuelResultLock,
  type DuelResultPreview,
} from "../data/gameRegistry";

interface DuelResultSceneData {
  duelId?: DuelModeId;
}

export class DuelResultScene extends Phaser.Scene {
  private duelId: DuelModeId = "leak_duel_async";
  private preview!: DuelResultPreview;
  private leaderboardPreview!: DuelLeaderboardSubmitPreview;
  private copyText?: Phaser.GameObjects.Text;

  constructor() {
    super(SCENE_KEYS.duelResult);
  }

  init(data?: DuelResultSceneData): void {
    this.duelId = data?.duelId ?? "leak_duel_async";
  }

  create(): void {
    this.preview = createDuelResultPreview(this.duelId);
    this.leaderboardPreview = createDuelLeaderboardSubmitPreviewFromResult(this.preview, "Local Broke Duelist");

    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "menu-start-screen")
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setDepth(0);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x020304, 0.76).setDepth(1);

    const titleColor = this.getToneColor(this.preview.tone);
    this.add.text(GAME_WIDTH / 2, 26, this.preview.outcomeLabel, {
      fontFamily: "Arial",
      fontSize: "25px",
      color: titleColor,
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(3);

    this.add.text(GAME_WIDTH / 2, 54, `${GAME_CONFIG.version} · DUEL RESULT PREVIEW · BACKEND LOCKED`, {
      fontFamily: "Arial",
      fontSize: "10px",
      color: "#d7ffd0",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(3);

    this.createScorePanels();
    this.createBreakdownPanel();
    this.createLockPanel();
    this.createFooterButtons();
  }

  private createScorePanels(): void {
    const player = this.preview.localPlayer;
    const opponent = this.preview.opponent;
    const playerColor = this.preview.tone === "win" ? 0x72ff57 : this.preview.tone === "draw" ? 0xffeb72 : 0xff6242;

    this.add.rectangle(236, 136, 330, 96, 0x071107, 0.92)
      .setStrokeStyle(2, playerColor, 0.68)
      .setDepth(2);
    this.add.rectangle(684, 136, 330, 96, 0x071107, 0.92)
      .setStrokeStyle(2, 0xffeb72, 0.45)
      .setDepth(2);

    this.add.text(86, 104, "YOU", this.panelTitleStyle("#72ff57")).setDepth(4);
    this.add.text(534, 104, "RIVAL", this.panelTitleStyle("#ffeb72")).setDepth(4);

    this.add.text(86, 126, `${player.score.totalScore.toLocaleString("en-US")} PTS`, this.bigScoreStyle("#fcfff7")).setDepth(4);
    this.add.text(534, 126, `${opponent.score.totalScore.toLocaleString("en-US")} PTS`, this.bigScoreStyle("#fcfff7")).setDepth(4);

    this.add.text(86, 162, `QUALITY: ${player.qualityBand.replace(/_/g, " ").toUpperCase()}`, this.smallLineStyle("#d7ffd0", 292)).setDepth(4);
    this.add.text(534, 162, `QUALITY: ${opponent.qualityBand.replace(/_/g, " ").toUpperCase()}`, this.smallLineStyle("#d7ffd0", 292)).setDepth(4);

    const modifierText = this.preview.seed.modifiers
      .map((modifierId) => DUEL_MODIFIER_LABELS[modifierId] ?? modifierId)
      .join(" + ");
    this.add.text(GAME_WIDTH / 2, 198, `SEED ${this.preview.seed.seedKey} · ${modifierText} · MARGIN ${this.preview.scoreMargin} PTS`, {
      fontFamily: "Arial",
      fontSize: "10px",
      color: "#8cdcff",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 3,
      align: "center",
      wordWrap: { width: 780 },
    }).setOrigin(0.5).setDepth(4);
  }

  private createBreakdownPanel(): void {
    this.add.rectangle(268, 298, 404, 154, 0x071107, 0.9)
      .setStrokeStyle(2, 0x72ff57, 0.44)
      .setDepth(2);
    this.add.text(82, 235, "YOUR SCORING BREAKDOWN", this.panelTitleStyle("#72ff57")).setDepth(4);

    this.preview.localPlayer.score.breakdown.slice(0, 7).forEach((row, index) => {
      const y = 260 + index * 18;
      this.add.text(84, y, row.label.toUpperCase(), this.rowStyle("#fcfff7", 148)).setDepth(4);
      this.add.text(256, y, `${row.rawValue} × ${row.weight}`, this.rowStyle("#d7ffd0", 96)).setDepth(4);
      this.add.text(390, y, `${row.points.toLocaleString("en-US")} pts`.toUpperCase(), this.rowStyle(row.points < 0 ? "#ff6242" : "#ffeb72", 92)).setDepth(4);
    });

    this.add.text(82, 394, "LOCAL PREVIEW: SCORE IS NOT SUBMITTED AND DOES NOT CLAIM RANK POINTS.", {
      fontFamily: "Arial",
      fontSize: "9px",
      color: "#ffeb72",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 3,
      wordWrap: { width: 360 },
    }).setDepth(4);
  }

  private createLockPanel(): void {
    this.add.rectangle(682, 298, 392, 154, 0x071107, 0.9)
      .setStrokeStyle(2, 0xffeb72, 0.44)
      .setDepth(2);
    this.add.text(508, 235, "REWARDS / SUBMIT LOCKS", this.panelTitleStyle("#ffeb72")).setDepth(4);

    const rewardLine = this.preview.rewardPreview.visibleRewards
      .map((reward) => `${reward.amount} ${reward.currencyId.replace(/_/g, " ").toUpperCase()}`)
      .join(" · ");
    this.add.text(508, 260, `REWARD PREVIEW: ${rewardLine || "NONE"}`, this.smallLineStyle("#d7ffd0", 330)).setDepth(4);
    this.add.text(508, 281, `RANK PAYLOAD: ${this.leaderboardPreview.value.toLocaleString("en-US")} RP · PREVIEW ONLY`, this.smallLineStyle("#ffeb72", 330)).setDepth(4);
    this.add.text(508, 302, `SUBMIT STATUS: ${this.leaderboardPreview.submissionStatus.replace(/_/g, " ").toUpperCase()}`, this.smallLineStyle("#ffeb72", 330)).setDepth(4);

    this.preview.locks.slice(0, 3).forEach((lock, index) => this.createLockRow(lock, 327 + index * 18));
  }

  private createLockRow(lock: DuelResultLock, y: number): void {
    const color = lock.severity === "backend_blocker" ? "#ffeb72" : "#d7ffd0";
    this.add.text(508, y, `• ${lock.label}`.toUpperCase(), {
      fontFamily: "Arial",
      fontSize: "8px",
      color,
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 2,
      wordWrap: { width: 336 },
    }).setDepth(4);
  }

  private createFooterButtons(): void {
    this.createFooterButton(176, "COPY DUEL", 0xb66cff, async () => {
      const copied = await this.copyDuelResult();
      this.copyText?.setText(copied ? "COPIED" : "COPY FAILED");
      this.time.delayedCall(1200, () => this.copyText?.setText("COPY DUEL"));
    }, true);
    this.createFooterButton(338, "DUEL", 0x72ff57, () => this.scene.start(SCENE_KEYS.duel));
    this.createFooterButton(500, "RANKS", 0xff7aeb, () => this.scene.start(SCENE_KEYS.leaderboard));
    this.createFooterButton(662, "ARENA", 0xffeb72, () => this.scene.start(SCENE_KEYS.arena));
    this.createFooterButton(824, "MENU", 0xfcfff7, () => this.scene.start(SCENE_KEYS.menu));
  }

  private createFooterButton(x: number, label: string, color: number, callback: () => void, trackCopyText = false): void {
    const button = this.add.rectangle(x, GAME_HEIGHT - 28, 132, 32, 0x071107, 0.94)
      .setStrokeStyle(2, color, 0.58)
      .setDepth(10)
      .setInteractive({ useHandCursor: true });
    const text = this.add.text(x, GAME_HEIGHT - 28, label, {
      fontFamily: "Arial",
      fontSize: "11px",
      color: "#fcfff7",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(11);
    if (trackCopyText) this.copyText = text;
    button.on("pointerdown", callback);
    button.on("pointerover", () => button.setScale(1.025));
    button.on("pointerout", () => button.setScale(1));
  }

  private async copyDuelResult(): Promise<boolean> {
    try {
      await navigator.clipboard.writeText([
        ...this.preview.shareLines,
        `Rank payload preview: ${this.leaderboardPreview.value} RP`,
        `Leaderboard: ${this.leaderboardPreview.leaderboardId}`,
        `Submit: ${this.leaderboardPreview.linkStatus.replace(/_/g, " ")}`,
      ].join("\n"));
      return true;
    } catch {
      return false;
    }
  }

  private getToneColor(tone: DuelResultPreview["tone"]): string {
    if (tone === "win") return "#72ff57";
    if (tone === "loss") return "#ff6242";
    if (tone === "draw") return "#ffeb72";
    return "#d7ffd0";
  }

  private panelTitleStyle(color: string): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      fontFamily: "Arial",
      fontSize: "14px",
      color,
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 4,
    };
  }

  private bigScoreStyle(color: string): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      fontFamily: "Arial",
      fontSize: "24px",
      color,
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 5,
    };
  }

  private smallLineStyle(color: string, width: number): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      fontFamily: "Arial",
      fontSize: "9px",
      color,
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 3,
      wordWrap: { width },
    };
  }

  private rowStyle(color: string, width: number): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      fontFamily: "Arial",
      fontSize: "9px",
      color,
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 3,
      wordWrap: { width },
    };
  }
}
