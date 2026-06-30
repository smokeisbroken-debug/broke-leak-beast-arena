import type { LeaderboardId, LeaderboardSubmissionStatus, LeaderboardValidationTier } from "./LeaderboardTypes";
import type {
  TournamentId,
  TournamentScoreBreakdownRow,
  TournamentScoreInput,
  TournamentScorePreview,
  TournamentScoreWeights,
} from "./TournamentTypes";

export type TournamentScoreSafetyTier = "local_preview" | "backend_locked" | "backend_authoritative";
export type TournamentScoreSource = "sample_preview" | "local_run_preview" | "validated_run_payload";
export type TournamentScoreVerdict = "preview_only" | "ready_for_adapter" | "blocked_backend_validation" | "blocked_anticheat";

export interface TournamentScoreCaps {
  score: number;
  leaksDefeated: number;
  bossDamage: number;
  survivedSeconds: number;
  hpRemaining: number;
  guards: number;
  damageTaken: number;
  finalPoints: number;
}

export interface TournamentNormalizedScoreInput extends TournamentScoreInput {
  source: TournamentScoreSource;
}

export interface TournamentScorePenaltyRow {
  id: "damage_taken" | "missing_participation" | "backend_lock";
  label: string;
  value: number;
  points: number;
  backendValidationRequired: boolean;
}

export interface TournamentScoringSnapshot extends TournamentScorePreview {
  leaderboardId: LeaderboardId;
  periodKey: string;
  safetyTier: TournamentScoreSafetyTier;
  scoreSource: TournamentScoreSource;
  verdict: TournamentScoreVerdict;
  submissionStatus: LeaderboardSubmissionStatus;
  normalizedInput: TournamentNormalizedScoreInput;
  weights: TournamentScoreWeights;
  caps: TournamentScoreCaps;
  penalties: TournamentScorePenaltyRow[];
  localPreviewValue: number;
  backendLockedReason: string;
}

export interface TournamentScorePreviewCard {
  tournamentId: TournamentId;
  leaderboardId: LeaderboardId;
  periodKey: string;
  points: number;
  validationTier: LeaderboardValidationTier;
  verdict: TournamentScoreVerdict;
  backendValidationRequired: boolean;
  publicSubmitEnabled: boolean;
  componentCount: number;
  positivePointTotal: number;
  penaltyPointTotal: number;
}

export interface TournamentScoringSystemDefinition {
  version: string;
  goal: string;
  defaultCaps: TournamentScoreCaps;
  safetyRules: readonly string[];
  requiredBeforeRealSubmit: readonly string[];
}

export interface TournamentScoringSummary {
  version: string;
  tournamentCount: number;
  previewCards: TournamentScorePreviewCard[];
  backendLockedCount: number;
  publicSubmitEnabled: boolean;
}

export type TournamentScoreBreakdownMap = Record<TournamentId, TournamentScoringSnapshot>;
export type TournamentScorePreviewCardMap = Record<TournamentId, TournamentScorePreviewCard>;

export type { TournamentScoreBreakdownRow };
