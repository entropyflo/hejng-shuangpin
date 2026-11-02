import type { KeyValueStorage } from "../scheme/readings";
import type { Exercise } from "../curriculum/content";

export type HintMode = "always" | "hidden" | "auto";
export type InputMode = "key" | "ime";
export type CorrectionMode = "auto" | "strict" | "continuous";
export type CorrectionBehavior = "strict" | "continuous";

export const HINT_MODE_KEY = "xiaohe.hint-mode.v1";
export const INPUT_MODE_KEY = "xiaohe.input-mode.v1";
export const CORRECTION_MODE_KEY = "xiaohe.correction-mode.v1";
export const AUTO_HINT_STREAK = 3;
export const MOTION_KEY = "xiaohe.motion.v1";
export const SOUND_KEY = "xiaohe.sound.v1";
export const FINGERING_KEY = "xiaohe.fingering.v1";

const HINT_MODES: readonly HintMode[] = ["always", "hidden", "auto"];
const INPUT_MODES: readonly InputMode[] = ["key", "ime"];
const CORRECTION_MODES: readonly CorrectionMode[] = ["auto", "strict", "continuous"];

export function parseHintMode(value: string | null | undefined): HintMode {
  return HINT_MODES.includes(value as HintMode) ? (value as HintMode) : "auto";
}

export function readHintMode(storage: KeyValueStorage): HintMode {
  return parseHintMode(storage.getItem(HINT_MODE_KEY));
}

export function writeHintMode(storage: KeyValueStorage, mode: HintMode): void {
  storage.setItem(HINT_MODE_KEY, mode);
}

export function shouldShowHint(mode: HintMode, correctStreak: number): boolean {
  if (mode === "always") return true;
  if (mode === "hidden") return false;
  return correctStreak < AUTO_HINT_STREAK;
}

export function parseInputMode(value: string | null | undefined): InputMode {
  return INPUT_MODES.includes(value as InputMode) ? (value as InputMode) : "key";
}

export function readInputMode(storage: KeyValueStorage): InputMode {
  return parseInputMode(storage.getItem(INPUT_MODE_KEY));
}

export function writeInputMode(storage: KeyValueStorage, mode: InputMode): void {
  storage.setItem(INPUT_MODE_KEY, mode);
}

export function parseCorrectionMode(value: string | null | undefined): CorrectionMode {
  return CORRECTION_MODES.includes(value as CorrectionMode) ? (value as CorrectionMode) : "auto";
}

export function readCorrectionMode(storage: KeyValueStorage): CorrectionMode {
  return parseCorrectionMode(storage.getItem(CORRECTION_MODE_KEY));
}

export function writeCorrectionMode(storage: KeyValueStorage, mode: CorrectionMode): void {
  storage.setItem(CORRECTION_MODE_KEY, mode);
}

export function resolveCorrection(mode: CorrectionMode, kind: Exercise["kind"]): CorrectionBehavior {
  if (mode === "strict") return "strict";
  if (mode === "continuous") return "continuous";
  return kind === "text-typing" || kind === "speed-challenge" ? "continuous" : "strict";
}

export const HINT_LABEL: Record<HintMode, string> = {
  always: "始终显示",
  hidden: "隐藏",
  auto: `自动（连对 ${AUTO_HINT_STREAK} 题后隐藏）`,
};

export const INPUT_LABEL: Record<InputMode, string> = {
  key: "按键模式",
  ime: "输入法模式",
};

export const CORRECTION_LABEL: Record<CorrectionMode, string> = {
  auto: "自动（入门严格，连打连续）",
  strict: "严格：答错必须按对才能继续",
  continuous: "连续：记录错误，不阻塞",
};

export function readToggle(storage: KeyValueStorage, key: string, fallback: boolean): boolean {
  const value = storage.getItem(key);
  if (value === "on") return true;
  if (value === "off") return false;
  return fallback;
}

export function writeToggle(storage: KeyValueStorage, key: string, value: boolean): void {
  storage.setItem(key, value ? "on" : "off");
}
