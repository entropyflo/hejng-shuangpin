import { useMemo, useState } from "react";
import type { MappingMode } from "../app/settings";
import { KEYBOARD_ROWS, buildKeyMap } from "../curriculum/practice";

type MappingKeyboardProps = {
  pressedKey: string | null;
  pressedCorrect: boolean | null;
  nextKey: string | null;
  mode: MappingMode;
};

export function MappingKeyboard({ pressedKey, pressedCorrect, nextKey, mode }: MappingKeyboardProps) {
  const slots = useMemo(() => new Map(buildKeyMap().map((slot) => [slot.key, slot])), []);
  const [revealed, setRevealed] = useState<Set<string>>(() => new Set());

  if (pressedKey && !revealed.has(pressedKey)) {
    const next = new Set(revealed);
    next.add(pressedKey);
    setRevealed(next);
  }

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
                <span className="mk-initial">{showsMapping(key) ? slot?.initials.join(" ") || "\u00A0" : "\u00A0"}</span>
                <span className="mk-final">{showsMapping(key) ? slot?.finals.join(" ") || "\u00A0" : "\u00A0"}</span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
