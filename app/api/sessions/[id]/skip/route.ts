import { NextResponse } from "next/server";
import { getPool } from "../../../../../lib/db";

export const runtime = "nodejs";

const MAX_SKIPS = 3;

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const payload = await request.json();
  const userKey = String(payload.userKey || "");
  const sessionId = params.id;

  if (!userKey) {
    return NextResponse.json({ error: "userKey required" }, { status: 400 });
  }

  const pool = getPool();
  const result = await pool.query(
    "UPDATE sessions SET skips_used = LEAST(skips_used + 1, $1) WHERE id = $2 AND user_key = $3 RETURNING skips_used",
    [MAX_SKIPS, sessionId, userKey]
  );

  if (!result.rows.length) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({ skipsUsed: result.rows[0].skips_used, maxSkips: MAX_SKIPS });
}
