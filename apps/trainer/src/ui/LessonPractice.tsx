import { useState, type KeyboardEvent } from "react";
import { LESSONS, QUESTION_BANK, type Exercise } from "../curriculum/content";
import {
  buildReverseRecallOptions,
  checkExerciseAnswer,
  expectedAnswer,
  sameFinals,
} from "../curriculum/practice";
import type { FlypyFinal } from "../scheme/flypy";

const KIND_LABEL: Record<Exercise["kind"], string> = {
  "key-recognition": "键位认知",
  "reverse-recall": "反向记忆",
  "syllable-composition": "组合拼读",
  "text-typing": "词句输入",
  "speed-challenge": "速度挑战",
};

const DIFFICULTY_LABEL = {
  basic: "入门",
  intermediate: "进阶",
  advanced: "挑战",
} as const;

type Feedback = { status: "correct" | "wrong" | "revealed" };

function exercisesOf(lessonId: string): Exercise[] {
  const lesson = LESSONS.find((item) => item.id === lessonId);
  if (!lesson) return [];
  return lesson.exerciseIds
    .map((id) => QUESTION_BANK.find((exercise) => exercise.id === id))
    .filter((exercise): exercise is Exercise => Boolean(exercise));
}

export function LessonPractice() {
  const [lessonId, setLessonId] = useState(LESSONS[0].id);
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [selectedOption, setSelectedOption] = useState<FlypyFinal[] | null>(null);
  const [finished, setFinished] = useState(false);

  const lesson = LESSONS.find((item) => item.id === lessonId) ?? LESSONS[0];
  const exercises = exercisesOf(lesson.id);
  const exercise = exercises[Math.min(index, exercises.length - 1)];

  const maxLength =
    exercise.kind === "key-recognition"
      ? 1
      : exercise.kind === "syllable-composition"
        ? 2
        : (expectedAnswer(exercise)?.length ?? 40);

  function reset(nextLessonId = lessonId) {
    setLessonId(nextLessonId);
    setIndex(0);
    setInput("");
    setFeedback(null);
    setSelectedOption(null);
    setFinished(false);
  }

  function submit() {
    if (!exercise || exercise.kind === "speed-challenge") return;
    if (exercise.kind === "reverse-recall") {
      if (!selectedOption) return;
      setFeedback({ status: sameFinals(selectedOption, exercise.expectedReadings) ? "correct" : "wrong" });
      return;
    }
    const result = checkExerciseAnswer(exercise, input);
    setFeedback({ status: result.correct ? "correct" : "wrong" });
  }

  function next() {
    if (index + 1 >= exercises.length) {
      setFinished(true);
      return;
    }
    setIndex(index + 1);
    setInput("");
    setFeedback(null);
    setSelectedOption(null);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      submit();
      return;
    }
    const match = /^Key([A-Z])$/u.exec(event.code);
    if (!match) return;
    event.preventDefault();
    setInput((current) => (current + match[1].toLowerCase()).slice(0, maxLength));
    setFeedback(null);
  }

  return (
    <section className="panel" aria-labelledby="course-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">七天路径 · 全部开放</p>
          <h2 id="course-title">从认键到真实输入</h2>
        </div>
        <p className="panel-note">
          使用实体键盘字母键作答（按物理键位识别）。答错会给出提示，可再试或查看答案。
        </p>
      </div>

      <div className="lesson-tabs" role="tablist" aria-label="选择课程">
        {LESSONS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={item.id === lesson.id}
            className={item.id === lesson.id ? "lesson-tab is-active" : "lesson-tab"}
            onClick={() => reset(item.id)}
          >
            <span>第 {item.day} 天</span>
            <strong>{item.title}</strong>
          </button>
        ))}
      </div>

      <p className="lesson-summary">{lesson.summary}</p>

      <ol className="step-list">
        {lesson.steps.map((step) => (
          <li key={step.kind}>
            <span className="step-kind">{step.title}</span>
            <span className="step-body">{step.body}</span>
          </li>
        ))}
      </ol>

      {finished ? (
        <div className="exercise-card">
          <h3>本课题目已走完</h3>
          <p>这一轮共 {exercises.length} 题。成绩统计与间隔复习在后续阶段接入。</p>
          <button type="button" className="primary" onClick={() => reset()}>
            重新练习本课
          </button>
        </div>
      ) : (
        <div className="exercise-card" aria-live="polite">
          <div className="exercise-meta">
            <span className="badge">{KIND_LABEL[exercise.kind]}</span>
            <span className={`badge badge-${exercise.difficulty}`}>{DIFFICULTY_LABEL[exercise.difficulty]}</span>
            <span className="muted">
              第 {index + 1} / {exercises.length} 题
            </span>
          </div>

          <h3>{exercise.prompt}</h3>

          {exercise.kind === "speed-challenge" ? (
            <div className="speed-preview">
              <p className="speed-text">{exercise.text}</p>
              <p className="muted">
                限时 {exercise.durationSeconds} 秒。计时与 CPM 结算属于 S2，本页只展示题目文本，不伪造成绩。
              </p>
            </div>
          ) : exercise.kind === "reverse-recall" ? (
            <div className="option-grid">
              {buildReverseRecallOptions(exercise).map((option) => {
                const active = selectedOption ? sameFinals(selectedOption, option) : false;
                return (
                  <button
                    key={option.join("-")}
                    type="button"
                    className={active ? "option is-active" : "option"}
                    onClick={() => {
                      setSelectedOption(option);
                      setFeedback(null);
                    }}
                  >
                    {option.join(" / ")}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="answer-row">
              <input
                className="answer-input"
                value={input}
                onChange={(event) => {
                  setInput(event.target.value.toLowerCase().replace(/[^a-z]/gu, "").slice(0, maxLength));
                  setFeedback(null);
                }}
                onKeyDown={handleKeyDown}
                maxLength={maxLength}
                placeholder={exercise.kind === "key-recognition" ? "按一个字母键" : "输入双拼码，例如 ul"}
                aria-label="作答输入"
                autoComplete="off"
                spellCheck={false}
              />
              <button type="button" className="primary" onClick={submit}>
                检查
              </button>
            </div>
          )}

          {feedback ? (
            <div className={`feedback feedback-${feedback.status}`}>
              {feedback.status === "correct" ? <strong>正确</strong> : null}
              {feedback.status === "wrong" ? <strong>还不对</strong> : null}
              {feedback.status === "revealed" ? <strong>参考答案</strong> : null}

              {feedback.status === "correct" ? <p>{exercise.explanation}</p> : null}
              {feedback.status === "wrong" ? (
                <p>
                  {exercise.errorHint}
                  <button type="button" className="link" onClick={() => setFeedback({ status: "revealed" })}>
                    显示答案
                  </button>
                </p>
              ) : null}
              {feedback.status === "revealed" ? (
                <p>
                  正确码为 <code>{expectedAnswer(exercise) ?? exercise.explanation}</code>。{exercise.explanation}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="exercise-footer">
            <span className="muted">知识点：{exercise.knowledgeIds.join("、")}</span>
            <button type="button" className="secondary" onClick={next} disabled={exercise.kind === "speed-challenge"}>
              下一题
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
