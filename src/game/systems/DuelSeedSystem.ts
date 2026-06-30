import { DEFAULT_LEAK_DUEL_SEED, DUEL_MODIFIER_LABELS, type DuelModeId, type DuelSeedDefinition } from "../types/DuelTypes";
import type {
  DuelSeedFairnessRuleId,
  DuelSeedGenerationInput,
  DuelSeedHashResult,
  DuelSeedPreviewCard,
  DuelSeedSnapshot,
  DuelSeedSystemDefinition,
  DuelSeedTemplate,
} from "../types/DuelSeedTypes";

export const DUEL_SEED_SYSTEM_VERSION = "0.11.4-duel-seed-system";

export const DUEL_SEED_TEMPLATES: readonly DuelSeedTemplate[] = [
  {
    id: "subscription-cold-wallet",
    label: "Subscription Swarm / Cold Wallet",
    stageId: "subscription_office",
    bossId: "subscription_leech",
    durationSeconds: 120,
    modifiers: ["subscription_swarm", "cold_wallet"],
    difficultyBand: "standard",
    theme: "Cancel recurring leaks while guarding the wallet.",
  },
  {
    id: "fomo-debt-pressure",
    label: "FOMO Storm / Debt Pressure",
    stageId: "crypto_arena",
    bossId: "emotional_trading_beast",
    durationSeconds: 120,
    modifiers: ["fomo_storm", "debt_pressure"],
    difficultyBand: "pressure",
    theme: "Survive impulse pressure without overusing risky skills.",
  },
  {
    id: "rug-pull-no-spend",
    label: "Rug Pull Traps / No-Spend Duel",
    stageId: "casino_district",
    bossId: "rug_pull_beast",
    durationSeconds: 105,
    modifiers: ["rug_pull_traps", "no_spend_duel"],
    difficultyBand: "boss_pressure",
    theme: "Avoid scam traps and win through clean movement.",
  },
  {
    id: "training-leak-control",
    label: "Training Leak Control",
    stageId: DEFAULT_LEAK_DUEL_SEED.stageId,
    bossId: DEFAULT_LEAK_DUEL_SEED.bossId,
    durationSeconds: 90,
    modifiers: ["cold_wallet"],
    difficultyBand: "training",
    theme: "Short equal-seed duel for onboarding and friendly tests.",
  },
] as const;

export const DUEL_SEED_FAIRNESS_RULES: readonly DuelSeedFairnessRuleId[] = [
  "same_seed_key",
  "same_stage",
  "same_boss",
  "same_modifiers",
  "same_duration",
  "no_player_power_scaling",
  "backend_signature_required_for_ranked",
] as const;

export const DUEL_SEED_SYSTEM_DEFINITION: DuelSeedSystemDefinition = {
  version: DUEL_SEED_SYSTEM_VERSION,
  goal: "Create deterministic equal-condition Leak Duel seeds before duel scoring, duel scenes, matchmaking or remote ranked submission are enabled.",
  seedStatus: "local_preview",
  localPreviewEnabled: true,
  publicSubmitEnabled: false,
  templates: DUEL_SEED_TEMPLATES,
  fairnessRules: DUEL_SEED_FAIRNESS_RULES,
  backendLocks: [
    "Ranked duel seeds must be created or signed by backend before public submit.",
    "Both players must receive the same seedKey, stage, boss, modifiers and duration.",
    "Seed snapshots must be included in future anti-cheat run payloads.",
    "Local seed previews are for UI and balance planning only; they do not award Rank Points or Leak Points.",
  ],
};

