import { KEYBOARD_ROWS } from "../curriculum/practice";

type HintKeyboardProps = {
  sequence: string[];
  progress: number;
  flashKey: string | null;
};

export function HintKeyboard({ sequence, progress, flashKey }: HintKeyboardProps) {
  const nextKey = sequence[progress];

  return (
    <div
      className="hint-keyboard"
      role="img"
      aria-label={nextKey ? `屏幕键盘提示：下一个键是 ${nextKey.toUpperCase()}` : "屏幕键盘提示"}
    >
      {KEYBOARD_ROWS.map((row) => (
        <div className={`hint-row hint-row-${row.length}`} key={row}>
          {Array.from(row).map((key) => {
            const classes = ["hint-key"];
            if (key === nextKey) classes.push("is-next");
            if (key === flashKey) classes.push("is-flash");
            return (
              <span key={key} className={classes.join(" ")} aria-hidden="true">
                {key.toUpperCase()}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}
