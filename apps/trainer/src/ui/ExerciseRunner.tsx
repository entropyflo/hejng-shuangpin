import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { usePreferences } from "../app/preferences";
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
  insertRetry,
  normalizeCodeInput,
  retryOffset,
  sameFinals,
} from "../curriculum/practice";
import { getRepository } from "../data";
import { computeCpm, starsToText } from "../data/metrics";
import { buildSession, newSessionId } from "../data/recorder";
import { createMastery, reviewMastery } from "../data/scheduler";
import type { Attempt, PracticeSession } from "../data/types";
import type { FlypyFinal } from "../scheme/flypy";
import { playFeedback } from "./feedbackSound";
import { HintKeyboard } from "./HintKeyboard";
import { ImePractice } from "./ImePractice";
import { Link } from "./Link";
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

export function ExerciseRunner({ exercises, scope }: { exercises: Exercise[]; scope: string }) {
  const [index, setIndex] = useState(0);
  const [queue, setQueue] = useState<Exercise[]>(() => [...exercises]);
  const retriedRef = useRef<Set<string>>(new Set());
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
  const [summary, setSummary] = useState<PracticeSession | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { sound } = usePreferences();

  const sessionIdRef = useRef(newSessionId());
  const sessionStartRef = useRef(Date.now());
  const questionStartRef = useRef(Date.now());
  const attemptsRef = useRef<Attempt[]>([]);
  const cpmRef = useRef<number | null>(null);

  useEffect(() => {
    if (!flashKey) return;
    const timer = window.setTimeout(() => setFlashKey(null), 1200);
    return () => window.clearTimeout(timer);
  }, [flashKey]);

  if (queue.length === 0) {
    return <p className="muted">当前筛选下没有题目，换一个难度试试。</p>;
  }

  const exercise = queue[Math.min(index, queue.length - 1)];
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

  async function persistAttempt(attempt: Attempt) {
    try {
      const repository = getRepository();
      await repository.addAttempt(attempt);
      for (const knowledgeId of attempt.knowledgeIds) {
        const current = (await repository.getMastery(knowledgeId)) ?? createMastery(knowledgeId, attempt.at);
        await repository.putMastery(
          reviewMastery(current, attempt.correct ? "correct" : "wrong", attempt.at, attempt.responseMs),
        );
      }
    } catch {
      setSaveError("本次作答未能写入本机数据库。");
    }
  }

  function recordAttempt(current: Exercise, correct: boolean, expected: string, received: string) {
    const at = Date.now();
    const attempt: Attempt = {
      sessionId: sessionIdRef.current,
      exerciseId: current.id,
      kind: current.kind,
      knowledgeIds: current.knowledgeIds,
      mode: inputMode,
      correct,
      responseMs: Math.max(0, at - questionStartRef.current),
      at,
      expected,
      received,
    };
    questionStartRef.current = at;
    attemptsRef.current.push(attempt);
    void persistAttempt(attempt);
  }

  async function finishSession() {
    const session = buildSession({
      id: sessionIdRef.current,
      scope,
      mode: inputMode,
      startedAt: sessionStartRef.current,
      endedAt: Date.now(),
      attempts: attemptsRef.current,
      cpm: cpmRef.current,
    });
    setSummary(session);
    try {
      await getRepository().saveSession(session);
    } catch {
      setSaveError("会话未能保存到本机数据库。");
    }
  }

  function scheduleRetry(current: Exercise) {
    if (retriedRef.current.has(current.id)) return;
    retriedRef.current.add(current.id);
    setQueue((existing) => insertRetry(existing, index, current, retryOffset(current.id)));
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
      playFeedback(correct ? "correct" : "wrong", sound);
      recordAttempt(exercise, correct, exercise.expectedReadings.join(" / "), selectedOption.join(" / "));
      if (!correct) scheduleRetry(exercise);
      return;
    }

    const result = checkExerciseAnswer(exercise, input);
    setFeedback({ status: result.correct ? "correct" : "wrong" });
    playFeedback(result.correct ? "correct" : "wrong", sound);
    recordAttempt(exercise, result.correct, result.expected, normalizeCodeInput(input));

    if (result.correct) {
      setStreak(streak + 1);
      setLocked(false);
      return;
    }

    setStreak(0);
    flashNextKey();
    scheduleRetry(exercise);
    if (behavior === "strict") {
      setLocked(true);
      setInput("");
    }
  }

  function next() {
    if (locked) return;
    if (index + 1 >= queue.length) {
      setFinished(true);
      void finishSession();
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
    setQueue([...exercises]);
    retriedRef.current.clear();
    setSummary(null);
    setSaveError(null);
    sessionIdRef.current = newSessionId();
    sessionStartRef.current = Date.now();
    questionStartRef.current = Date.now();
    attemptsRef.current = [];
    cpmRef.current = null;
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
        {summary ? (
          <dl className="summary-grid">
            <div>
              <dt>题数</dt>
              <dd>{summary.attempts}</dd>
            </div>
            <div>
              <dt>正确</dt>
              <dd>{summary.correct}</dd>
            </div>
            <div>
              <dt>正确率</dt>
              <dd>{Math.round(summary.accuracy * 100)}%</dd>
            </div>
            <div>
              <dt>星级</dt>
              <dd className="stars">{starsToText(summary.stars)}</dd>
            </div>
            <div>
              <dt>CPM</dt>
              <dd>{summary.cpm ?? "—"}</dd>
            </div>
          </dl>
        ) : null}
        <p className="muted small">{saveError ?? "记录已保存到本机数据库（IndexedDB）。"}</p>
        <div className="speed-actions">
          <button type="button" className="primary" onClick={restart}>
            再来一轮
          </button>
          <Link className="secondary" to="/stats">
            查看统计
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="exercise-card" aria-live="polite">
      <div className="exercise-meta">
        <span className="badge">{KIND_LABEL[exercise.kind]}</span>
        <span className={`badge badge-${exercise.difficulty}`}>{DIFFICULTY_LABEL[exercise.difficulty]}</span>
        <span className="muted">
          第 {index + 1} / {queue.length} 题
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
        <SpeedChallenge
          text={exercise.text}
          durationSeconds={exercise.durationSeconds}
          onResult={(result) => {
            cpmRef.current = computeCpm(result.correctChars, result.elapsedMs);
          }}
        />
      ) : exercise.kind === "reverse-recall" ? (
        <>
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
          <div className="speed-actions">
            <button type="button" className="primary" onClick={submit} disabled={!selectedOption}>
              检查
            </button>
          </div>
        </>
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
