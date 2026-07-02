import type { PlayerProfile } from "../data/playerProfile";
import { createRunValidationPayloadMap } from "./RunValidationPayloadSystem";
import type { RunValidationPayload, RunValidationSource } from "../types/RunValidationPayloadTypes";
import type {
  AntiCheatAssessment,
  AntiCheatAssessmentInput,
  AntiCheatAssessmentMap,
  AntiCheatCheckStatus,
  AntiCheatFinding,
  AntiCheatMetricAssessment,
  AntiCheatRuleDefinition,
  AntiCheatRuleId,
  AntiCheatSeverity,
  AntiCheatSummary,
  AntiCheatSystemDefinition,
  AntiCheatVerdict,
} from "../types/AntiCheatTypes";

export const ANTI_CHEAT_SYSTEM_VERSION = "0.13.3-anti-cheat-skeleton";

export const ANTI_CHEAT_RULES: readonly AntiCheatRuleDefinition[] = [
  {
    id: "payload_hash_required",
    label: "Payload hash required",
    severity: "warning",
    backendRequired: false,
    description: "Every ranked run payload needs a deterministic hash so the backend can compare client data with server validation.",
  },
  {
    id: "server_clock_required",
    label: "Server clock required",
    severity: "critical",
    backendRequired: true,
    description: "Start and completion time cannot be trusted for ranked score, tournaments, boss damage or Leak Duel until verified by the server clock.",
  },
  {
    id: "server_seed_required",
    label: "Server seed required",
    severity: "critical",
    backendRequired: true,
    description: "Ranked arena, tournament and Leak Duel runs must use server-generated or server-approved seeds before results become public.",
  },
  {
    id: "metric_reasonable_cap",
    label: "Metric reasonable cap",
    severity: "warning",
    backendRequired: false,
    description: "Score, boss damage, action counts and survival metrics are checked against local reasonable caps before future remote validation.",
  },
  {
    id: "duration_reasonable_cap",
    label: "Duration reasonable cap",
    severity: "warning",
    backendRequired: false,
    description: "Runs that are too long for a mode should be reviewed before ranked submission or reward reconciliation.",
  },
  {
    id: "hp_reasonable_cap",
    label: "HP reasonable cap",
    severity: "warning",
    backendRequired: false,
    description: "HP remaining above expected caps is suspicious until server-side state reconstruction exists.",
  },
  {
    id: "action_rate_reasonable_cap",
    label: "Action rate reasonable cap",
    severity: "warning",
    backendRequired: false,
    description: "Guard, dodge, skill and ultimate counts should stay within plausible action-per-minute limits.",
  },
  {
    id: "profile_snapshot_required",
    label: "Profile snapshot required",
    severity: "warning",
    backendRequired: true,
    description: "Ranked runs require a cloud-save profile snapshot so power, skills, evolution and skins cannot be spoofed locally.",
  },
  {
    id: "reward_submit_locked",
    label: "Reward submit locked",
    severity: "critical",
    backendRequired: true,
    description: "Any economy, leaderboard, tournament, duel or boss reward remains blocked until backend validation and reconciliation are active.",
  },
];

export const ANTI_CHEAT_SYSTEM_DEFINITION: AntiCheatSystemDefinition = {
  version: ANTI_CHEAT_SYSTEM_VERSION,
  goal: "Create a local anti-cheat assessment layer for run validation payloads before leaderboard, tournament, Leak Duel, boss damage or reward submissions become public.",
  localPreviewOnly: true,
  publicSubmitEnabled: false,
  supportedSources: ["arena", "campaign", "tournament", "duel", "weekly_boss"],
  rules: ANTI_CHEAT_RULES,
  requiredBeforeLive: [
    "Auth Link Prep",
    "Cloud Save Adapter live identity",
    "server-generated seeds",
    "server clock timestamps",
    "backend run reconstruction",
    "reward reconciliation ledger",
  ],
};

const ACTION_RATE_KEYS = new Set(["guards", "dodges", "skillsUsed", "ultimatesUsed"]);

function getRule(id: AntiCheatRuleId): AntiCheatRuleDefinition {
  const rule = ANTI_CHEAT_RULES.find((candidate) => candidate.id === id);
  if (!rule) {
    throw new Error(`Unknown anti-cheat rule: ${id}`);
  }
  return rule;
}

