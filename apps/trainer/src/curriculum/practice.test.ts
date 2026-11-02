import { describe, expect, it } from "vitest";
import { FLYPY_FINAL_KEYS, FLYPY_INITIAL_KEYS } from "../scheme/flypy";
import { CURRICULUM, DISPLAY_FINALS } from "./content";
import {
  buildKeyMap,
  buildReverseRecallOptions,
  checkExerciseAnswer,
  expectedAnswer,
  finalGroupsByKey,
  normalizeCodeInput,
  sameFinals,
  seededShuffle,
} from "./practice";

describe("键位映射图数据", () => {
  it("覆盖 26 个字母键且不重复", () => {
    const slots = buildKeyMap();
    expect(slots).toHaveLength(26);
    expect(new Set(slots.map((slot) => slot.key)).size).toBe(26);
  });

  it("每个声母和展示韵母恰好出现一次", () => {
    const slots = buildKeyMap();
    const initials = slots.flatMap((slot) => slot.initials);
    const finals = slots.flatMap((slot) => slot.finals);
    expect(initials.sort()).toEqual(Object.keys(FLYPY_INITIAL_KEYS).sort());
    expect(finals.sort()).toEqual([...DISPLAY_FINALS].sort());
  });

  it("复合声母与共享键位落在预期键上", () => {
    const slots = new Map(buildKeyMap().map((slot) => [slot.key, slot]));
    expect(slots.get("v")?.initials).toEqual(["zh"]);
    expect(slots.get("v")?.finals).toEqual(["ü", "ui"]);
    expect(slots.get("i")?.initials).toEqual(["ch"]);
    expect(slots.get("u")?.initials).toEqual(["sh"]);
    expect(slots.get("q")?.finals).toEqual(["iu"]);
    expect(slots.get("l")?.finals).toEqual(["iang", "uang"]);
  });
});

describe("作答判定", () => {
  it("忽略大小写与空白", () => {
    expect(normalizeCodeInput(" U L ")).toBe("ul");
    expect(normalizeCodeInput("vs，go")).toBe("vsgo");
  });

  it("音节与文本题按统一引擎答案判定", () => {
    const syllable = CURRICULUM.exercises.find((exercise) => exercise.id === "syllable-shuang");
    const text = CURRICULUM.exercises.find((exercise) => exercise.id === "word-zhongguo");
    if (!syllable || !text) throw new Error("缺少测试题");

    expect(expectedAnswer(syllable)).toBe("ul");
    expect(checkExerciseAnswer(syllable, "UL")).toMatchObject({ correct: true, received: "ul" });
    expect(checkExerciseAnswer(syllable, "lu")).toMatchObject({ correct: false, received: "lu" });

    expect(expectedAnswer(text)).toBe("vsgo");
    expect(checkExerciseAnswer(text, "vs go").correct).toBe(true);
  });

  it("反向记忆题不参与文本比对", () => {
    const reverse = CURRICULUM.exercises.find((exercise) => exercise.kind === "reverse-recall");
    if (!reverse) throw new Error("缺少反向记忆题");
    expect(expectedAnswer(reverse)).toBeNull();
    expect(() => checkExerciseAnswer(reverse, "x")).toThrow();
  });
});

describe("反向记忆选项", () => {
  it("包含正确项且不重复", () => {
    const reverse = CURRICULUM.exercises.find(
      (exercise): exercise is Extract<typeof exercise, { kind: "reverse-recall" }> =>
        exercise.kind === "reverse-recall" && exercise.key === "l",
    );
    if (!reverse) throw new Error("缺少 L 键反向题");

    const options = buildReverseRecallOptions(reverse);
    expect(options).toHaveLength(4);
    const serialized = options.map((option) => option.join("/"));
    expect(new Set(serialized).size).toBe(4);
    expect(serialized).toContain("iang/uang");
  });

  it("同一题目重复生成顺序稳定", () => {
    const reverse = CURRICULUM.exercises.find(
      (exercise): exercise is Extract<typeof exercise, { kind: "reverse-recall" }> =>
        exercise.kind === "reverse-recall",
    );
    if (!reverse) throw new Error("缺少反向记忆题");
    expect(buildReverseRecallOptions(reverse)).toEqual(buildReverseRecallOptions(reverse));
  });

  it("分组与洗牌保持元素完整", () => {
    const groups = finalGroupsByKey();
    expect(Object.values(groups).flat().sort()).toEqual([...DISPLAY_FINALS].sort());
    const shuffled = seededShuffle([1, 2, 3, 4, 5], "seed");
    expect([...shuffled].sort()).toEqual([1, 2, 3, 4, 5]);
    expect(sameFinals(["a", "o"], ["a", "o"])).toBe(true);
    expect(sameFinals(["a", "o"], ["o", "a"])).toBe(false);
  });
});
