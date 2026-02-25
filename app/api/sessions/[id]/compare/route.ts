import { NextResponse } from "next/server";
import { getPool } from "../../../../../lib/db";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const payload = await request.json();
  const userKey = String(payload.userKey || "");
  const sessionId = params.id;
  const aItemId = String(payload.aItemId || "");
  const bItemId = String(payload.bItemId || "");
  const winnerItemId = String(payload.winnerItemId || "");

  if (!userKey) {
    return NextResponse.json({ error: "userKey required" }, { status: 400 });
  }
  if (!aItemId || !bItemId || !winnerItemId || aItemId === bItemId) {
    return NextResponse.json({ error: "invalid items" }, { status: 400 });
  }
  if (winnerItemId !== aItemId && winnerItemId !== bItemId) {
    return NextResponse.json({ error: "winner must be one of the items" }, { status: 400 });
  }

  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const items = await client.query(
      "SELECT id FROM items WHERE session_id = $1 AND user_key = $2 AND id IN ($3, $4)",
      [sessionId, userKey, aItemId, bItemId]
    );
    if (items.rows.length !== 2) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "items not found" }, { status: 400 });
    }

    const existing = await client.query(
      "SELECT id FROM comparisons WHERE session_id = $1 AND user_key = $2 AND ((a_item_id = $3 AND b_item_id = $4) OR (a_item_id = $4 AND b_item_id = $3))",
      [sessionId, userKey, aItemId, bItemId]
    );
    if (existing.rows.length) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "comparison already exists" }, { status: 400 });
    }

    await client.query(
      "INSERT INTO comparisons (id, session_id, user_key, a_item_id, b_item_id, winner_item_id) VALUES ($1, $2, $3, $4, $5, $6)",
      [crypto.randomUUID(), sessionId, userKey, aItemId, bItemId, winnerItemId]
    );
    await client.query("COMMIT");
    return NextResponse.json({ ok: true });
  } catch {
    await client.query("ROLLBACK");
    return NextResponse.json({ error: "failed" }, { status: 500 });
  } finally {
    client.release();
  }
}
