import { useEffect, useMemo, useState } from "react";
import type { MappingMode } from "../app/settings";
import { KEYBOARD_ROWS, buildKeyMap, mnemonicFor, specialInitialFor } from "../curriculum/practice";

type MappingKeyboardProps = {
  pressedKey: string | null;
  pressedCorrect: boolean | null;
  nextKey: string | null;
  mode: MappingMode;
  showMnemonic: boolean;
};

export function MappingKeyboard({ pressedKey, pressedCorrect, nextKey, mode, showMnemonic }: MappingKeyboardProps) {
  const slots = useMemo(() => new Map(buildKeyMap().map((slot) => [slot.key, slot])), []);
  const [revealed, setRevealed] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (!pressedKey) return;
    setRevealed((current) => {
      if (current.has(pressedKey)) return current;
      const next = new Set(current);
      next.add(pressedKey);
      return next;
    });
  }, [pressedKey]);

  function showsMapping(key: string): boolean {
    return mode === "always" || revealed.has(key);
  }

  return (
    <div className="mapping-keyboard" role="img" aria-label="小鹤双拼键位图，显示每个字母键对应的声母与韵母">
      {KEYBOARD_ROWS.map((row) => (
        <div className={`mk-row mk-row-${row.length}`} key={row}>
          {Array.from(row).map((key) => {
            const slot = slots.get(key);
            const classes = ["mk-key"];
            if (key === nextKey) classes.push("is-next");
            if (key === pressedKey) classes.push(pressedCorrect ? "is-correct" : "is-wrong");
            return (
              <div key={key} className={classes.join(" ")} aria-hidden="true">
                <span className="mk-letter">{key.toUpperCase()}</span>
                <span className={specialInitialFor(key) ? "mk-initial is-special" : "mk-initial"}>
                  {showsMapping(key) && specialInitialFor(key) ? specialInitialFor(key) : "\u00A0"}
                </span>
                <span className="mk-final">{showsMapping(key) ? slot?.finals.join(" ") || "\u00A0" : "\u00A0"}</span>
                {showMnemonic ? <span className="mk-mnemonic">{mnemonicFor(key) ?? "\u00A0"}</span> : null}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
