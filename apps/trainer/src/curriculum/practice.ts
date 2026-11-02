import { FLYPY_FINAL_KEYS, FLYPY_INITIAL_KEYS, type FlypyFinal } from "../scheme/flypy";
import { DISPLAY_FINALS, type Exercise } from "./content";

export type KeySlot = {
  key: string;
  initials: string[];
  finals: FlypyFinal[];
};

export const KEYBOARD_ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"] as const;

export function buildKeyMap(): KeySlot[] {
  return KEYBOARD_ROWS.flatMap((row) => Array.from(row)).map((key) => ({
    key,
    initials: Object.entries(FLYPY_INITIAL_KEYS)
      .filter(([, mapped]) => mapped === key)
      .map(([initial]) => initial),
    finals: DISPLAY_FINALS.filter((final) => FLYPY_FINAL_KEYS[final] === key),
  }));
}

export function normalizeCodeInput(value: string): string {
  return value.toLowerCase().replace(/[\s,，、]+/gu, "");
}

export function expectedAnswer(exercise: Exercise): string | null {
  switch (exercise.kind) {
    case "key-recognition":
      return exercise.expectedKey;
    case "syllable-composition":
      return exercise.expectedCode;
    case "text-typing":
    case "speed-challenge":
      return exercise.expectedCodes.join("");
    case "reverse-recall":
      return null;
  }
}

export type AnswerCheck = {
  correct: boolean;
  expected: string;
  received: string;
};

export function checkExerciseAnswer(exercise: Exercise, input: string): AnswerCheck {
  const expected = expectedAnswer(exercise);
  if (expected === null) {
    throw new Error("该题型需要选择答案，不能直接比对文本。");
  }
  const received = normalizeCodeInput(input);
  return { correct: received === expected, expected, received };
}

function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (const character of seed) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  const result = [...items];
  let state = hashSeed(seed) || 1;
  for (let index = result.length - 1; index > 0; index -= 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const swapIndex = state % (index + 1);
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function finalGroupsByKey(): Record<string, FlypyFinal[]> {
  return DISPLAY_FINALS.reduce<Record<string, FlypyFinal[]>>((groups, final) => {
    const key = FLYPY_FINAL_KEYS[final];
    groups[key] ??= [];
    groups[key].push(final);
    return groups;
  }, {});
}

export function buildReverseRecallOptions(
  exercise: Extract<Exercise, { kind: "reverse-recall" }>,
  optionCount = 4,
): FlypyFinal[][] {
  const groups = finalGroupsByKey();
  const distractors = Object.entries(groups)
    .filter(([key]) => key !== exercise.key)
    .map(([, finals]) => finals);
  const picked = seededShuffle(distractors, `${exercise.id}:pick`).slice(0, Math.max(1, optionCount - 1));
  return seededShuffle([[...exercise.expectedReadings] as FlypyFinal[], ...picked], exercise.id);
}

export function sameFinals(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

export function expectedKeySequence(exercise: Exercise): string[] {
  switch (exercise.kind) {
    case "key-recognition":
      return [exercise.expectedKey];
    case "syllable-composition":
      return Array.from(exercise.expectedCode);
    case "text-typing":
    case "speed-challenge":
      return exercise.expectedCodes.flatMap((code) => Array.from(code));
    case "reverse-recall":
      return [];
  }
}

export function correctPrefixLength(target: string, typed: string): number {
  let index = 0;
  while (index < target.length && index < typed.length && target[index] === typed[index]) {
    index += 1;
  }
  return index;
}

export const KEY_FINGERS: Record<string, string> = {
  q: "左小指", a: "左小指", z: "左小指",
  w: "左无名指", s: "左无名指", x: "左无名指",
  e: "左中指", d: "左中指", c: "左中指",
  r: "左食指", f: "左食指", v: "左食指", t: "左食指", g: "左食指", b: "左食指",
  y: "右食指", h: "右食指", n: "右食指", u: "右食指", j: "右食指", m: "右食指",
  i: "右中指", k: "右中指",
  o: "右无名指", l: "右无名指",
  p: "右小指",
};

export function fingerForKey(key: string): string | null {
  return KEY_FINGERS[key.toLowerCase()] ?? null;
}
