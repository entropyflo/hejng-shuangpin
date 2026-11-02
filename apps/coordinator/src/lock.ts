import { closeSync, existsSync, mkdirSync, openSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export type LockInfo = {
  pid: number;
  startedAt: number;
  owner: string;
};

export type AcquireResult = { ok: true; info: LockInfo } | { ok: false; holder: LockInfo | null };

export function isProcessAlive(pid: number): boolean {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === "EPERM";
  }
}

export function readLock(path: string): LockInfo | null {
  if (!existsSync(path)) return null;
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as LockInfo;
    if (typeof parsed.pid !== "number" || typeof parsed.startedAt !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

function tryCreate(path: string, info: LockInfo): boolean {
  try {
    const descriptor = openSync(path, "wx");
    writeFileSync(descriptor, JSON.stringify(info));
    closeSync(descriptor);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") return false;
    throw error;
  }
}

export function acquireLock(
  path: string,
  info: LockInfo,
  options: { now?: number; ttlMs?: number } = {},
): AcquireResult {
  const now = options.now ?? Date.now();
  const ttlMs = options.ttlMs ?? 30 * 60 * 1000;
  mkdirSync(dirname(path), { recursive: true });

  if (tryCreate(path, info)) return { ok: true, info };

  const holder = readLock(path);
  const stale = !holder || now - holder.startedAt > ttlMs || !isProcessAlive(holder.pid);
  if (!stale) return { ok: false, holder };

  try {
    unlinkSync(path);
  } catch {
    // 其他进程可能已清理，继续尝试创建。
  }

  if (tryCreate(path, info)) return { ok: true, info };
  return { ok: false, holder: readLock(path) };
}

export function releaseLock(path: string, pid: number): void {
  const holder = readLock(path);
  if (!holder || holder.pid !== pid) return;
  try {
    unlinkSync(path);
  } catch {
    // 已被清理时忽略。
  }
}
