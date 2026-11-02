import { describe, expect, it } from "vitest";
import {
  encodeSyllable,
  FLYPY_FINAL_KEYS,
  FLYPY_INITIAL_KEYS,
  FLYPY_SCHEME_SOURCES,
  FLYPY_SPECIAL_INITIAL_KEYS,
  FLYPY_ZERO_INITIAL_CODES,
  FlypyEncodingError,
  normalizeFlypyFinal,
  normalizePinyinPart,
} from "./flypy";

describe("小鹤双拼键位金样", () => {
  it("固定三个复合声母键位", () => {
    expect(FLYPY_SPECIAL_INITIAL_KEYS).toEqual({ zh: "v", ch: "i", sh: "u" });
  });

  it("保留普通声母原键并覆盖 y/w", () => {
    expect(FLYPY_INITIAL_KEYS).toEqual({
      b: "b",
      p: "p",
      m: "m",
      f: "f",
      d: "d",
      t: "t",
      n: "n",
      l: "l",
      g: "g",
      k: "k",
      h: "h",
      j: "j",
      q: "q",
      x: "x",
      zh: "v",
      ch: "i",
      sh: "u",
      r: "r",
      z: "z",
      c: "c",
      s: "s",
      y: "y",
      w: "w",
    });
  });

  it("完整固定官方图对应的韵母键位，不沿用错误示意", () => {
    expect(FLYPY_FINAL_KEYS).toEqual({
      a: "a",
      o: "o",
      e: "e",
      i: "i",
      u: "u",
      ü: "v",
      v: "v",
      iu: "q",
      ei: "w",
      uan: "r",
      üan: "r",
      van: "r",
      üe: "t",
      ue: "t",
      ve: "t",
      un: "y",
      ün: "y",
      vn: "y",
      uo: "o",
      ie: "p",
      ong: "s",
      iong: "s",
      ai: "d",
      en: "f",
      eng: "g",
      ang: "h",
      an: "j",
      ing: "k",
      uai: "k",
      iang: "l",
      uang: "l",
      ou: "z",
      ia: "x",
      ua: "x",
      ao: "c",
      ui: "v",
      in: "b",
      iao: "n",
      ian: "m",
    });
  });

  it.each([
    [{ initial: "sh", final: "uang", normalizedPinyin: "shuang" }, "ul"],
    [{ initial: "p", final: "in", normalizedPinyin: "pin" }, "pb"],
    [{ initial: "zh", final: "ong", normalizedPinyin: "zhong" }, "vs"],
    [{ initial: "w", final: "en", normalizedPinyin: "wen" }, "wf"],
  ])("编码公开交叉样例 %#", (syllable, code) => {
    expect(encodeSyllable(syllable)).toMatchObject({ code, normalizedPinyin: syllable.normalizedPinyin });
  });

  it("输出可追踪的规则 ID", () => {
    expect(encodeSyllable({ initial: "sh", final: "uang", normalizedPinyin: "shuang" })).toEqual({
      code: "ul",
      normalizedPinyin: "shuang",
      ruleId: "flypy.initial.sh+final.uang",
      warnings: [],
    });
  });

  it("拒绝未知声母和韵母", () => {
    expect(() => encodeSyllable({ initial: "xx", final: "ang", normalizedPinyin: "xxang" })).toThrowError(
      expect.objectContaining<Partial<FlypyEncodingError>>({ code: "UNSUPPORTED_INITIAL" }),
    );
    expect(() => encodeSyllable({ initial: "b", final: "zzz", normalizedPinyin: "bzzz" })).toThrowError(
      expect.objectContaining<Partial<FlypyEncodingError>>({ code: "UNSUPPORTED_FINAL" }),
    );
  });

  it("在代码中保留主来源与交叉来源", () => {
    expect(FLYPY_SCHEME_SOURCES).toEqual([
      expect.objectContaining({ id: "flypy-official-home", role: "primary" }),
      expect.objectContaining({ id: "shuangpin-layout", role: "cross-check" }),
      expect.objectContaining({ id: "rime-double-pinyin-flypy", role: "implementation-cross-check" }),
      expect.objectContaining({ id: "apple-shuangpin-layouts", role: "platform-cross-check" }),
    ]);
  });
});

describe("SCH-002 零声母与拼音正规化", () => {
  it("完整锁定十二个官方零声母音节", () => {
    expect(FLYPY_ZERO_INITIAL_CODES).toEqual({
      a: "aa",
      o: "oo",
      e: "ee",
      ai: "ai",
      ei: "ei",
      ao: "ao",
      ou: "ou",
      an: "an",
      en: "en",
      er: "er",
      ang: "ah",
      eng: "eg",
    });
  });

  it.each(Object.entries(FLYPY_ZERO_INITIAL_CODES))("编码零声母 %s→%s", (final, code) => {
    expect(encodeSyllable({ initial: "", final, normalizedPinyin: final })).toEqual({
      code,
      normalizedPinyin: final,
      ruleId: `flypy.zero-initial.${final}`,
      warnings: [],
    });
  });

  it.each([
    ["ǎng", "ah", "ang"],
    ["è", "ee", "e"],
    ["ér2", "er", "er"],
  ])("编码带声调的零声母 %s", (final, code, normalizedPinyin) => {
    expect(encodeSyllable({ initial: "", final, normalizedPinyin: final })).toMatchObject({
      code,
      normalizedPinyin,
    });
  });

  it("移除声调符号、尾部声调数字并统一 v/u: 为 ü", () => {
    expect(normalizePinyinPart(" Nǚ3 ")).toBe("nü");
    expect(normalizePinyinPart("lü4")).toBe("lü");
    expect(normalizePinyinPart("u:")).toBe("ü");
    expect(normalizePinyinPart("v")).toBe("ü");
  });

  it.each([
    ["j", "u", "ü"],
    ["q", "ue", "üe"],
    ["x", "uan", "üan"],
    ["y", "un", "ün"],
    ["n", "ǚ", "ü"],
    ["l", "ve", "üe"],
  ])("正规化 %s + %s 的 ü 规则", (initial, final, expected) => {
    expect(normalizeFlypyFinal(initial, final)).toBe(expected);
  });

  it.each([
    [{ initial: "j", final: "u", normalizedPinyin: "ju" }, "jv", "jü"],
    [{ initial: "q", final: "ue", normalizedPinyin: "que" }, "qt", "qüe"],
    [{ initial: "x", final: "uan", normalizedPinyin: "xuan" }, "xr", "xüan"],
    [{ initial: "y", final: "un", normalizedPinyin: "yun" }, "yy", "yün"],
    [{ initial: "n", final: "ǚ", normalizedPinyin: "nǚ" }, "nv", "nü"],
    [{ initial: "l", final: "ve", normalizedPinyin: "lve" }, "lt", "lüe"],
  ])("编码 ü 音节 %#", (syllable, code, normalizedPinyin) => {
    expect(encodeSyllable(syllable)).toMatchObject({ code, normalizedPinyin });
  });

  it("正规化 iou/uei/uen 的完整拼写", () => {
    expect(normalizeFlypyFinal("l", "iou")).toBe("iu");
    expect(normalizeFlypyFinal("g", "uei")).toBe("ui");
    expect(normalizeFlypyFinal("d", "uen")).toBe("un");
  });

  it("未知零声母音节显式失败", () => {
    expect(() => encodeSyllable({ initial: "", final: "ong", normalizedPinyin: "ong" })).toThrowError(
      expect.objectContaining<Partial<FlypyEncodingError>>({ code: "UNSUPPORTED_ZERO_INITIAL" }),
    );
  });
});

