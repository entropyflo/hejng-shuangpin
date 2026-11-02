import { describe, expect, it } from "vitest";
import type { PracticeSession } from "../data/types";
import { summarizeLessonProgress } from "./progress.js";

function session(overrides: Partial<PracticeSession> = {}): PracticeSession {
  return {
    id: "s",
    scope: "lesson:day-1",
    mode: "key",
    startedAt: 0,
    endedAt: 1000,
    attempts: 7,
    correct: 7,
    accuracy: 1,
    stars: 3,
    cpm: null,
    ...overrides,
  };
}

const TOTALS = { "day-1": 7, "day-2": 10 };

describe("关卡进度", () => {
  it("没有记录时不返回条目", () => {
    expect(summarizeLessonProgress([], TOTALS).size).toBe(0);
  });

  it("做满全部题才算完成", () => {
    const partial = summarizeLessonProgress([session({ attempts: 3, stars: 1, accuracy: 0.6 })], TOTALS);
    expect(partial.get("day-1")?.status).toBe("practiced");

    const full = summarizeLessonProgress(
      [session({ attempts: 3, stars: 1 }), session({ attempts: 7, stars: 2, accuracy: 0.9, endedAt: 2000 })],
      TOTALS,
    );
    const progress = full.get("day-1");
    expect(progress?.status).toBe("completed");
    expect(progress?.sessions).toBe(2);
    expect(progress?.bestStars).toBe(2);
    expect(progress?.bestAccuracy).toBe(1);
  });

  it("最近一次按结束时间取最新", () => {
    const map = summarizeLessonProgress(
      [
        session({ id: "old", endedAt: 100, stars: 3, accuracy: 1 }),
        session({ id: "new", endedAt: 500, stars: 1, accuracy: 0.75 }),
      ],
      TOTALS,
    );
    expect(map.get("day-1")?.lastStars).toBe(1);
    expect(map.get("day-1")?.lastAccuracy).toBe(0.75);
    expect(map.get("day-1")?.bestStars).toBe(3);
  });

  it("忽略自由训练与复习会话", () => {
    const map = summarizeLessonProgress(
      [session({ scope: "free:all:1" }), session({ scope: "review" }), session({ scope: "custom:x" })],
      TOTALS,
    );
    expect(map.size).toBe(0);
  });
});
