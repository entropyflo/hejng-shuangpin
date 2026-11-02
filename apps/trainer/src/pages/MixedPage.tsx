import { useEffect, useState } from "react";
import { CURRICULUM, type Exercise } from "../curriculum/content";
import { getRepository } from "../data";
import { buildMixedExercises } from "../review/mixed";
import { ExerciseRunner } from "../ui/ExerciseRunner";

const LIMIT = 20;

export function MixedPage() {
  const [exercises, setExercises] = useState<Exercise[] | null>(null);
  const [seed, setSeed] = useState(1);
  const [weighted, setWeighted] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getRepository()
      .listAttempts(1000)
      .then((attempts) => {
        if (cancelled) return;
        setExercises(
          weighted
            ? buildMixedExercises({ exercises: CURRICULUM.exercises, attempts, seed: `mixed-${seed}`, limit: LIMIT })
            : buildMixedExercises({ exercises: CURRICULUM.exercises, attempts: [], seed: `random-${seed}`, limit: LIMIT }),
        );
      })
      .catch(() => {
        if (!cancelled) setExercises(buildMixedExercises({ exercises: CURRICULUM.exercises, attempts: [], seed: `mixed-${seed}`, limit: LIMIT }));
      });
    return () => {
      cancelled = true;
    };
  }, [seed, weighted]);

  return (
    <>
      <header className="page-head">
        <p className="eyebrow">混合训练</p>
        <h1 className="page-title">先练薄弱的，再练熟悉的</h1>
        <p className="lede">
          按答错次数、正确率与反应时给题目加权；答错越多、越慢的知识点越容易再次出现。抽题由 seed 决定，可重现。
        </p>
      </header>

      <section className="panel">
        <div className="filter-row" role="group" aria-label="抽题方式">
          <button
            type="button"
            className={weighted ? "chip is-active" : "chip"}
            aria-pressed={weighted}
            onClick={() => setWeighted(true)}
          >
            薄弱加权
          </button>
          <button
            type="button"
            className={weighted ? "chip" : "chip is-active"}
            aria-pressed={!weighted}
            onClick={() => setWeighted(false)}
          >
            完全随机
          </button>
          <button type="button" className="chip" onClick={() => setSeed((current) => current + 1)}>
            换一批
          </button>
          <span className="muted small">seed {seed} · 共 {exercises?.length ?? 0} 题</span>
        </div>

        {exercises === null ? (
          <p className="muted">正在按薄弱度抽题…</p>
        ) : (
          <ExerciseRunner key={`${weighted}-${seed}`} exercises={exercises} scope={`mixed:${weighted ? "weighted" : "random"}:${seed}`} />
        )}
      </section>
    </>
  );
}
