import { navigate } from "../app/router";
import { KEYBOARD_ROWS } from "../curriculum/practice";
import type { KeyStat } from "../review/plan";

function bucketClass(stat: KeyStat | undefined): string {
  if (!stat) return "is-empty";
  if (stat.accuracy >= 0.9) return "is-strong";
  if (stat.accuracy >= 0.7) return "is-mid";
  return "is-weak";
}

export function KeyHeatmap({ stats }: { stats: Map<string, KeyStat> }) {
  return (
    <div className="heatmap" role="group" aria-label="键位正确率热力图，点击任意键进入专项练习">
      {KEYBOARD_ROWS.map((row) => (
        <div className={`hint-row hint-row-${row.length}`} key={row}>
          {Array.from(row).map((key) => {
            const stat = stats.get(key);
            const label = stat
              ? `${key.toUpperCase()} 键：${stat.attempts} 次，正确率 ${Math.round(stat.accuracy * 100)}%`
              : `${key.toUpperCase()} 键：还没有记录`;
            return (
              <button
                key={key}
                type="button"
                className={`heat-key ${bucketClass(stat)}`}
                onClick={() => navigate(`/practice/key/${key}`)}
                title={label}
                aria-label={label}
              >
                <span className="heat-letter">{key.toUpperCase()}</span>
                <span className="heat-value">{stat ? `${Math.round(stat.accuracy * 100)}%` : "—"}</span>
              </button>
            );
          })}
        </div>
      ))}
      <p className="muted small">点击任意键进入该键的专项练习；空白键表示还没有键位认知记录。</p>
    </div>
  );
}
