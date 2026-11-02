import { useMemo } from "react";
import { KEYBOARD_ROWS, buildKeyMap } from "../curriculum/practice";

type MappingKeyboardProps = {
  pressedKey: string | null;
  pressedCorrect: boolean | null;
  nextKey: string | null;
};

export function MappingKeyboard({ pressedKey, pressedCorrect, nextKey }: MappingKeyboardProps) {
  const slots = useMemo(() => new Map(buildKeyMap().map((slot) => [slot.key, slot])), []);

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
                <span className="mk-initial">{slot?.initials.join(" ") || "\u00A0"}</span>
                <span className="mk-final">{slot?.finals.join(" ") || "\u00A0"}</span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
