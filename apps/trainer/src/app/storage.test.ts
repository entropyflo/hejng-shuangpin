import { describe, expect, it } from "vitest";
import { LAST_LESSON_KEY, readLastLessonId, writeLastLessonId } from "./storage";

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  };
}

describe("上次学习记录", () => {
  it("没有记录时返回 null", () => {
    expect(readLastLessonId(memoryStorage(), ["day-1"])).toBeNull();
  });

  it("写入后可读回", () => {
    const storage = memoryStorage();
    writeLastLessonId(storage, "day-4");
    expect(storage.getItem(LAST_LESSON_KEY)).toBe("day-4");
    expect(readLastLessonId(storage, ["day-1", "day-4"])).toBe("day-4");
  });

  it("忽略已不存在的课时，避免跳转到坏链接", () => {
    expect(readLastLessonId(memoryStorage({ [LAST_LESSON_KEY]: "day-99" }), ["day-1"])).toBeNull();
  });
});