function severityRank(severity: AntiCheatSeverity): number {
  if (severity === "critical") return 4;
  if (severity === "warning") return 3;
  if (severity === "watch") return 2;
  return 1;
}

function statusForSeverity(severity: AntiCheatSeverity, blocking: boolean): AntiCheatCheckStatus {
  if (blocking) return "blocked";
  if (severity === "critical") return "fail";
  if (severity === "warning") return "watch";
  if (severity === "watch") return "watch";
  return "pass";
}

function createFinding(input: {
  ruleId: AntiCheatRuleId;
  label?: string;
  detail: string;
  severity?: AntiCheatSeverity;
  blocking?: boolean;
  index: number;
}): AntiCheatFinding {
  const rule = getRule(input.ruleId);
  const severity = input.severity ?? rule.severity;
  const blocking = input.blocking ?? rule.backendRequired;
  return {
    id: `${input.ruleId}-${input.index}`,
    ruleId: input.ruleId,
    label: input.label ?? rule.label,
    detail: input.detail,
    severity,
    status: statusForSeverity(severity, blocking),
    blocking,
  };
}

function metricSeverity(ratio: number): AntiCheatSeverity {
  if (ratio > 1) return "critical";
  if (ratio >= 0.85) return "warning";
  if (ratio >= 0.65) return "watch";
  return "info";
}

function metricStatus(severity: AntiCheatSeverity): AntiCheatCheckStatus {
  if (severity === "critical") return "fail";
  if (severity === "warning" || severity === "watch") return "watch";
  return "pass";
}

function assessMetrics(payload: RunValidationPayload): AntiCheatMetricAssessment[] {
  return payload.metrics.map((metric) => {
    const maxReasonableValue = Math.max(1, metric.maxReasonableValue);
    const ratio = metric.value / maxReasonableValue;
    const severity = metricSeverity(ratio);
    return {
      key: metric.key,
      label: metric.label,
      value: metric.value,
      maxReasonableValue,
      ratio,
      severity,
      status: metricStatus(severity),
    };
  });
}

function createMetricFindings(assessments: readonly AntiCheatMetricAssessment[], startIndex: number): AntiCheatFinding[] {
  const findings: AntiCheatFinding[] = [];
  assessments.forEach((metric) => {
    if (metric.severity === "info") return;
    const isActionRate = ACTION_RATE_KEYS.has(metric.key);
    const ruleId: AntiCheatRuleId = isActionRate ? "action_rate_reasonable_cap" : metric.key === "survivedSeconds" ? "duration_reasonable_cap" : metric.key === "hpRemaining" ? "hp_reasonable_cap" : "metric_reasonable_cap";
    findings.push(
      createFinding({
        ruleId,
        label: `${metric.label} check`,
        detail: `${metric.label}: ${Math.floor(metric.value).toLocaleString("en-US")} / ${Math.floor(metric.maxReasonableValue).toLocaleString("en-US")} local reasonable cap.`,
        severity: metric.severity,
        blocking: metric.severity === "critical",
        index: startIndex + findings.length,
      }),
    );
  });
  return findings;
}

function getPayloadHash(payload: RunValidationPayload): string {
  return payload.integrity.payloadHash || "missing-hash";
}

function getVerdict(findings: readonly AntiCheatFinding[]): AntiCheatVerdict {
  if (findings.some((finding) => finding.blocking)) return "blocked_backend_required";
  if (findings.some((finding) => finding.severity === "warning" || finding.severity === "watch")) return "needs_review";
  return "clean_preview";
}

function createSummaryRows(payload: RunValidationPayload, findings: readonly AntiCheatFinding[], verdict: AntiCheatVerdict): string[] {
  const highestSeverity = findings.reduce<AntiCheatSeverity>((current, finding) => (severityRank(finding.severity) > severityRank(current) ? finding.severity : current), "info");
  return [
    `SOURCE: ${payload.source.replace(/_/g, " ").toUpperCase()}`,
    `RUN: ${payload.runId}`,
    `HASH: ${getPayloadHash(payload)}`,
    `VERDICT: ${verdict.replace(/_/g, " ").toUpperCase()}`,
    `HIGHEST SEVERITY: ${highestSeverity.toUpperCase()}`,
    "PUBLIC SUBMIT: DISABLED",
  ];
}

