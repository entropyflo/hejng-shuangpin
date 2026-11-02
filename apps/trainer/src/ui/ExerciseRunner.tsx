import { useEffect, useState, type KeyboardEvent } from "react";
import {
  HINT_LABEL,
  INPUT_LABEL,
  readCorrectionMode,
  readHintMode,
  readInputMode,
  resolveCorrection,
  shouldShowHint,
  writeInputMode,
  type InputMode,
} from "../app/settings";
import type { Exercise } from "../curriculum/content";
import {
  buildReverseRecallOptions,
  checkExerciseAnswer,
  expectedAnswer,
  expectedKeySequence,
  sameFinals,
} from "../curriculum/practice";
import type { FlypyFinal } from "../scheme/flypy";
import { HintKeyboard } from "./HintKeyboard";
import { ImePractice } from "./ImePractice";
import { SpeedChallenge } from "./SpeedChallenge";

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

export function ExerciseRunner({ exercises }: { exercises: Exercise[] }) {
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [selectedOption, setSelectedOption] = useState<FlypyFinal[] | null>(null);
  const [finished, setFinished] = useState(false);
  const [hintMode] = useState(() => readHintMode(window.localStorage));
  const [correctionMode] = useState(() => readCorrectionMode(window.localStorage));
  const [streak, setStreak] = useState(0);
  const [flashKey, setFlashKey] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [inputMode, setInputMode] = useState(() => readInputMode(window.localStorage));

  useEffect(() => {
    if (!flashKey) return;
    const timer = window.setTimeout(() => setFlashKey(null), 1200);
    return () => window.clearTimeout(timer);
  }, [flashKey]);

  if (exercises.length === 0) {
    return <p className="muted">当前筛选下没有题目，换一个难度试试。</p>;
  }

  const exercise = exercises[Math.min(index, exercises.length - 1)];
  const maxLength =
    exercise.kind === "key-recognition"
      ? 1
      : exercise.kind === "syllable-composition"
        ? 2
        : (expectedAnswer(exercise)?.length ?? 40);
  const sequence = expectedKeySequence(exercise);
  const behavior = resolveCorrection(correctionMode, exercise.kind);
  const showKeyboard = sequence.length > 0 && (shouldShowHint(hintMode, streak) || flashKey !== null);
  const useIme = inputMode === "ime" && exercise.kind === "text-typing";

  function changeInputMode(mode: InputMode) {
    setInputMode(mode);
    writeInputMode(window.localStorage, mode);
    setInput("");
    setFeedback(null);
    setLocked(false);
  }

  function flashNextKey() {
    const next = sequence[input.length] ?? sequence[0];
    if (next) setFlashKey(next);
  }

  function submit() {
    if (exercise.kind === "speed-challenge") return;

    if (exercise.kind === "reverse-recall") {
      if (!selectedOption) return;
      const correct = sameFinals(selectedOption, exercise.expectedReadings);
      setFeedback({ status: correct ? "correct" : "wrong" });
      setStreak(correct ? streak + 1 : 0);
      setLocked(!correct && behavior === "strict");
      return;
    }

    const result = checkExerciseAnswer(exercise, input);
    setFeedback({ status: result.correct ? "correct" : "wrong" });
    if (result.correct) {
      setStreak(streak + 1);
      setLocked(false);
      return;
    }

    setStreak(0);
    flashNextKey();
    if (behavior === "strict") {
      setLocked(true);
      setInput("");
    }
  }

  function next() {
    if (locked) return;
    if (index + 1 >= exercises.length) {
      setFinished(true);
      return;
    }
    setIndex(index + 1);
    setInput("");
    setFeedback(null);
    setSelectedOption(null);
    setFlashKey(null);
    setLocked(false);
  }

  function restart() {
    setIndex(0);
    setInput("");
    setFeedback(null);
    setSelectedOption(null);
    setFlashKey(null);
    setLocked(false);
    setStreak(0);
    setFinished(false);
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

  if (finished) {
    return (
      <div className="exercise-card">
        <h3>本轮完成</h3>
        <p>共 {exercises.length} 题。成绩统计、错题本与间隔复习在 S3 接入。</p>
        <button type="button" className="primary" onClick={restart}>
          再来一轮
        </button>
      </div>
    );
  }

  return (
    <div className="exercise-card" aria-live="polite">
      <div className="exercise-meta">
        <span className="badge">{KIND_LABEL[exercise.kind]}</span>
        <span className={`badge badge-${exercise.difficulty}`}>{DIFFICULTY_LABEL[exercise.difficulty]}</span>
        <span className="muted">
          第 {index + 1} / {exercises.length} 题
        </span>
      </div>

      <h3>{useIme ? `用系统中文输入法输入：“${exercise.text}”` : exercise.prompt}</h3>

      {exercise.kind === "text-typing" ? (
        <div className="filter-row mode-row" role="group" aria-label="输入方式">
          {(["key", "ime"] as InputMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              className={inputMode === mode ? "chip is-active" : "chip"}
              aria-pressed={inputMode === mode}
              onClick={() => changeInputMode(mode)}
            >
              {INPUT_LABEL[mode]}
            </button>
          ))}
        </div>
      ) : null}

      {exercise.kind === "speed-challenge" ? (
        <SpeedChallenge text={exercise.text} durationSeconds={exercise.durationSeconds} />
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
      ) : useIme ? (
        <ImePractice text={exercise.text} />
      ) : (
        <>
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

          {showKeyboard ? (
            <HintKeyboard sequence={sequence} progress={input.length} flashKey={flashKey} />
          ) : null}
        </>
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
              {locked ? " 严格纠错已开启：按对正确键后才能进入下一题。" : null}
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
        <span className="muted small">
          知识点：{exercise.knowledgeIds.join("、")} ·{" "}
          {useIme ? "输入法模式：按已提交文本判定" : `提示：${HINT_LABEL[hintMode]} · 纠错：${behavior === "strict" ? "严格" : "连续"}`}
        </span>
        <button type="button" className="secondary" onClick={next} disabled={locked}>
          下一题
        </button>
      </div>
    </div>
  );
}
