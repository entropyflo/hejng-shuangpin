import { z } from "zod";
import {
  encodeSyllable,
  FLYPY_FINAL_KEYS,
  FLYPY_INITIAL_KEYS,
  FLYPY_ZERO_INITIAL_CODES,
  normalizeFlypyFinal,
  type FlypyFinal,
  type FlypyInitial,
} from "../scheme/flypy";
import { parsePinyinSyllable } from "../scheme/readings";

export const DifficultySchema = z.enum(["basic", "intermediate", "advanced"]);
export type Difficulty = z.infer<typeof DifficultySchema>;

export const GranularitySchema = z.enum(["character", "word", "phrase", "sentence", "paragraph"]);
export type Granularity = z.infer<typeof GranularitySchema>;

const BaseExerciseSchema = z.object({
  id: z.string().min(1),
  knowledgeIds: z.array(z.string().min(1)).min(1),
  prompt: z.string().min(1),
  explanation: z.string().min(1),
  errorHint: z.string().min(1),
  origin: z.enum(["original", "scheme-rule"]),
  difficulty: DifficultySchema,
});

export const ExerciseSchema = z.discriminatedUnion("kind", [
  BaseExerciseSchema.extend({
    kind: z.literal("key-recognition"),
    mappingType: z.enum(["initial", "final"]),
    reading: z.string().min(1),
    expectedKey: z.string().regex(/^[a-z]$/u),
  }),
  BaseExerciseSchema.extend({
    kind: z.literal("reverse-recall"),
    key: z.string().regex(/^[a-z]$/u),
    expectedReadings: z.array(z.string().min(1)).min(1),
  }),
  BaseExerciseSchema.extend({
    kind: z.literal("syllable-composition"),
    initial: z.string(),
    final: z.string().min(1),
    normalizedPinyin: z.string().min(1),
    expectedCode: z.string().regex(/^[a-z]{2}$/u),
  }),
  BaseExerciseSchema.extend({
    kind: z.literal("text-typing"),
    granularity: GranularitySchema,
    text: z.string().min(1),
    readings: z.array(z.string().min(1)).min(1),
    expectedCodes: z.array(z.string().regex(/^[a-z]{2}$/u)).min(1),
  }),
  BaseExerciseSchema.extend({
    kind: z.literal("speed-challenge"),
    text: z.string().min(2),
    readings: z.array(z.string().min(1)).min(1),
    expectedCodes: z.array(z.string().regex(/^[a-z]{2}$/u)).min(1),
    durationSeconds: z.number().int().positive(),
  }),
]);

export type Exercise = z.infer<typeof ExerciseSchema>;
export type ExerciseKind = Exercise["kind"];

export const LessonSchema = z.object({
  id: z.string().min(1),
  day: z.number().int().min(1).max(7),
  title: z.string().min(1),
  summary: z.string().min(1),
  locked: z.literal(false),
  steps: z
    .array(
      z.object({
        kind: z.enum(["guide", "demonstration", "key-practice", "quiz", "mixed-practice"]),
        title: z.string().min(1),
        body: z.string().min(1),
      }),
    )
    .length(5),
  exerciseIds: z.array(z.string().min(1)).min(1),
});

export type Lesson = z.infer<typeof LessonSchema>;

const DISPLAY_FINALS = [
  "a",
  "o",
  "e",
  "i",
  "u",
  "ü",
  "iu",
  "ei",
  "uan",
  "üan",
  "üe",
  "un",
  "ün",
  "uo",
  "ie",
  "ong",
  "iong",
  "ai",
  "en",
  "eng",
  "ang",
  "an",
  "ing",
  "uai",
  "iang",
  "uang",
  "ou",
  "ia",
  "ua",
  "ao",
  "ui",
  "in",
  "iao",
  "ian",
] as const satisfies readonly FlypyFinal[];

const DISPLAY_INITIALS = Object.keys(FLYPY_INITIAL_KEYS) as FlypyInitial[];

