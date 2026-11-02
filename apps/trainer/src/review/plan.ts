import { QUESTION_BANK, type Exercise } from "../curriculum/content";
import { seededShuffle } from "../curriculum/practice";
import type { Attempt, MasteryRecord } from "../data/types";

const KNOWLEDGE_INDEX = new Map<string, Exercise[]>();

for (const exercise of QUESTION_BANK) {
  for (const knowledgeId of exercise.knowledgeIds) {
    const list = KNOWLEDGE_INDEX.get(knowledgeId) ?? [];
    list.push(exercise);
    KNOWLEDGE_INDEX.set(knowledgeId, list);
  }
}

export function buildReviewExercises(due: MasteryRecord[], limit = 15, seed = "review"): Exercise[] {
  const picked: Exercise[] = [];
  const seen = new Set<string>();

  for (const record of [...due].sort((left, right) => left.nextDueAt - right.nextDueAt)) {
    const candidates = KNOWLEDGE_INDEX.get(record.knowledgeId) ?? [];
    for (const exercise of seededShuffle(candidates, `${seed}:${record.knowledgeId}`)) {
      if (seen.has(exercise.id)) continue;
      seen.add(exercise.id);
      picked.push(exercise);
      break;
    }
    if (picked.length >= limit) break;
  }

  return picked;
}

export type DailyPlanItem = {
  kind: "review" | "lesson" | "mixed";
  title: string;
  detail: string;
  to: string;
};

export function buildDailyPlan(input: {
  dueCount: number;
  nextLesson: { id: string; day: number; title: string };
}): DailyPlanItem[] {
  const items: DailyPlanItem[] = [];

  if (input.dueCount > 0) {
    items.push({
      kind: "review",
      title: `复习 ${input.dueCount} 个到期知识点`,
      detail: "先巩固到期内容，再学新的；不强制打卡。",
      to: "/review",
    });
  }

  items.push({
    kind: "lesson",
    title: `第 ${input.nextLesson.day} 天：${input.nextLesson.title}`,
    detail: "按自己的节奏推进，随时可以跳关或重复练习。",
    to: `/lesson/${input.nextLesson.id}`,
  });

  items.push({
    kind: "mixed",
    title: "混合训练",
    detail: "按答错次数与反应时加权抽题，可换一批。",
    to: "/mixed",
  });

  return items;
}

export type MistakeEntry = {
  exerciseId: string;
  prompt: string;
  count: number;
  lastAt: number;
  expected: string;
  received: string;
};

export function summarizeMistakes(attempts: Attempt[], limit = 10): MistakeEntry[] {
  const map = new Map<string, MistakeEntry>();

  for (const attempt of attempts) {
    if (attempt.correct) continue;
    const existing = map.get(attempt.exerciseId);
    if (existing) {
      existing.count += 1;
      if (attempt.at > existing.lastAt) {
        existing.lastAt = attempt.at;
        existing.expected = attempt.expected;
        existing.received = attempt.received;
      }
      continue;
    }
    const exercise = QUESTION_BANK.find((item) => item.id === attempt.exerciseId);
    map.set(attempt.exerciseId, {
      exerciseId: attempt.exerciseId,
      prompt: exercise?.prompt ?? attempt.exerciseId,
      count: 1,
      lastAt: attempt.at,
      expected: attempt.expected,
      received: attempt.received,
    });
  }

  return [...map.values()]
    .sort((left, right) => right.count - left.count || right.lastAt - left.lastAt)
    .slice(0, limit);
}

export type KeyStat = {
  key: string;
  attempts: number;
  correct: number;
  accuracy: number;
};

export function keyAccuracy(attempts: Attempt[]): Map<string, KeyStat> {
  const map = new Map<string, KeyStat>();

  for (const attempt of attempts) {
    if (attempt.kind !== "key-recognition") continue;
    const key = attempt.expected.trim().toLowerCase();
    if (!/^[a-z]$/u.test(key)) continue;
    const entry = map.get(key) ?? { key, attempts: 0, correct: 0, accuracy: 0 };
    entry.attempts += 1;
    if (attempt.correct) entry.correct += 1;
    entry.accuracy = entry.correct / entry.attempts;
    map.set(key, entry);
  }

  return map;
}
