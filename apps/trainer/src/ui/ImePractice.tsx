import { useRef, useState, type ChangeEvent, type ClipboardEvent, type CompositionEvent } from "react";
import { sanitizePracticeText } from "../curriculum/content";
import { evaluateCommitted, type CommittedEvaluation } from "../curriculum/ime";

type ImePracticeProps = {
  text: string;
};

export function ImePractice({ text }: ImePracticeProps) {
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const [evaluation, setEvaluation] = useState<CommittedEvaluation | null>(null);
  const [composing, setComposing] = useState(false);

  function judge(value: string) {
    setEvaluation(evaluateCommitted(text, value));
  }

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    const native = event.nativeEvent as InputEvent;
    if (native.isComposing) {
      setComposing(true);
      return;
    }
    setComposing(false);
    judge(event.currentTarget.value);
  }

  function handleCompositionEnd(event: CompositionEvent<HTMLTextAreaElement>) {
    setComposing(false);
    judge(event.currentTarget.value);
  }

  function handlePaste(event: ClipboardEvent<HTMLTextAreaElement>) {
    event.preventDefault();
    const area = inputRef.current;
    if (!area) return;
    const pasted = sanitizePracticeText(event.clipboardData.getData("text"), 160);
    const start = area.selectionStart ?? area.value.length;
    const end = area.selectionEnd ?? start;
    const next = sanitizePracticeText(area.value.slice(0, start) + pasted + area.value.slice(end), 160);
    area.value = next;
    judge(next);
  }

  function reset() {
    if (inputRef.current) inputRef.current.value = "";
    setEvaluation(null);
    setComposing(false);
    inputRef.current?.focus();
  }

  return (
    <div className="ime-box">
      <p className="ime-target">{text}</p>

      <textarea
        ref={inputRef}
        className="ime-input"
        onChange={handleChange}
        onCompositionStart={() => setComposing(true)}
        onCompositionEnd={handleCompositionEnd}
        onPaste={handlePaste}
        placeholder="切换到系统中文输入法，在这里输入上方文字"
        aria-label="输入法练习输入框"
        spellCheck={false}
        rows={3}
      />

      <div className="ime-status" aria-live="polite">
        {composing ? (
          <span className="badge badge-ambiguous">正在组合输入，未提交不判定</span>
        ) : evaluation ? (
          <>
            <span className="badge">已提交 {evaluation.committed} 字</span>
            <span className={evaluation.wrongAt === null ? "badge badge-confirmed" : "badge badge-advanced"}>
              正确 {evaluation.correct} 字
            </span>
            <span className="muted small">正确率 {evaluation.accuracy}%</span>
            {evaluation.wrongAt !== null ? (
              <span className="muted small">第 {evaluation.wrongAt + 1} 个字与目标不同</span>
            ) : null}
          </>
        ) : (
          <span className="muted small">等待输入</span>
        )}
      </div>

      {evaluation?.done ? (
        <div className="feedback feedback-correct">
          <strong>已完成</strong>
          <p>提交文本与目标完全一致。删除、撤销或替换候选词后，判定会实时更新。</p>
        </div>
      ) : null}

      <div className="speed-actions">
        <button type="button" className="secondary" onClick={reset}>
          清空重输
        </button>
      </div>

      <p className="muted small">
        只按 compositionend / input 后的已提交文本判定，组合中的候选不计分；粘贴会过滤非汉字字符。
        真实系统输入法仍需人工验收，本页的自测不能替代。
      </p>
    </div>
  );
}
