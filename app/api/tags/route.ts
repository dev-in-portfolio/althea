import { NextResponse } from "next/server";
import { getPool } from "../../../lib/db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userKey = String(searchParams.get("userKey") || "");

  if (!userKey) {
    return NextResponse.json({ error: "userKey required" }, { status: 400 });
  }

  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT tag, COUNT(*)::int AS count
     FROM statement_tags
     WHERE user_key = $1
     GROUP BY tag
     ORDER BY count DESC, tag ASC
     LIMIT 12`,
    [userKey]
  );

  return NextResponse.json({ tags: rows });
}
