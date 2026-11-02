import { LESSONS } from "../curriculum/content";
import { Link } from "../ui/Link";

export function CoursePage() {
  return (
    <>
      <header className="page-head">
        <p className="eyebrow">七天课程</p>
        <h1 className="page-title">全部课程，随时进入</h1>
        <p className="lede">每天包含导学、演示、按键实操、小测与混合练习；跳过讲解或重复练习都不受限。</p>
      </header>

      <ol className="lesson-list">
        {LESSONS.map((lesson) => (
          <li key={lesson.id}>
            <div className="lesson-list-head">
              <span className="day-badge">第 {lesson.day} 天</span>
              <h2>{lesson.title}</h2>
            </div>
            <p>{lesson.summary}</p>
            <div className="lesson-list-meta">
              <span className="muted">{lesson.exerciseIds.length} 道练习</span>
              <Link to={`/lesson/${lesson.id}`} className="secondary">
                进入第 {lesson.day} 天
              </Link>
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}
