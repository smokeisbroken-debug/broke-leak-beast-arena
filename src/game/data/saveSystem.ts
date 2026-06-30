import type { PlayerProfile } from "./playerProfile";
import { CURRENT_SAVE_SCHEMA_VERSION, SAVE_SCHEMA_VERSION_LABEL } from "../types/SaveSchemaTypes";

export const SAVE_FORMAT = "broke-leak-fighter-save";
export const SAVE_FORMAT_VERSION = CURRENT_SAVE_SCHEMA_VERSION;
export const SAVE_MIN_SUPPORTED_FORMAT_VERSION = 1;
export const PROFILE_BACKUP_STORAGE_KEY = "broke_leak_fighter_profile_backup_v2";
export const LEGACY_PROFILE_BACKUP_STORAGE_KEYS = ["broke_leak_fighter_profile_backup_v1"] as const;

export interface ExportedSaveFile {
  format: typeof SAVE_FORMAT;
  formatVersion: number;
  schemaVersion: typeof CURRENT_SAVE_SCHEMA_VERSION;
  schemaLabel: typeof SAVE_SCHEMA_VERSION_LABEL;
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
  backupStorageKey: string;
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

function getReadableBackupRaw(): { key: string; raw: string | null; updatedAt: string | null } {
  if (typeof window === "undefined") return { key: PROFILE_BACKUP_STORAGE_KEY, raw: null, updatedAt: null };

  const storageKeys = [PROFILE_BACKUP_STORAGE_KEY, ...LEGACY_PROFILE_BACKUP_STORAGE_KEYS];
  for (const key of storageKeys) {
    const raw = window.localStorage.getItem(key);
    if (raw) {
      return {
        key,
        raw,
        updatedAt: window.localStorage.getItem(`${key}_updated_at`),
      };
    }
  }

  return { key: PROFILE_BACKUP_STORAGE_KEY, raw: null, updatedAt: null };
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
    schemaVersion: CURRENT_SAVE_SCHEMA_VERSION,
    schemaLabel: SAVE_SCHEMA_VERSION_LABEL,
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
      const formatVersion = Number(maybeSaveFile.formatVersion || SAVE_MIN_SUPPORTED_FORMAT_VERSION);
      if (formatVersion > SAVE_FORMAT_VERSION) return { ok: false, error: "SAVE FILE VERSION IS NEWER THAN THIS BUILD" };
      if (formatVersion < SAVE_MIN_SUPPORTED_FORMAT_VERSION) return { ok: false, error: "SAVE FILE VERSION IS NOT SUPPORTED" };

      const expected = calculateSaveChecksum(maybeSaveFile.profile);
      const checksumWarning = maybeSaveFile.checksum && maybeSaveFile.checksum !== expected ? "CHECKSUM MISMATCH" : undefined;
      const migrationWarning = formatVersion < SAVE_FORMAT_VERSION ? "SAVE WILL MIGRATE TO SCHEMA V2" : undefined;
      return { ok: true, profile: maybeSaveFile.profile, warning: checksumWarning ?? migrationWarning };
    }

    return { ok: true, profile: parsed as Partial<PlayerProfile>, warning: "LEGACY PROFILE JSON" };
  } catch {
    return { ok: false, error: "INVALID SAVE JSON" };
  }
}

export function getLocalSaveStatus(mainKey: string): SaveStatus {
  if (typeof window === "undefined") {
    return {
      hasMainSave: false,
      hasBackupSave: false,
      mainReadable: false,
      backupReadable: false,
      backupUpdatedAt: null,
      backupStorageKey: PROFILE_BACKUP_STORAGE_KEY,
    };
  }

  const mainRaw = window.localStorage.getItem(mainKey);
  const backup = getReadableBackupRaw();

  return {
    hasMainSave: Boolean(mainRaw),
    hasBackupSave: Boolean(backup.raw),
    mainReadable: mainRaw ? parseSaveImport(mainRaw).ok : false,
    backupReadable: backup.raw ? parseSaveImport(backup.raw).ok : false,
    backupUpdatedAt: backup.updatedAt,
    backupStorageKey: backup.key,
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
  return getReadableBackupRaw().raw;
}
