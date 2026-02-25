import { NextResponse } from "next/server";
import { getPool } from "../../../../lib/db";

export const runtime = "nodejs";

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(request.url);
  const userKey = String(searchParams.get("userKey") || "");
  const statementId = params.id;

  if (!userKey) {
    return NextResponse.json({ error: "userKey required" }, { status: 400 });
  }

  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM statement_tags WHERE statement_id = $1 AND user_key = $2", [statementId, userKey]);
    await client.query("DELETE FROM conflicts WHERE user_key = $1 AND (a_id = $2 OR b_id = $2)", [userKey, statementId]);
    await client.query("DELETE FROM statements WHERE id = $1 AND user_key = $2", [statementId, userKey]);
    await client.query("COMMIT");
    return NextResponse.json({ deleted: true });
  } catch {
    await client.query("ROLLBACK");
    return NextResponse.json({ error: "failed" }, { status: 500 });
  } finally {
    client.release();
  }
}