const HAN_CHARACTER = /\p{Script=Han}/u;
const ALLOWED_PUNCTUATION = new Set(Array.from("，。、；：？！“”‘’（）—…《》· \u3000"));

export function hanCharacters(text: string): string[] {
  return Array.from(text).filter((character) => HAN_CHARACTER.test(character));
}

function encodeReading(reading: string): string {
  return encodeSyllable(parsePinyinSyllable(reading)).code;
}

function keyExercise(mappingType: "initial" | "final", reading: string, expectedKey: string): Exercise {
  const label = mappingType === "initial" ? "声母" : "韵母";
  return {
    id: `key-${mappingType}-${reading}`,
    kind: "key-recognition",
    mappingType,
    reading,
    expectedKey,
    knowledgeIds: [`${mappingType}.${reading}`],
    prompt: `${label}“${reading}”对应哪个键？`,
    explanation: `${label}“${reading}”在小鹤方案中映射到 ${expectedKey.toUpperCase()} 键。`,
    errorHint: `先定位 ${expectedKey.toUpperCase()} 键，再重新按一次。`,
    origin: "scheme-rule",
    difficulty: "basic",
  };
}

const keyRecognitionExercises: Exercise[] = [
  ...DISPLAY_FINALS.map((final) => keyExercise("final", final, FLYPY_FINAL_KEYS[final])),
  ...DISPLAY_INITIALS.map((initial) => keyExercise("initial", initial, FLYPY_INITIAL_KEYS[initial])),
];

const finalGroups = DISPLAY_FINALS.reduce<Record<string, FlypyFinal[]>>((groups, final) => {
  const key = FLYPY_FINAL_KEYS[final];
  groups[key] ??= [];
  groups[key].push(final);
  return groups;
}, {});

const reverseRecallExercises: Exercise[] = Object.entries(finalGroups).map(([key, finals]) => ({
  id: `reverse-final-${key}`,
  kind: "reverse-recall",
  key,
  expectedReadings: [...finals],
  knowledgeIds: finals.map((final) => `final.${final}`),
  prompt: `${key.toUpperCase()} 键包含哪些韵母？`,
  explanation: `${key.toUpperCase()} 键对应 ${finals.join(" / ")}。共享键位时要结合完整音节判断。`,
  errorHint: `回想与 ${key.toUpperCase()} 键关联的助记组合。`,
  origin: "original",
  difficulty: "intermediate",
}));

type SyllableSeed = {
  pinyin: string;
  initial: string;
  final: string;
  difficulty: Difficulty;
};

const SYLLABLE_SEEDS: SyllableSeed[] = [
  { pinyin: "shuang", initial: "sh", final: "uang", difficulty: "intermediate" },
  { pinyin: "pin", initial: "p", final: "in", difficulty: "basic" },
  { pinyin: "zhong", initial: "zh", final: "ong", difficulty: "basic" },
  { pinyin: "wen", initial: "w", final: "en", difficulty: "basic" },
  { pinyin: "zhi", initial: "zh", final: "i", difficulty: "intermediate" },
  { pinyin: "chi", initial: "ch", final: "i", difficulty: "intermediate" },
  { pinyin: "shi", initial: "sh", final: "i", difficulty: "intermediate" },
  { pinyin: "ju", initial: "j", final: "u", difficulty: "intermediate" },
  { pinyin: "qu", initial: "q", final: "u", difficulty: "intermediate" },
  { pinyin: "xu", initial: "x", final: "u", difficulty: "intermediate" },
  { pinyin: "yu", initial: "y", final: "u", difficulty: "intermediate" },
  { pinyin: "yuan", initial: "y", final: "uan", difficulty: "advanced" },
  { pinyin: "xue", initial: "x", final: "ue", difficulty: "advanced" },
  { pinyin: "lüe", initial: "l", final: "üe", difficulty: "advanced" },
  { pinyin: "chuang", initial: "ch", final: "uang", difficulty: "advanced" },
  { pinyin: "zhuang", initial: "zh", final: "uang", difficulty: "advanced" },
  { pinyin: "hua", initial: "h", final: "ua", difficulty: "intermediate" },
  { pinyin: "guo", initial: "g", final: "uo", difficulty: "basic" },
  { pinyin: "shui", initial: "sh", final: "ui", difficulty: "intermediate" },
  { pinyin: "jiong", initial: "j", final: "iong", difficulty: "advanced" },
  { pinyin: "kuai", initial: "k", final: "uai", difficulty: "advanced" },
  { pinyin: "niao", initial: "n", final: "iao", difficulty: "intermediate" },
  { pinyin: "mian", initial: "m", final: "ian", difficulty: "intermediate" },
];

