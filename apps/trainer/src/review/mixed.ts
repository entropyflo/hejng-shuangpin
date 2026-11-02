import type { Exercise } from "../curriculum/content";
import type { Attempt } from "../data/types";

export type KnowledgeStat = {
  total: number;
  correct: number;
  slow: number;
};

export function knowledgeStats(attempts: Attempt[]): Map<string, KnowledgeStat> {
  const map = new Map<string, KnowledgeStat>();

  for (const attempt of attempts) {
    for (const knowledgeId of attempt.knowledgeIds) {
      const stat = map.get(knowledgeId) ?? { total: 0, correct: 0, slow: 0 };
      stat.total += 1;
      if (attempt.correct) stat.correct += 1;
      if (attempt.responseMs > 4000) stat.slow += 1;
      map.set(knowledgeId, stat);
    }
  }

  return map;
}

export function exerciseWeight(exercise: Exercise, stats: Map<string, KnowledgeStat>): number {
  let weight = 1;

  for (const knowledgeId of exercise.knowledgeIds) {
    const stat = stats.get(knowledgeId);
    if (!stat || stat.total === 0) continue;

    const accuracy = stat.correct / stat.total;
    weight += Math.min(4, (stat.total - stat.correct) * 1.5);
    if (accuracy < 0.7 && stat.total >= 2) weight += 2;
    if (stat.slow > 0) weight += 1;
  }

  return weight;
}

function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (const character of seed) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildMixedExercises(input: {
  exercises: Exercise[];
  attempts: Attempt[];
  limit?: number;
  seed?: string;
}): Exercise[] {
  const limit = input.limit ?? 20;
  const stats = knowledgeStats(input.attempts);
  const remaining = input.exercises.map((exercise) => ({
    exercise,
    weight: exerciseWeight(exercise, stats),
  }));
  const random = mulberry32(hashSeed(input.seed ?? "mixed"));
  const picked: Exercise[] = [];

  while (picked.length < limit && remaining.length > 0) {
    const total = remaining.reduce((sum, item) => sum + item.weight, 0);
    let target = random() * total;
    let chosen = remaining.length - 1;

    for (let index = 0; index < remaining.length; index += 1) {
      target -= remaining[index].weight;
      if (target <= 0) {
        chosen = index;
        break;
      }
    }

    picked.push(remaining[chosen].exercise);
    remaining.splice(chosen, 1);
  }

  return picked;
}
