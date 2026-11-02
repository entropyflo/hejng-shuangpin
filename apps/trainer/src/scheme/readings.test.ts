import { describe, expect, it } from "vitest";
import {
  analyzeReadings,
  deserializeReadingOverrides,
  encodeReadingTokens,
  ReadingOverrideRepository,
  ReadingResolutionError,
  serializeReadingOverrides,
  type KeyValueStorage,
  type ReadingOverride,
} from "./readings";

const expectedPhrases = [
  ["银行", ["yin", "hang"], ["yb", "hh"]],
  ["行走", ["xing", "zou"], ["xk", "zz"]],
  ["重庆", ["chong", "qing"], ["is", "qk"]],
  ["重要", ["zhong", "yao"], ["vs", "yc"]],
  ["音乐", ["yin", "yue"], ["yb", "yt"]],
] as const;

function analyze(text: string, overrides: ReadingOverride[] = []) {
  return analyzeReadings({ textId: "lesson", textVersion: "v1", text, overrides });
}

class MemoryStorage implements KeyValueStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

describe("SCH-003 离线词级读音", () => {
  it.each(expectedPhrases)("按词识别 %s 的上下文读音", (text, reading, codes) => {
    const tokens = analyze(text);
    expect(tokens).toHaveLength(1);
    expect(tokens[0]).toMatchObject({
      text,
      status: "confirmed",
      selectedReading: [...reading],
      sourceId: "builtin-word-v1",
    });
    expect(encodeReadingTokens(tokens)[0].encoded.map((item) => item.code)).toEqual([...codes]);
  });

  it("使用最长词匹配连续处理多个多音词", () => {
    expect(analyze("银行行走").map((token) => [token.text, token.selectedReading])).toEqual([
      ["银行", ["yin", "hang"]],
      ["行走", ["xing", "zou"]],
    ]);
  });

  it.each([
    ["行", ["xing", "hang"]],
    ["重", ["zhong", "chong"]],
    ["乐", ["le", "yue"]],
  ])("单字 %s 保持歧义并展示候选", (text, readings) => {
    const token = analyze(text)[0];
    expect(token).toMatchObject({
      status: "ambiguous",
      candidates: readings.map((reading) => [reading]),
    });
    expect(token.selectedReading).toBeUndefined();
  });

  it("未知字不猜读音", () => {
    expect(analyze("龘")[0]).toMatchObject({ status: "unknown", candidates: [], sourceId: "none" });
  });

  it("歧义或未知读音未确认时禁止生成固定答案", () => {
    expect(() => encodeReadingTokens(analyze("行"))).toThrowError(
      expect.objectContaining<Partial<ReadingResolutionError>>({ code: "UNCONFIRMED_READING" }),
    );
    expect(() => encodeReadingTokens(analyze("龘"))).toThrowError(
      expect.objectContaining<Partial<ReadingResolutionError>>({ code: "UNCONFIRMED_READING" }),
    );
  });
});

describe("SCH-003 人工读音修正与持久化", () => {
  const override: ReadingOverride = {
    textId: "lesson",
    textVersion: "v1",
    spanStart: 0,
    spanEnd: 2,
    reading: ["yin", "xing"],
    updatedAt: "2026-11-02T14:25:00.000Z",
  };

  it("文本位置级修正优先于内置词典且可重复编码", () => {
    const first = encodeReadingTokens(analyze("银行", [override]));
    const second = encodeReadingTokens(analyze("银行", [override]));
    expect(first[0]).toMatchObject({ sourceId: "manual-override", selectedReading: ["yin", "xing"] });
    expect(first[0].encoded.map((item) => item.code)).toEqual(["yb", "xk"]);
    expect(second).toEqual(first);
  });

  it("导出导入保持修正并拒绝错误 schema", () => {
    const serialized = serializeReadingOverrides([override]);
    expect(deserializeReadingOverrides(serialized)).toEqual([override]);
    expect(() => deserializeReadingOverrides('{"schemaVersion":2,"overrides":[]}')).toThrow();
  });

  it("新建仓储实例后仍能加载修正，模拟重新打开", () => {
    const storage = new MemoryStorage();
    new ReadingOverrideRepository(storage).upsert(override);
    const reopened = new ReadingOverrideRepository(storage);
    expect(reopened.load()).toEqual([override]);
    expect(analyze("银行", reopened.load())[0]).toMatchObject({ sourceId: "manual-override" });
  });

  it("同一文本位置的后续修正会替换旧值", () => {
    const storage = new MemoryStorage();
    const repository = new ReadingOverrideRepository(storage);
    repository.upsert(override);
    repository.upsert({ ...override, reading: ["yin", "hang"], updatedAt: "2026-11-02T14:26:00.000Z" });
    expect(repository.load()).toEqual([
      { ...override, reading: ["yin", "hang"], updatedAt: "2026-11-02T14:26:00.000Z" },
    ]);
  });

  it("修正读音数量与字符数量不一致时拒绝应用", () => {
    expect(() => analyze("银行", [{ ...override, reading: ["yin"] }])).toThrowError(
      expect.objectContaining<Partial<ReadingResolutionError>>({ code: "READING_LENGTH_MISMATCH" }),
    );
  });
});