const zeroInitialSeeds: SyllableSeed[] = (
  Object.keys(FLYPY_ZERO_INITIAL_CODES) as Array<keyof typeof FLYPY_ZERO_INITIAL_CODES>
).map((final) => ({
  pinyin: final,
  initial: "",
  final,
  difficulty: "intermediate" as Difficulty,
}));

const syllableExercises: Exercise[] = [...SYLLABLE_SEEDS, ...zeroInitialSeeds].map((seed) => {
  const code = encodeSyllable({
    initial: seed.initial,
    final: seed.final,
    normalizedPinyin: seed.pinyin,
  }).code;
  const canonicalFinal = normalizeFlypyFinal(seed.initial, seed.final);
  const finalKnowledge = (DISPLAY_FINALS as readonly string[]).includes(canonicalFinal)
    ? [`final.${canonicalFinal}`]
    : [];
  return {
    id: `syllable-${seed.pinyin}`,
    kind: "syllable-composition",
    initial: seed.initial,
    final: seed.final,
    normalizedPinyin: seed.pinyin,
    expectedCode: code,
    knowledgeIds: [seed.initial ? `initial.${seed.initial}` : `zero.${seed.final}`, ...finalKnowledge],
    prompt: `拼音“${seed.pinyin}”的小鹤双拼码是什么？`,
    explanation: seed.initial
      ? `先输入声母“${seed.initial}”的键，再输入韵母“${seed.final}”的键，得到 ${code}。`
      : `这是零声母音节，按小鹤零声母规则输入，得到 ${code}。`,
    errorHint: "把音节拆成声母和韵母，再按顺序检查两码。",
    origin: "scheme-rule",
    difficulty: seed.difficulty,
  };
});

type TextSeed = {
  id: string;
  granularity: Granularity;
  text: string;
  readings: string[];
  difficulty: Difficulty;
};

