import { useMemo, useState } from "react";
import { filterExercises, type Difficulty } from "../curriculum/content";
import { seededShuffle } from "../curriculum/practice";
import { ExerciseRunner } from "../ui/ExerciseRunner";
import { Link } from "../ui/Link";

const DIFFICULTIES: Array<{ value: Difficulty | "all"; label: string }> = [
  { value: "all", label: "全部" },
  { value: "basic", label: "入门" },
  { value: "intermediate", label: "进阶" },
  { value: "advanced", label: "挑战" },
];

const SAMPLE_SIZE = 20;

export function PracticePage({ focusKey }: { focusKey?: string }) {
  const [difficulty, setDifficulty] = useState<Difficulty | "all">("all");
  const [seed, setSeed] = useState(1);

  const exercises = useMemo(() => {
    const base = filterExercises(difficulty === "all" ? {} : { difficulty });
    const pool = focusKey
      ? base.filter(
          (exercise) =>
            exercise.knowledgeIds.includes(`initial.${focusKey}`) ||
            exercise.knowledgeIds.includes(`final.${focusKey}`) ||
            (exercise.kind === "key-recognition" && exercise.expectedKey === focusKey),
        )
      : base;
    return seededShuffle(pool, `free-${difficulty}-${seed}-${focusKey ?? "all"}`).slice(0, SAMPLE_SIZE);
  }, [difficulty, seed, focusKey]);

  return (
    <>
      <header className="page-head">
        <p className="eyebrow">{focusKey ? "键位专项" : "自由训练"}</p>
        <h1 className="page-title">{focusKey ? `${focusKey.toUpperCase()} 键专项` : "不用选课，直接练"}</h1>
        <p className="lede">
          {focusKey
            ? "只抽与该键相关的题目；答错的知识点会按短间隔回到复习队列。"
            : "按难度从整个题库抽题。抽题结果由 seed 决定，同一个 seed 可以重现同一组题。"}
        </p>
        <div className="actions">
          {focusKey ? (
            <Link to="/practice" className="secondary">
              返回全部练习
            </Link>
          ) : null}
          <Link to="/mixed" className="secondary">
            混合训练
          </Link>
          <Link to="/texts" className="secondary">
            自定义文本
          </Link>
        </div>
      </header>

      <section className="panel">
        <div className="filter-row" role="group" aria-label="难度筛选">
          {DIFFICULTIES.map((item) => (
            <button
              key={item.value}
              type="button"
              className={difficulty === item.value ? "chip is-active" : "chip"}
              aria-pressed={difficulty === item.value}
              onClick={() => {
                setDifficulty(item.value);
                setSeed(1);
              }}
            >
              {item.label}
            </button>
          ))}
          <button type="button" className="chip" onClick={() => setSeed((current) => current + 1)}>
            换一批
          </button>
          <span className="muted small">
            seed {seed} · 共 {exercises.length} 题
          </span>
        </div>

        <ExerciseRunner
          key={`${difficulty}-${seed}-${focusKey ?? "all"}`}
          exercises={exercises}
          scope={`free:${difficulty}:${seed}:${focusKey ?? "all"}`}
        />
      </section>
    </>
  );
}
