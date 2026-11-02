import type { Stars } from "./types";

export function accuracyOf(correct: number, total: number): number {
  if (total <= 0) return 0;
  return correct / total;
}

export function starRating(accuracy: number): Stars {
  if (accuracy >= 0.95) return 3;
  if (accuracy >= 0.85) return 2;
  if (accuracy >= 0.7) return 1;
  return 0;
}

export function computeCpm(correctChars: number, elapsedMs: number): number | null {
  if (correctChars <= 0 || elapsedMs < 1000) return null;
  return Math.round(correctChars / (elapsedMs / 60_000));
}

export function formatCpm(cpm: number | null): string {
  return cpm === null ? "—" : `${cpm} CPM`;
}

export function starsToText(stars: Stars): string {
  return "★".repeat(stars) + "☆".repeat(3 - stars);
}
