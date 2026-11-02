import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { acquireLock, readLock, releaseLock } from "./lock.js";

function tempLock(): string {
  return join(mkdtempSync(join(tmpdir(), "coord-lock-")), "coordinator.lock");
}

const ME = { pid: process.pid, startedAt: 1000, owner: "test" };

describe("单写锁", () => {
  it("首次获取成功，第二次被拒绝", () => {
    const path = tempLock();
    expect(acquireLock(path, ME, { now: 1000 }).ok).toBe(true);
    const second = acquireLock(path, { ...ME, owner: "other" }, { now: 1000 });
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.holder?.owner).toBe("test");
  });

  it("释放后可以重新获取", () => {
    const path = tempLock();
    acquireLock(path, ME, { now: 1000 });
    releaseLock(path, process.pid);
    expect(readLock(path)).toBeNull();
    expect(acquireLock(path, ME, { now: 1000 }).ok).toBe(true);
  });

  it("非持有者不能释放", () => {
    const path = tempLock();
    acquireLock(path, ME, { now: 1000 });
    releaseLock(path, process.pid + 1);
    expect(readLock(path)?.owner).toBe("test");
  });

  it("超时锁视为过期并可接管", () => {
    const path = tempLock();
    acquireLock(path, { ...ME, startedAt: 0 }, { now: 0, ttlMs: 1000 });
    const result = acquireLock(path, { ...ME, owner: "next" }, { now: 5000, ttlMs: 1000 });
    expect(result.ok).toBe(true);
  });

  it("进程已退出的锁可接管", () => {
    const path = tempLock();
    writeFileSync(path, JSON.stringify({ pid: 999999, startedAt: 0, owner: "dead" }));
    const result = acquireLock(path, { ...ME, owner: "alive" }, { now: 10, ttlMs: 10 * 60 * 1000 });
    expect(result.ok).toBe(true);
  });

  it("损坏的锁文件视为过期", () => {
    const path = tempLock();
    writeFileSync(path, "not-json");
    expect(acquireLock(path, ME, { now: 10 }).ok).toBe(true);
  });
});
