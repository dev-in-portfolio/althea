import { NextResponse } from "next/server";
import { getPool } from "../../../lib/db";
import { computeSignals } from "../../../lib/radar/detect";
import type { EventRecord } from "../../../lib/radar/types";

export const runtime = "nodejs";

function parseWindow(param: string | null) {
  if (!param) return 30;
  const match = param.match(/(\d+)/);
  if (!match) return 30;
  const days = Math.min(Math.max(parseInt(match[1], 10), 7), 180);
  return days;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userKey = String(searchParams.get("userKey") || "");
  const windowDays = parseWindow(searchParams.get("window"));

  if (!userKey) {
    return NextResponse.json({ error: "userKey required" }, { status: 400 });
  }

  const pool = getPool();
  const cacheResult = await pool.query(
    "SELECT computed_at, payload, events_updated_at FROM signals_cache WHERE user_key = $1",
    [userKey]
  );

  if (cacheResult.rows.length) {
    const { computed_at, payload, events_updated_at } = cacheResult.rows[0];
    const computedAt = new Date(computed_at);
    const eventsUpdatedAt = events_updated_at ? new Date(events_updated_at) : null;
    const maxAgeMs = 60 * 60 * 1000;
    const cacheFresh =
      Date.now() - computedAt.getTime() < maxAgeMs &&
      payload?.windowDays === windowDays &&
      (!eventsUpdatedAt || computedAt >= eventsUpdatedAt);
    if (cacheFresh) {
      return NextResponse.json(payload);
    }
  }

  const { rows } = await pool.query(
    `
    SELECT e.id, e.happened_at, e.context, COALESCE(array_agg(et.tag) FILTER (WHERE et.tag IS NOT NULL), '{}') AS tags
    FROM events e
    LEFT JOIN event_tags et ON e.id = et.event_id AND e.user_key = et.user_key
    WHERE e.user_key = $1 AND e.happened_at >= now() - ($2 || ' days')::interval
    GROUP BY e.id, e.happened_at, e.context
    ORDER BY e.happened_at DESC
  `,
    [userKey, windowDays]
  );

  const events: EventRecord[] = rows.map((row: {
    id: string;
    happened_at: string;
    tags: string[] | null;
    context: Record<string, string> | null;
  }) => ({
    id: row.id,
    happenedAt: row.happened_at,
    tags: row.tags || [],
    context: row.context || null
  }));

  const signals = computeSignals(events, windowDays);
  const payload = {
    windowDays,
    computedAt: new Date().toISOString(),
    signals
  };

  await pool.query(
    `INSERT INTO signals_cache (user_key, computed_at, payload, events_updated_at)
     VALUES ($1, now(), $2, now())
     ON CONFLICT (user_key)
     DO UPDATE SET computed_at = excluded.computed_at, payload = excluded.payload`,
    [userKey, payload]
  );

  return NextResponse.json(payload);
}
