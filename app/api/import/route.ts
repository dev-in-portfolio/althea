import { NextResponse } from "next/server";
import { getPool } from "../../../lib/db";
import { normalizeTags } from "../../../lib/tags";

export const runtime = "nodejs";

const MAX_EVENTS = 500;
const MAX_TAGS = 12;
const MAX_NOTE_LENGTH = 600;

export async function POST(request: Request) {
  const payload = await request.json();
  const userKey = String(payload.userKey || "");
  const events = Array.isArray(payload.events) ? payload.events.slice(0, MAX_EVENTS) : [];

  if (!userKey) {
    return NextResponse.json({ error: "userKey required" }, { status: 400 });
  }

  const pool = getPool();
  const client = await pool.connect();
  let inserted = 0;
  try {
    await client.query("BEGIN");
    for (const event of events) {
      const note = String(event.note || "").trim();
      if (!note || note.length > MAX_NOTE_LENGTH) continue;
      const happenedAt = event.happened_at ? new Date(event.happened_at) : new Date();
      const context = event.context ?? null;
      const tags = normalizeTags(event.tags || []).slice(0, MAX_TAGS);
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
      inserted += 1;
    }
    await client.query(
      `INSERT INTO signals_cache (user_key, events_updated_at)
       VALUES ($1, now())
       ON CONFLICT (user_key) DO UPDATE SET events_updated_at = excluded.events_updated_at`,
      [userKey]
    );
    await client.query("COMMIT");
    return NextResponse.json({ inserted });
  } catch {
    await client.query("ROLLBACK");
    return NextResponse.json({ error: "failed" }, { status: 500 });
  } finally {
    client.release();
  }
}
