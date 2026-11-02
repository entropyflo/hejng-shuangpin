import { useEffect, useRef, useState } from "react";
import { hanCharacters } from "../curriculum/content";
import { correctPrefixLength } from "../curriculum/practice";

type SpeedChallengeProps = {
  text: string;
  durationSeconds: number;
  onResult?: (result: { correctChars: number; elapsedMs: number }) => void;
};

export function SpeedChallenge({ text, durationSeconds, onResult }: SpeedChallengeProps) {
  const [status, setStatus] = useState<"idle" | "running" | "done">("idle");
  const [typed, setTyped] = useState("");
  const [remaining, setRemaining] = useState(durationSeconds);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [endedAt, setEndedAt] = useState<number | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const typedRef = useRef("");

  function end() {
    if (status !== "running") return;
    const ended = Date.now();
    setEndedAt(ended);
    setStatus("done");
    onResult?.({
      correctChars: correctPrefixLength(text, typedRef.current),
      elapsedMs: Math.max(0, ended - (startedAt ?? ended)),
    });
  }

  useEffect(() => {
    if (status !== "running" || startedAt === null) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((startedAt + durationSeconds * 1000 - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) {
        const ended = Date.now();
        setEndedAt(ended);
        setStatus("done");
        onResult?.({
          correctChars: correctPrefixLength(text, typedRef.current),
          elapsedMs: Math.max(0, ended - startedAt),
        });
      }
    };
    tick();
    const timer = window.setInterval(tick, 250);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, startedAt, durationSeconds, text]);

  useEffect(() => {
    if (status === "running") inputRef.current?.focus();
  }, [status]);

  function start() {
    typedRef.current = "";
    setTyped("");
    setRemaining(durationSeconds);
    setStartedAt(Date.now());
    setEndedAt(null);
    setStatus("running");
  }

  const elapsed = startedAt === null ? 0 : Math.max(0, Math.round(((endedAt ?? Date.now()) - startedAt) / 1000));
  const correct = correctPrefixLength(text, typed);
  const accuracy = typed.length === 0 ? 0 : Math.round((correct / typed.length) * 100);

  return (
    <div className="speed-box">
      <p className="speed-target">{text}</p>

      <div className="speed-bar">
        <span className="badge">
          {status === "idle" ? "未开始" : status === "running" ? `剩余 ${remaining} 秒` : "已结束"}
        </span>
        <span className="muted small">{hanCharacters(text).length} 个汉字</span>
      </div>

      <textarea
        ref={inputRef}
        className="speed-input"
        value={typed}
        onChange={(event) => {
          typedRef.current = event.target.value;
          setTyped(event.target.value);
        }}
        disabled={status !== "running"}
        placeholder={status === "idle" ? "点击“开始”后在这里输入" : "输入与上方一致的文本"}
        aria-label="测速输入"
        spellCheck={false}
      />

      <div className="speed-actions">
        {status === "idle" ? (
          <button type="button" className="primary" onClick={start}>
            开始
          </button>
        ) : null}
        {status === "running" ? (
          <button type="button" className="secondary" onClick={end}>
            提前结束
          </button>
        ) : null}
        {status === "done" ? (
          <button type="button" className="secondary" onClick={start}>
            再测一次
          </button>
        ) : null}
      </div>

      {status === "done" ? (
        <dl className="speed-result">
          <div>
            <dt>用时</dt>
            <dd>{elapsed} 秒</dd>
          </div>
          <div>
            <dt>正确字数</dt>
            <dd>{correct}</dd>
          </div>
          <div>
            <dt>输入正确率</dt>
            <dd>{accuracy}%</dd>
          </div>
        </dl>
      ) : null}

      <p className="muted small">
        只统计本次用时与正确字数；CPM 会写入本机记录，星级与复习排程在 S3 逐步接入。
      </p>
    </div>
  );
}
