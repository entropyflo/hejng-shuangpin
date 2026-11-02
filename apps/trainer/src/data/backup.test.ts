import { describe, expect, it } from "vitest";
import { BACKUP_SCHEMA_VERSION, checksumOf, createBackup, parseBackup, stableStringify } from "./backup";
import type { BackupData } from "./backup";

function sampleData(): BackupData {
  return {
    attempts: [
      {
        sessionId: "s1",
        exerciseId: "key-final-a",
        kind: "key-recognition",
        knowledgeIds: ["final.a"],
        mode: "key",
        correct: true,
        responseMs: 1000,
        at: 1,
        expected: "a",
        received: "a",
      },
    ],
    sessions: [
      {
        id: "s1",
        scope: "lesson:day-1",
        mode: "key",
        startedAt: 0,
        endedAt: 10,
        attempts: 1,
        correct: 1,
        accuracy: 1,
        stars: 3,
        cpm: null,
      },
    ],
    mastery: [
      {
        knowledgeId: "final.a",
        attempts: 1,
        correctAttempts: 1,
        streak: 1,
        ease: 2.2,
        intervalDays: 1,
        lastPracticedAt: 10,
        nextDueAt: 100,
        lastResponseMs: 1000,
      },
    ],
    comparisons: [],
    texts: [],
  };
}

describe("备份序列化", () => {
  it("稳定序列化与键顺序无关", () => {
    expect(stableStringify({ b: 1, a: 2 })).toBe(stableStringify({ a: 2, b: 1 }));
    expect(checksumOf({ a: 1, b: [2, 3] })).toBe(checksumOf({ b: [2, 3], a: 1 }));
  });

  it("创建备份时写入版本、计数与校验和", () => {
    const payload = createBackup(sampleData(), 123);
    expect(payload.schemaVersion).toBe(BACKUP_SCHEMA_VERSION);
    expect(payload.exportedAt).toBe(123);
    expect(payload.counts).toEqual({ attempts: 1, sessions: 1, mastery: 1, comparisons: 0, texts: 0 });
    expect(payload.checksum).toMatch(/^[0-9a-f]{8}$/u);
  });
});

describe("备份校验", () => {
  it("合法备份可往返", () => {
    const payload = createBackup(sampleData(), 123);
    const result = parseBackup(JSON.stringify(payload));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.payload.data.sessions[0].id).toBe("s1");
    }
  });

  it("拒绝损坏的 JSON", () => {
    const result = parseBackup("{not json");
    expect(result).toEqual({ ok: false, error: "文件不是有效的 JSON。" });
  });

  it("拒绝不支持的版本", () => {
    const payload = { ...createBackup(sampleData()), schemaVersion: 99 };
    expect(parseBackup(JSON.stringify(payload))).toMatchObject({ ok: false });
  });

  it("拒绝被篡改的数据", () => {
    const payload = createBackup(sampleData());
    payload.data.sessions[0].correct = 0;
    const result = parseBackup(JSON.stringify(payload));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("校验失败");
  });

  it("拒绝数量声明不一致", () => {
    const payload = createBackup(sampleData());
    payload.counts.attempts = 5;
    payload.checksum = checksumOf(payload.data);
    const result = parseBackup(JSON.stringify(payload));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("数量");
  });

  it("拒绝缺少列表", () => {
    const payload = createBackup(sampleData()) as unknown as { data: Record<string, unknown> };
    delete payload.data.comparisons;
    const result = parseBackup(JSON.stringify(payload));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("comparisons");
  });
});
