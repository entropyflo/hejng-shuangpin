import { useEffect, useState } from "react";
import { readLastLessonId } from "../app/storage";
import { CURRICULUM, LESSONS } from "../curriculum/content";
import { getRepository } from "../data";
import { buildDailyPlan } from "../review/plan";
import { LESSON_STATUS_LABEL, summarizeLessonProgress, type LessonProgress } from "../review/progress";
import { summarizeActivity, type ActivitySummary } from "../review/activity";
import { starsToText } from "../data/metrics";
import { Link } from "../ui/Link";

const ENTRIES = [
  { to: "/practice", title: "自由训练", body: "按难度抽题，随时开始，不必先选课。" },
  { to: "/keyboard", title: "键位映射", body: "26 个字母键、共享韵母与十二个零声母。" },
  { to: "/stats", title: "学习统计", body: "总览、错题、键位热力图与趋势。" },
  { to: "/texts", title: "自定义文本", body: "粘贴自己的句子，用系统输入法练习。" },
  { to: "/settings", title: "设置与修正", body: "切换主题，修改多音字读音并保存在本机。" },
];

export function HomePage() {
  const lessonIds = LESSONS.map((lesson) => lesson.id);
  const lastLessonId = readLastLessonId(window.localStorage, lessonIds);
  const resume = LESSONS.find((lesson) => lesson.id === lastLessonId) ?? LESSONS[0];
  const [dueCount, setDueCount] = useState<number | null>(null);
  const [progress, setProgress] = useState<Map<string, LessonProgress> | null>(null);
  const [activity, setActivity] = useState<ActivitySummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    const totals = Object.fromEntries(LESSONS.map((lesson) => [lesson.id, lesson.exerciseIds.length]));
    Promise.all([
      getRepository().listDue(Date.now()),
      getRepository().listSessions(200),
      getRepository().listAttempts(2000),
    ])
      .then(([due, sessions, attempts]) => {
        if (cancelled) return;
        setDueCount(due.length);
        setProgress(summarizeLessonProgress(sessions, totals));
        setActivity(summarizeActivity(sessions, attempts));
      })
      .catch(() => {
        if (cancelled) return;
        setDueCount(0);
        setProgress(new Map());
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const plan = buildDailyPlan({ dueCount: dueCount ?? 0, nextLesson: resume });

  return (
    <>
      <section className="hero">
        <p className="eyebrow">七天路径全部开放 · 离线可用</p>
        <h1>沿着鹤径，练成双拼</h1>
        <p className="lede">
          从认键到真实输入，按自己的节奏推进。进度只作参考，不设时间、星级或订阅门槛。
        </p>

        <div className="actions">
          <Link className="primary" to={`/lesson/${resume.id}`}>
            {lastLessonId ? `继续第 ${resume.day} 天` : "从第 1 天开始"}
          </Link>
          <Link className="secondary" to="/practice">
            自由训练
          </Link>
        </div>

        <dl className="stat-row">
          <div>
            <dt>课程</dt>
            <dd>{LESSONS.length} 天</dd>
          </div>
          <div>
            <dt>题目</dt>
            <dd>{CURRICULUM.exercises.length} 道</dd>
          </div>
          <div>
            <dt>学习天数</dt>
            <dd>{activity ? `${activity.studyDays} 天` : "—"}</dd>
          </div>
          <div>
            <dt>XP</dt>
            <dd>{activity ? activity.xp : "—"}</dd>
          </div>
          <div>
            <dt>上次学习</dt>
            <dd>{lastLessonId ? `第 ${resume.day} 天` : "还没有记录"}</dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="plan-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">今日建议</p>
            <h2 id="plan-title">按到期与进度安排</h2>
          </div>
          <span className="status">
            {dueCount === null ? "检查到期…" : dueCount > 0 ? `${dueCount} 个到期` : "无到期复习"}
          </span>
        </div>

        <div className="plan-grid">
          {plan.map((item) => (
            <Link key={item.kind} to={item.to} className={`plan-card plan-${item.kind}`}>
              <span className="plan-kind">
                {item.kind === "review" ? "复习" : item.kind === "lesson" ? "新课" : "混合"}
              </span>
              <strong>{item.title}</strong>
              <span>{item.detail}</span>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="path-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">七天路径</p>
            <h2 id="path-title">从认键到真实输入</h2>
          </div>
          <span className="status">全部可自由进入</span>
        </div>

        <ol className="course-grid">
          {LESSONS.map((lesson) => {
            const state = progress?.get(lesson.id);
            return (
              <li key={lesson.id} className={lesson.id === resume.id ? "is-resume" : undefined}>
                <Link to={`/lesson/${lesson.id}`}>
                  <span>第 {lesson.day} 天</span>
                  <strong>{lesson.title}</strong>
                  <small>
                    {state ? `${LESSON_STATUS_LABEL[state.status]} · ${starsToText(state.bestStars)}` : "未练"}
                    {lesson.id === resume.id ? " · 上次学到" : ""}
                  </small>
                </Link>
              </li>
            );
          })}
        </ol>
      </section>

      <section aria-labelledby="entries-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">其他入口</p>
            <h2 id="entries-title">想练什么就练什么</h2>
          </div>
        </div>
        <div className="entry-grid">
          {ENTRIES.map((entry) => (
            <Link key={entry.to} to={entry.to} className="entry-card">
              <strong>{entry.title}</strong>
              <span>{entry.body}</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
