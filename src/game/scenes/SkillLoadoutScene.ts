import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../../config/game";
import { SCENE_KEYS } from "../../config/routes";
import {
  getSkillById,
  getSkillRarityColor,
  getSkillsForLoadoutSlot,
  isSkillUnlocked,
  loadPlayerProfile,
  savePlayerProfile,
  selectProfileSkill,
} from "../data/gameRegistry";
import type { ActiveSkillSlot, PlayerProfile, SkillDefinition } from "../data/gameRegistry";

const LOADOUT_SLOTS: Array<{ slot: ActiveSkillSlot; title: string; subtitle: string }> = [
  { slot: "skill1", title: "SKILL 1", subtitle: "OFFENSE" },
  { slot: "skill2", title: "SKILL 2", subtitle: "UTILITY" },
  { slot: "ultimate", title: "ULTIMATE", subtitle: "100 ENERGY" },
];

export class SkillLoadoutScene extends Phaser.Scene {
  private profile!: PlayerProfile;
  private selectedSlot: ActiveSkillSlot = "skill1";

  constructor() {
    super(SCENE_KEYS.skillLoadout);
  }

  create(data?: { selectedSlot?: ActiveSkillSlot }): void {
    this.profile = loadPlayerProfile();
    this.selectedSlot = data?.selectedSlot ?? this.selectedSlot ?? "skill1";

    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "menu-start-screen")
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setDepth(0);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x020304, 0.62).setDepth(1);

    this.add.text(GAME_WIDTH / 2, 26, "SKILL LOADOUT", {
      fontFamily: "Arial",
      fontSize: "28px",
      color: "#72ff57",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(3);

    this.add.text(GAME_WIDTH / 2, 58, "CHOOSE ACTIVE SKILLS · COOLDOWNS AND ENERGY WORK IN BATTLE", {
      fontFamily: "Arial",
      fontSize: "12px",
      color: "#fcfff7",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(3);

    this.createLoadoutPanel();
    this.createSkillCards();
    this.createFooterActions();

    const back = this.add.text(64, GAME_HEIGHT - 30, "BACK", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#fcfff7",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 4,
      backgroundColor: "#071107",
      padding: { x: 18, y: 8 },
    }).setOrigin(0.5).setDepth(10).setInteractive({ useHandCursor: true });
    back.on("pointerdown", () => this.scene.start(SCENE_KEYS.menu));
  }

  private createFooterActions(): void {
    const unlockedCount = getSkillsForLoadoutSlot(this.selectedSlot)
      .filter((skill) => isSkillUnlocked(this.profile.unlockedSkillIds, skill.id)).length;
    const totalCount = getSkillsForLoadoutSlot(this.selectedSlot).length;
    const activeSkill = getSkillById(this.profile.selectedSkillIds[this.selectedSlot]);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 34, `ACTIVE ${activeSkill.name.toUpperCase()} · UNLOCKED ${unlockedCount}/${totalCount}`, {
      fontFamily: "Arial",
      fontSize: "12px",
      color: activeSkill.uiColor,
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(10);

    const fight = this.add.text(GAME_WIDTH - 94, GAME_HEIGHT - 30, "FIGHT", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#041004",
      fontStyle: "bold",
      stroke: "#72ff57",
      strokeThickness: 2,
      backgroundColor: "#72ff57",
      padding: { x: 20, y: 8 },
    }).setOrigin(0.5).setDepth(10).setInteractive({ useHandCursor: true });
    fight.on("pointerdown", () => this.scene.start(SCENE_KEYS.arena));
  }

  private createLoadoutPanel(): void {
    LOADOUT_SLOTS.forEach((entry, index) => {
      const x = 162 + index * 298;
      const y = 118;
      const skill = getSkillById(this.profile.selectedSkillIds[entry.slot]);
      const active = this.selectedSlot === entry.slot;

      const panel = this.add.rectangle(x, y, 254, 72, 0x061006, 0.86)
        .setStrokeStyle(active ? 4 : 2, active ? skill.color : 0x72ff57, active ? 0.96 : 0.34)
        .setDepth(4)
        .setInteractive({ useHandCursor: true });
      panel.on("pointerdown", () => this.scene.restart({ selectedSlot: entry.slot }));

      this.add.text(x - 112, y - 28, entry.title, {
        fontFamily: "Arial",
        fontSize: "12px",
        color: "#72ff57",
        fontStyle: "bold",
        stroke: "#041004",
        strokeThickness: 4,
      }).setDepth(5);
      this.add.text(x + 112, y - 28, entry.subtitle, {
        fontFamily: "Arial",
        fontSize: "10px",
        color: "#d7ffd0",
        fontStyle: "bold",
        stroke: "#041004",
        strokeThickness: 3,
      }).setOrigin(1, 0).setDepth(5);
      this.add.text(x, y + 5, skill.name.toUpperCase(), {
        fontFamily: "Arial",
        fontSize: skill.name.length > 17 ? "13px" : "15px",
        color: skill.uiColor,
        fontStyle: "bold",
        stroke: "#041004",
        strokeThickness: 5,
      }).setOrigin(0.5).setDepth(5);
      this.add.text(x, y + 28, `${skill.effect.toUpperCase()} · ${Math.round(skill.cooldownMs / 1000)}s CD · ${skill.energyCost}E`, {
        fontFamily: "Arial",
        fontSize: "10px",
        color: "#fcfff7",
        fontStyle: "bold",
        stroke: "#041004",
        strokeThickness: 3,
      }).setOrigin(0.5).setDepth(5);
    });
  }

  private createSkillCards(): void {
    const skills = getSkillsForLoadoutSlot(this.selectedSlot);
    skills.forEach((skill, index) => this.createSkillCard(skill, index));
  }

  private createSkillCard(skill: SkillDefinition, index: number): void {
    const col = index % 3;
    const row = Math.floor(index / 3);
    const x = 176 + col * 284;
    const y = 236 + row * 112;
    const unlocked = isSkillUnlocked(this.profile.unlockedSkillIds, skill.id);
    const active = this.profile.selectedSkillIds[this.selectedSlot] === skill.id;
    const alpha = unlocked ? 0.88 : 0.54;

    const card = this.add.rectangle(x, y, 256, 96, 0x061006, alpha)
      .setStrokeStyle(active ? 4 : 2, active ? skill.color : 0x2a382a, active ? 0.98 : 0.55)
      .setDepth(4);

    this.add.circle(x - 102, y - 18, 24, skill.color, unlocked ? 0.22 : 0.07)
      .setStrokeStyle(2, skill.color, unlocked ? 0.72 : 0.25)
      .setDepth(5);
    this.add.text(x - 102, y - 18, skill.slot === "ultimate" ? "ULT" : skill.effect.toUpperCase().slice(0, 3), {
      fontFamily: "Arial",
      fontSize: "10px",
      color: "#fcfff7",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(6);

    this.add.text(x - 70, y - 42, skill.name.toUpperCase(), {
      fontFamily: "Arial",
      fontSize: skill.name.length > 16 ? "11px" : "13px",
      color: unlocked ? skill.uiColor : "#869186",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 4,
    }).setOrigin(0, 0).setDepth(6);

    this.add.text(x - 70, y - 23, `${skill.rarity.toUpperCase()} · LV ${skill.unlockLevel}`, {
      fontFamily: "Arial",
      fontSize: "10px",
      color: getSkillRarityColor(skill),
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 3,
    }).setOrigin(0, 0).setDepth(6);

    this.add.text(x - 70, y - 5, skill.description, {
      fontFamily: "Arial",
      fontSize: "10px",
      color: unlocked ? "#d7ffd0" : "#8c968c",
      stroke: "#041004",
      strokeThickness: 3,
      wordWrap: { width: 184 },
      lineSpacing: 1,
    }).setOrigin(0, 0).setDepth(6);

    const footer = `${skill.damage ? `DMG ${skill.damage}` : skill.healAmount ? `HEAL ${skill.healAmount}` : "BUFF"} · ${Math.round(skill.cooldownMs / 100) / 10}s CD`;
    this.add.text(x - 70, y + 34, footer, {
      fontFamily: "Arial",
      fontSize: "10px",
      color: "#fcfff7",
      fontStyle: "bold",
      stroke: "#041004",
      strokeThickness: 3,
    }).setOrigin(0, 0).setDepth(6);

    const buttonLabel = active ? "ACTIVE" : unlocked ? "EQUIP" : `LV ${skill.unlockLevel}`;
    const button = this.add.rectangle(x + 82, y + 34, 76, 22, active ? 0x72ff57 : unlocked ? skill.color : 0x2a322a, active ? 0.96 : 0.72)
      .setStrokeStyle(2, active ? 0xfcfff7 : skill.color, active ? 0.7 : 0.35)
      .setDepth(6);
    const label = this.add.text(x + 82, y + 34, buttonLabel, {
      fontFamily: "Arial",
      fontSize: "10px",
      color: active ? "#041004" : "#fcfff7",
      fontStyle: "bold",
      stroke: active ? "#72ff57" : "#041004",
      strokeThickness: active ? 0 : 3,
    }).setOrigin(0.5).setDepth(7);

    if (!active && unlocked) {
      card.setInteractive({ useHandCursor: true });
      button.setInteractive({ useHandCursor: true });
      label.setInteractive({ useHandCursor: true });
      const equip = () => {
        const nextProfile = selectProfileSkill(loadPlayerProfile(), this.selectedSlot, skill.id);
        savePlayerProfile(nextProfile);
        this.scene.restart({ selectedSlot: this.selectedSlot });
      };
      card.on("pointerdown", equip);
      button.on("pointerdown", equip);
      label.on("pointerdown", equip);
    }
  }
}
