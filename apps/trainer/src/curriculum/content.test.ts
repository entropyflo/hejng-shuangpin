import { describe, expect, it } from "vitest";
import { FLYPY_FINAL_KEYS, FLYPY_INITIAL_KEYS, FLYPY_ZERO_INITIAL_CODES } from "../scheme/flypy";
import {
  CURRICULUM,
  CURRICULUM_JSON_SCHEMA,
  CurriculumSchema,
  filterExercises,
  hanCharacters,
  inspectCurriculum,
  KNOWLEDGE_ITEMS,
  sanitizePracticeText,
  type Curriculum,
} from "./content";

function cloneCurriculum(): Curriculum {
  return structuredClone(CURRICULUM);
}

function issuesOf(curriculum: Curriculum) {
  return inspectCurriculum(curriculum).map((issue) => issue.code);
}

function findTextExercise(curriculum: Curriculum, id: string) {
  const exercise = curriculum.exercises.find((item) => item.id === id);
  if (!exercise || exercise.kind !== "text-typing") throw new Error(`找不到文本题 ${id}`);
  return exercise;
}

describe("CUR-001 七天原创课程", () => {
  it("恰好包含 7 天且冷启动全部开放", () => {
    expect(CURRICULUM.lessons.map((lesson) => lesson.day)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(CURRICULUM.lessons.every((lesson) => lesson.locked === false)).toBe(true);
  });

  it("每天都有导学、演示、实操、小测和混合训练", () => {
    for (const lesson of CURRICULUM.lessons) {
      expect(lesson.steps.map((step) => step.kind)).toEqual([
        "guide",
        "demonstration",
        "key-practice",
        "quiz",
        "mixed-practice",
      ]);
    }
  });

  it("课程明确标记为本项目原创内容", () => {
    expect(CURRICULUM.license).toBe("原创课程数据，仅用于本项目");
    expect(CURRICULUM.contentVersion).toBe("s1-v2");
  });

  it("七天合计覆盖全部五种题型", () => {
    const referenced = new Set(
      CURRICULUM.lessons.flatMap((lesson) => lesson.exerciseIds),
    );
    const kinds = new Set(
      CURRICULUM.exercises.filter((exercise) => referenced.has(exercise.id)).map((exercise) => exercise.kind),
    );
    expect(kinds).toEqual(
      new Set(["key-recognition", "reverse-recall", "syllable-composition", "text-typing", "speed-challenge"]),
    );
  });
});

describe("CUR-001 分层题库", () => {
  it("单字、双字词、多字词、短句、段落五层都有原创题目", () => {
    const granularities = new Set(
      CURRICULUM.exercises
        .filter((exercise) => exercise.kind === "text-typing")
        .map((exercise) => exercise.granularity),
    );
    expect(granularities).toEqual(new Set(["character", "word", "phrase", "sentence", "paragraph"]));
  });

  it("每道文本题的字数、读音和双拼码一一对应", () => {
    for (const exercise of CURRICULUM.exercises) {
      if (exercise.kind !== "text-typing") continue;
      expect(hanCharacters(exercise.text).length).toBe(exercise.readings.length);
      expect(exercise.expectedCodes.length).toBe(exercise.readings.length);
      for (const code of exercise.expectedCodes) expect(code).toMatch(/^[a-z]{2}$/u);
    }
  });

  it("可以按难度和练习类型筛选", () => {
    const characters = filterExercises({ granularity: "character" });
    expect(characters.length).toBeGreaterThan(0);
    expect(
      characters.every((exercise) => exercise.kind === "text-typing" && exercise.granularity === "character"),
    ).toBe(true);

    const advanced = filterExercises({ difficulty: "advanced" });
    expect(advanced.length).toBeGreaterThan(0);
    expect(advanced.every((exercise) => exercise.difficulty === "advanced")).toBe(true);

    const speed = filterExercises({ kind: "speed-challenge" });
    expect(speed.length).toBe(3);
    expect(filterExercises({ granularity: "paragraph", difficulty: "basic" })).toEqual([]);
  });

  it("三个难度层级都有内容", () => {
    const levels = new Set(CURRICULUM.exercises.map((exercise) => exercise.difficulty));
    expect(levels).toEqual(new Set(["basic", "intermediate", "advanced"]));
  });
});

describe("CUR-002 题库质量", () => {
  it("所有展示声母和韵母都有认键题", () => {
    const keyExercises = CURRICULUM.exercises.filter(
      (exercise): exercise is Extract<(typeof CURRICULUM.exercises)[number], { kind: "key-recognition" }> =>
        exercise.kind === "key-recognition",
    );
    const coveredInitials = new Set(
      keyExercises
        .filter((exercise) => exercise.mappingType === "initial")
        .map((exercise) => exercise.reading),
    );
    const coveredFinals = new Set(
      keyExercises
        .filter((exercise) => exercise.mappingType === "final")
        .map((exercise) => exercise.reading),
    );
    expect(coveredInitials).toEqual(new Set(Object.keys(FLYPY_INITIAL_KEYS)));
    expect(coveredFinals).toEqual(
      new Set(Object.keys(FLYPY_FINAL_KEYS).filter((reading) => !["v", "van", "ve", "vn", "ue"].includes(reading))),
    );
  });

  it("十二个零声母都有例题", () => {
    const zeroExercises = CURRICULUM.exercises.filter(
      (exercise): exercise is Extract<(typeof CURRICULUM.exercises)[number], { kind: "syllable-composition" }> =>
        exercise.kind === "syllable-composition" && exercise.initial === "",
    );
    expect(new Set(zeroExercises.map((exercise) => exercise.final))).toEqual(
      new Set(Object.keys(FLYPY_ZERO_INITIAL_CODES)),
    );
  });

  it("每个知识点都有讲解且被至少一道题覆盖", () => {
    for (const item of KNOWLEDGE_ITEMS) {
      expect(item.guide.length).toBeGreaterThan(0);
      expect(item.label.length).toBeGreaterThan(0);
    }
    expect(inspectCurriculum(CURRICULUM)).toEqual([]);
  });

  it("每题都有知识点、解释和错误提示", () => {
    for (const exercise of CURRICULUM.exercises) {
      expect(exercise.knowledgeIds.length).toBeGreaterThan(0);
      expect(exercise.explanation.length).toBeGreaterThan(0);
      expect(exercise.errorHint.length).toBeGreaterThan(0);
    }
  });

  it("schema 拒绝锁关和缺少错误提示的坏题", () => {
    const invalid = cloneCurriculum() as unknown as {
      lessons: Array<Record<string, unknown>>;
      exercises: Array<Record<string, unknown>>;
    };
    invalid.lessons[0].locked = true;
    delete invalid.exercises[0].errorHint;
    expect(CurriculumSchema.safeParse(invalid).success).toBe(false);
  });

  it("筛查能识别重复 ID、错误答案和缺题引用", () => {
    const duplicateId = cloneCurriculum();
    duplicateId.exercises[1].id = duplicateId.exercises[0].id;
    expect(issuesOf(duplicateId)).toContain("DUPLICATE_ID");

    const wrongCode = cloneCurriculum();
    const target = findTextExercise(wrongCode, "word-zhongguo");
    target.expectedCodes[0] = target.expectedCodes[0] === "zz" ? "zy" : "zz";
    expect(issuesOf(wrongCode)).toContain("INVALID_CODE");

    const missing = cloneCurriculum();
    missing.lessons[0].exerciseIds.push("ghost-exercise");
    expect(issuesOf(missing)).toContain("MISSING_EXERCISE");
  });

  it("筛查能识别读音数量不符、未知读音和未知知识点", () => {
    const mismatch = cloneCurriculum();
    findTextExercise(mismatch, "word-xuexi").readings.push("xi");
    expect(issuesOf(mismatch)).toContain("READING_COUNT_MISMATCH");

    const unknownReading = cloneCurriculum();
    const broken = unknownReading.exercises.find((exercise) => exercise.kind === "syllable-composition");
    if (!broken || broken.kind !== "syllable-composition") throw new Error("缺少音节题");
    broken.final = "zzz";
    expect(issuesOf(unknownReading)).toContain("UNSUPPORTED_READING");

    const unknownKnowledge = cloneCurriculum();
    unknownKnowledge.exercises[0].knowledgeIds = ["ghost.knowledge"];
    expect(issuesOf(unknownKnowledge)).toContain("UNKNOWN_KNOWLEDGE");
  });

  it("筛查能识别重复文本、非法字符和未覆盖知识点", () => {
    const duplicateText = cloneCurriculum();
    findTextExercise(duplicateText, "char-da").text = "人";
    expect(issuesOf(duplicateText)).toContain("DUPLICATE_TEXT");

    const invalidCharacter = cloneCurriculum();
    findTextExercise(invalidCharacter, "char-ren").text = "人a";
    expect(issuesOf(invalidCharacter)).toContain("INVALID_TEXT_CHARACTER");

    const uncovered = cloneCurriculum();
    uncovered.exercises = uncovered.exercises.filter((exercise) => exercise.id !== "key-initial-b");
    expect(issuesOf(uncovered)).toContain("UNCOVERED_KNOWLEDGE");
  });

  it("导出可序列化的 JSON Schema", () => {
    expect(CURRICULUM_JSON_SCHEMA).toMatchObject({ $schema: expect.stringContaining("2020-12") });
    expect(() => JSON.stringify(CURRICULUM_JSON_SCHEMA)).not.toThrow();
    const serialized = JSON.stringify(CURRICULUM_JSON_SCHEMA);
    expect(serialized).toContain("contentVersion");
    expect(serialized).toContain("text-typing");
  });
});

describe("练习文本清洗", () => {
  it("保留汉字、允许的标点与空格，去掉拉丁字母和换行", () => {
    expect(sanitizePracticeText("中国 abc，你好。\n第二行")).toBe("中国 ，你好。第二行");
  });

  it("按长度截断", () => {
    expect(sanitizePracticeText("一二三四五", 3)).toBe("一二三");
  });

  it("纯非法字符返回空串", () => {
    expect(sanitizePracticeText("abc123")).toBe("");
  });
});
