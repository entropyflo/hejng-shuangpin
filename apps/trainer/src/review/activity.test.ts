import { describe, expect, it } from "vitest";
import type { Attempt, PracticeSession } from "../data/types";
import { summarizeActivity } from "./activity.js";

function session(endedAt: number): PracticeSession {
  return {
    id: `s-${endedAt}`,
    scope: "lesson:day-1",
    mode: "key",
    startedAt: endedAt - 1000,
    endedAt,
    attempts: 3,
    correct: 3,
    accuracy: 1,
    stars: 3,
    cpm: null,
  };
}

function attempt(at: number, correct = true): Attempt {
  return {
    sessionId: "s",
    exerciseId: "key-final-a",
    kind: "key-recognition",
    knowledgeIds: ["final.a"],
    mode: "key",
    correct,
    responseMs: 1000,
    at,
    expected: "a",
    received: "a",
  };
}

const DAY1 = new Date(2026, 10, 1, 10, 0, 0).getTime();
const DAY1_LATER = new Date(2026, 10, 1, 22, 0, 0).getTime();
const DAY2 = new Date(2026, 10, 2, 9, 0, 0).getTime();

describe("学习活动统计", () => {
  it("同一天多次会话只算一天", () => {
    expect(summarizeActivity([session(DAY1), session(DAY1_LATER)], []).studyDays).toBe(1);
  });

  it("跨天分别计数", () => {
    expect(summarizeActivity([session(DAY1), session(DAY2)], []).studyDays).toBe(2);
  });

  it("没有会话时按作答日期统计", () => {
    expect(summarizeActivity([], [attempt(DAY1), attempt(DAY2)]).studyDays).toBe(2);
  });

  it("XP 按正确作答与会话数计算", () => {
    const summary = summarizeActivity([session(DAY1)], [attempt(DAY1), attempt(DAY1), attempt(DAY1, false)]);
    expect(summary.correctAttempts).toBe(2);
    expect(summary.xp).toBe(2 * 2 + 10);
    expect(summary.totalAttempts).toBe(3);
  });

  it("空数据返回零", () => {
    expect(summarizeActivity([], [])).toEqual({ studyDays: 0, xp: 0, totalAttempts: 0, correctAttempts: 0 });
  });
});
