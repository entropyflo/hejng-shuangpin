import type { Exercise } from "../curriculum/content";

export type PracticeMode = "key" | "ime";

export type Attempt = {
  id?: number;
  sessionId: string;
  exerciseId: string;
  kind: Exercise["kind"];
  knowledgeIds: string[];
  mode: PracticeMode;
  correct: boolean;
  responseMs: number;
  at: number;
  expected: string;
  received: string;
};

export type Stars = 0 | 1 | 2 | 3;

export type PracticeSession = {
  id: string;
  scope: string;
  mode: PracticeMode;
  startedAt: number;
  endedAt: number;
  attempts: number;
  correct: number;
  accuracy: number;
  stars: Stars;
  cpm: number | null;
};

export type MasteryRecord = {
  knowledgeId: string;
  attempts: number;
  correctAttempts: number;
  streak: number;
  ease: number;
  intervalDays: number;
  lastPracticedAt: number;
  nextDueAt: number;
  lastResponseMs: number;
};
