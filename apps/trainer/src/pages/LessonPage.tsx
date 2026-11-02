import { useEffect } from "react";
import { writeLastLessonId } from "../app/storage";
import { LESSONS, QUESTION_BANK, type Exercise } from "../curriculum/content";
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
