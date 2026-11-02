import { describe, expect, it } from "vitest";
import { buildCustomPracticeUnits, firstTypeableIndex, previousTypeableIndex } from "./practice.js";

describe("自定义文本双拼拆分", () => {
  it("按上下文生成逐字小鹤双拼码并保留标点位置", () => {
    expect(buildCustomPracticeUnits("今天练习双拼。")).toEqual([
      { character: "今", reading: "jin", code: "jb" },
      { character: "天", reading: "tian", code: "tm" },
      { character: "练", reading: "lian", code: "lm" },
      { character: "习", reading: "xi", code: "xi" },
      { character: "双", reading: "shuang", code: "ul" },
      { character: "拼", reading: "pin", code: "pb" },
      { character: "。", reading: null, code: null },
    ]);
  });

  it("使用词语上下文处理多音字", () => {
    expect(buildCustomPracticeUnits("银行行走").map((unit) => unit.code)).toEqual(["yb", "hh", "xk", "zz"]);
  });

  it("前后查找时跳过标点", () => {
    const units = buildCustomPracticeUnits("你，好");
    expect(firstTypeableIndex(units)).toBe(0);
    expect(firstTypeableIndex(units, 0)).toBe(2);
    expect(previousTypeableIndex(units, 2)).toBe(0);
  });

  it("连续标点不会打乱后续汉字与读音的对齐", () => {
    expect(buildCustomPracticeUnits("你好！？今天").map((unit) => [unit.character, unit.code])).toEqual([
      ["你", "ni"],
      ["好", "hc"],
      ["！", null],
      ["？", null],
      ["今", "jb"],
      ["天", "tm"],
    ]);
  });
});
