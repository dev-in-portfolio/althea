import { NextResponse } from "next/server";
import { getPool } from "../../../../lib/db";
import { normalizeTags } from "../../../../lib/tags";

export const runtime = "nodejs";
const MAX_TAGS = 12;
const MAX_NOTE_LENGTH = 600;

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(request.url);
  const userKey = String(searchParams.get("userKey") || "");
  const eventId = params.id;

  if (!userKey) {
    return NextResponse.json({ error: "userKey required" }, { status: 400 });
  }

  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM event_tags WHERE event_id = $1 AND user_key = $2", [eventId, userKey]);
    const result = await client.query("DELETE FROM events WHERE id = $1 AND user_key = $2", [eventId, userKey]);
    await client.query(
      `INSERT INTO signals_cache (user_key, events_updated_at)
       VALUES ($1, now())
       ON CONFLICT (user_key) DO UPDATE SET events_updated_at = excluded.events_updated_at`,
      [userKey]
    );
    await client.query("COMMIT");
    return NextResponse.json({ deleted: result.rowCount });
  } catch {
    await client.query("ROLLBACK");
    return NextResponse.json({ error: "failed" }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
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
  const eventId = params.id;
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "UPDATE events SET happened_at = $1, note = $2, context = $3 WHERE id = $4 AND user_key = $5",
      [happenedAt.toISOString(), note, context, eventId, userKey]
    );
    await client.query("DELETE FROM event_tags WHERE event_id = $1 AND user_key = $2", [eventId, userKey]);
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
  } catch {
    await client.query("ROLLBACK");
    return NextResponse.json({ error: "failed" }, { status: 500 });
  } finally {
    client.release();
  }
}