const TEXT_SEEDS: TextSeed[] = [
  { id: "char-ren", granularity: "character", text: "人", readings: ["ren"], difficulty: "basic" },
  { id: "char-da", granularity: "character", text: "大", readings: ["da"], difficulty: "basic" },
  { id: "char-zhong", granularity: "character", text: "中", readings: ["zhong"], difficulty: "basic" },
  { id: "char-guo", granularity: "character", text: "国", readings: ["guo"], difficulty: "basic" },
  { id: "char-wo", granularity: "character", text: "我", readings: ["wo"], difficulty: "basic" },
  { id: "char-ni", granularity: "character", text: "你", readings: ["ni"], difficulty: "basic" },
  { id: "char-hao", granularity: "character", text: "好", readings: ["hao"], difficulty: "basic" },
  { id: "char-shi", granularity: "character", text: "是", readings: ["shi"], difficulty: "basic" },
  { id: "char-lai", granularity: "character", text: "来", readings: ["lai"], difficulty: "basic" },
  { id: "char-qu", granularity: "character", text: "去", readings: ["qu"], difficulty: "basic" },
  { id: "char-tian", granularity: "character", text: "天", readings: ["tian"], difficulty: "basic" },
  { id: "char-xin", granularity: "character", text: "心", readings: ["xin"], difficulty: "basic" },
  {
    id: "word-zhongguo",
    granularity: "word",
    text: "中国",
    readings: ["zhong", "guo"],
    difficulty: "basic",
  },
  {
    id: "word-xuexi",
    granularity: "word",
    text: "学习",
    readings: ["xue", "xi"],
    difficulty: "basic",
  },
  {
    id: "word-shijian",
    granularity: "word",
    text: "时间",
    readings: ["shi", "jian"],
    difficulty: "basic",
  },
  {
    id: "word-gongzuo",
    granularity: "word",
    text: "工作",
    readings: ["gong", "zuo"],
    difficulty: "basic",
  },
  {
    id: "word-wenti",
    granularity: "word",
    text: "问题",
    readings: ["wen", "ti"],
    difficulty: "basic",
  },
  {
    id: "word-xianzai",
    granularity: "word",
    text: "现在",
    readings: ["xian", "zai"],
    difficulty: "basic",
  },
  {
    id: "word-zhidao",
    granularity: "word",
    text: "知道",
    readings: ["zhi", "dao"],
    difficulty: "basic",
  },
  {
    id: "word-keyi",
    granularity: "word",
    text: "可以",
    readings: ["ke", "yi"],
    difficulty: "basic",
  },
  {
    id: "phrase-shuangpinlianxi",
    granularity: "phrase",
    text: "双拼练习",
    readings: ["shuang", "pin", "lian", "xi"],
    difficulty: "intermediate",
  },
  {
    id: "phrase-shurufangfa",
    granularity: "phrase",
    text: "输入方法",
    readings: ["shu", "ru", "fang", "fa"],
    difficulty: "intermediate",
  },
  {
    id: "phrase-jianpanbuju",
    granularity: "phrase",
    text: "键盘布局",
    readings: ["jian", "pan", "bu", "ju"],
    difficulty: "intermediate",
  },
  {
    id: "phrase-xuexijihua",
    granularity: "phrase",
    text: "学习计划",
    readings: ["xue", "xi", "ji", "hua"],
    difficulty: "intermediate",
  },
  {
    id: "phrase-meitianjinbu",
    granularity: "phrase",
    text: "每天进步",
    readings: ["mei", "tian", "jin", "bu"],
    difficulty: "intermediate",
  },
  {
    id: "sentence-daily-1",
    granularity: "sentence",
    text: "今天我们一起练习双拼。",
    readings: ["jin", "tian", "wo", "men", "yi", "qi", "lian", "xi", "shuang", "pin"],
    difficulty: "advanced",
  },
  {
    id: "sentence-daily-2",
    granularity: "sentence",
    text: "先把每个音节打准。",
    readings: ["xian", "ba", "mei", "ge", "yin", "jie", "da", "zhun"],
    difficulty: "advanced",
  },
  {
    id: "sentence-daily-3",
    granularity: "sentence",
    text: "请打开键盘提示。",
    readings: ["qing", "da", "kai", "jian", "pan", "ti", "shi"],
    difficulty: "advanced",
  },
  {
    id: "sentence-daily-4",
    granularity: "sentence",
    text: "输入完成后检查一遍。",
    readings: ["shu", "ru", "wan", "cheng", "hou", "jian", "cha", "yi", "bian"],
    difficulty: "advanced",
  },
  {
    id: "paragraph-daily-1",
    granularity: "paragraph",
    text: "窗外有风，桌前有光。我们安静地练习，也认真记录每一次进步。",
    readings: [
      "chuang",
      "wai",
      "you",
      "feng",
      "zhuo",
      "qian",
      "you",
      "guang",
      "wo",
      "men",
      "an",
      "jing",
      "di",
      "lian",
      "xi",
      "ye",
      "ren",
      "zhen",
      "ji",
      "lu",
      "mei",
      "yi",
      "ci",
      "jin",
      "bu",
    ],
    difficulty: "advanced",
  },
];

