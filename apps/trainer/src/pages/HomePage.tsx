import { readLastLessonId } from "../app/storage";
import { CURRICULUM, KNOWLEDGE_ITEMS, LESSONS } from "../curriculum/content";
import { Link } from "../ui/Link";

const ENTRIES = [
  { to: "/practice", title: "自由训练", body: "按难度抽题，随时开始，不必先选课。" },
  { to: "/keyboard", title: "键位映射", body: "26 个字母键、共享韵母与十二个零声母。" },
  { to: "/stats", title: "学习统计", body: "热力图与 CPM 将在 S3 接入，目前没有数据。" },
  { to: "/settings", title: "设置与修正", body: "切换主题，修改多音字读音并保存在本机。" },
];

export function HomePage() {
  const lessonIds = LESSONS.map((lesson) => lesson.id);
  const lastLessonId = readLastLessonId(window.localStorage, lessonIds);
  const resume = LESSONS.find((lesson) => lesson.id === lastLessonId) ?? LESSONS[0];

  return (
    <>
      <section className="hero">
        <p className="eyebrow">S2 开发中 · 七天路径全部开放</p>
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
            <dt>知识点</dt>
            <dd>{KNOWLEDGE_ITEMS.length} 个</dd>
          </div>
          <div>
            <dt>上次学习</dt>
            <dd>{lastLessonId ? `第 ${resume.day} 天` : "还没有记录"}</dd>
          </div>
        </dl>
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
          {LESSONS.map((lesson) => (
            <li key={lesson.id} className={lesson.id === resume.id ? "is-resume" : undefined}>
              <Link to={`/lesson/${lesson.id}`}>
                <span>第 {lesson.day} 天</span>
                <strong>{lesson.title}</strong>
                <small>
                  {lesson.exerciseIds.length} 道练习
                  {lesson.id === resume.id ? " · 上次学到" : ""}
                </small>
              </Link>
            </li>
          ))}
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
