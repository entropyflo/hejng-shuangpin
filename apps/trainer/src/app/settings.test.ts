import { describe, expect, it } from "vitest";
import {
  AUTO_HINT_STREAK,
  CORRECTION_MODE_KEY,
  HINT_MODE_KEY,
  INPUT_MODE_KEY,
  MAPPING_MODE_KEY,
  AUTO_ADVANCE_KEY,
  readAutoAdvance,
  writeAutoAdvance,
  parseMappingMode,
  readMappingMode,
  writeMappingMode,
  MOTION_KEY,
  SOUND_KEY,
  parseCorrectionMode,
  parseInputMode,
  parseHintMode,
  readCorrectionMode,
  readHintMode,
  readInputMode,
  readToggle,
  resolveCorrection,
  shouldShowHint,
  writeCorrectionMode,
  writeHintMode,
  writeInputMode,
  writeToggle,
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

describe("输入方式", () => {
  it("非法值回退到按键模式", () => {
    expect(parseInputMode("key")).toBe("key");
    expect(parseInputMode("ime")).toBe("ime");
    expect(parseInputMode(null)).toBe("key");
    expect(parseInputMode("handwriting")).toBe("key");
  });

  it("读写 localStorage 键", () => {
    const storage = memoryStorage();
    expect(readInputMode(storage)).toBe("key");
    writeInputMode(storage, "ime");
    expect(storage.getItem(INPUT_MODE_KEY)).toBe("ime");
    expect(readInputMode(storage)).toBe("ime");
  });
});

describe("动画与音效开关", () => {
  it("未设置时使用默认值", () => {
    const storage = memoryStorage();
    expect(readToggle(storage, MOTION_KEY, true)).toBe(true);
    expect(readToggle(storage, SOUND_KEY, false)).toBe(false);
  });

  it("写入 on/off 后可读回", () => {
    const storage = memoryStorage();
    writeToggle(storage, MOTION_KEY, false);
    writeToggle(storage, SOUND_KEY, true);
    expect(storage.getItem(MOTION_KEY)).toBe("off");
    expect(readToggle(storage, MOTION_KEY, true)).toBe(false);
    expect(readToggle(storage, SOUND_KEY, false)).toBe(true);
  });
});

describe("键位映射显示方式", () => {
  it("默认始终显示", () => {
    expect(parseMappingMode(null)).toBe("always");
    expect(parseMappingMode("on-press")).toBe("on-press");
    expect(parseMappingMode("unknown")).toBe("always");
  });

  it("读写 localStorage 键", () => {
    const storage = memoryStorage();
    expect(readMappingMode(storage)).toBe("always");
    writeMappingMode(storage, "on-press");
    expect(storage.getItem(MAPPING_MODE_KEY)).toBe("on-press");
    expect(readMappingMode(storage)).toBe("on-press");
  });
});

describe("答对自动切题", () => {
  it("默认开启", () => {
    const storage = memoryStorage();
    expect(readAutoAdvance(storage)).toBe(true);
  });

  it("可关闭并持久化", () => {
    const storage = memoryStorage();
    writeAutoAdvance(storage, false);
    expect(storage.getItem(AUTO_ADVANCE_KEY)).toBe("off");
    expect(readAutoAdvance(storage)).toBe(false);
  });
});
