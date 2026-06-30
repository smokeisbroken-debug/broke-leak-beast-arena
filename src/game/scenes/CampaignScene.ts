import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../../config/game";
import { SCENE_KEYS } from "../../config/routes";
import {
  CAMPAIGN_CHAPTERS,
  getCampaignBossState,
  getCampaignBosses,
  getCampaignBossUnlockLabel,
  getCampaignProgress,
  getCampaignProgressSummary,
  getCampaignUnlockLabel,
  getRecommendedCampaignBoss,
  isCampaignChapterUnlocked,
  loadPlayerProfile,
  savePlayerProfile,
  selectProfileCampaignBoss,
  type CampaignChapterDefinition,
  type PlayerProfile,
} from "../data/gameRegistry";
import type { ArenaBossDefinition } from "../data/bosses";

export class CampaignScene extends Phaser.Scene {
  private profile!: PlayerProfile;
  private selectedChapter!: CampaignChapterDefinition;
  private chapterObjects: Phaser.GameObjects.GameObject[] = [];
  private bossObjects: Phaser.GameObjects.GameObject[] = [];
  private flowStatusText!: Phaser.GameObjects.Text;

  constructor() {
    super(SCENE_KEYS.campaign);
  }

  create(): void {
    this.profile = loadPlayerProfile();
    this.selectedChapter = CAMPAIGN_CHAPTERS.find((chapter) => chapter.id === this.profile.selectedCampaignId) ?? CAMPAIGN_CHAPTERS[0];

    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "menu-start-screen")
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setDepth(0);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x020304, 0.48).setDepth(1);

    this.add.text(GAME_WIDTH / 2, 28, "CAMPAIGN LADDER", {
      fontFamily: "Arial", fontSize: "27px", color: "#72ff57", fontStyle: "bold", stroke: "#050805", strokeThickness: 6,
    }).setOrigin(0.5).setDepth(3);

    this.add.text(GAME_WIDTH / 2, 58, "Choose chapter → choose leak boss → fight → unlock next mission", {
      fontFamily: "Arial", fontSize: "12px", color: "#d7ffd0", fontStyle: "bold", stroke: "#050805", strokeThickness: 4,
    }).setOrigin(0.5).setDepth(3);

    this.createProfileStrip();
    this.createFlowStatusText();
    this.renderChapters();
    this.renderBosses();
    this.createBackButton();
  }

  private createProfileStrip(): void {
    const progress = getCampaignProgress(this.profile);
    const summary = getCampaignProgressSummary(this.profile);
    const recommendedBoss = getRecommendedCampaignBoss(this.profile);
    const currentChapter = CAMPAIGN_CHAPTERS.find((chapter) => chapter.id === summary.currentChapterId) ?? CAMPAIGN_CHAPTERS[0];
    const totalCleared = Object.values(progress).reduce((sum, value) => sum + value, 0);
    this.add.rectangle(GAME_WIDTH / 2, 88, 804, 34, 0x071107, 0.88)
      .setStrokeStyle(2, currentChapter.color, 0.28)
      .setDepth(2);
    this.add.text(GAME_WIDTH / 2, 88, `LEVEL ${this.profile.level} · COINS ${this.profile.coins} · CLEARS ${totalCleared}/${summary.total} · NEXT ${recommendedBoss.name.toUpperCase()}`, {
      fontFamily: "Arial", fontSize: "12px", color: "#fcfff7", fontStyle: "bold", stroke: "#050805", strokeThickness: 3,
    }).setOrigin(0.5).setDepth(3);
  }

  private createFlowStatusText(): void {
    const recommendedBoss = getRecommendedCampaignBoss(this.profile);
    this.flowStatusText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 30, `Recommended next fight: ${recommendedBoss.name.toUpperCase()}`, {
      fontFamily: "Arial", fontSize: "11px", color: "#d7ffd0", fontStyle: "bold", stroke: "#050805", strokeThickness: 3,
    }).setOrigin(0.5).setDepth(6);
  }

  private renderChapters(): void {
    this.chapterObjects.forEach((object) => object.destroy());
    this.chapterObjects = [];

    this.add.text(92, 120, "CHAPTERS", {
      fontFamily: "Arial", fontSize: "13px", color: "#72ff57", fontStyle: "bold", stroke: "#050805", strokeThickness: 4,
    }).setDepth(3);

    CAMPAIGN_CHAPTERS.forEach((chapter, index) => {
      const unlocked = isCampaignChapterUnlocked(this.profile, chapter.id);
      const selected = chapter.id === this.selectedChapter.id;
      const progress = getCampaignProgress(this.profile)[chapter.id] ?? 0;
      const total = Math.max(1, chapter.bossIds.length);
      const y = 150 + index * 62;
      const card = this.add.rectangle(210, y, 296, 52, 0x071107, unlocked ? 0.92 : 0.58)
        .setStrokeStyle(selected ? 4 : 2, unlocked ? chapter.color : 0x555555, selected ? 0.92 : 0.36)
        .setDepth(3)
        .setInteractive({ useHandCursor: true });
      const title = this.add.text(78, y - 17, chapter.name.toUpperCase(), {
        fontFamily: "Arial", fontSize: "11px", color: unlocked ? chapter.uiColor : "#888888", fontStyle: "bold", stroke: "#050805", strokeThickness: 3,
      }).setDepth(4);
      const sub = this.add.text(78, y + 1, unlocked ? `${progress}/${chapter.bossIds.length} cleared · ${chapter.rewardLabel}` : getCampaignUnlockLabel(this.profile, chapter), {
        fontFamily: "Arial", fontSize: "10px", color: unlocked ? "#d7ffd0" : "#9c9c9c", fontStyle: "bold", stroke: "#050805", strokeThickness: 3,
      }).setDepth(4);
      const barBg = this.add.rectangle(210, y + 20, 238, 5, 0x1b251b, 1).setOrigin(0.5).setDepth(4);
      const bar = this.add.rectangle(91, y + 20, 238 * Phaser.Math.Clamp(progress / total, 0, 1), 5, chapter.color, unlocked ? 0.9 : 0.34).setOrigin(0, 0.5).setDepth(5);

      card.on("pointerdown", () => {
        this.selectedChapter = chapter;
        this.renderChapters();
        this.renderBosses();
      });
      card.on("pointerover", () => card.setScale(1.012));
      card.on("pointerout", () => card.setScale(1));
      this.chapterObjects.push(card, title, sub, barBg, bar);
    });
  }

  private renderBosses(): void {
    this.bossObjects.forEach((object) => object.destroy());
    this.bossObjects = [];

    const header = this.add.text(404, 120, this.selectedChapter.name.toUpperCase(), {
      fontFamily: "Arial", fontSize: "13px", color: this.selectedChapter.uiColor, fontStyle: "bold", stroke: "#050805", strokeThickness: 4,
    }).setDepth(3);
    const desc = this.add.text(404, 139, this.selectedChapter.description, {
      fontFamily: "Arial", fontSize: "10px", color: "#d7ffd0", fontStyle: "bold", stroke: "#050805", strokeThickness: 3,
      wordWrap: { width: 420 },
    }).setDepth(3);
    this.bossObjects.push(header, desc);

    const bosses = getCampaignBosses(this.selectedChapter.id);
    if (!bosses.length) {
      const card = this.add.rectangle(620, 246, 408, 116, 0x071107, 0.82)
        .setStrokeStyle(2, this.selectedChapter.color, 0.35)
        .setDepth(3);
      const text = this.add.text(620, 246, "COMING CONTENT SLOT\nBosses, skins, maps and mechanics will attach here later.", {
        fontFamily: "Arial", fontSize: "14px", color: "#fcfff7", fontStyle: "bold", stroke: "#050805", strokeThickness: 4,
        align: "center",
      }).setOrigin(0.5).setDepth(4);
      this.bossObjects.push(card, text);
      return;
    }

    bosses.forEach((boss, index) => this.createBossCard(boss, 620, 186 + index * 76));
  }

  private createBossCard(boss: ArenaBossDefinition, x: number, y: number): void {
    const state = getCampaignBossState(this.profile, boss.id);
    const unlocked = state !== "locked";
    const selected = this.profile.selectedBossId === boss.id;
    const card = this.add.rectangle(x, y, 408, 64, 0x071107, unlocked ? 0.94 : 0.56)
      .setStrokeStyle(selected ? 4 : 2, unlocked ? boss.color : 0x555555, selected ? 0.95 : 0.38)
      .setDepth(3)
      .setInteractive({ useHandCursor: true });
    const stateLabel = state === "complete" ? "CLEARED · REPLAY" : state === "unlocked" ? "READY" : "LOCKED";
    const lockReason = getCampaignBossUnlockLabel(this.profile, boss.id);
    const title = this.add.text(x - 186, y - 22, boss.name.toUpperCase(), {
      fontFamily: "Arial", fontSize: "13px", color: unlocked ? "#fcfff7" : "#888888", fontStyle: "bold", stroke: "#050805", strokeThickness: 4,
    }).setDepth(4);
    const meta = this.add.text(x - 186, y - 3, unlocked ? `${stateLabel} · LEVEL ${boss.unlockLevel} · ${boss.leakLabel}` : `LOCKED · ${lockReason.toUpperCase()}`, {
      fontFamily: "Arial", fontSize: "10px", color: unlocked ? boss.color === 0xffeb72 ? "#ffeb72" : "#d7ffd0" : "#9c9c9c", fontStyle: "bold", stroke: "#050805", strokeThickness: 3,
    }).setDepth(4);
    const hint = this.add.text(x - 186, y + 16, boss.introLine, {
      fontFamily: "Arial", fontSize: "9px", color: "#cfe8ca", fontStyle: "bold", stroke: "#050805", strokeThickness: 3,
      wordWrap: { width: 300 },
    }).setDepth(4).setAlpha(unlocked ? 1 : 0.45);
    const fight = this.add.text(x + 156, y, unlocked ? "FIGHT" : "---", {
      fontFamily: "Arial", fontSize: "13px", color: unlocked ? "#050805" : "#777777", backgroundColor: unlocked ? "#72ff57" : "#222222", padding: { x: 13, y: 7 }, fontStyle: "bold",
    }).setOrigin(0.5).setDepth(4);

    card.on("pointerdown", () => this.selectBoss(boss, unlocked));
    fight.setInteractive({ useHandCursor: unlocked });
    fight.on("pointerdown", () => this.selectBoss(boss, unlocked));
    card.on("pointerover", () => { if (unlocked) card.setScale(1.012); });
    card.on("pointerout", () => card.setScale(1));
    this.bossObjects.push(card, title, meta, hint, fight);
  }

  private selectBoss(boss: ArenaBossDefinition, unlocked: boolean): void {
    if (!unlocked) {
      const reason = getCampaignBossUnlockLabel(this.profile, boss.id);
      this.flowStatusText?.setText(`${boss.name.toUpperCase()} locked: ${reason}`);
      this.flowStatusText?.setColor("#ffeb72");
      this.cameras.main.shake(60, 0.0018);
      return;
    }
    this.profile = selectProfileCampaignBoss(this.profile, boss.id);
    savePlayerProfile(this.profile);
    this.flowStatusText?.setText(`Starting ${boss.name.toUpperCase()}...`);
    this.flowStatusText?.setColor("#72ff57");
    this.cameras.main.flash(80, 114, 255, 87, false);
    this.time.delayedCall(90, () => this.scene.start(SCENE_KEYS.arena));
  }

  private createBackButton(): void {
    const back = this.add.text(64, GAME_HEIGHT - 34, "← MENU", {
      fontFamily: "Arial", fontSize: "13px", color: "#fcfff7", fontStyle: "bold", stroke: "#050805", strokeThickness: 4,
    }).setOrigin(0.5).setDepth(5).setInteractive({ useHandCursor: true });
    back.on("pointerdown", () => this.scene.start(SCENE_KEYS.menu));
  }
}
