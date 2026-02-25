import { NextResponse } from "next/server";
import { getPool } from "../../../lib/db";
import { normalizeTags } from "../../../lib/tags";

export const runtime = "nodejs";

const MAX_TAGS = 12;
const MAX_NOTE_LENGTH = 600;

function parseCursor(cursor: string | null) {
  if (!cursor) return null;
  try {
    const decoded = Buffer.from(cursor, "base64").toString("utf-8");
    const parsed = JSON.parse(decoded);
    if (parsed?.happenedAt && parsed?.id) {
      return parsed as { happenedAt: string; id: string };
    }
  } catch {
    return null;
  }
  return null;
}

export async function POST(request: Request) {
  const payload = await request.json();
  const userKey = String(payload.userKey || "");
  const note = String(payload.note || "").trim();
  const happenedAt = payload.happenedAt ? new Date(payload.happenedAt) : new Date();
  const context = payload.context ?? null;
  const rawTags = Array.isArray(payload.tags) ? payload.tags : [];

  if (!userKey) {
    return NextResponse.json({ error: "userKey required" }, { status: 400 });
  }
  if (!note || note.length > MAX_NOTE_LENGTH) {
    return NextResponse.json({ error: "note must be 1-600 characters" }, { status: 400 });
  }

  const tags = normalizeTags(rawTags).slice(0, MAX_TAGS);
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const eventId = crypto.randomUUID();
    await client.query(
      "INSERT INTO events (id, user_key, happened_at, note, context) VALUES ($1, $2, $3, $4, $5)",
      [eventId, userKey, happenedAt.toISOString(), note, context]
    );

    for (const tag of tags) {
      await client.query(
        "INSERT INTO event_tags (event_id, user_key, tag) VALUES ($1, $2, $3)",
        [eventId, userKey, tag]
      );
    }

    await client.query(
      `INSERT INTO signals_cache (user_key, events_updated_at)
       VALUES ($1, now())
       ON CONFLICT (user_key) DO UPDATE SET events_updated_at = excluded.events_updated_at`,
      [userKey]
    );
    await client.query("COMMIT");
    return NextResponse.json({ id: eventId, tags });
  } catch (error) {
    await client.query("ROLLBACK");
    return NextResponse.json({ error: "failed" }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userKey = String(searchParams.get("userKey") || "");
  const limit = Math.min(Number(searchParams.get("limit") || 20), 100);
  const cursor = parseCursor(searchParams.get("cursor"));
  const tagFilter = searchParams.get("tags");
  const filterTags = tagFilter ? normalizeTags(tagFilter.split(",")).slice(0, MAX_TAGS) : [];

  if (!userKey) {
    return NextResponse.json({ error: "userKey required" }, { status: 400 });
  }

  const pool = getPool();

  const values: Array<string | number> = [userKey];
  let where = "e.user_key = $1";

  if (cursor) {
    values.push(cursor.happenedAt, cursor.id);
    where += ` AND (e.happened_at, e.id) < ($${values.length - 1}, $${values.length})`;
  }

  for (const tag of filterTags) {
    values.push(tag);
    where += ` AND EXISTS (SELECT 1 FROM event_tags etf WHERE etf.event_id = e.id AND etf.user_key = e.user_key AND etf.tag = $${values.length})`;
  }

  const query = `
    SELECT
      e.id,
      e.happened_at,
      e.note,
      e.context,
      COALESCE(array_agg(et.tag ORDER BY et.tag) FILTER (WHERE et.tag IS NOT NULL), '{}') AS tags
    FROM events e
    LEFT JOIN event_tags et
      ON e.id = et.event_id AND e.user_key = et.user_key
    WHERE ${where}
    GROUP BY e.id, e.happened_at, e.note, e.context
    ORDER BY e.happened_at DESC, e.id DESC
    LIMIT ${limit}
  `;

  const { rows } = await pool.query(query, values);
  const nextCursor = rows.length
    ? Buffer.from(
        JSON.stringify({
          happenedAt: rows[rows.length - 1].happened_at,
          id: rows[rows.length - 1].id
        })
      ).toString("base64")
    : null;

  return NextResponse.json({ events: rows, nextCursor });
}
