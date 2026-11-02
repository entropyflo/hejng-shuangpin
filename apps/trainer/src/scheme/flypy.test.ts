import { describe, expect, it } from "vitest";
import {
  encodeSyllable,
  FLYPY_FINAL_KEYS,
  FLYPY_INITIAL_KEYS,
  FLYPY_SCHEME_SOURCES,
  FLYPY_SPECIAL_INITIAL_KEYS,
  FlypyEncodingError,
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

  it("在 SCH-002 前明确拒绝零声母，不伪造规则", () => {
    expect(() => encodeSyllable({ initial: "", final: "ang", normalizedPinyin: "ang" })).toThrowError(
      expect.objectContaining<Partial<FlypyEncodingError>>({ code: "ZERO_INITIAL_NOT_IMPLEMENTED" }),
    );
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

