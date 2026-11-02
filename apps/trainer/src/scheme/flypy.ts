export type FlypyInitial = keyof typeof FLYPY_INITIAL_KEYS;
export type FlypyFinal = keyof typeof FLYPY_FINAL_KEYS;

export type Syllable = {
  initial: string;
  final: string;
  normalizedPinyin: string;
};

export type EncodeResult = {
  code: string;
  normalizedPinyin: string;
  ruleId: string;
  warnings: string[];
};

export type FlypyEncodingErrorCode =
  | "UNSUPPORTED_ZERO_INITIAL"
  | "UNSUPPORTED_INITIAL"
  | "UNSUPPORTED_FINAL";

export class FlypyEncodingError extends Error {
  constructor(
    readonly code: FlypyEncodingErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "FlypyEncodingError";
  }
}

export const FLYPY_SPECIAL_INITIAL_KEYS = {
  zh: "v",
  ch: "i",
  sh: "u",
} as const;

export const FLYPY_INITIAL_KEYS = {
  b: "b",
  p: "p",
  m: "m",
  f: "f",
  d: "d",
  t: "t",
  n: "n",
  l: "l",
  g: "g",
  k: "k",
  h: "h",
  j: "j",
  q: "q",
  x: "x",
  zh: "v",
  ch: "i",
  sh: "u",
  r: "r",
  z: "z",
  c: "c",
  s: "s",
  y: "y",
  w: "w",
} as const;

export const FLYPY_FINAL_KEYS = {
  a: "a",
  o: "o",
  e: "e",
  i: "i",
  u: "u",
  ü: "v",
  v: "v",
  iu: "q",
  ei: "w",
  uan: "r",
  üan: "r",
  van: "r",
  üe: "t",
  ue: "t",
  ve: "t",
  un: "y",
  ün: "y",
  vn: "y",
  uo: "o",
  ie: "p",
  ong: "s",
  iong: "s",
  ai: "d",
  en: "f",
  eng: "g",
  ang: "h",
  an: "j",
  ing: "k",
  uai: "k",
  iang: "l",
  uang: "l",
  ou: "z",
  ia: "x",
  ua: "x",
  ao: "c",
  ui: "v",
  in: "b",
  iao: "n",
  ian: "m",
} as const;

export const FLYPY_ZERO_INITIAL_CODES = {
  a: "aa",
  o: "oo",
  e: "ee",
  ai: "ai",
  ei: "ei",
  ao: "ao",
  ou: "ou",
  an: "an",
  en: "en",
  er: "er",
  ang: "ah",
  eng: "eg",
} as const;

export const FLYPY_SCHEME_SOURCES = [
  {
    id: "flypy-official-home",
    url: "https://flypy.cc/",
    role: "primary",
    supports: "小鹤方案身份、声韵二码原则、官方键位图与零声母章节",
  },
  {
    id: "shuangpin-layout",
    url: "https://shuangpin.app/layout/",
    role: "cross-check",
    supports: "可检索键位文本和 shuang/pin/zhong/wen 示例",
  },
  {
    id: "rime-double-pinyin-flypy",
    url: "https://github.com/rime/rime-double-pinyin/blob/master/double_pinyin_flypy.schema.yaml",
    role: "implementation-cross-check",
    supports: "可执行代数规则，逐项覆盖复合声母、韵母、零声母变换与 ü/v 显示",
  },
  {
    id: "apple-shuangpin-layouts",
    url: "https://support.apple.com/zh-cn/guide/chinese-input-method/cimc29a772a9/mac",
    role: "platform-cross-check",
    supports: "macOS 官方确认内置独立的小鹤双拼布局并展示键盘图",
  },
] as const;

function hasOwn<T extends object>(value: T, key: PropertyKey): key is keyof T {
  return Object.prototype.hasOwnProperty.call(value, key);
}

const PINYIN_CHAR_NORMALIZATION: Record<string, string> = {
  ā: "a",
  á: "a",
  ǎ: "a",
  à: "a",
  ē: "e",
  é: "e",
  ě: "e",
  è: "e",
  ī: "i",
  í: "i",
  ǐ: "i",
  ì: "i",
  ō: "o",
  ó: "o",
  ǒ: "o",
  ò: "o",
  ū: "u",
  ú: "u",
  ǔ: "u",
  ù: "u",
  ǖ: "ü",
  ǘ: "ü",
  ǚ: "ü",
  ǜ: "ü",
  v: "ü",
};

export function normalizePinyinPart(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/u:/g, "ü")
    .replace(/[1-5]$/u, "")
    .replace(/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜv]/gu, (character) => PINYIN_CHAR_NORMALIZATION[character]);
}

export function normalizeFlypyFinal(initial: string, value: string): string {
  let final = normalizePinyinPart(value);

  if (["j", "q", "x", "y"].includes(initial) && final.startsWith("u")) {
    final = `ü${final.slice(1)}`;
  }

  if (final === "iou") return "iu";
  if (final === "uei") return "ui";
  if (final === "uen") return "un";

  return final;
}

export function encodeSyllable(syllable: Syllable): EncodeResult {
  const initial = normalizePinyinPart(syllable.initial);
  const final = normalizeFlypyFinal(initial, syllable.final);
  const normalizedPinyin = `${initial}${final}`;

  if (initial === "") {
    if (!hasOwn(FLYPY_ZERO_INITIAL_CODES, final)) {
      throw new FlypyEncodingError("UNSUPPORTED_ZERO_INITIAL", `不支持的零声母音节：${final}`);
    }

    return {
      code: FLYPY_ZERO_INITIAL_CODES[final],
      normalizedPinyin: final,
      ruleId: `flypy.zero-initial.${final}`,
      warnings: [],
    };
  }

  if (!hasOwn(FLYPY_INITIAL_KEYS, initial)) {
    throw new FlypyEncodingError("UNSUPPORTED_INITIAL", `不支持的声母：${syllable.initial}`);
  }

  if (!hasOwn(FLYPY_FINAL_KEYS, final)) {
    throw new FlypyEncodingError("UNSUPPORTED_FINAL", `不支持的韵母：${syllable.final}`);
  }

  return {
    code: `${FLYPY_INITIAL_KEYS[initial]}${FLYPY_FINAL_KEYS[final]}`,
    normalizedPinyin,
    ruleId: `flypy.initial.${initial}+final.${final}`,
    warnings: [],
  };
}

