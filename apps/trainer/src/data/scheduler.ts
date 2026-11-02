import type { MasteryRecord } from "./types";

export const MIN_EASE = 1.3;
export const MAX_EASE = 2.5;
export const DEFAULT_EASE = 2.2;
export const WRONG_RETRY_MS = 10 * 60 * 1000;
export const FAST_RESPONSE_MS = 2500;
const DAY_MS = 24 * 60 * 60 * 1000;

export function createMastery(knowledgeId: string, now: number): MasteryRecord {
  return {
    knowledgeId,
    attempts: 0,
    correctAttempts: 0,
    streak: 0,
    ease: DEFAULT_EASE,
    intervalDays: 0,
    lastPracticedAt: 0,
    nextDueAt: now,
    lastResponseMs: 0,
  };
}

export function reviewMastery(
  record: MasteryRecord,
  outcome: "correct" | "wrong",
  now: number,
  responseMs: number,
): MasteryRecord {
  const attempts = record.attempts + 1;

  if (outcome === "wrong") {
    return {
      ...record,
      attempts,
      streak: 0,
      ease: Math.max(MIN_EASE, Number((record.ease - 0.2).toFixed(2))),
      intervalDays: 0,
      lastPracticedAt: now,
      lastResponseMs: responseMs,
      nextDueAt: now + WRONG_RETRY_MS,
    };
  }

  const streak = record.streak + 1;
  const easeGain = responseMs > 0 && responseMs < FAST_RESPONSE_MS ? 0.15 : 0.05;
  const ease = Math.min(MAX_EASE, Number((record.ease + easeGain).toFixed(2)));
  const intervalDays =
    streak === 1 ? 1 : streak === 2 ? 3 : Math.max(1, Math.round((record.intervalDays || 1) * ease));

  return {
    ...record,
    attempts,
    correctAttempts: record.correctAttempts + 1,
    streak,
    ease,
    intervalDays,
    lastPracticedAt: now,
    lastResponseMs: responseMs,
    nextDueAt: now + intervalDays * DAY_MS,
  };
}

export function isDue(record: MasteryRecord, now: number): boolean {
  return record.nextDueAt <= now;
}
