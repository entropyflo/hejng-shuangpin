import type { ComparisonRecord } from "../data/types";

export type CompareText = {
  id: string;
  label: string;
  text: string;
};

export const COMPARE_TEXTS: CompareText[] = [
  { id: "compare-short", label: "短句", text: "清风明月，双拼输入。" },
  { id: "compare-mid", label: "中段", text: "稳定的节奏来自准确的拆分，而不是盲目追求速度。" },
  { id: "compare-long", label: "长段", text: "窗外有风，桌前有光。我们安静地练习，也认真记录每一次进步。" },
];

export function improvementPercent(flypyCpm: number, quanpinCpm: number): number | null {
  if (quanpinCpm <= 0) return null;
  return Math.round(((flypyCpm - quanpinCpm) / quanpinCpm) * 100);
}

export function buildComparison(input: {
  id: string;
  textId: string;
  text: string;
  flypyCpm: number;
  quanpinCpm: number;
  at: number;
}): ComparisonRecord {
  return { ...input };
}