function stableHash(input: string): number {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function normalizeSeedInput(input: DuelSeedGenerationInput): DuelSeedGenerationInput {
  return {
    duelId: input.duelId,
    matchType: input.matchType,
    periodKey: input.periodKey || "duel:local-contract",
    playerAId: input.playerAId || "local-player-a",
    playerBId: input.playerBId,
    nonce: input.nonce || "preview",
    source: input.source || "local_preview",
  };
}

function getSeedBasis(input: DuelSeedGenerationInput): string {
  const safeInput = normalizeSeedInput(input);
  const playerPair = [safeInput.playerAId, safeInput.playerBId || "open-opponent"].sort().join(":");
  return [safeInput.duelId, safeInput.matchType, safeInput.periodKey, playerPair, safeInput.nonce].join("|");
}

export function createDuelSeedHash(input: DuelSeedGenerationInput): DuelSeedHashResult {
  const basis = getSeedBasis(input);
  const hash = stableHash(basis);
  return {
    hash,
    hashKey: hash.toString(36).toUpperCase().padStart(7, "0"),
    templateIndex: hash % DUEL_SEED_TEMPLATES.length,
    modifierRotation: Math.floor(hash / DUEL_SEED_TEMPLATES.length) % 3,
  };
}

function rotateModifiers(modifiers: DuelSeedTemplate["modifiers"], rotation: number): DuelSeedTemplate["modifiers"] {
  if (modifiers.length <= 1) {
    return [...modifiers];
  }
  const safeRotation = rotation % modifiers.length;
  return [...modifiers.slice(safeRotation), ...modifiers.slice(0, safeRotation)];
}

export function createDuelSeedDefinition(input: DuelSeedGenerationInput): DuelSeedDefinition {
  const safeInput = normalizeSeedInput(input);
  const hash = createDuelSeedHash(safeInput);
  const template = DUEL_SEED_TEMPLATES[hash.templateIndex] ?? DUEL_SEED_TEMPLATES[0];
  const seedStatus = safeInput.source === "backend_future" ? "backend_seed_required" : "local_preview";

  return {
    seedId: `duel-seed-${hash.hashKey.toLowerCase()}`,
    seedKey: `LD-${safeInput.periodKey.replace(/[^a-z0-9]+/gi, "-").toUpperCase()}-${hash.hashKey}`,
    stageId: template.stageId,
    bossId: template.bossId,
    durationSeconds: template.durationSeconds,
    modifiers: rotateModifiers(template.modifiers, hash.modifierRotation),
    seedStatus,
    backendValidationRequired: true,
  };
}

export function createDuelSeedSnapshot(input: DuelSeedGenerationInput): DuelSeedSnapshot {
  const safeInput = normalizeSeedInput(input);
  const hash = createDuelSeedHash(safeInput);
  const template = DUEL_SEED_TEMPLATES[hash.templateIndex] ?? DUEL_SEED_TEMPLATES[0];
  const seed = createDuelSeedDefinition(safeInput);

  return {
    version: DUEL_SEED_SYSTEM_VERSION,
    input: {
      duelId: safeInput.duelId as DuelModeId,
      matchType: safeInput.matchType,
      periodKey: safeInput.periodKey || "duel:local-contract",
      playerAId: safeInput.playerAId || "local-player-a",
      playerBId: safeInput.playerBId,
      nonce: safeInput.nonce || "preview",
      source: safeInput.source || "local_preview",
    },
    template,
    seed,
    hash,
    fairnessRules: [...DUEL_SEED_FAIRNESS_RULES],
    backendValidationRequired: true,
    publicSubmitEnabled: false,
    notes: [
      "Both participants must fight this exact seed snapshot.",
      "The seed does not scale by player power; score comparison must remain skill-based.",
      "Ranked submit stays locked until backend signs or verifies the seed.",
    ],
  };
}

export function createDefaultDuelSeedSnapshot(): DuelSeedSnapshot {
  return createDuelSeedSnapshot({
    duelId: "leak_duel_async",
    matchType: "ranked",
    periodKey: "duel:local-contract",
    playerAId: "local-player",
    playerBId: "preview-rival",
    nonce: "v0.11.4-preview",
    source: "local_preview",
  });
}

export function createDuelSeedPreviewCard(input: DuelSeedGenerationInput = createDefaultDuelSeedSnapshot().input): DuelSeedPreviewCard {
  const snapshot = createDuelSeedSnapshot(input);
  const modifierLabels = snapshot.seed.modifiers.map((modifierId) => DUEL_MODIFIER_LABELS[modifierId] ?? modifierId);

  return {
    title: "Leak Duel Seed Preview",
    subtitle: snapshot.template.label,
    seedKey: snapshot.seed.seedKey,
    stageId: snapshot.seed.stageId,
    bossId: snapshot.seed.bossId,
    durationSeconds: snapshot.seed.durationSeconds,
    modifiers: snapshot.seed.modifiers,
    difficultyBand: snapshot.template.difficultyBand,
    backendValidationRequired: snapshot.backendValidationRequired,
    rows: [
      `Stage: ${snapshot.seed.stageId}`,
      `Boss: ${snapshot.seed.bossId || "none"}`,
      `Timebox: ${snapshot.seed.durationSeconds}s`,
      `Modifiers: ${modifierLabels.join(" + ")}`,
      `Public ranked submit: locked`,
    ],
  };
}
