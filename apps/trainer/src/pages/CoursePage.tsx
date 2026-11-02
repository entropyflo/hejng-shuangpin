import { useEffect, useState } from "react";
import { getRepository } from "../data";
import { starsToText } from "../data/metrics";
import { LESSONS } from "../curriculum/content";
import { LESSON_STATUS_LABEL, summarizeLessonProgress, type LessonProgress } from "../review/progress";
import { Link } from "../ui/Link";

const DATE_FORMAT = new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit" });

const TOTALS = Object.fromEntries(LESSONS.map((lesson) => [lesson.id, lesson.exerciseIds.length]));

export function CoursePage() {
  const [progress, setProgress] = useState<Map<string, LessonProgress> | null>(null);

  useEffect(() => {
    let cancelled = false;
    getRepository()
      .listSessions(200)
      .then((sessions) => {
        if (!cancelled) setProgress(summarizeLessonProgress(sessions, TOTALS));
      })
      .catch(() => {
        if (!cancelled) setProgress(new Map());
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <header className="page-head">
        <p className="eyebrow">七天课程</p>
        <h1 className="page-title">全部课程，随时进入</h1>
        <p className="lede">每天包含导学、演示、按键实操、小测与混合练习；跳过讲解或重复练习都不受限。</p>
      </header>

      <ol className="lesson-list">
        {LESSONS.map((lesson) => {
          const state = progress?.get(lesson.id);
          return (
            <li key={lesson.id}>
              <div className="lesson-list-head">
                <span className="day-badge">第 {lesson.day} 天</span>
                <h2>{lesson.title}</h2>
                <span className={state?.status === "completed" ? "badge badge-confirmed" : "badge"}>
                  {state ? LESSON_STATUS_LABEL[state.status] : "未练"}
                </span>
              </div>
              <p>{lesson.summary}</p>
              <div className="lesson-list-meta">
                <span className="muted small">
                  {lesson.exerciseIds.length} 道练习
                  {state ? (
                    <>
                      {" · 最佳 "}
                      <span className="stars">{starsToText(state.bestStars)}</span>
                      {state.lastAt !== null ? (
                        <>
                          {" · 最近 "}
                          {DATE_FORMAT.format(new Date(state.lastAt))} ·{" "}
                          {Math.round((state.lastAccuracy ?? 0) * 100)}%
                        </>
                      ) : null}
                    </>
                  ) : (
                    " · 还没有记录"
                  )}
                </span>
                <Link to={`/lesson/${lesson.id}`} className="secondary">
                  进入第 {lesson.day} 天
                </Link>
              </div>
            </li>
          );
        })}
      </ol>
    </>
  );
}
