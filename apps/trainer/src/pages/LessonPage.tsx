import { useEffect } from "react";
import { writeLastLessonId } from "../app/storage";
import { LESSONS, QUESTION_BANK, type Exercise } from "../curriculum/content";
import { FLYPY_ZERO_INITIAL_CODES } from "../scheme/flypy";
import { ExerciseRunner } from "../ui/ExerciseRunner";
import { Link } from "../ui/Link";

export function LessonPage({ lessonId }: { lessonId: string }) {
  const lesson = LESSONS.find((item) => item.id === lessonId);

  useEffect(() => {
    if (lesson) writeLastLessonId(window.localStorage, lesson.id);
  }, [lesson]);

  if (!lesson) {
    return (
      <section className="panel">
        <p className="eyebrow">找不到这一课</p>
        <h1 className="page-title">课时不存在</h1>
        <p className="lede">链接里的课时编号没有对应内容，可能已经调整。</p>
        <Link to="/course" className="primary">
          返回课程列表
        </Link>
      </section>
    );
  }

  const exercises = lesson.exerciseIds
    .map((id) => QUESTION_BANK.find((exercise) => exercise.id === id))
    .filter((exercise): exercise is Exercise => Boolean(exercise));
  const previous = LESSONS[lesson.day - 2];
  const next = LESSONS[lesson.day];

  return (
    <>
      <header className="page-head">
        <p className="eyebrow">
          第 {lesson.day} 天 · 七天课程
        </p>
        <h1 className="page-title">{lesson.title}</h1>
        <p className="lede">{lesson.summary}</p>
        <nav className="lesson-nav" aria-label="课时切换">
          {previous ? (
            <Link to={`/lesson/${previous.id}`} className="secondary">
              ← 第 {previous.day} 天
            </Link>
          ) : (
            <span />
          )}
          <Link to="/course" className="secondary">
            全部课程
          </Link>
          {next ? (
            <Link to={`/lesson/${next.id}`} className="secondary">
              第 {next.day} 天 →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </header>

      {lesson.id === "day-4" ? (
        <section className="panel" aria-labelledby="zero-title">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">速查</p>
              <h2 id="zero-title">十二个零声母</h2>
            </div>
            <p className="panel-note">单韵母双打、双字母取原形、ang/eng 用特码。</p>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">音节</th>
                <th scope="col">双拼码</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(FLYPY_ZERO_INITIAL_CODES).map(([syllable, code]) => (
                <tr key={syllable}>
                  <td>{syllable}</td>
                  <td>
                    <code>{code}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      <section className="panel" aria-labelledby="practice-title">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">本课练习</p>
            <h2 id="practice-title">共 {exercises.length} 题</h2>
          </div>
          <p className="panel-note">
            按下字母立即判定；回车或空格进入下一题。输入法模式只判定已提交的汉字。
          </p>
        </div>
        <ExerciseRunner key={lesson.id} exercises={exercises} scope={`lesson:${lesson.id}`} />
      </section>
    </>
  );
}
