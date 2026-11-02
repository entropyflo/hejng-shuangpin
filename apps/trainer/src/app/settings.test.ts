import { describe, expect, it } from "vitest";
import {
  AUTO_HINT_STREAK,
  CORRECTION_MODE_KEY,
  HINT_MODE_KEY,
  parseCorrectionMode,
  parseHintMode,
  readCorrectionMode,
  readHintMode,
  resolveCorrection,
  shouldShowHint,
  writeCorrectionMode,
  writeHintMode,
} from "./settings";

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  };
}

describe("提示方式", () => {
  it("非法值回退到自动", () => {
    expect(parseHintMode("always")).toBe("always");
    expect(parseHintMode("hidden")).toBe("hidden");
    expect(parseHintMode(null)).toBe("auto");
    expect(parseHintMode("sometimes")).toBe("auto");
  });

  it("始终显示与隐藏不受连对影响", () => {
    expect(shouldShowHint("always", 99)).toBe(true);
    expect(shouldShowHint("hidden", 0)).toBe(false);
  });

  it("自动模式在连对达到阈值后隐藏", () => {
    expect(shouldShowHint("auto", 0)).toBe(true);
    expect(shouldShowHint("auto", AUTO_HINT_STREAK - 1)).toBe(true);
    expect(shouldShowHint("auto", AUTO_HINT_STREAK)).toBe(false);
  });

  it("读写 localStorage 键", () => {
    const storage = memoryStorage();
    expect(readHintMode(storage)).toBe("auto");
    writeHintMode(storage, "hidden");
    expect(storage.getItem(HINT_MODE_KEY)).toBe("hidden");
    expect(readHintMode(storage)).toBe("hidden");
  });
});

describe("纠错方式", () => {
  it("非法值回退到自动", () => {
    expect(parseCorrectionMode("strict")).toBe("strict");
    expect(parseCorrectionMode("continuous")).toBe("continuous");
    expect(parseCorrectionMode(undefined)).toBe("auto");
    expect(parseCorrectionMode("lenient")).toBe("auto");
  });

  it("自动模式按题型决定：入门严格、连打连续", () => {
    expect(resolveCorrection("auto", "key-recognition")).toBe("strict");
    expect(resolveCorrection("auto", "syllable-composition")).toBe("strict");
    expect(resolveCorrection("auto", "reverse-recall")).toBe("strict");
    expect(resolveCorrection("auto", "text-typing")).toBe("continuous");
    expect(resolveCorrection("auto", "speed-challenge")).toBe("continuous");
  });

  it("手动覆盖优先于题型默认", () => {
    expect(resolveCorrection("strict", "text-typing")).toBe("strict");
    expect(resolveCorrection("continuous", "key-recognition")).toBe("continuous");
  });

  it("读写 localStorage 键", () => {
    const storage = memoryStorage();
    expect(readCorrectionMode(storage)).toBe("auto");
    writeCorrectionMode(storage, "strict");
    expect(storage.getItem(CORRECTION_MODE_KEY)).toBe("strict");
    expect(readCorrectionMode(storage)).toBe("strict");
  });
});
