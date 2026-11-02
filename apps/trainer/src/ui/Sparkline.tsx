import { seriesStats, toPoints } from "../charts/series";

type SparklineProps = {
  label: string;
  values: number[];
  unit?: string;
};

export function Sparkline({ label, values, unit = "" }: SparklineProps) {
  const stats = seriesStats(values);

  if (!stats) {
    return <p className="muted small">{label}：还没有数据</p>;
  }

  const width = 320;
  const height = 96;
  const points = toPoints(values, width, height);

  return (
    <figure className="spark">
      <figcaption>
        <span>{label}</span>
        <strong>
          {stats.latest}
          {unit}
        </strong>
      </figcaption>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label={`${label}趋势`}>
        {points.length > 1 ? (
          <polyline
            points={points.map((point) => `${point.x},${point.y}`).join(" ")}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}
        {points.map((point, index) => (
          <circle key={index} cx={point.x} cy={point.y} r="4" fill="currentColor" />
        ))}
      </svg>
      <div className="spark-scale">
        <span>
          {stats.min}
          {unit}
        </span>
        <span>
          {stats.max}
          {unit}
        </span>
      </div>
    </figure>
  );
}
