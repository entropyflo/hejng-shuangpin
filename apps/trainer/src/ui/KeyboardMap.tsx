import { useMemo } from "react";
import { KEYBOARD_ROWS, buildKeyMap } from "../curriculum/practice";
import { FLYPY_ZERO_INITIAL_CODES } from "../scheme/flypy";

export function KeyboardMap() {
  const slots = useMemo(() => new Map(buildKeyMap().map((slot) => [slot.key, slot])), []);

  return (
    <section className="panel" aria-labelledby="keyboard-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">规则核验</p>
          <h2 id="keyboard-title">小鹤双拼键位图</h2>
        </div>
        <p className="panel-note">
          键帽下方第一行是声母，第二行是韵母。共享键位必须结合完整音节判断，不能反向唯一还原。
        </p>
      </div>

      <div className="keyboard" role="img" aria-label="小鹤双拼键位映射图，逐键列出声母与韵母">
        {KEYBOARD_ROWS.map((row) => (
          <div className={`keyboard-row keyboard-row-${row.length}`} key={row}>
            {Array.from(row).map((key) => {
              const slot = slots.get(key);
              return (
                <div className="key" key={key}>
                  <span className="key-cap">{key.toUpperCase()}</span>
                  <span className="key-initial">{slot?.initials.join(" ") || "\u00A0"}</span>
                  <span className="key-final">{slot?.finals.join(" ") || "\u00A0"}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="split">
        <table className="data-table">
          <caption>十二个零声母音节</caption>
          <thead>
            <tr>
              <th scope="col">音节</th>
              <th scope="col">双拼码</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(FLYPY_ZERO_INITIAL_CODES).map(([syllable, code]) => (
              <tr key={syllable}>
                <td>{syllable}</td>
                <td>
                  <code>{code}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="rule-notes">
          <h3>三个特殊声母</h3>
          <ul>
            <li>
              <code>zh</code> 使用 <kbd>V</kbd> 键，不是 Z 与 H 连按。
            </li>
            <li>
              <code>ch</code> 使用 <kbd>I</kbd> 键。
            </li>
            <li>
              <code>sh</code> 使用 <kbd>U</kbd> 键。
            </li>
          </ul>
          <h3>ü 的写法</h3>
          <p>
            <code>ü</code> 统一映射到 <kbd>V</kbd> 键；<code>j/q/x/y</code> 后的 <code>u</code> 在内部按{" "}
            <code>ü</code> 处理，因此 <code>ju → jv</code>、<code>yuan → yr</code>。
          </p>
          <p className="muted">本页键位来自已核验的方案表，来源记录见 docs/SCHEME_SOURCES.md。</p>
        </div>
      </div>
    </section>
  );
}
