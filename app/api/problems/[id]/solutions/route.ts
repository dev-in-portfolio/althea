import { NextResponse } from "next/server";
import { getPool } from "../../../../../lib/db";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(request.url);
  const userKey = String(searchParams.get("userKey") || "");
  const problemId = params.id;

  if (!userKey) {
    return NextResponse.json({ error: "userKey required" }, { status: 400 });
  }

  const pool = getPool();
  const { rows } = await pool.query(
    "SELECT rank, payload, created_at FROM solutions WHERE problem_id = $1 AND user_key = $2 ORDER BY rank ASC",
    [problemId, userKey]
  );

  return NextResponse.json({ solutions: rows });
}
