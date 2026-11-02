import { describe, expect, it } from "vitest";
import { FLYPY_FINAL_KEYS, FLYPY_INITIAL_KEYS } from "../scheme/flypy";
import { CURRICULUM, DISPLAY_FINALS } from "./content";
import {
  buildKeyMap,
  buildReverseRecallOptions,
  checkExerciseAnswer,
  correctPrefixLength,
  expectedAnswer,
  expectedKeySequence,
  finalGroupsByKey,
  fingerForKey,
  insertRetry,
  retryOffset,
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

describe("键盘提示序列", () => {
  it("认键题只提示一个键", () => {
    const exercise = CURRICULUM.exercises.find((item) => item.id === "key-final-a");
    if (!exercise) throw new Error("缺少认键题");
    expect(expectedKeySequence(exercise)).toEqual(["a"]);
  });

  it("音节题按码位拆分", () => {
    const exercise = CURRICULUM.exercises.find((item) => item.id === "syllable-shuang");
    if (!exercise) throw new Error("缺少音节题");
    expect(expectedKeySequence(exercise)).toEqual(["u", "l"]);
  });

  it("词句题把所有音节码连成序列", () => {
    const exercise = CURRICULUM.exercises.find((item) => item.id === "word-zhongguo");
    if (!exercise) throw new Error("缺少词语题");
    expect(expectedKeySequence(exercise)).toEqual(["v", "s", "g", "o"]);
  });

  it("反向记忆题不提供键盘提示", () => {
    const exercise = CURRICULUM.exercises.find((item) => item.kind === "reverse-recall");
    if (!exercise) throw new Error("缺少反向题");
    expect(expectedKeySequence(exercise)).toEqual([]);
  });
});

describe("测速前缀比对", () => {
  it("统计正确前缀长度", () => {
    expect(correctPrefixLength("abcdef", "abcX")).toBe(3);
    expect(correctPrefixLength("abc", "")).toBe(0);
    expect(correctPrefixLength("abc", "abcdef")).toBe(3);
    expect(correctPrefixLength("abc", "abd")).toBe(2);
    expect(correctPrefixLength("", "abc")).toBe(0);
  });
});

describe("指法映射", () => {
  it("26 个字母键都有推荐手指", () => {
    const letters = "abcdefghijklmnopqrstuvwxyz".split("");
    for (const letter of letters) {
      expect(fingerForKey(letter)).not.toBeNull();
    }
  });

  it("左右手分区正确", () => {
    expect(fingerForKey("q")).toBe("左小指");
    expect(fingerForKey("f")).toBe("左食指");
    expect(fingerForKey("j")).toBe("右食指");
    expect(fingerForKey("p")).toBe("右小指");
    expect(fingerForKey("P")).toBe("右小指");
    expect(fingerForKey("1")).toBeNull();
  });
});

describe("答错当轮插回", () => {
  it("插回位置在 2～5 题之后", () => {
    expect(retryOffset("key-final-a")).toBeGreaterThanOrEqual(2);
    expect(retryOffset("key-final-a")).toBeLessThanOrEqual(5);
    expect(retryOffset("key-final-a")).toBe(retryOffset("key-final-a"));
  });

  it("插回不改变原队列", () => {
    const queue = ["a", "b", "c", "d"];
    const next = insertRetry(queue, 0, "a", 2);
    expect(queue).toEqual(["a", "b", "c", "d"]);
    expect(next).toEqual(["a", "b", "c", "a", "d"]);
  });

  it("末尾插入不会越界", () => {
    const next = insertRetry(["a", "b"], 1, "b", 5);
    expect(next).toEqual(["a", "b", "b"]);
  });
});
