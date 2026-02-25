import { NextResponse } from "next/server";
import { getPool } from "../../../../lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const payload = await request.json();
  const userKey = String(payload.userKey || "");
  const conflictId = String(payload.conflictId || "");
  const status = String(payload.status || "open");

  if (!userKey || !conflictId) {
    return NextResponse.json({ error: "userKey and conflictId required" }, { status: 400 });
  }

  const pool = getPool();
  await pool.query(
    "UPDATE conflicts SET resolution_status = $1 WHERE id = $2 AND user_key = $3",
    [status, conflictId, userKey]
  );

  return NextResponse.json({ ok: true });
}
