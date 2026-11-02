import { pinyin } from "pinyin-pro";
import { encodeSyllable } from "../scheme/flypy";
import { parsePinyinSyllable } from "../scheme/readings";

export type CustomPracticeUnit = {
  character: string;
  reading: string | null;
  code: string | null;
};

const HAN = /^\p{Script=Han}$/u;

export function buildCustomPracticeUnits(text: string): CustomPracticeUnit[] {
  const tokens = pinyin(text, { toneType: "none", type: "all", nonZh: "consecutive" });

  return tokens.flatMap((token) =>
    Array.from(token.origin).map((character) => {
      if (!HAN.test(character) || !token.isZh) return { character, reading: null, code: null };
      const reading = token.pinyin;
      try {
        return {
          character,
          reading,
          code: encodeSyllable(parsePinyinSyllable(reading)).code,
        };
      } catch {
        return { character, reading, code: null };
      }
    }),
  );
}

export function firstTypeableIndex(units: CustomPracticeUnit[], after = -1): number {
  for (let index = after + 1; index < units.length; index += 1) {
    if (units[index].code) return index;
  }
  return -1;
}

export function previousTypeableIndex(units: CustomPracticeUnit[], before: number): number {
  for (let index = before - 1; index >= 0; index -= 1) {
    if (units[index].code) return index;
  }
  return -1;
}
