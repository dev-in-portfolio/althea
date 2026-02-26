type Point = { x: number; y: number };

export function buildWavePath(values: number[], width = 600, height = 160) {
  if (!values.length) return '';
  const max = Math.max(...values, 1);
  const step = width / (values.length - 1);
  const points: Point[] = values.map((value, idx) => ({
    x: idx * step,
    y: height - (value / max) * (height - 20) - 10
  }));

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const curr = points[i];
    const cx = (prev.x + curr.x) / 2;
    d += ` Q ${cx} ${prev.y} ${curr.x} ${curr.y}`;
  }
  return d;
}
