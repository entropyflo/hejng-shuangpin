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
  | "ZERO_INITIAL_NOT_IMPLEMENTED"
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

export function encodeSyllable(syllable: Syllable): EncodeResult {
  const initial = syllable.initial.toLowerCase();
  const final = syllable.final.toLowerCase();

  if (initial === "") {
    throw new FlypyEncodingError(
      "ZERO_INITIAL_NOT_IMPLEMENTED",
      "零声母规则由 SCH-002 实现；SCH-001 不猜测编码。",
    );
  }

  if (!hasOwn(FLYPY_INITIAL_KEYS, initial)) {
    throw new FlypyEncodingError("UNSUPPORTED_INITIAL", `不支持的声母：${syllable.initial}`);
  }

  if (!hasOwn(FLYPY_FINAL_KEYS, final)) {
    throw new FlypyEncodingError("UNSUPPORTED_FINAL", `不支持的韵母：${syllable.final}`);
  }

  return {
    code: `${FLYPY_INITIAL_KEYS[initial]}${FLYPY_FINAL_KEYS[final]}`,
    normalizedPinyin: syllable.normalizedPinyin,
    ruleId: `flypy.initial.${initial}+final.${final}`,
    warnings: [],
  };
}

