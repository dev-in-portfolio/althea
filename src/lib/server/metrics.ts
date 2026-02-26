import { getDbError, getPool } from './db';

function requirePool() {
  const pool = getPool();
  if (!pool) {
    throw new Error(getDbError() || 'Database is unavailable.');
  }
  return pool;
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function rangeDays(days: number) {
  const now = new Date();
  const out: string[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    out.push(toDateKey(d));
  }
  return out;
}

type MetricsCacheEntry = {
  value: any;
  expiresAt: number;
};

const metricsCache = new Map<string, MetricsCacheEntry>();
const METRICS_TTL_MS = 60_000;

export async function getMetrics(userKey: string) {
  const cached = metricsCache.get(userKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }
  const pool = requirePool();
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const result = await pool.query(
    `select started_at, duration_seconds, feel
     from momentum_sessions
     where user_key = $1 and started_at >= $2
     order by started_at asc`,
    [userKey, since.toISOString()]
  );

  const dailyTotals = new Map<string, number>();
  const last7Totals = new Map<string, number>();
  const byHour = new Array<number>(24).fill(0);
  const byWeekday = new Array<number>(7).fill(0);
  let last7Sessions = 0;
  let last7Flow = 0;
  let recentDrag = 0;

  const now = new Date();
  const last7Start = new Date();
  last7Start.setDate(now.getDate() - 6);

  const flowDays = new Set<string>();
  for (const row of result.rows as any[]) {
    const dayKey = toDateKey(new Date(row.started_at));
    const current = dailyTotals.get(dayKey) ?? 0;
    dailyTotals.set(dayKey, current + Number(row.duration_seconds));
    if (Number(row.feel) === 1) flowDays.add(dayKey);

    const startedAt = new Date(row.started_at);
    const hour = startedAt.getHours();
    byHour[hour] += Number(row.duration_seconds);
    const weekday = startedAt.getDay();
    byWeekday[weekday] += Number(row.duration_seconds);
    if (startedAt >= last7Start) {
      last7Sessions += 1;
      if (Number(row.feel) === 1) last7Flow += 1;
      if (Number(row.feel) === -1) recentDrag += 1;
      const last7Current = last7Totals.get(dayKey) ?? 0;
      last7Totals.set(dayKey, last7Current + Number(row.duration_seconds));
    }
  }

  const days30 = rangeDays(30);
  const totals30 = days30.map((date) => ({
    date,
    seconds: dailyTotals.get(date) ?? 0
  }));

  const days7 = rangeDays(7);
  const totals7 = days7.map((date) => ({
    date,
    seconds: last7Totals.get(date) ?? 0
  }));

  const streakThreshold = 20 * 60;
  let streakDays = 0;
  for (let i = days30.length - 1; i >= 0; i -= 1) {
    const seconds = dailyTotals.get(days30[i]) ?? 0;
    if (seconds >= streakThreshold) {
      streakDays += 1;
    } else {
      break;
    }
  }

  const weeklySeconds = totals7.reduce((sum, day) => sum + day.seconds, 0);
  const previous7 = days30.slice(0, 23).slice(-7);
  const previous7Seconds = previous7.reduce((sum, date) => sum + (dailyTotals.get(date) ?? 0), 0);
  const trendDelta = weeklySeconds - previous7Seconds;
  const trendDirection = trendDelta > 0 ? 'up' : trendDelta < 0 ? 'down' : 'flat';
  const velocity = Math.round(weeklySeconds / 7);
  const smoothedVelocity = Math.round((weeklySeconds + previous7Seconds) / 14);
  const flowRatio = last7Sessions ? Number((last7Flow / last7Sessions).toFixed(2)) : 0;
  const dragAlert = recentDrag >= 3;

  const levels = totals30.map((day) => day.seconds);
  const sorted = [...levels].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)] ?? 0;
  const q2 = sorted[Math.floor(sorted.length * 0.5)] ?? 0;
  const q3 = sorted[Math.floor(sorted.length * 0.75)] ?? 0;

  const heatmap = totals30.map((day) => {
    let level = 0;
    if (day.seconds > 0 && day.seconds <= q1) level = 1;
    else if (day.seconds > q1 && day.seconds <= q2) level = 2;
    else if (day.seconds > q2 && day.seconds <= q3) level = 3;
    else if (day.seconds > q3) level = 4;
    return { date: day.date, level };
  });

  const flowStreak = (() => {
    let streak = 0;
    for (let i = days30.length - 1; i >= 0; i -= 1) {
      const day = days30[i];
      const total = dailyTotals.get(day) ?? 0;
      if (total >= streakThreshold && flowDays.has(day)) {
        streak += 1;
      } else {
        break;
      }
    }
    return streak;
  })();

  const weekdayHeatmap = byWeekday.map((seconds, idx) => ({
    weekday: idx,
    seconds
  }));

  const hourlyWave = byHour.map((seconds, hour) => ({
    hour,
    seconds
  }));

  const payload = {
    streakDays,
    flowStreak,
    dragAlert,
    weeklySeconds,
    velocity,
    smoothedVelocity,
    trendDelta,
    trendDirection,
    flowRatio,
    dailyTotals: totals7,
    heatmap,
    weekdayHeatmap,
    hourlyWave
  };
  metricsCache.set(userKey, { value: payload, expiresAt: Date.now() + METRICS_TTL_MS });
  return payload;
}
