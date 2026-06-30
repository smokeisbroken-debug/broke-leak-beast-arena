import type {
  DuelModifierId,
  DuelOutcome,
  DuelParticipantSlot,
  DuelScoreBreakdown,
  DuelScoreBreakdownRow,
  DuelScoreInput,
  DuelScoreWeights,
  DuelSeedDefinition,
} from "./DuelTypes";

export type DuelScoreQualityBand = "leaked_out" | "survived" | "clean_run" | "dominant_control";
export type DuelScoreValidationSeverity = "info" | "warning" | "backend_blocker";
export type DuelScoreValidationFlagId =
  | "backend_validation_required"
  | "seed_duration_cap_applied"
  | "hp_cap_applied"
  | "damage_cap_applied"
  | "leak_cap_applied"
  | "guard_cap_applied"
  | "skill_cap_applied"
  | "damage_taken_cap_applied"
  | "participation_missing"
  | "score_not_reward_claimable";

export interface DuelScoreCaps {
  damageDealt: number;
  leaksDefeated: number;
  hpRemaining: number;
  guards: number;
  skillsUsed: number;
  damageTaken: number;
}

export interface DuelScoreValidationFlag {
  id: DuelScoreValidationFlagId;
  label: string;
  severity: DuelScoreValidationSeverity;
}

export interface DuelScoreFormulaInput {
  participantSlot: DuelParticipantSlot;
  displayName: string;
  seed: DuelSeedDefinition;
  rawScore: DuelScoreInput;
  weights?: DuelScoreWeights;
}

export interface DuelScoreFormulaSnapshot {
  version: string;
  participantSlot: DuelParticipantSlot;
  displayName: string;
  seed: DuelSeedDefinition;
  rawScore: Required<DuelScoreInput>;
  normalizedScore: Required<DuelScoreInput>;
  score: DuelScoreBreakdown;
  cappedRows: DuelScoreBreakdownRow[];
  qualityBand: DuelScoreQualityBand;
  validationFlags: DuelScoreValidationFlag[];
  backendValidationRequired: boolean;
  publicSubmitEnabled: boolean;
  claimEnabled: boolean;
  rows: readonly string[];
}

export interface DuelScoreVersusPreview {
  version: string;
  seed: DuelSeedDefinition;
  playerA: DuelScoreFormulaSnapshot;
  playerB: DuelScoreFormulaSnapshot;
  outcome: DuelOutcome;
  winnerLabel: string;
  scoreMargin: number;
  backendValidationRequired: boolean;
  publicSubmitEnabled: boolean;
  rows: readonly string[];
}

export interface DuelModifierScoreNote {
  modifierId: DuelModifierId;
  label: string;
  scoringFocus: string;
}

export interface DuelScoreSystemDefinition {
  version: string;
  goal: string;
  caps: DuelScoreCaps;
  publicSubmitEnabled: boolean;
  backendValidationRequired: boolean;
  qualityBands: readonly DuelScoreQualityBand[];
  modifierNotes: readonly DuelModifierScoreNote[];
  backendLocks: readonly string[];
}
