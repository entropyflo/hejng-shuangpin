import type { KeyValueStorage } from "../scheme/readings";

export const LAST_LESSON_KEY = "xiaohe.last-lesson.v1";

export function readLastLessonId(storage: KeyValueStorage, validIds: readonly string[]): string | null {
  const value = storage.getItem(LAST_LESSON_KEY);
  return value && validIds.includes(value) ? value : null;
}

export function writeLastLessonId(storage: KeyValueStorage, lessonId: string): void {
  storage.setItem(LAST_LESSON_KEY, lessonId);
}
