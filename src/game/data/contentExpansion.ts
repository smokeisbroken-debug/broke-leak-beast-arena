import { ARENA_BOSSES } from "./bosses";
import { CAMPAIGN_CHAPTERS } from "./campaigns";
import { SKILLS } from "./skills";
import { SKINS } from "./skins";
import { STAGES } from "./stages";

export interface ContentExpansionSummary {
  chapters: number;
  bosses: number;
  skins: number;
  skills: number;
  stages: number;
  playableBosses: number;
}

export const CONTENT_EXPANSION_VERSION = "content-foundation-1";

export function getContentExpansionSummary(): ContentExpansionSummary {
  return {
    chapters: CAMPAIGN_CHAPTERS.length,
    bosses: ARENA_BOSSES.length,
    skins: SKINS.length,
    skills: SKILLS.length,
    stages: STAGES.length,
    playableBosses: ARENA_BOSSES.filter((boss) => boss.unlockLevel > 0).length,
  };
}

export const CONTENT_EXPANSION_NOTES = [
  "All expanded bosses use existing placeholder sprites until final art is generated.",
  "Campaign content is now data-driven: add a boss to ARENA_BOSSES and place its id in CAMPAIGN_CHAPTERS.",
  "Stages already carry modifiers, hazards, unlock levels, and background keys.",
  "Skill and skin lists are prepared for future assets without changing combat scene structure.",
];
