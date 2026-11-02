import { describe, expect, it } from "vitest";
import { COMPARE_TEXTS, buildComparison, improvementPercent } from "./model";

describe("全拼 / 小鹤对比", () => {
  it("提升百分比按全拼基线计算", () => {
    expect(improvementPercent(60, 40)).toBe(50);
    expect(improvementPercent(30, 40)).toBe(-25);
    expect(improvementPercent(40, 40)).toBe(0);
  });

  it("全拼为 0 时不计算提升", () => {
    expect(improvementPercent(50, 0)).toBeNull();
  });

  it("对比文本非空且 id 唯一", () => {
    expect(COMPARE_TEXTS.length).toBeGreaterThanOrEqual(3);
    for (const item of COMPARE_TEXTS) {
      expect(item.text.length).toBeGreaterThan(4);
    }
    expect(new Set(COMPARE_TEXTS.map((item) => item.id)).size).toBe(COMPARE_TEXTS.length);
  });

  it("构造记录保留全部字段", () => {
    const record = buildComparison({
      id: "c1",
      textId: "compare-short",
      text: "清风明月",
      flypyCpm: 60,
      quanpinCpm: 40,
      at: 100,
    });
    expect(record).toEqual({
      id: "c1",
      textId: "compare-short",
      text: "清风明月",
      flypyCpm: 60,
      quanpinCpm: 40,
      at: 100,
    });
  });
});
