import type { AuthLinkEnvelope } from "./AuthLinkTypes";
import type { BackendConfigRouteKey } from "./BackendConfigTypes";
import type { LeaderboardId, LeaderboardPeriodKey } from "./LeaderboardTypes";
import type { MultiplayerAdapterEnvelope } from "./MultiplayerAdapterTypes";
import type { DuelLeaderboardSubmitPreview } from "./DuelLeaderboardLinkTypes";
import type { DuelResultPreview } from "./DuelResultTypes";
import type { DuelModeId, DuelOutcome } from "./DuelTypes";

export type RemoteDuelSubmitOperationId = "fetch_match" | "submit_result" | "reconcile_rewards";
export type RemoteDuelSubmitTransport = "local_preview" | "http_json_future";
export type RemoteDuelSubmitStatus = "local_preview" | "remote_read_locked" | "remote_submit_locked" | "blocked_backend_required";
export type RemoteDuelSubmitLockId =
  | "remote_config_required"
  | "backend_identity_required"
  | "cloud_save_required"
  | "run_validation_required"
  | "anti_cheat_required"
  | "server_clock_required"
  | "server_seed_required"
  | "opponent_result_required"
  | "matchmaking_required"
  | "duplicate_submit_protection_required"
  | "reward_reconciliation_required"
  | "public_submit_disabled";

export interface RemoteDuelSubmitRouteDefinition {
  operationId: RemoteDuelSubmitOperationId;
  label: string;
  routeKey: BackendConfigRouteKey;
  method: "GET" | "POST";
  remotePath: string;
  transport: RemoteDuelSubmitTransport;
  backendLocked: boolean;
  publicWriteEnabled: boolean;
  localPreviewOnly: boolean;
  locks: readonly RemoteDuelSubmitLockId[];
  description: string;
}

export interface RemoteDuelSubmitReadinessRow {
  duelId: DuelModeId;
  title: string;
  leaderboardId: LeaderboardId;
  periodKey: LeaderboardPeriodKey;
  fetchStatus: RemoteDuelSubmitStatus;
  submitStatus: RemoteDuelSubmitStatus;
  remoteReadEnabled: boolean;
  remoteSubmitEnabled: boolean;
  asyncFirst: boolean;
  requiresAntiCheat: boolean;
  requiresBackendValidation: boolean;
  locks: readonly RemoteDuelSubmitLockId[];
  requiredBeforeRemote: readonly string[];
}

export interface RemoteDuelFetchPreview {
  id: string;
  duelId: DuelModeId;
  operationId: "fetch_match";
  routeKey: "duel.fetch";
  remotePath: string;
  method: "GET";
  periodKey: LeaderboardPeriodKey;
  generatedAtIso: string;
  status: RemoteDuelSubmitStatus;
  remoteReadEnabled: boolean;
  localPreviewOnly: boolean;
  locks: readonly RemoteDuelSubmitLockId[];
  queryPreview: {
    duelId: DuelModeId;
    periodKey: LeaderboardPeriodKey;
    includeSeed: boolean;
    includeOpponent: boolean;
  };
}

export interface RemoteDuelSubmitPreview {
  id: string;
  duelId: DuelModeId;
  leaderboardId: LeaderboardId;
  operationId: "submit_result";
  routeKey: "duel.submit";
  remotePath: string;
  method: "POST";
  playerId: string;
  displayName: string;
  periodKey: LeaderboardPeriodKey;
  matchId: string;
  outcome: DuelOutcome;
  localScore: number;
  opponentScore: number;
  scoreMargin: number;
  rankPoints: number;
  payloadHash: string;
  generatedAtIso: string;
  status: RemoteDuelSubmitStatus;
  remoteSubmitEnabled: boolean;
  localPreviewOnly: boolean;
  locks: readonly RemoteDuelSubmitLockId[];
  requiredBeforeRemote: readonly string[];
  authEnvelope: AuthLinkEnvelope;
  cloudProfileHash: string;
  resultPreview: DuelResultPreview;
  leaderboardSubmitPreview: DuelLeaderboardSubmitPreview;
  multiplayerEnvelope: MultiplayerAdapterEnvelope;
  payloadPreview: {
    duelId: DuelModeId;
    leaderboardId: LeaderboardId;
    periodKey: LeaderboardPeriodKey;
    matchId: string;
    seedId: string;
    seedKey: string;
    localScore: number;
    opponentScore: number;
    scoreMargin: number;
    outcome: DuelOutcome;
    rankPoints: number;
    validationTier: string;
    backendValidationRequired: boolean;
    antiCheatRequired: boolean;
    opponentResultRequired: boolean;
    duplicateSubmitProtectionRequired: boolean;
    rewardReconciliationRequired: boolean;
    cloudProfileHash: string;
  };
}

export type RemoteDuelSubmitPreviewMap = Record<DuelModeId, RemoteDuelSubmitPreview>;

export interface RemoteDuelSubmitSummary {
  version: string;
  duelCount: number;
  backendLockedCount: number;
  remoteReadEnabled: boolean;
  remoteSubmitEnabled: boolean;
  publicSubmitEnabled: boolean;
  requiredBeforeLive: readonly string[];
}

export interface RemoteDuelSubmitSystemDefinition {
  version: string;
  goal: string;
  remoteReadEnabled: boolean;
  remoteSubmitEnabled: boolean;
  publicSubmitEnabled: boolean;
  supportedDuelIds: readonly DuelModeId[];
  routes: readonly RemoteDuelSubmitRouteDefinition[];
  locks: readonly RemoteDuelSubmitLockId[];
  rules: readonly string[];
  requiredBeforeLive: readonly string[];
}
