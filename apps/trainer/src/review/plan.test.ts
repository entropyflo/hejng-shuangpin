import { describe, expect, it } from "vitest";
import type { Attempt, MasteryRecord } from "../data/types";
import { buildDailyPlan, buildReviewExercises, keyAccuracy, summarizeMistakes } from "./plan";

function mastery(knowledgeId: string, nextDueAt: number): MasteryRecord {
  return {
    knowledgeId,
    attempts: 1,
    correctAttempts: 0,
    streak: 0,
    ease: 2,
    intervalDays: 0,
    lastPracticedAt: nextDueAt - 1000,
    nextDueAt,
    lastResponseMs: 2000,
  };
}

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

describe("复习题生成", () => {
  it("按到期知识点挑题并去重", () => {
    const exercises = buildReviewExercises([mastery("final.ang", 1), mastery("initial.b", 2)]);
    expect(exercises).toHaveLength(2);
    expect(exercises[0].knowledgeIds).toContain("final.ang");
    expect(exercises[1].knowledgeIds).toContain("initial.b");
    expect(new Set(exercises.map((item) => item.id)).size).toBe(2);
  });

  it("同一知识点不会重复出题", () => {
    const exercises = buildReviewExercises([mastery("zero.ang", 1), mastery("final.ang", 2)]);
    expect(new Set(exercises.map((item) => item.id)).size).toBe(exercises.length);
  });

  it("遵守上限且按到期时间排序", () => {
    const due = [mastery("final.ang", 30), mastery("initial.b", 10), mastery("final.ao", 20)];
    const exercises = buildReviewExercises(due, 2);
    expect(exercises).toHaveLength(2);
    expect(exercises[0].knowledgeIds).toContain("initial.b");
  });

  it("没有到期记录时返回空", () => {
    expect(buildReviewExercises([])).toEqual([]);
  });
});

describe("今日计划", () => {
  const lesson = { id: "day-2", day: 2, title: "复合韵母与共享键位" };

  it("没有到期复习时只安排新课与混合", () => {
    const plan = buildDailyPlan({ dueCount: 0, nextLesson: lesson });
    expect(plan.map((item) => item.kind)).toEqual(["lesson", "mixed"]);
  });

  it("有到期复习时优先安排复习", () => {
    const plan = buildDailyPlan({ dueCount: 4, nextLesson: lesson });
    expect(plan.map((item) => item.kind)).toEqual(["review", "lesson", "mixed"]);
    expect(plan[0].to).toBe("/review");
    expect(plan[0].title).toContain("4");
  });
});

describe("错题汇总", () => {
  it("按题目聚合次数并忽略答对记录", () => {
    const entries = summarizeMistakes([
      attempt({ at: 1 }),
      attempt({ at: 5, received: "b" }),
      attempt({ exerciseId: "key-final-o", expected: "o", received: "p", at: 3 }),
      attempt({ correct: true, at: 9 }),
    ]);

    expect(entries).toHaveLength(2);
    expect(entries[0].exerciseId).toBe("key-final-a");
    expect(entries[0].count).toBe(2);
    expect(entries[0].received).toBe("b");
    expect(entries[0].prompt).toContain("韵母“a”");
  });

  it("遵守上限", () => {
    const entries = summarizeMistakes(
      [attempt({ exerciseId: "a" }), attempt({ exerciseId: "b" }), attempt({ exerciseId: "c" })],
      2,
    );
    expect(entries).toHaveLength(2);
  });
});

describe("键位正确率", () => {
  it("只统计键位认知题", () => {
    const stats = keyAccuracy([
      attempt({ expected: "a", correct: true }),
      attempt({ expected: "a", correct: false }),
      attempt({ expected: "b", correct: true }),
      attempt({ kind: "text-typing", expected: "vsgo", correct: true }),
    ]);

    expect(stats.get("a")).toMatchObject({ attempts: 2, correct: 1, accuracy: 0.5 });
    expect(stats.get("b")).toMatchObject({ attempts: 1, correct: 1, accuracy: 1 });
    expect(stats.has("v")).toBe(false);
  });
});