function knowledgeIdForText(seed: TextSeed): string {
  if (seed.granularity === "character") return `char.${seed.text}`;
  if (seed.granularity === "word") return `word.${seed.text}`;
  if (seed.granularity === "phrase") return `phrase.${seed.text}`;
  return `text.${seed.id}`;
}

function describeText(seed: TextSeed, codes: string[]): string {
  if (seed.granularity === "character") {
    const syllable = parsePinyinSyllable(seed.readings[0]);
    const initialLabel = syllable.initial || "零声母";
    return `单字“${seed.text}”读作 ${seed.readings[0]}：声母 ${initialLabel} + 韵母 ${syllable.final}，双拼码 ${codes[0]}。`;
  }
  if (seed.granularity === "word" || seed.granularity === "phrase") {
    return `“${seed.text}”逐字读作 ${seed.readings.join(" ")}，双拼码依次为 ${codes.join(" ")}。`;
  }
  return `共 ${hanCharacters(seed.text).length} 个汉字，标点不计入编码；逐字双拼码依次为 ${codes.join(" ")}。`;
}

function textPrompt(seed: TextSeed): string {
  if (seed.granularity === "character") return `输入单字“${seed.text}”的小鹤双拼码。`;
  if (seed.granularity === "word" || seed.granularity === "phrase") {
    return `输入词语“${seed.text}”的小鹤双拼码。`;
  }
  return `输入${seed.granularity === "sentence" ? "句子" : "段落"}：“${seed.text}”`;
}

function textErrorHint(seed: TextSeed): string {
  if (seed.granularity === "character") return `把“${seed.text}”拆成声母和韵母，再各按一次。`;
  if (seed.granularity === "word" || seed.granularity === "phrase") {
    return "先确认每个字的读音，再逐字连打两码。";
  }
  return "按词读一遍再输入；标点不需要编码。";
}

const textExercises: Exercise[] = TEXT_SEEDS.map((seed) => {
  const codes = seed.readings.map(encodeReading);
  return {
    id: seed.id,
    kind: "text-typing",
    granularity: seed.granularity,
    text: seed.text,
    readings: seed.readings,
    expectedCodes: codes,
    knowledgeIds: [knowledgeIdForText(seed)],
    prompt: textPrompt(seed),
    explanation: describeText(seed, codes),
    errorHint: textErrorHint(seed),
    origin: "original",
    difficulty: seed.difficulty,
  };
});

type SpeedSeed = {
  id: string;
  text: string;
  readings: string[];
  durationSeconds: number;
};

const SPEED_SEEDS: SpeedSeed[] = [
  {
    id: "speed-words",
    text: "清风 明月 双拼 输入",
    readings: ["qing", "feng", "ming", "yue", "shuang", "pin", "shu", "ru"],
    durationSeconds: 60,
  },
  {
    id: "speed-sentence",
    text: "先把每个音节打准，再逐渐提高速度。",
    readings: ["xian", "ba", "mei", "ge", "yin", "jie", "da", "zhun", "zai", "zhu", "jian", "ti", "gao", "su", "du"],
    durationSeconds: 90,
  },
  {
    id: "speed-paragraph",
    text: "稳定不是慢，而是每一次都更准确。",
    readings: ["wen", "ding", "bu", "shi", "man", "er", "shi", "mei", "yi", "ci", "dou", "geng", "zhun", "que"],
    durationSeconds: 180,
  },
];

const speedExercises: Exercise[] = SPEED_SEEDS.map((seed) => {
  const codes = seed.readings.map(encodeReading);
  return {
    id: seed.id,
    kind: "speed-challenge",
    text: seed.text,
    readings: seed.readings,
    expectedCodes: codes,
    durationSeconds: seed.durationSeconds,
    knowledgeIds: ["practice.speed"],
    prompt: `在 ${seed.durationSeconds} 秒内准确输入给定文本。`,
    explanation: `共 ${hanCharacters(seed.text).length} 个汉字；只统计输入法已提交且与目标对齐的汉字，标点不计入 CPM 分子。`,
    errorHint: "先保证准确，遇到错误继续完成，结算后再复盘。",
    origin: "original",
    difficulty: "advanced",
  };
});

