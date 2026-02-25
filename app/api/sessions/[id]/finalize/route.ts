import { NextResponse } from "next/server";
import { getPool } from "../../../../../lib/db";
import { rankItems, buildScore } from "../../../../../lib/collapse/engine";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const userKey = String(body.userKey || "");
  const sessionId = params.id;

  if (!userKey) {
    return NextResponse.json({ error: "userKey required" }, { status: 400 });
  }

  const pool = getPool();
  const itemsResult = await pool.query(
    "SELECT id, label, seed FROM items WHERE session_id = $1 AND user_key = $2 ORDER BY seed ASC",
    [sessionId, userKey]
  );
  const comparisonsResult = await pool.query(
    "SELECT a_item_id, b_item_id, winner_item_id FROM comparisons WHERE session_id = $1 AND user_key = $2",
    [sessionId, userKey]
  );

  const items = itemsResult.rows;
  const comparisons = comparisonsResult.rows;
  const ranking = rankItems(items, comparisons);
  const scoreMap = buildScore(items, comparisons);
  const payload = { ranking, scoreMap: [...scoreMap.values()] };

  await pool.query(
    "UPDATE sessions SET finalized_at = now(), finalized_payload = $1 WHERE id = $2 AND user_key = $3",
    [payload, sessionId, userKey]
  );

  return NextResponse.json(payload);
}
