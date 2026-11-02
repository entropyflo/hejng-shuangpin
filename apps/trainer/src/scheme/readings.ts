import { z } from "zod";
import { encodeSyllable, normalizePinyinPart, type EncodeResult, type Syllable } from "./flypy";

export const BUILTIN_WORD_READINGS = {
  银行: ["yin", "hang"],
  行走: ["xing", "zou"],
  重庆: ["chong", "qing"],
  重要: ["zhong", "yao"],
  音乐: ["yin", "yue"],
} as const satisfies Record<string, readonly string[]>;

export const AMBIGUOUS_CHARACTER_READINGS = {
  行: ["xing", "hang"],
  重: ["zhong", "chong"],
  乐: ["le", "yue"],
} as const satisfies Record<string, readonly string[]>;

export const ReadingOverrideSchema = z
  .object({
    textId: z.string().min(1),
    textVersion: z.string().min(1),
    spanStart: z.number().int().nonnegative(),
    spanEnd: z.number().int().positive(),
    reading: z.array(z.string().min(1)).min(1),
    updatedAt: z.string().datetime(),
  })
  .refine((value) => value.spanEnd > value.spanStart, {
    message: "spanEnd 必须大于 spanStart",
  });

export type ReadingOverride = z.infer<typeof ReadingOverrideSchema>;

const ReadingOverrideBackupSchema = z.object({
  schemaVersion: z.literal(1),
  overrides: z.array(ReadingOverrideSchema),
});

export type ReadingTokenStatus = "confirmed" | "ambiguous" | "unknown";

export type ReadingToken = {
  text: string;
  spanStart: number;
  spanEnd: number;
  status: ReadingTokenStatus;
  candidates: string[][];
  selectedReading?: string[];
  sourceId: "manual-override" | "builtin-word-v1" | "ambiguous-character-v1" | "none";
};

export type ReadingAnalysisInput = {
  textId: string;
  textVersion: string;
  text: string;
  overrides?: ReadingOverride[];
};

export class ReadingResolutionError extends Error {
  constructor(
    readonly code: "UNCONFIRMED_READING" | "INVALID_OVERRIDE_SPAN" | "READING_LENGTH_MISMATCH",
    message: string,
  ) {
    super(message);
    this.name = "ReadingResolutionError";
  }
}

const WORD_ENTRIES = Object.entries(BUILTIN_WORD_READINGS).sort(([left], [right]) => right.length - left.length);
const INITIALS = ["zh", "ch", "sh", "b", "p", "m", "f", "d", "t", "n", "l", "g", "k", "h", "j", "q", "x", "r", "z", "c", "s", "y", "w"];

function normalizeReadingList(readings: readonly string[]): string[] {
  return readings.map(normalizePinyinPart);
}

function matchingOverride(input: ReadingAnalysisInput, position: number): ReadingOverride | undefined {
  return input.overrides
    ?.filter(
      (override) =>
        override.textId === input.textId &&
        override.textVersion === input.textVersion &&
        override.spanStart === position &&
        override.spanEnd <= input.text.length,
    )
    .sort((left, right) => right.spanEnd - left.spanEnd)[0];
}

export function analyzeReadings(input: ReadingAnalysisInput): ReadingToken[] {
  const tokens: ReadingToken[] = [];
  let position = 0;

  while (position < input.text.length) {
    const override = matchingOverride(input, position);
    if (override) {
      const overriddenText = input.text.slice(override.spanStart, override.spanEnd);
      if (Array.from(overriddenText).length !== override.reading.length) {
        throw new ReadingResolutionError("READING_LENGTH_MISMATCH", "人工修正的读音数量必须与字符数量一致。");
      }

      tokens.push({
        text: overriddenText,
        spanStart: override.spanStart,
        spanEnd: override.spanEnd,
        status: "confirmed",
        candidates: [normalizeReadingList(override.reading)],
        selectedReading: normalizeReadingList(override.reading),
        sourceId: "manual-override",
      });
      position = override.spanEnd;
      continue;
    }

    const wordEntry = WORD_ENTRIES.find(([word]) => input.text.startsWith(word, position));
    if (wordEntry) {
      const [word, reading] = wordEntry;
      const normalizedReading = normalizeReadingList(reading);
      tokens.push({
        text: word,
        spanStart: position,
        spanEnd: position + word.length,
        status: "confirmed",
        candidates: [normalizedReading],
        selectedReading: normalizedReading,
        sourceId: "builtin-word-v1",
      });
      position += word.length;
      continue;
    }

    const character = input.text[position];
    if (Object.prototype.hasOwnProperty.call(AMBIGUOUS_CHARACTER_READINGS, character)) {
      const readings = AMBIGUOUS_CHARACTER_READINGS[character as keyof typeof AMBIGUOUS_CHARACTER_READINGS];
      tokens.push({
        text: character,
        spanStart: position,
        spanEnd: position + character.length,
        status: "ambiguous",
        candidates: readings.map((reading) => [reading]),
        sourceId: "ambiguous-character-v1",
      });
    } else {
      tokens.push({
        text: character,
        spanStart: position,
        spanEnd: position + character.length,
        status: "unknown",
        candidates: [],
        sourceId: "none",
      });
    }
    position += character.length;
  }

  return tokens;
}

export function parsePinyinSyllable(reading: string): Syllable {
  const normalized = normalizePinyinPart(reading);
  const initial = INITIALS.find((candidate) => normalized.startsWith(candidate)) ?? "";
  const final = normalized.slice(initial.length);
  return { initial, final, normalizedPinyin: normalized };
}

export type EncodedReadingToken = ReadingToken & { encoded: EncodeResult[] };

export function encodeReadingTokens(tokens: ReadingToken[]): EncodedReadingToken[] {
  return tokens.map((token) => {
    if (token.status !== "confirmed" || !token.selectedReading) {
      throw new ReadingResolutionError(
        "UNCONFIRMED_READING",
        `“${token.text}”的读音尚未确认，不能生成固定双拼答案。`,
      );
    }

    return {
      ...token,
      encoded: token.selectedReading.map((reading) => encodeSyllable(parsePinyinSyllable(reading))),
    };
  });
}

export function serializeReadingOverrides(overrides: ReadingOverride[]): string {
  return JSON.stringify(ReadingOverrideBackupSchema.parse({ schemaVersion: 1, overrides }));
}

export function deserializeReadingOverrides(serialized: string): ReadingOverride[] {
  return ReadingOverrideBackupSchema.parse(JSON.parse(serialized)).overrides;
}

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export class ReadingOverrideRepository {
  static readonly storageKey = "xiaohe.reading-overrides.v1";

  constructor(private readonly storage: KeyValueStorage) {}

  load(): ReadingOverride[] {
    const stored = this.storage.getItem(ReadingOverrideRepository.storageKey);
    return stored ? deserializeReadingOverrides(stored) : [];
  }

  save(overrides: ReadingOverride[]): void {
    this.storage.setItem(ReadingOverrideRepository.storageKey, serializeReadingOverrides(overrides));
  }

  upsert(override: ReadingOverride): ReadingOverride[] {
    const parsed = ReadingOverrideSchema.parse(override);
    const existing = this.load().filter(
      (item) =>
        !(
          item.textId === parsed.textId &&
          item.textVersion === parsed.textVersion &&
          item.spanStart === parsed.spanStart &&
          item.spanEnd === parsed.spanEnd
        ),
    );
    const next = [...existing, parsed];
    this.save(next);
    return next;
  }
}