export const QUESTION_BANK: Exercise[] = [
  ...keyRecognitionExercises,
  ...reverseRecallExercises,
  ...syllableExercises,
  ...textExercises,
  ...speedExercises,
];

function lessonSteps(topic: string): Lesson["steps"] {
  return [
    { kind: "guide", title: "为什么要学", body: `先理解${topic}在完整双拼音节中的作用。` },
    { kind: "demonstration", title: "看一次拆分", body: `观察${topic}如何从拼音转换为两次按键。` },
    { kind: "key-practice", title: "亲手定位", body: "使用实体键盘完成短组练习，答错后按提示重试。" },
    { kind: "quiz", title: "不看提示回忆", body: "关闭映射提示，完成一组可随时退出的小测。" },
    { kind: "mixed-practice", title: "放进真实组合", body: "把本节知识与已学内容混合，形成稳定节奏。" },
  ];
}

function keyIds(readings: readonly string[], mappingType: "initial" | "final" = "final") {
  return readings.map((reading) => `key-${mappingType}-${reading}`);
}

function idsOf(predicate: (exercise: Exercise) => boolean): string[] {
  return QUESTION_BANK.filter(predicate).map((exercise) => exercise.id);
}

const characterIds = idsOf((exercise) => exercise.kind === "text-typing" && exercise.granularity === "character");
const wordIds = idsOf((exercise) => exercise.kind === "text-typing" && exercise.granularity === "word");
const phraseIds = idsOf((exercise) => exercise.kind === "text-typing" && exercise.granularity === "phrase");
const sentenceIds = idsOf((exercise) => exercise.kind === "text-typing" && exercise.granularity === "sentence");
const paragraphIds = idsOf((exercise) => exercise.kind === "text-typing" && exercise.granularity === "paragraph");
const speedIds = idsOf((exercise) => exercise.kind === "speed-challenge");

export const LESSONS: Lesson[] = [
  {
    id: "day-1",
    day: 1,
    title: "认识双拼与基础韵母",
    summary: "理解声母加韵母的两码节奏，先熟悉 a、o、e、i、u、ü。",
    locked: false,
    steps: lessonSteps("基础韵母"),
    exerciseIds: [...keyIds(["a", "o", "e", "i", "u", "ü"]), "reverse-final-a"],
  },
  {
    id: "day-2",
    day: 2,
    title: "复合韵母与共享键位",
    summary: "学习开口复韵母，理解一个键可以代表多个合法韵母。",
    locked: false,
    steps: lessonSteps("复合韵母"),
    exerciseIds: keyIds(["ai", "ei", "ao", "ou", "ia", "ua", "ie", "üe", "iu", "ui"]),
  },
  {
    id: "day-3",
    day: 3,
    title: "前后鼻韵母",
    summary: "对照 an/ang、en/eng、in/ing，减少形近与音近混淆。",
    locked: false,
    steps: lessonSteps("鼻韵母"),
    exerciseIds: keyIds(["an", "ang", "en", "eng", "in", "ing", "ong", "iong"]),
  },
  {
    id: "day-4",
    day: 4,
    title: "声母、zh/ch/sh 与零声母",
    summary: "普通声母保留原键，三个复合声母使用专门键位，并练习零声母规则。",
    locked: false,
    steps: lessonSteps("声母与零声母"),
    exerciseIds: [
      ...keyIds(DISPLAY_INITIALS, "initial"),
      "syllable-ang",
      "syllable-er",
      "syllable-a",
      "syllable-e",
    ],
  },
  {
    id: "day-5",
    day: 5,
    title: "组合完整音节与常用单字",
    summary: "把声母与韵母合成稳定的双拼码，再用高频单字验证拆分。",
    locked: false,
    steps: lessonSteps("完整音节"),
    exerciseIds: [
      ...syllableExercises.map((exercise) => exercise.id),
      ...characterIds,
    ],
  },
  {
    id: "day-6",
    day: 6,
    title: "词语与真实输入法连打",
    summary: "在输入法提交汉字后判断结果，练习双字词、多字词与连续输入。",
    locked: false,
    steps: lessonSteps("词语连打"),
    exerciseIds: [...wordIds, ...phraseIds, "speed-words"],
  },
  {
    id: "day-7",
    day: 7,
    title: "句段测速与全拼对比",
    summary: "使用同一文本建立双拼基线，速度与正确率分开记录。",
    locked: false,
    steps: lessonSteps("句段测速"),
    exerciseIds: [...sentenceIds, ...paragraphIds, "speed-sentence", "speed-paragraph"],
  },
];

