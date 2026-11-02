import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { buildCustomPracticeUnits, firstTypeableIndex, previousTypeableIndex } from "../texts/practice";
import { MappingKeyboard } from "./MappingKeyboard";

type Outcome = "correct" | "wrong";

type CustomTextPracticeProps = {
  text: string;
  onComplete: (result: { correct: number; total: number }) => void;
};

export function CustomTextPractice({ text, onComplete }: CustomTextPracticeProps) {
  const units = useMemo(() => buildCustomPracticeUnits(text), [text]);
  const total = useMemo(() => units.filter((unit) => unit.code !== null).length, [units]);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [current, setCurrent] = useState(() => firstTypeableIndex(units));
  const [partial, setPartial] = useState("");
  const [entered, setEntered] = useState<Record<number, string>>({});
  const [outcomes, setOutcomes] = useState<Record<number, Outcome>>({});
  const [keyboardVisible, setKeyboardVisible] = useState(true);
  const [lastKey, setLastKey] = useState<string | null>(null);
  const [lastKeyCorrect, setLastKeyCorrect] = useState<boolean | null>(null);

  const expected = current >= 0 ? units[current].code : null;
  const liveWrong = Boolean(expected && partial && !expected.startsWith(partial));

  function focusInput() {
    inputRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.metaKey || event.ctrlKey || event.altKey) return;

    if (event.key === "Backspace") {
      event.preventDefault();
      if (partial) {
        setPartial(partial.slice(0, -1));
        setLastKey(null);
        setLastKeyCorrect(null);
        return;
      }
      const previous = previousTypeableIndex(units, current < 0 ? units.length : current);
      if (previous < 0) return;
      const restored = entered[previous] ?? "";
      setCurrent(previous);
      setPartial(restored);
      setEntered((value) => {
        const next = { ...value };
        delete next[previous];
        return next;
      });
      setOutcomes((value) => {
        const next = { ...value };
        delete next[previous];
        return next;
      });
      return;
    }

    if (!/^[a-zA-Z]$/u.test(event.key) || current < 0 || !expected) return;
    event.preventDefault();
    const key = event.key.toLowerCase();
    const nextPartial = `${partial}${key}`.slice(0, 2);
    const prefixCorrect = expected.startsWith(nextPartial);
    setPartial(nextPartial);
    setLastKey(key);
    setLastKeyCorrect(prefixCorrect);

    if (nextPartial.length < 2) return;

    const outcome: Outcome = nextPartial === expected ? "correct" : "wrong";
    const nextEntered = { ...entered, [current]: nextPartial };
    const nextOutcomes = { ...outcomes, [current]: outcome };
    setEntered(nextEntered);
    setOutcomes(nextOutcomes);
    setPartial("");

    const nextIndex = firstTypeableIndex(units, current);
    setCurrent(nextIndex);
    if (nextIndex < 0) {
      const correct = Object.values(nextOutcomes).filter((value) => value === "correct").length;
      onComplete({ correct, total });
    }
  }

  return (
    <div className="custom-practice">
      <div className="custom-reference" aria-label="练习原文">
        <span>原文</span>
        <p>{text}</p>
      </div>

      <div
        className="custom-typing-board"
        role="group"
        aria-label="双拼逐字练习区"
        onClick={focusInput}
      >
        <div className="custom-unit-flow" aria-live="polite">
          {units.map((unit, index) => {
            const outcome = outcomes[index];
            const isCurrent = index === current;
            const wrong = outcome === "wrong" || (isCurrent && liveWrong);
            const code = entered[index] ?? (isCurrent ? partial : "");
            const classes = ["custom-unit"];
            if (!unit.code) classes.push("is-punctuation");
            else if (outcome === "correct") classes.push("is-correct");
            else if (wrong) classes.push("is-wrong");
            else if (isCurrent) classes.push("is-current");

            return (
              <span className={classes.join(" ")} key={`${unit.character}-${index}`}>
                <span className="custom-character">{unit.character}</span>
                <span className="custom-code" aria-label={unit.code ? `已输入 ${code || "空"}` : "标点"}>
                  {unit.code ? (
                    <>
                      <span>{code[0] ?? "·"}</span>
                      <span>{code[1] ?? "·"}</span>
                    </>
                  ) : (
                    <span aria-hidden="true">&nbsp;</span>
                  )}
                </span>
              </span>
            );
          })}
        </div>

        <input
          ref={inputRef}
          className="custom-input-capture"
          aria-label="双拼逐字输入"
          value=""
          onChange={() => undefined}
          onKeyDown={handleKeyDown}
          autoCapitalize="off"
          autoComplete="off"
          spellCheck={false}
          autoFocus
        />
        <p className="custom-input-help">
          {current < 0 ? "本轮输入完成" : `第 ${Object.keys(outcomes).length + 1} / ${total} 字 · 直接键入双拼码`}
        </p>
      </div>

      <div className="custom-keyboard-toggle">
        <div>
          <strong>键位提示图</strong>
          <span>显示下一个按键与本轮按键反馈</span>
        </div>
        <button
          type="button"
          className={keyboardVisible ? "switch is-on" : "switch"}
          role="switch"
          aria-label="键位提示图"
          aria-checked={keyboardVisible}
          onClick={() => setKeyboardVisible((value) => !value)}
        >
          <span />
          <b>{keyboardVisible ? "开" : "关"}</b>
        </button>
      </div>

      {keyboardVisible ? (
        <MappingKeyboard
          pressedKey={lastKey}
          pressedCorrect={lastKeyCorrect}
          nextKey={expected?.[partial.length] ?? null}
          mode="always"
          showMnemonic={false}
        />
      ) : null}
    </div>
  );
}
