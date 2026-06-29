import type { PlayerProfile } from "./playerProfile";

export const SAVE_FORMAT = "broke-leak-fighter-save";
export const SAVE_FORMAT_VERSION = 1;
export const PROFILE_BACKUP_STORAGE_KEY = "broke_leak_fighter_profile_backup_v1";

export interface ExportedSaveFile {
  format: typeof SAVE_FORMAT;
  formatVersion: typeof SAVE_FORMAT_VERSION;
  exportedAt: string;
  checksum: string;
  profile: PlayerProfile;
}

export interface SaveParseResult {
  ok: boolean;
  profile?: Partial<PlayerProfile>;
  error?: string;
  warning?: string;
}

export interface SaveStatus {
  hasMainSave: boolean;
  hasBackupSave: boolean;
  mainReadable: boolean;
  backupReadable: boolean;
  backupUpdatedAt: string | null;
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(",")}]`;

  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(",")}}`;
}

export function calculateSaveChecksum(profile: Partial<PlayerProfile>): string {
  const input = stableStringify(profile);
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function createSaveExport(profile: PlayerProfile): string {
  const payload: ExportedSaveFile = {
    format: SAVE_FORMAT,
    formatVersion: SAVE_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    checksum: calculateSaveChecksum(profile),
    profile,
  };
  return JSON.stringify(payload, null, 2);
}

export function parseSaveImport(raw: string): SaveParseResult {
  if (!raw.trim()) return { ok: false, error: "EMPTY SAVE DATA" };

  try {
    const parsed = JSON.parse(raw) as Partial<ExportedSaveFile> | Partial<PlayerProfile>;
    const maybeSaveFile = parsed as Partial<ExportedSaveFile>;

    if (maybeSaveFile.format === SAVE_FORMAT) {
      if (!maybeSaveFile.profile) return { ok: false, error: "SAVE FILE HAS NO PROFILE" };
      const expected = calculateSaveChecksum(maybeSaveFile.profile);
      const warning = maybeSaveFile.checksum && maybeSaveFile.checksum !== expected ? "CHECKSUM MISMATCH" : undefined;
      return { ok: true, profile: maybeSaveFile.profile, warning };
    }

    return { ok: true, profile: parsed as Partial<PlayerProfile>, warning: "LEGACY PROFILE JSON" };
  } catch {
    return { ok: false, error: "INVALID SAVE JSON" };
  }
}

export function getLocalSaveStatus(mainKey: string): SaveStatus {
  if (typeof window === "undefined") {
    return { hasMainSave: false, hasBackupSave: false, mainReadable: false, backupReadable: false, backupUpdatedAt: null };
  }

  const mainRaw = window.localStorage.getItem(mainKey);
  const backupRaw = window.localStorage.getItem(PROFILE_BACKUP_STORAGE_KEY);
  const backupUpdatedAt = window.localStorage.getItem(`${PROFILE_BACKUP_STORAGE_KEY}_updated_at`);

  return {
    hasMainSave: Boolean(mainRaw),
    hasBackupSave: Boolean(backupRaw),
    mainReadable: mainRaw ? parseSaveImport(mainRaw).ok : false,
    backupReadable: backupRaw ? parseSaveImport(backupRaw).ok : false,
    backupUpdatedAt,
  };
}

export function writeProfileBackup(mainKey: string): void {
  if (typeof window === "undefined") return;
  const current = window.localStorage.getItem(mainKey);
  if (!current) return;
  window.localStorage.setItem(PROFILE_BACKUP_STORAGE_KEY, current);
  window.localStorage.setItem(`${PROFILE_BACKUP_STORAGE_KEY}_updated_at`, new Date().toISOString());
}

export function readProfileBackup(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(PROFILE_BACKUP_STORAGE_KEY);
}
