import { useEffect, useState } from "react";
import type { Exercise } from "../curriculum/content";
import { getRepository } from "../data";
import { buildReviewExercises } from "../review/plan";
import { ExerciseRunner } from "../ui/ExerciseRunner";
import { Link } from "../ui/Link";

type ReviewState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; exercises: Exercise[]; dueCount: number };

export function ReviewPage() {
  const [state, setState] = useState<ReviewState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const due = await getRepository().listDue(Date.now());
        if (cancelled) return;
        setState({ status: "ready", exercises: buildReviewExercises(due), dueCount: due.length });
      } catch {
        if (!cancelled) setState({ status: "error" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <header className="page-head">
        <p className="eyebrow">间隔复习</p>
        <h1 className="page-title">到期内容，先巩固</h1>
        <p className="lede">
          队列按到期时间排序，最多 15 题。答错的知识点会在约 10 分钟后重新到期；全部课程仍然自由开放。
        </p>
      </header>

      {state.status === "loading" ? (
        <section className="panel">
          <p className="muted">正在读取到期队列…</p>
        </section>
      ) : state.status === "error" ? (
        <section className="panel">
          <p className="error-text">无法读取本机数据库，请确认浏览器允许 IndexedDB。</p>
        </section>
      ) : state.exercises.length === 0 ? (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">队列为空</p>
              <h2>目前没有到期复习</h2>
            </div>
            <p className="panel-note">
              首次练习后，知识点会按表现安排在 1 天、3 天或更久之后到期；答错的会先短间隔回到队列。
            </p>
          </div>
          <div className="actions">
            <Link to="/lesson/day-1" className="primary">
              去上课
            </Link>
            <Link to="/practice" className="secondary">
              自由训练
            </Link>
          </div>
        </section>
      ) : (
        <section className="panel" aria-labelledby="review-title">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">今日队列</p>
              <h2 id="review-title">
                {state.dueCount} 个到期知识点 · {state.exercises.length} 题
              </h2>
            </div>
            <p className="panel-note">复习成绩同样计入统计与掌握度。</p>
          </div>
          <ExerciseRunner
            key={state.exercises.map((exercise) => exercise.id).join(",")}
            exercises={state.exercises}
            scope="review"
          />
        </section>
      )}
    </>
  );
}
