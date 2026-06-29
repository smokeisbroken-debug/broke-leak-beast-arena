import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../../config/game";
import { SCENE_KEYS } from "../../config/routes";
import {
  applyFightResultToProfile,
  applyRewardChoiceToProfile,
  getPostFightRewardChoices,
  getRewardChoiceRarityLabel,
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
  private choiceCards: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super(SCENE_KEYS.result);
  }

  init(data: RunResult): void {
    this.result = data;
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

    this.add.rectangle(GAME_WIDTH / 2, 158, GAME_WIDTH - 100, 166, 0x050805, 0.84)
      .setStrokeStyle(2, 0x39ff14, 0.26)
      .setDepth(2);

    this.createResultStats();
    this.createRewardSummary();
    this.createRewardChoiceCards();
    this.createFooterButtons();
  }

  private createResultStats(): void {
    const bossesBroken = this.result.bossesBroken ?? 0;
    const stats = [
      ["LEAKS BROKEN", this.result.leaksDefeated.toString()],
      ["FIGHT TIME", `${this.result.survivedSeconds}s`],
      ["BOSSES", bossesBroken.toString()],
      ["SCORE", this.result.score.toString()],
    ];

    stats.forEach(([label, value], index) => {
      const row = Math.floor(index / 2);
      const col = index % 2;
      const x = col === 0 ? 98 : 278;
      const y = 102 + row * 48;
      this.add.text(x, y, label, {
        fontFamily: "Arial", fontSize: "11px", color: "#9cff8a", fontStyle: "bold",
      }).setDepth(3);
      this.add.text(x + 138, y - 4, value, {
        fontFamily: "Arial", fontSize: "22px", color: "#f5fff1", fontStyle: "bold",
      }).setOrigin(1, 0).setDepth(3);
    });
  }

  private createRewardSummary(): void {
    const reward = this.rewardApplication.baseRewards;
    const profile = this.profileAfterBase;
    const xpProgress = getXpProgress(profile.xp);
    const levelText = this.rewardApplication.newLevel > this.rewardApplication.oldLevel
      ? `LEVEL UP ${this.rewardApplication.oldLevel} → ${this.rewardApplication.newLevel}`
      : `LEVEL ${profile.level}`;
    const missionText = this.rewardApplication.completedMissionIds.length > 0
      ? `MISSIONS DONE: ${this.rewardApplication.completedMissionIds.length}`
      : "DAILY MISSIONS UPDATED";
    const unlockText = this.rewardApplication.unlocks.length > 0
      ? `UNLOCKED: ${this.rewardApplication.unlocks.slice(0, 3).map((item) => item.split("_").join(" ").toUpperCase()).join(" · ")}`
      : xpProgress.nextLevel
        ? `NEXT LEVEL IN ${xpProgress.remaining} XP`
        : "MAX LEVEL FOUNDATION";

    this.add.text(506, 92, "REWARDS", {
      fontFamily: "Arial", fontSize: "13px", color: "#39ff14", fontStyle: "bold", stroke: "#050805", strokeThickness: 3,
    }).setDepth(3);

    const rewardLines = [
      `+${reward.xp} XP`,
      `+${reward.coins} COINS`,
      `+${reward.leakPoints} LEAK POINTS`,
      reward.skinShards > 0 ? `+${reward.skinShards} SKIN SHARD` : undefined,
      reward.skillCards > 0 ? `+${reward.skillCards} SKILL CARD` : undefined,
      this.rewardApplication.levelCoinReward > 0 ? `+${this.rewardApplication.levelCoinReward} LEVEL COINS` : undefined,
    ].filter(Boolean) as string[];

    this.add.text(506, 118, rewardLines.join("  ·  "), {
      fontFamily: "Arial", fontSize: "12px", color: "#f5fff1", fontStyle: "bold", stroke: "#050805", strokeThickness: 3,
      wordWrap: { width: 330 },
    }).setDepth(3);

    this.profileText = this.add.text(506, 162, `${levelText}\nCOINS ${profile.coins} · XP ${profile.xp} · LEAK POINTS ${profile.leakPoints}\n${unlockText}`, {
      fontFamily: "Arial", fontSize: "12px", color: "#d7ffd0", fontStyle: "bold", stroke: "#050805", strokeThickness: 3,
      lineSpacing: 3,
      wordWrap: { width: 330 },
    }).setDepth(3);
  }

  private createRewardChoiceCards(): void {
    const choices = getPostFightRewardChoices(this.profileAfterBase).slice(0, 3);
    this.add.text(GAME_WIDTH / 2, 256, "CHOOSE 1 BONUS UPGRADE", {
      fontFamily: "Arial", fontSize: "15px", color: "#ffeb72", fontStyle: "bold", stroke: "#050805", strokeThickness: 4,
    }).setOrigin(0.5).setDepth(4);

    this.bonusStatusText = this.add.text(GAME_WIDTH / 2, 274, "Permanent profile reward. One choice per fight.", {
      fontFamily: "Arial", fontSize: "11px", color: "#d7ffd0", fontStyle: "bold", stroke: "#050805", strokeThickness: 3,
    }).setOrigin(0.5).setDepth(4);

    choices.forEach((choice, index) => {
      const x = 190 + index * 270;
      this.createRewardChoiceCard(choice, x, 324);
    });
  }

  private createRewardChoiceCard(choice: RewardChoiceDefinition, x: number, y: number): void {
    const card = this.add.rectangle(x, y, 246, 70, 0x071107, 0.94)
      .setStrokeStyle(2, choice.color, 0.58)
      .setDepth(4)
      .setInteractive({ useHandCursor: true });
    const rarity = this.add.text(x, y - 25, getRewardChoiceRarityLabel(choice).toUpperCase(), {
      fontFamily: "Arial", fontSize: "9px", color: choice.uiColor, fontStyle: "bold", stroke: "#050805", strokeThickness: 3,
    }).setOrigin(0.5).setDepth(5);
    const title = this.add.text(x, y - 7, choice.name.toUpperCase(), {
      fontFamily: "Arial", fontSize: "13px", color: "#f5fff1", fontStyle: "bold", stroke: "#050805", strokeThickness: 4,
    }).setOrigin(0.5).setDepth(5);
    const desc = this.add.text(x, y + 16, choice.description, {
      fontFamily: "Arial", fontSize: "10px", color: "#d7ffd0", fontStyle: "bold", stroke: "#050805", strokeThickness: 3,
      align: "center",
      wordWrap: { width: 212 },
    }).setOrigin(0.5).setDepth(5);

    const objects = [card, rarity, title, desc];
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

    this.profileText.setText(`LEVEL ${this.profileAfterBase.level}\nCOINS ${this.profileAfterBase.coins} · XP ${this.profileAfterBase.xp} · LEAK POINTS ${this.profileAfterBase.leakPoints}\n${unlockText}`);
    this.cameras.main.flash(80, 114, 255, 87, false);
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

    const again = this.add.text(488, GAME_HEIGHT - 34, "PLAY AGAIN", {
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
