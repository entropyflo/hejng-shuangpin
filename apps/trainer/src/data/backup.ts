import type { Attempt, ComparisonRecord, MasteryRecord, PracticeSession } from "./types";

export const BACKUP_SCHEMA_VERSION = 2;

export type BackupData = {
  attempts: Attempt[];
  sessions: PracticeSession[];
  mastery: MasteryRecord[];
  comparisons: ComparisonRecord[];
};

export type BackupPayload = {
  schemaVersion: number;
  exportedAt: number;
  checksum: string;
  counts: Record<keyof BackupData, number>;
  data: BackupData;
};

const DATA_KEYS: Array<keyof BackupData> = ["attempts", "sessions", "mastery", "comparisons"];

export function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(value ?? null);
}

export function checksumOf(value: unknown): string {
  const text = stableStringify(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

export function createBackup(data: BackupData, now = Date.now()): BackupPayload {
  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: now,
    checksum: checksumOf(data),
    counts: {
      attempts: data.attempts.length,
      sessions: data.sessions.length,
      mastery: data.mastery.length,
      comparisons: data.comparisons.length,
    },
    data,
  };
}

export type BackupParseResult =
  | { ok: true; payload: BackupPayload }
  | { ok: false; error: string };

export function parseBackup(raw: string): BackupParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: "文件不是有效的 JSON。" };
  }

  if (!parsed || typeof parsed !== "object") {
    return { ok: false, error: "备份格式不正确。" };
  }

  const payload = parsed as Partial<BackupPayload>;

  if (payload.schemaVersion !== BACKUP_SCHEMA_VERSION) {
    return { ok: false, error: `备份版本不受支持：${String(payload.schemaVersion)}。` };
  }

  if (!payload.data || typeof payload.data !== "object") {
    return { ok: false, error: "备份缺少 data 字段。" };
  }

  for (const key of DATA_KEYS) {
    if (!Array.isArray(payload.data[key])) {
      return { ok: false, error: `备份缺少 ${key} 列表。` };
    }
  }

  if (typeof payload.checksum !== "string" || payload.checksum !== checksumOf(payload.data)) {
    return { ok: false, error: "备份校验失败，文件可能被修改或损坏。" };
  }

  if (payload.counts) {
    for (const key of DATA_KEYS) {
      if (payload.counts[key] !== payload.data[key].length) {
        return { ok: false, error: `${key} 数量与声明不一致。` };
      }
    }
  }

  return { ok: true, payload: payload as BackupPayload };
}
