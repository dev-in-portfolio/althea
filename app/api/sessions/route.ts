import { NextResponse } from "next/server";
import { getPool } from "../../../lib/db";

export const runtime = "nodejs";

const MAX_ITEMS = 200;
const MAX_LABEL_LENGTH = 200;

export async function POST(request: Request) {
  const payload = await request.json();
  const userKey = String(payload.userKey || "");
  const title = String(payload.title || "Untitled session").trim().slice(0, 120);
  const items = Array.isArray(payload.items) ? payload.items : [];

  if (!userKey) {
    return NextResponse.json({ error: "userKey required" }, { status: 400 });
  }

  const cleaned = items
    .map((item: string) => String(item).trim())
    .filter((item: string) => item.length > 0)
    .slice(0, MAX_ITEMS)
    .map((item: string) => item.slice(0, MAX_LABEL_LENGTH));

  if (cleaned.length < 2) {
    return NextResponse.json({ error: "Provide at least two items" }, { status: 400 });
  }

  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const sessionId = crypto.randomUUID();
    await client.query(
      "INSERT INTO sessions (id, user_key, title) VALUES ($1, $2, $3)",
      [sessionId, userKey, title]
    );

    for (let i = 0; i < cleaned.length; i += 1) {
      await client.query(
        "INSERT INTO items (id, session_id, user_key, label, seed) VALUES ($1, $2, $3, $4, $5)",
        [crypto.randomUUID(), sessionId, userKey, cleaned[i], i]
      );
    }

    await client.query("COMMIT");
    return NextResponse.json({ id: sessionId });
  } catch {
    await client.query("ROLLBACK");
    return NextResponse.json({ error: "failed" }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userKey = String(searchParams.get("userKey") || "");
  if (!userKey) {
    return NextResponse.json({ error: "userKey required" }, { status: 400 });
  }

  const pool = getPool();
  const { rows } = await pool.query(
    `
    SELECT s.id, s.title, s.created_at,
      COUNT(DISTINCT i.id) AS item_count,
      COUNT(DISTINCT c.id) AS comparison_count
    FROM sessions s
    LEFT JOIN items i ON s.id = i.session_id AND s.user_key = i.user_key
    LEFT JOIN comparisons c ON s.id = c.session_id AND s.user_key = c.user_key
    WHERE s.user_key = $1
    GROUP BY s.id
    ORDER BY s.created_at DESC
  `,
    [userKey]
  );

  return NextResponse.json({ sessions: rows });
}
