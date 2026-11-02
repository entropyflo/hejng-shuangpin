import { correctPrefixLength } from "./practice";

export type CommittedEvaluation = {
  committed: number;
  correct: number;
  wrongAt: number | null;
  done: boolean;
  accuracy: number;
};

export function evaluateCommitted(target: string, committed: string): CommittedEvaluation {
  const correct = correctPrefixLength(target, committed);
  const wrongAt = correct < committed.length ? correct : null;
  return {
    committed: committed.length,
    correct,
    wrongAt,
    done: committed.length > 0 && committed === target,
    accuracy: committed.length === 0 ? 0 : Math.round((correct / committed.length) * 100),
  };
}
