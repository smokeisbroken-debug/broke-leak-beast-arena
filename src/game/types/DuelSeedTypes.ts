import type { DuelModeId, DuelModifierId, DuelSeedDefinition, DuelSeedStatus } from "./DuelTypes";

export type DuelSeedSource = "local_preview" | "backend_future";
export type DuelSeedDifficultyBand = "training" | "standard" | "pressure" | "boss_pressure";
export type DuelSeedFairnessRuleId =
  | "same_seed_key"
  | "same_stage"
  | "same_boss"
  | "same_modifiers"
  | "same_duration"
  | "no_player_power_scaling"
  | "backend_signature_required_for_ranked";

export interface DuelSeedTemplate {
  id: string;
  label: string;
  stageId: string;
  bossId?: string;
  durationSeconds: number;
  modifiers: DuelModifierId[];
  difficultyBand: DuelSeedDifficultyBand;
  theme: string;
}

export interface DuelSeedGenerationInput {
  duelId: DuelModeId;
  matchType: "friendly" | "ranked" | "tournament_qualifier";
  periodKey: string;
  playerAId: string;
  playerBId?: string;
  nonce?: string;
  source?: DuelSeedSource;
}

export interface DuelSeedHashResult {
  hash: number;
  hashKey: string;
  templateIndex: number;
  modifierRotation: number;
}

export interface DuelSeedSnapshot {
  version: string;
  input: Required<Pick<DuelSeedGenerationInput, "duelId" | "matchType" | "periodKey" | "playerAId" | "nonce" | "source">> & {
    playerBId?: string;
  };
  template: DuelSeedTemplate;
  seed: DuelSeedDefinition;
  hash: DuelSeedHashResult;
  fairnessRules: DuelSeedFairnessRuleId[];
  backendValidationRequired: boolean;
  publicSubmitEnabled: boolean;
  notes: string[];
}

export interface DuelSeedPreviewCard {
  title: string;
  subtitle: string;
  seedKey: string;
  stageId: string;
  bossId?: string;
  durationSeconds: number;
  modifiers: DuelModifierId[];
  difficultyBand: DuelSeedDifficultyBand;
  backendValidationRequired: boolean;
  rows: readonly string[];
}

export interface DuelSeedSystemDefinition {
  version: string;
  goal: string;
  seedStatus: DuelSeedStatus;
  localPreviewEnabled: boolean;
  publicSubmitEnabled: boolean;
  templates: readonly DuelSeedTemplate[];
  fairnessRules: readonly DuelSeedFairnessRuleId[];
  backendLocks: readonly string[];
}
