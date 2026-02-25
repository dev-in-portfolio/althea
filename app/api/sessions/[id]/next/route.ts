import { NextResponse } from "next/server";
import { getPool } from "../../../../../lib/db";
import { nextPair, coverage } from "../../../../../lib/collapse/engine";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(request.url);
  const userKey = String(searchParams.get("userKey") || "");
  const sessionId = params.id;
  const exclude = searchParams.get("exclude") || "";
  const excludedPairs = exclude ? exclude.split(",").filter(Boolean) : [];

  if (!userKey) {
    return NextResponse.json({ error: "userKey required" }, { status: 400 });
  }

  const pool = getPool();
  const sessionResult = await pool.query(
    "SELECT skips_used FROM sessions WHERE id = $1 AND user_key = $2",
    [sessionId, userKey]
  );
  if (!sessionResult.rows.length) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const skipsUsed = sessionResult.rows[0].skips_used ?? 0;

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
  const totalPairs = (items.length * (items.length - 1)) / 2;
  const cap = Math.min(30, totalPairs);

  if (comparisons.length >= cap) {
    return NextResponse.json({ done: true, reason: "cap" });
  }

  const pair = nextPair(items, comparisons, excludedPairs);
  if (!pair) {
    return NextResponse.json({ done: true, reason: "exhausted" });
  }

  return NextResponse.json({
    pair: {
      a: pair.a,
      b: pair.b,
      key: pair.key
    },
    coverage: coverage(items, comparisons),
    comparisons: comparisons.length,
    cap,
    skipsUsed,
    maxSkips: 3
  });
}
