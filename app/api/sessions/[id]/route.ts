import { NextResponse } from "next/server";
import { getPool } from "../../../../lib/db";
import { rankItems, buildScore } from "../../../../lib/collapse/engine";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(request.url);
  const userKey = String(searchParams.get("userKey") || "");
  const sessionId = params.id;

  if (!userKey) {
    return NextResponse.json({ error: "userKey required" }, { status: 400 });
  }

  const pool = getPool();
  const sessionResult = await pool.query(
    "SELECT id, title, created_at, skips_used, finalized_at, finalized_payload FROM sessions WHERE id = $1 AND user_key = $2",
    [sessionId, userKey]
  );
  if (!sessionResult.rows.length) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const itemsResult = await pool.query(
    "SELECT id, label, seed FROM items WHERE session_id = $1 AND user_key = $2 ORDER BY seed ASC",
    [sessionId, userKey]
  );

  const comparisonsResult = await pool.query(
    "SELECT id, a_item_id, b_item_id, winner_item_id, created_at FROM comparisons WHERE session_id = $1 AND user_key = $2 ORDER BY created_at ASC",
    [sessionId, userKey]
  );

  const items = itemsResult.rows;
  const comparisons = comparisonsResult.rows;
  const ranking = rankItems(items, comparisons);
  const scoreMap = buildScore(items, comparisons);

  return NextResponse.json({
    session: sessionResult.rows[0],
    items,
    comparisons,
    ranking,
    scoreMap: [...scoreMap.values()]
  });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(request.url);
  const userKey = String(searchParams.get("userKey") || "");
  const sessionId = params.id;

  if (!userKey) {
    return NextResponse.json({ error: "userKey required" }, { status: 400 });
  }

  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM comparisons WHERE session_id = $1 AND user_key = $2", [sessionId, userKey]);
    await client.query("DELETE FROM items WHERE session_id = $1 AND user_key = $2", [sessionId, userKey]);
    await client.query("DELETE FROM sessions WHERE id = $1 AND user_key = $2", [sessionId, userKey]);
    await client.query("COMMIT");
    return NextResponse.json({ deleted: true });
  } catch {
    await client.query("ROLLBACK");
    return NextResponse.json({ error: "failed" }, { status: 500 });
  } finally {
    client.release();
  }
}