export function createAntiCheatAssessment(input: AntiCheatAssessmentInput): AntiCheatAssessment {
  const payload = input.payload;
  const metricAssessments = assessMetrics(payload);
  const findings: AntiCheatFinding[] = [];

  if (!payload.integrity.payloadHash) {
    findings.push(
      createFinding({
        ruleId: "payload_hash_required",
        detail: "Payload hash is missing from the run validation payload.",
        blocking: true,
        index: findings.length,
      }),
    );
  }

  if (!input.serverClockVerified || payload.integrity.requiresServerClock) {
    findings.push(
      createFinding({
        ruleId: "server_clock_required",
        detail: "Server clock has not verified this run start/completion window yet.",
        blocking: true,
        index: findings.length,
      }),
    );
  }

  if (!input.serverSeedVerified || payload.integrity.requiresServerSeed) {
    findings.push(
      createFinding({
        ruleId: "server_seed_required",
        detail: "Server seed validation is required before this result can become ranked.",
        blocking: true,
        index: findings.length,
      }),
    );
  }

  if (!input.backendIdentityVerified || payload.playerSnapshot.level <= 0 || payload.playerSnapshot.evolutionId === "unknown") {
    findings.push(
      createFinding({
        ruleId: "profile_snapshot_required",
        detail: "Cloud-save profile snapshot and backend identity are not verified for this payload.",
        blocking: true,
        index: findings.length,
      }),
    );
  }

  findings.push(...createMetricFindings(metricAssessments, findings.length));

  if (!payload.publicSubmitEnabled || payload.localPreviewOnly) {
    findings.push(
      createFinding({
        ruleId: "reward_submit_locked",
        detail: "Ranked submit and reward reconciliation are intentionally locked in local preview.",
        blocking: true,
        index: findings.length,
      }),
    );
  }

  const verdict = getVerdict(findings);
  return {
    id: `anti-cheat-${payload.id}`,
    version: ANTI_CHEAT_SYSTEM_VERSION,
    source: payload.source,
    kind: payload.kind,
    runId: payload.runId,
    payloadHash: getPayloadHash(payload),
    verdict,
    localPreviewOnly: true,
    publicSubmitEnabled: false,
    backendRequired: true,
    findingCount: findings.length,
    blockingFindingCount: findings.filter((finding) => finding.blocking).length,
    criticalFindingCount: findings.filter((finding) => finding.severity === "critical").length,
    metricAssessments,
    findings,
    summaryRows: createSummaryRows(payload, findings, verdict),
  };
}

export function createAntiCheatAssessmentFromPayload(payload: RunValidationPayload): AntiCheatAssessment {
  return createAntiCheatAssessment({ payload });
}

export function createAntiCheatAssessmentMap(profile: PlayerProfile): AntiCheatAssessmentMap {
  const payloadMap = createRunValidationPayloadMap(profile);
  return (Object.entries(payloadMap) as [RunValidationSource, RunValidationPayload][]).reduce<AntiCheatAssessmentMap>((acc, [source, payload]) => {
    acc[source] = createAntiCheatAssessmentFromPayload(payload);
    return acc;
  }, {} as AntiCheatAssessmentMap);
}

export function getAntiCheatSummary(): AntiCheatSummary {
  return {
    version: ANTI_CHEAT_SYSTEM_VERSION,
    localPreviewOnly: ANTI_CHEAT_SYSTEM_DEFINITION.localPreviewOnly,
    publicSubmitEnabled: ANTI_CHEAT_SYSTEM_DEFINITION.publicSubmitEnabled,
    ruleCount: ANTI_CHEAT_RULES.length,
    backendRequiredRuleCount: ANTI_CHEAT_RULES.filter((rule) => rule.backendRequired).length,
    supportedSources: ANTI_CHEAT_SYSTEM_DEFINITION.supportedSources,
    requiredBeforeLive: ANTI_CHEAT_SYSTEM_DEFINITION.requiredBeforeLive,
  };
}
