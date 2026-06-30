import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../../config/game";
import { SCENE_KEYS } from "../../config/routes";
import {
  applyFightResultToProfile,
  applyRewardChoiceToProfile,
  getCampaignChapterForBoss,
  getCampaignProgressSummary,
  getDailyMissionStates,
  getPostFightRewardChoices,
  getRewardChoiceRarityLabel,
  getSelectedCampaignBoss,
  getXpProgress,
  loadPlayerProfile,
  savePlayerProfile,
  type FightRewardApplication,
  type PlayerProfile,
  type RewardChoiceDefinition,
} from "../data/gameRegistry";
import type { RunResult } from "../types/game";

export class ResultScene extends Phaser.Scene {
  private result!: RunResult;
  private rewardApplication!: FightRewardApplication;
  private profileAfterBase!: PlayerProfile;
  private bonusClaimed = false;
  private profileText!: Phaser.GameObjects.Text;
  private bonusStatusText!: Phaser.GameObjects.Text;
  private progressHintText!: Phaser.GameObjects.Text;
  private choiceCards: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super(SCENE_KEYS.result);
  }

  init(data: RunResult): void {
    this.result = {
      resultId: data?.resultId,
      score: Math.max(0, Math.floor(data?.score ?? 0)),
      leaksDefeated: Math.max(0, Math.floor(data?.leaksDefeated ?? 0)),
      survivedSeconds: Math.max(0, Math.floor(data?.survivedSeconds ?? 0)),
      safePoints: Math.max(0, Math.floor(data?.safePoints ?? 0)),
      bossDamage: Math.max(0, Math.floor(data?.bossDamage ?? 0)),
      upgradesChosen: Math.max(0, Math.floor(data?.upgradesChosen ?? 0)),
      pickupsCollected: Math.max(0, Math.floor(data?.pickupsCollected ?? 0)),
      bossesBroken: Math.max(0, Math.floor(data?.bossesBroken ?? 0)),
      victory: Boolean(data?.victory),
      selectedBossId: data?.selectedBossId,
      selectedCampaignId: data?.selectedCampaignId,
      defeatedBossIds: Array.isArray(data?.defeatedBossIds) ? data.defeatedBossIds : [],
      blocks: Math.max(0, Math.floor(data?.blocks ?? 0)),
      dodges: Math.max(0, Math.floor(data?.dodges ?? 0)),
      skillsUsed: Math.max(0, Math.floor(data?.skillsUsed ?? 0)),
      ultimatesUsed: Math.max(0, Math.floor(data?.ultimatesUsed ?? 0)),
      damageTaken: Math.max(0, Math.floor(data?.damageTaken ?? 0)),
      usedUltimate: Boolean(data?.usedUltimate),
    };
  }

  create(): void {
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "result-screen")
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setDepth(0);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x040507, 0.46).setDepth(1);

    const victory = this.getVictory();
    const profile = loadPlayerProfile();
    this.rewardApplication = applyFightResultToProfile(profile, {
      victory,
      score: this.result.score,
      bossesBroken: this.result.bossesBroken ?? 0,
      leaksDefeated: this.result.leaksDefeated,
      survivedSeconds: this.result.survivedSeconds,
      defeatedBossIds: this.result.defeatedBossIds,
      blocks: this.result.blocks ?? 0,
      dodges: this.result.dodges ?? 0,
      skillsUsed: this.result.skillsUsed ?? 0,
      ultimatesUsed: this.result.ultimatesUsed ?? 0,
      damageTaken: this.result.damageTaken ?? 0,
      usedUltimate: this.result.usedUltimate ?? false,
      resultId: this.result.resultId,
    });
    this.profileAfterBase = this.rewardApplication.profile;
    savePlayerProfile(this.profileAfterBase);

    const grade = this.getGrade();
    const titleColor = victory ? "#39ff14" : "#ff4866";

    this.add.text(GAME_WIDTH / 2, 28, victory ? "WALLET PROTECTED" : "WALLET HIT", {
      fontFamily: "Arial", fontSize: "28px", color: titleColor, fontStyle: "bold", stroke: "#050805", strokeThickness: 5,
    }).setOrigin(0.5).setDepth(3);

    this.add.text(GAME_WIDTH / 2, 58, `Arena Grade: ${grade}`, {
      fontFamily: "Arial", fontSize: "15px", color: "#b66cff", fontStyle: "bold", stroke: "#050805", strokeThickness: 4,
    }).setOrigin(0.5).setDepth(3);

    this.add.rectangle(GAME_WIDTH / 2, 158, GAME_WIDTH - 100, 166, 0x050805, 0.86)
      .setStrokeStyle(2, 0x39ff14, 0.26)
      .setDepth(2);

    this.createResultStats();
    this.createRewardSummary();
    this.createProgressClarityPanel();
    this.createRewardChoiceCards();
    this.createFooterButtons();
  }

  private createResultStats(): void {
    const bossesBroken = this.result.bossesBroken ?? 0;
    const stats = [
      ["LEAKS", this.result.leaksDefeated.toString()],
      ["TIME", `${this.result.survivedSeconds}s`],
      ["BOSSES", bossesBroken.toString()],
      ["SCORE", this.result.score.toString()],
    ];

    this.add.text(98, 82, "FIGHT RESULT", {
      fontFamily: "Arial", fontSize: "13px", color: "#39ff14", fontStyle: "bold", stroke: "#050805", strokeThickness: 3,
    }).setDepth(3);

    stats.forEach(([label, value], index) => {
      const row = Math.floor(index / 2);
      const col = index % 2;
      const x = col === 0 ? 98 : 278;
      const y = 108 + row * 42;
      this.add.text(x, y, label, {
        fontFamily: "Arial", fontSize: "10px", color: "#9cff8a", fontStyle: "bold", stroke: "#050805", strokeThickness: 2,
      }).setDepth(3);
      this.add.text(x + 118, y - 4, value, {
        fontFamily: "Arial", fontSize: "21px", color: "#f5fff1", fontStyle: "bold", stroke: "#050805", strokeThickness: 3,
      }).setOrigin(1, 0).setDepth(3);
    });

    const detail = [
      `BLOCKS ${this.result.blocks ?? 0}`,
      `DODGES ${this.result.dodges ?? 0}`,
      `SKILLS ${this.result.skillsUsed ?? 0}`,
      `ULT ${this.result.ultimatesUsed ?? 0}`,
    ].join("  ·  ");

    this.add.text(98, 206, detail, {
      fontFamily: "Arial", fontSize: "10px", color: "#d7ffd0", fontStyle: "bold", stroke: "#050805", strokeThickness: 3,
    }).setDepth(3);
  }

  private createRewardSummary(): void {
    const reward = this.rewardApplication.baseRewards;
    const profile = this.profileAfterBase;
    const xpProgress = getXpProgress(profile.xp);
    const levelText = this.rewardApplication.newLevel > this.rewardApplication.oldLevel
      ? `LEVEL UP ${this.rewardApplication.oldLevel} → ${this.rewardApplication.newLevel}`
      : `LEVEL ${profile.level}`;
    const unlockText = this.rewardApplication.unlocks.length > 0
      ? `UNLOCKED: ${this.formatUnlockList(this.rewardApplication.unlocks, 3)}`
      : xpProgress.nextLevel
        ? `${xpProgress.remaining} XP TO LEVEL ${xpProgress.nextLevel.level}`
        : "MAX LEVEL FOUNDATION";

    this.add.text(506, 82, "BASE REWARDS", {
      fontFamily: "Arial", fontSize: "13px", color: "#39ff14", fontStyle: "bold", stroke: "#050805", strokeThickness: 3,
    }).setDepth(3);

    const rewardChips = [
      [`+${reward.xp}`, "XP", 0x72ff57],
      [`+${reward.coins}`, "COINS", 0xffeb72],
      [`+${reward.leakPoints}`, "LEAK", 0xd9a7ff],
      [`+${reward.skillCards}`, "CARDS", 0x8cdcff],
    ];

    rewardChips.forEach(([value, label, color], index) => {
      const x = 506 + index * 78;
      this.add.rectangle(x, 122, 70, 36, 0x071107, 0.9)
        .setStrokeStyle(2, Number(color), 0.4)
        .setDepth(3);
      this.add.text(x, 114, String(value), {
        fontFamily: "Arial", fontSize: "13px", color: "#f5fff1", fontStyle: "bold", stroke: "#050805", strokeThickness: 3,
      }).setOrigin(0.5).setDepth(4);
      this.add.text(x, 132, String(label), {
        fontFamily: "Arial", fontSize: "8px", color: "#d7ffd0", fontStyle: "bold", stroke: "#050805", strokeThickness: 2,
      }).setOrigin(0.5).setDepth(4);
    });

    this.profileText = this.add.text(506, 154, `${levelText} · COINS ${profile.coins} · XP ${profile.xp}\n${unlockText}`, {
      fontFamily: "Arial", fontSize: "11px", color: "#d7ffd0", fontStyle: "bold", stroke: "#050805", strokeThickness: 3,
      lineSpacing: 3,
      wordWrap: { width: 330 },
    }).setDepth(3);

    this.createXpProgressBar(506, 197, 312, xpProgress.progress, xpProgress.nextLevel ? `LEVEL ${profile.level} PROGRESS` : "MAX LEVEL FOUNDATION");
  }

  private createProgressClarityPanel(): void {
    const profile = this.profileAfterBase;
    const missionStates = getDailyMissionStates(profile);
    const completed = missionStates.filter((mission) => mission.completed && !mission.claimed).length;
    const inProgress = missionStates
      .filter((mission) => !mission.completed)
      .sort((a, b) => (b.progress / Math.max(1, b.target)) - (a.progress / Math.max(1, a.target)))[0];

    const nextBoss = getSelectedCampaignBoss(profile);
    const chapter = getCampaignChapterForBoss(nextBoss.id);
    const summary = getCampaignProgressSummary(profile);
    const missionLine = completed > 0
      ? `${completed} MISSION REWARD${completed === 1 ? "" : "S"} READY`
      : inProgress
        ? `${inProgress.definition.title.toUpperCase()}: ${inProgress.progress}/${inProgress.target}`
        : "DAILY MISSIONS COMPLETE";

    const bossLine = `NEXT: ${nextBoss.name.toUpperCase()} · ${summary.cleared}/${summary.total} CLEARED`;

    this.add.rectangle(232, 226, 316, 25, 0x071107, 0.88)
      .setStrokeStyle(1, chapter.color, 0.42)
      .setDepth(3);
    this.add.text(232, 226, bossLine, {
      fontFamily: "Arial", fontSize: "10px", color: chapter.uiColor, fontStyle: "bold", stroke: "#050805", strokeThickness: 3,
    }).setOrigin(0.5).setDepth(4);

    this.progressHintText = this.add.text(644, 226, missionLine, {
      fontFamily: "Arial", fontSize: "10px", color: completed > 0 ? "#ffeb72" : "#d7ffd0", fontStyle: "bold", stroke: "#050805", strokeThickness: 3,
    }).setOrigin(0.5).setDepth(4);
  }

  private createRewardChoiceCards(): void {
    if (this.rewardApplication.duplicateResult) {
      this.bonusClaimed = true;
      this.add.text(GAME_WIDTH / 2, 256, "REWARD ALREADY CLAIMED", {
        fontFamily: "Arial", fontSize: "15px", color: "#ffeb72", fontStyle: "bold", stroke: "#050805", strokeThickness: 4,
      }).setOrigin(0.5).setDepth(4);
      this.bonusStatusText = this.add.text(GAME_WIDTH / 2, 280, "This result was already processed. Start a new fight for fresh rewards.", {
        fontFamily: "Arial", fontSize: "11px", color: "#d7ffd0", fontStyle: "bold", stroke: "#050805", strokeThickness: 3,
      }).setOrigin(0.5).setDepth(4);
      return;
    }

    const choices = getPostFightRewardChoices(this.profileAfterBase).slice(0, 3);
    this.add.text(GAME_WIDTH / 2, 256, "CHOOSE 1 POST-FIGHT BONUS", {
      fontFamily: "Arial", fontSize: "15px", color: "#ffeb72", fontStyle: "bold", stroke: "#050805", strokeThickness: 4,
    }).setOrigin(0.5).setDepth(4);

    this.bonusStatusText = this.add.text(GAME_WIDTH / 2, 274, "Base rewards are already saved. Pick one extra bonus.", {
      fontFamily: "Arial", fontSize: "11px", color: "#d7ffd0", fontStyle: "bold", stroke: "#050805", strokeThickness: 3,
    }).setOrigin(0.5).setDepth(4);

    choices.forEach((choice, index) => {
      const x = 190 + index * 270;
      this.createRewardChoiceCard(choice, x, 324);
    });
  }

  private createRewardChoiceCard(choice: RewardChoiceDefinition, x: number, y: number): void {
    const card = this.add.rectangle(x, y, 246, 76, 0x071107, 0.94)
      .setStrokeStyle(2, choice.color, 0.62)
      .setDepth(4)
      .setInteractive({ useHandCursor: true });
    const amount = this.add.text(x - 106, y - 28, this.getChoiceAmountLabel(choice), {
      fontFamily: "Arial", fontSize: "9px", color: choice.uiColor, fontStyle: "bold", stroke: "#050805", strokeThickness: 3,
    }).setOrigin(0, 0.5).setDepth(5);
    const rarity = this.add.text(x + 106, y - 28, getRewardChoiceRarityLabel(choice).toUpperCase(), {
      fontFamily: "Arial", fontSize: "8px", color: choice.uiColor, fontStyle: "bold", stroke: "#050805", strokeThickness: 3,
    }).setOrigin(1, 0.5).setDepth(5);
    const title = this.add.text(x, y - 8, choice.name.toUpperCase(), {
      fontFamily: "Arial", fontSize: "13px", color: "#f5fff1", fontStyle: "bold", stroke: "#050805", strokeThickness: 4,
    }).setOrigin(0.5).setDepth(5);
    const desc = this.add.text(x, y + 13, choice.description, {
      fontFamily: "Arial", fontSize: "9px", color: "#d7ffd0", fontStyle: "bold", stroke: "#050805", strokeThickness: 3,
      align: "center",
      wordWrap: { width: 212 },
    }).setOrigin(0.5).setDepth(5);
    const claim = this.add.text(x, y + 30, "TAP TO CLAIM", {
      fontFamily: "Arial", fontSize: "8px", color: "#ffeb72", fontStyle: "bold", stroke: "#050805", strokeThickness: 3,
    }).setOrigin(0.5).setDepth(5);

    const objects = [card, amount, rarity, title, desc, claim];
    this.choiceCards.push(...objects);

    card.on("pointerdown", () => this.claimRewardChoice(choice));
    card.on("pointerover", () => { if (!this.bonusClaimed) card.setScale(1.025); });
    card.on("pointerout", () => card.setScale(1));
  }

  private claimRewardChoice(choice: RewardChoiceDefinition): void {
    if (this.bonusClaimed) return;
    this.bonusClaimed = true;
    const application = applyRewardChoiceToProfile(this.profileAfterBase, choice);
    this.profileAfterBase = application.profile;
    savePlayerProfile(this.profileAfterBase);

    this.choiceCards.forEach((object) => {
      const fadeable = object as Phaser.GameObjects.GameObject & { setAlpha?: (alpha: number) => void };
      fadeable.setAlpha?.(0.42);
    });
    this.bonusStatusText.setText(`CLAIMED: ${choice.name.toUpperCase()}`);
    this.bonusStatusText.setColor(choice.uiColor);

    const unlockText = application.unlocks.length > 0
      ? `UNLOCKED: ${application.unlocks.map((item) => item.split("_").join(" ").toUpperCase()).join(" · ")}`
      : application.newLevel > application.oldLevel
        ? `LEVEL UP ${application.oldLevel} → ${application.newLevel}`
        : "BONUS SAVED";

    const xpProgress = getXpProgress(this.profileAfterBase.xp);
    this.profileText.setText(`LEVEL ${this.profileAfterBase.level} · COINS ${this.profileAfterBase.coins} · XP ${this.profileAfterBase.xp}\n${unlockText}`);
    if (this.progressHintText) {
      const nextBoss = getSelectedCampaignBoss(this.profileAfterBase);
      this.progressHintText.setText(xpProgress.nextLevel ? `${xpProgress.remaining} XP TO LEVEL ${xpProgress.nextLevel.level}` : `NEXT FIGHT: ${nextBoss.name.toUpperCase()}`);
      this.progressHintText.setColor("#ffeb72");
    }
    this.cameras.main.flash(80, 114, 255, 87, false);
  }

  private createXpProgressBar(x: number, y: number, width: number, progress: number, label: string): void {
    const clamped = Phaser.Math.Clamp(progress, 0, 1);
    this.add.text(x, y - 15, label, {
      fontFamily: "Arial", fontSize: "9px", color: "#9cff8a", fontStyle: "bold", stroke: "#050805", strokeThickness: 3,
    }).setDepth(4);
    this.add.rectangle(x, y, width, 10, 0x122112, 1)
      .setOrigin(0, 0.5)
      .setStrokeStyle(1, 0x72ff57, 0.38)
      .setDepth(4);
    this.add.rectangle(x, y, Math.max(4, width * clamped), 8, 0x72ff57, 1)
      .setOrigin(0, 0.5)
      .setDepth(5);
    this.add.text(x + width + 8, y - 6, `${Math.round(clamped * 100)}%`, {
      fontFamily: "Arial", fontSize: "10px", color: "#f5fff1", fontStyle: "bold", stroke: "#050805", strokeThickness: 3,
    }).setDepth(5);
  }

  private getChoiceAmountLabel(choice: RewardChoiceDefinition): string {
    if (choice.kind === "coins") return `+${choice.amount} COINS`;
    if (choice.kind === "xp") return `+${choice.amount} XP`;
    if (choice.kind === "leak_points") return `+${choice.amount} LEAK`;
    if (choice.kind === "skill_unlock") return "UNLOCK SKILL";
    if (choice.kind === "stage_unlock") return "UNLOCK STAGE";
    if (choice.kind === "skin_unlock") return "UNLOCK SKIN";
    return "BONUS";
  }

  private formatUnlockList(unlocks: string[], limit = 3): string {
    const visible = unlocks.slice(0, limit).map((item) => item.split("_").join(" ").toUpperCase());
    const hiddenCount = Math.max(0, unlocks.length - visible.length);
    return `${visible.join(" · ")}${hiddenCount > 0 ? ` +${hiddenCount}` : ""}`;
  }

  private createFooterButtons(): void {
    const shareButton = this.add.rectangle(274, GAME_HEIGHT - 34, 170, 34, 0x071107, 0.94)
      .setStrokeStyle(2, 0xb66cff, 0.55)
      .setDepth(4)
      .setInteractive({ useHandCursor: true });
    const shareText = this.add.text(274, GAME_HEIGHT - 34, "COPY RESULT", {
      fontFamily: "Arial", fontSize: "12px", color: "#f5fff1", fontStyle: "bold", stroke: "#050805", strokeThickness: 3,
    }).setOrigin(0.5).setDepth(5);

    shareButton.on("pointerdown", async () => {
      const copied = await this.copyResultText();
      shareText.setText(copied ? "RESULT COPIED" : "COPY FAILED");
      this.time.delayedCall(1300, () => shareText.setText("COPY RESULT"));
    });

    const again = this.add.text(488, GAME_HEIGHT - 34, "NEXT BOSS", {
      fontFamily: "Arial", fontSize: "14px", color: "#050505", backgroundColor: "#39ff14", padding: { x: 22, y: 9 }, fontStyle: "bold",
    }).setOrigin(0.5).setDepth(4);
    again.setInteractive({ useHandCursor: true });
    again.on("pointerdown", () => this.scene.start(SCENE_KEYS.arena));

    const menu = this.add.text(672, GAME_HEIGHT - 34, "BACK TO MENU", {
      fontFamily: "Arial", fontSize: "13px", color: "#f5fff1", fontStyle: "bold", stroke: "#050805", strokeThickness: 3,
    }).setOrigin(0.5).setDepth(4);
    menu.setInteractive({ useHandCursor: true });
    menu.on("pointerdown", () => this.scene.start(SCENE_KEYS.menu));
  }

  private getShareText(): string {
    const bossesBroken = this.result.bossesBroken ?? 0;
    const pickupsCollected = this.result.pickupsCollected ?? 0;
    return [
      this.getVictory() ? "I protected my wallet in BROKE Arena." : "I fought in BROKE Arena.",
      `Score: ${this.result.score}`,
      `Time: ${this.result.survivedSeconds}s`,
      `Leaks broken: ${this.result.leaksDefeated}`,
      `Bosses broken: ${bossesBroken}`,
      `Blocks: ${this.result.blocks ?? 0}`,
      `Skills used: ${this.result.skillsUsed ?? 0}`,
      `Pickups: ${pickupsCollected}`,
      `Level: ${this.profileAfterBase.level}`,
      `Coins: ${this.profileAfterBase.coins}`,
      `XP: ${this.profileAfterBase.xp}`,
      `Next boss: ${getSelectedCampaignBoss(this.profileAfterBase).name}`,
      "https://broke-leak-beast-arena.vercel.app/",
      "$BROKE",
    ].join("\n");
  }

  private getVictory(): boolean {
    return this.result.victory ?? (this.result.bossesBroken ?? 0) > 0;
  }

  private async copyResultText(): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(this.getShareText());
      return true;
    } catch {
      return false;
    }
  }

  private getGrade(): string {
    if ((this.result.bossesBroken ?? 0) >= 2 || this.result.score >= 3200 || this.result.survivedSeconds >= 100) return "S";
    if ((this.result.bossesBroken ?? 0) >= 1 || this.result.score >= 1900 || this.result.survivedSeconds >= 70) return "A";
    if (this.result.score >= 1000 || this.result.survivedSeconds >= 45) return "B";
    if (this.result.score >= 350 || this.result.survivedSeconds >= 20) return "C";
    return "D";
  }
}
