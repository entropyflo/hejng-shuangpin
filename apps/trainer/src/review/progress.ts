import type { PracticeSession, Stars } from "../data/types";

export type LessonStatus = "untrained" | "practiced" | "completed";

export type LessonProgress = {
  lessonId: string;
  sessions: number;
  status: LessonStatus;
  bestStars: Stars;
  bestAccuracy: number;
  lastStars: Stars | null;
  lastAccuracy: number | null;
  lastAt: number | null;
};

function lessonIdOf(scope: string): string | null {
  return scope.startsWith("lesson:") ? scope.slice("lesson:".length) : null;
}

export function summarizeLessonProgress(
  sessions: PracticeSession[],
  exerciseTotals: Record<string, number>,
): Map<string, LessonProgress> {
  const map = new Map<string, LessonProgress>();

  for (const session of sessions) {
    const lessonId = lessonIdOf(session.scope);
    if (!lessonId) continue;

    const current =
      map.get(lessonId) ??
      ({
        lessonId,
        sessions: 0,
        status: "practiced",
        bestStars: 0,
        bestAccuracy: 0,
        lastStars: null,
        lastAccuracy: null,
        lastAt: null,
      } satisfies LessonProgress);

    current.sessions += 1;
    current.bestStars = Math.max(current.bestStars, session.stars) as Stars;
    current.bestAccuracy = Math.max(current.bestAccuracy, session.accuracy);

    if (current.lastAt === null || session.endedAt >= current.lastAt) {
      current.lastAt = session.endedAt;
      current.lastStars = session.stars;
      current.lastAccuracy = session.accuracy;
    }

    const total = exerciseTotals[lessonId];
    if (total !== undefined && session.attempts >= total) {
      current.status = "completed";
    } else if (current.status !== "completed") {
      current.status = "practiced";
    }

    map.set(lessonId, current);
  }

  return map;
}

export const LESSON_STATUS_LABEL: Record<LessonStatus, string> = {
  untrained: "未练",
  practiced: "已练",
  completed: "已完成",
};
