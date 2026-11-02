import type { Attempt, PracticeSession } from "../data/types";

export type ActivitySummary = {
  studyDays: number;
  xp: number;
  totalAttempts: number;
  correctAttempts: number;
};

function dayKey(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

export function summarizeActivity(sessions: PracticeSession[], attempts: Attempt[]): ActivitySummary {
  const days = new Set<string>();

  for (const session of sessions) days.add(dayKey(session.endedAt));
  if (days.size === 0) {
    for (const attempt of attempts) days.add(dayKey(attempt.at));
  }

  const correctAttempts = attempts.filter((attempt) => attempt.correct).length;
  const xp = correctAttempts * 2 + sessions.length * 10;

  return {
    studyDays: days.size,
    xp,
    totalAttempts: attempts.length,
    correctAttempts,
  };
}
