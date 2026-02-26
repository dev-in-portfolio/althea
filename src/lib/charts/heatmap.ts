export type HeatmapCell = { date: string; level: number };

export function splitWeeks(cells: HeatmapCell[]) {
  const weeks: HeatmapCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}
