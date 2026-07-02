import type { RunValidationPayload, RunValidationPayloadKind, RunValidationSource } from "./RunValidationPayloadTypes";

export type AntiCheatRuleId =
  | "payload_hash_required"
  | "server_clock_required"
  | "server_seed_required"
  | "metric_reasonable_cap"
  | "duration_reasonable_cap"
  | "hp_reasonable_cap"
  | "action_rate_reasonable_cap"
  | "profile_snapshot_required"
  | "reward_submit_locked";

export type AntiCheatSeverity = "info" | "watch" | "warning" | "critical";
export type AntiCheatVerdict = "clean_preview" | "needs_review" | "blocked_backend_required";
export type AntiCheatCheckStatus = "pass" | "watch" | "fail" | "blocked";

export interface AntiCheatRuleDefinition {
  id: AntiCheatRuleId;
  label: string;
  severity: AntiCheatSeverity;
  backendRequired: boolean;
  description: string;
}

export interface AntiCheatFinding {
  id: string;
  ruleId: AntiCheatRuleId;
  label: string;
  detail: string;
  severity: AntiCheatSeverity;
  status: AntiCheatCheckStatus;
  blocking: boolean;
}

export interface AntiCheatMetricAssessment {
  key: string;
  label: string;
  value: number;
  maxReasonableValue: number;
  ratio: number;
  severity: AntiCheatSeverity;
  status: AntiCheatCheckStatus;
}

export interface AntiCheatAssessment {
  id: string;
  version: string;
  source: RunValidationSource;
  kind: RunValidationPayloadKind;
  runId: string;
  payloadHash: string;
  verdict: AntiCheatVerdict;
  localPreviewOnly: boolean;
  publicSubmitEnabled: boolean;
  backendRequired: boolean;
  findingCount: number;
  blockingFindingCount: number;
  criticalFindingCount: number;
  metricAssessments: readonly AntiCheatMetricAssessment[];
  findings: readonly AntiCheatFinding[];
  summaryRows: readonly string[];
}

export interface AntiCheatSummary {
  version: string;
  localPreviewOnly: boolean;
  publicSubmitEnabled: boolean;
  ruleCount: number;
  backendRequiredRuleCount: number;
  supportedSources: readonly RunValidationSource[];
  requiredBeforeLive: readonly string[];
}

export interface AntiCheatSystemDefinition {
  version: string;
  goal: string;
  localPreviewOnly: boolean;
  publicSubmitEnabled: boolean;
  supportedSources: readonly RunValidationSource[];
  rules: readonly AntiCheatRuleDefinition[];
  requiredBeforeLive: readonly string[];
}

export type AntiCheatAssessmentMap = Record<RunValidationSource, AntiCheatAssessment>;

export interface AntiCheatAssessmentInput {
  payload: RunValidationPayload;
  serverClockVerified?: boolean;
  serverSeedVerified?: boolean;
  backendIdentityVerified?: boolean;
}