export const CurriculumSchema = z.object({
  contentVersion: z.string().min(1),
  license: z.literal("原创课程数据，仅用于本项目"),
  lessons: z.array(LessonSchema).length(7),
  exercises: z.array(ExerciseSchema).min(1),
});

export type Curriculum = z.infer<typeof CurriculumSchema>;

export const CURRICULUM: Curriculum = CurriculumSchema.parse({
  contentVersion: "s1-v2",
  license: "原创课程数据，仅用于本项目",
  lessons: LESSONS,
  exercises: QUESTION_BANK,
});

export type KnowledgeKind = "initial" | "final" | "zero-initial" | "text";

export type KnowledgeItem = {
  id: string;
  kind: KnowledgeKind;
  label: string;
  guide: string;
};

const knowledgeItems: KnowledgeItem[] = [
  ...DISPLAY_INITIALS.map((initial) => ({
    id: `initial.${initial}`,
    kind: "initial" as const,
    label: `声母 ${initial}`,
    guide: `声母“${initial}”在小鹤方案中对应 ${FLYPY_INITIAL_KEYS[initial].toUpperCase()} 键。`,
  })),
  ...DISPLAY_FINALS.map((final) => ({
    id: `final.${final}`,
    kind: "final" as const,
    label: `韵母 ${final}`,
    guide: `韵母“${final}”在小鹤方案中对应 ${FLYPY_FINAL_KEYS[final].toUpperCase()} 键。`,
  })),
  ...Object.entries(FLYPY_ZERO_INITIAL_CODES).map(([final, code]) => ({
    id: `zero.${final}`,
    kind: "zero-initial" as const,
    label: `零声母 ${final}`,
    guide: `零声母音节“${final}”按小鹤专用规则输入 ${code}。`,
  })),
  ...TEXT_SEEDS.map((seed) => ({
    id: knowledgeIdForText(seed),
    kind: "text" as const,
    label: seed.text,
    guide: describeText(seed, seed.readings.map(encodeReading)),
  })),
  {
    id: "practice.speed",
    kind: "text" as const,
    label: "速度挑战",
    guide: "只统计输入法已提交且与目标对齐的汉字，标点不计入 CPM 分子。",
  },
];

export const KNOWLEDGE_ITEMS: KnowledgeItem[] = knowledgeItems;

const KNOWLEDGE_IDS = new Set(KNOWLEDGE_ITEMS.map((item) => item.id));

export type CurriculumIssueCode =
  | "DUPLICATE_ID"
  | "MISSING_EXERCISE"
  | "INVALID_CODE"
  | "READING_COUNT_MISMATCH"
  | "UNSUPPORTED_READING"
  | "UNKNOWN_KNOWLEDGE"
  | "UNCOVERED_KNOWLEDGE"
  | "DUPLICATE_TEXT"
  | "INVALID_TEXT_CHARACTER";

export type CurriculumIssue = { code: CurriculumIssueCode; id: string };

