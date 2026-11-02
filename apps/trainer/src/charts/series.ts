export type Point = { x: number; y: number };

export function toPoints(values: number[], width: number, height: number, padding = 6): Point[] {
  if (values.length === 0) return [];

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min;
  const stepX = values.length > 1 ? (width - padding * 2) / (values.length - 1) : 0;

  return values.map((value, index) => {
    const x = values.length > 1 ? padding + index * stepX : width / 2;
    const ratio = span === 0 ? 0.5 : (value - min) / span;
    const y = height - padding - ratio * (height - padding * 2);
    return { x, y };
  });
}

export function toPolyline(values: number[], width: number, height: number, padding = 6): string {
  return toPoints(values, width, height, padding)
    .map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`)
    .join(" ");
}

export function seriesStats(values: number[]): { min: number; max: number; latest: number } | null {
  if (values.length === 0) return null;
  return {
    min: Math.min(...values),
    max: Math.max(...values),
    latest: values[values.length - 1],
  };
}
