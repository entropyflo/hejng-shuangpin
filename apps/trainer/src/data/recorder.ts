import { accuracyOf, starRating } from "./metrics";
import type { Attempt, PracticeMode, PracticeSession } from "./types";

export type SessionInput = {
  id: string;
  scope: string;
  mode: PracticeMode;
  startedAt: number;
  endedAt: number;
  attempts: Attempt[];
  cpm: number | null;
};

export function buildSession(input: SessionInput): PracticeSession {
  const total = input.attempts.length;
  const correct = input.attempts.filter((attempt) => attempt.correct).length;
  const accuracy = accuracyOf(correct, total);

  return {
    id: input.id,
    scope: input.scope,
    mode: input.mode,
    startedAt: input.startedAt,
    endedAt: input.endedAt,
    attempts: total,
    correct,
    accuracy,
    stars: starRating(accuracy),
    cpm: input.cpm,
  };
}

export function newSessionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `s-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}