function hasOnlySupportedCharacters(text: string): boolean {
  return Array.from(text).every(
    (character) => HAN_CHARACTER.test(character) || ALLOWED_PUNCTUATION.has(character),
  );
}

export function inspectCurriculum(curriculum: Curriculum = CURRICULUM): CurriculumIssue[] {
  const issues: CurriculumIssue[] = [];
  const seen = new Set<string>();
  const coveredKnowledge = new Set<string>();
  const seenTexts = new Set<string>();

  for (const exercise of curriculum.exercises) {
    if (seen.has(exercise.id)) issues.push({ code: "DUPLICATE_ID", id: exercise.id });
    seen.add(exercise.id);

    for (const knowledgeId of exercise.knowledgeIds) {
      coveredKnowledge.add(knowledgeId);
      if (!KNOWLEDGE_IDS.has(knowledgeId)) {
        issues.push({ code: "UNKNOWN_KNOWLEDGE", id: `${exercise.id}:${knowledgeId}` });
      }
    }

    if (exercise.kind === "syllable-composition") {
      let actual: string | undefined;
      try {
        actual = encodeSyllable({
          initial: exercise.initial,
          final: exercise.final,
          normalizedPinyin: exercise.normalizedPinyin,
        }).code;
      } catch {
        issues.push({ code: "UNSUPPORTED_READING", id: exercise.id });
      }
      if (actual !== undefined && actual !== exercise.expectedCode) {
        issues.push({ code: "INVALID_CODE", id: exercise.id });
      }
    }

    if (exercise.kind === "text-typing" || exercise.kind === "speed-challenge") {
      const characters = hanCharacters(exercise.text);
      if (characters.length !== exercise.readings.length) {
        issues.push({ code: "READING_COUNT_MISMATCH", id: exercise.id });
      }

      if (!hasOnlySupportedCharacters(exercise.text)) {
        issues.push({ code: "INVALID_TEXT_CHARACTER", id: exercise.id });
      }

      exercise.readings.forEach((reading, index) => {
        let code: string | undefined;
        try {
          code = encodeReading(reading);
        } catch {
          issues.push({ code: "UNSUPPORTED_READING", id: `${exercise.id}:${reading}` });
        }
        if (code !== undefined && code !== exercise.expectedCodes[index]) {
          issues.push({ code: "INVALID_CODE", id: `${exercise.id}:${reading}` });
        }
      });

      if (exercise.kind === "text-typing") {
        const textKey = `${exercise.granularity}:${exercise.text}`;
        if (seenTexts.has(textKey)) issues.push({ code: "DUPLICATE_TEXT", id: exercise.id });
        seenTexts.add(textKey);
      }
    }
  }

  for (const lesson of curriculum.lessons) {
    for (const exerciseId of lesson.exerciseIds) {
      if (!seen.has(exerciseId)) issues.push({ code: "MISSING_EXERCISE", id: `${lesson.id}:${exerciseId}` });
    }
  }

  for (const item of KNOWLEDGE_ITEMS) {
    if (!coveredKnowledge.has(item.id)) {
      issues.push({ code: "UNCOVERED_KNOWLEDGE", id: item.id });
    }
  }

  return issues;
}

export type ExerciseFilter = {
  kind?: ExerciseKind;
  granularity?: Granularity;
  difficulty?: Difficulty;
};

export function filterExercises(filter: ExerciseFilter = {}, curriculum: Curriculum = CURRICULUM): Exercise[] {
  return curriculum.exercises.filter((exercise) => {
    if (filter.kind && exercise.kind !== filter.kind) return false;
    if (filter.difficulty && exercise.difficulty !== filter.difficulty) return false;
    if (filter.granularity) {
      return exercise.kind === "text-typing" && exercise.granularity === filter.granularity;
    }
    return true;
  });
}

export const CURRICULUM_JSON_SCHEMA = z.toJSONSchema(CurriculumSchema, {
  io: "input",
  target: "draft-2020-12",
});
