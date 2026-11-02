import { describe, expect, it } from "vitest";
import { CURRICULUM } from "../curriculum/content";
import type { Attempt } from "../data/types";
import { buildMixedExercises, exerciseWeight, knowledgeStats } from "./mixed.js";

function attempt(overrides: Partial<Attempt> = {}): Attempt {
  return {
    sessionId: "s",
    exerciseId: "key-final-a",
    kind: "key-recognition",
    knowledgeIds: ["final.a"],
    mode: "key",
    correct: false,
    responseMs: 1000,
    at: 1,
    expected: "a",
    received: "x",
    ...overrides,
  };
}

describe("薄弱度权重", () => {
  it("没有记录时权重为 1", () => {
    const exercise = CURRICULUM.exercises.find((item) => item.id === "key-final-a");
    if (!exercise) throw new Error("缺少题目");
    expect(exerciseWeight(exercise, new Map())).toBe(1);
  });

  it("错误次数、低正确率与慢反应会提高权重", () => {
    const exercise = CURRICULUM.exercises.find((item) => item.id === "key-final-a");
    if (!exercise) throw new Error("缺少题目");
    const stats = knowledgeStats([
      attempt({ correct: false }),
      attempt({ correct: false }),
      attempt({ correct: false, responseMs: 6000 }),
    ]);
    expect(exerciseWeight(exercise, stats)).toBeGreaterThan(4);
  });

  it("统计按知识点聚合", () => {
    const stats = knowledgeStats([attempt(), attempt({ correct: true, knowledgeIds: ["final.a", "initial.b"] })]);
    expect(stats.get("final.a")).toMatchObject({ total: 2, correct: 1 });
    expect(stats.get("initial.b")).toMatchObject({ total: 1, correct: 1 });
  });
});

describe("混合训练抽题", () => {
  it("同一 seed 结果稳定且不重复", () => {
    const first = buildMixedExercises({ exercises: CURRICULUM.exercises, attempts: [], seed: "s1", limit: 10 });
    const second = buildMixedExercises({ exercises: CURRICULUM.exercises, attempts: [], seed: "s1", limit: 10 });
    expect(first.map((item) => item.id)).toEqual(second.map((item) => item.id));
    expect(new Set(first.map((item) => item.id)).size).toBe(first.length);
  });

  it("遵守数量上限", () => {
    const picked = buildMixedExercises({ exercises: CURRICULUM.exercises, attempts: [], limit: 5 });
    expect(picked).toHaveLength(5);
  });

  it("空题库返回空", () => {
    expect(buildMixedExercises({ exercises: [], attempts: [] })).toEqual([]);
  });
});
