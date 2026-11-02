import { describe, expect, it } from "vitest";
import { createMastery, isDue, reviewMastery, WRONG_RETRY_MS } from "./scheduler";

const NOW = Date.UTC(2026, 10, 2, 12, 0, 0);
const DAY = 24 * 60 * 60 * 1000;

describe("掌握度初始化", () => {
  it("新知识点立即可复习", () => {
    const record = createMastery("final.ang", NOW);
    expect(record.nextDueAt).toBe(NOW);
    expect(record.attempts).toBe(0);
    expect(record.ease).toBe(2.2);
    expect(isDue(record, NOW)).toBe(true);
  });
});

describe("答错", () => {
  it("重置连对、降低熟练度并安排短间隔复习", () => {
    const record = reviewMastery({ ...createMastery("final.ang", NOW), streak: 4, ease: 2.2 }, "wrong", NOW, 3000);
    expect(record.streak).toBe(0);
    expect(record.intervalDays).toBe(0);
    expect(record.ease).toBe(2);
    expect(record.nextDueAt).toBe(NOW + WRONG_RETRY_MS);
    expect(record.attempts).toBe(1);
    expect(record.correctAttempts).toBe(0);
  });

  it("熟练度不低于下限 1.3", () => {
    let record = createMastery("final.ang", NOW);
    for (let index = 0; index < 10; index += 1) {
      record = reviewMastery(record, "wrong", NOW, 3000);
    }
    expect(record.ease).toBe(1.3);
  });
});

describe("答对", () => {
  it("首次答对间隔 1 天，第二次 3 天", () => {
    let record = reviewMastery(createMastery("final.ang", NOW), "correct", NOW, 4000);
    expect(record.intervalDays).toBe(1);
    expect(record.nextDueAt).toBe(NOW + DAY);
    expect(record.streak).toBe(1);

    record = reviewMastery(record, "correct", NOW + DAY, 4000);
    expect(record.intervalDays).toBe(3);
    expect(record.nextDueAt).toBe(NOW + DAY + 3 * DAY);
    expect(record.correctAttempts).toBe(2);
  });

  it("第三次起按熟练度放大间隔", () => {
    let record = createMastery("final.ang", NOW);
    record = reviewMastery(record, "correct", NOW, 4000);
    record = reviewMastery(record, "correct", NOW, 4000);
    const before = record.ease;
    record = reviewMastery(record, "correct", NOW, 4000);
    expect(record.intervalDays).toBe(Math.round(3 * before));
  });

  it("快速答对提升熟练度更多", () => {
    const fast = reviewMastery(createMastery("a", NOW), "correct", NOW, 1200);
    const slow = reviewMastery(createMastery("a", NOW), "correct", NOW, 6000);
    expect(fast.ease).toBeGreaterThan(slow.ease);
    expect(fast.ease).toBeLessThanOrEqual(2.5);
  });

  it("熟练度不超过上限 2.5", () => {
    let record = createMastery("a", NOW);
    for (let index = 0; index < 20; index += 1) {
      record = reviewMastery(record, "correct", NOW, 1000);
    }
    expect(record.ease).toBe(2.5);
  });
});

describe("到期判定", () => {
  it("边界时刻算到期", () => {
    const record = { ...createMastery("a", NOW), nextDueAt: NOW + 1000 };
    expect(isDue(record, NOW + 999)).toBe(false);
    expect(isDue(record, NOW + 1000)).toBe(true);
  });
});
