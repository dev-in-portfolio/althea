import { NextResponse } from "next/server";
import { getPool } from "../../../lib/db";
import { detectConflicts, Statement } from "../../../lib/contradict/engine";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userKey = String(searchParams.get("userKey") || "");
  const mode = searchParams.get("mode") || "cached";

  if (!userKey) {
    return NextResponse.json({ error: "userKey required" }, { status: 400 });
  }

  const pool = getPool();

  if (mode === "cached") {
    const cached = await pool.query(
      `\n      SELECT c.*, sa.text AS a_text, sb.text AS b_text, sa.weight AS a_weight, sb.weight AS b_weight\n      FROM conflicts c\n      LEFT JOIN statements sa ON c.a_id = sa.id AND c.user_key = sa.user_key\n      LEFT JOIN statements sb ON c.b_id = sb.id AND c.user_key = sb.user_key\n      WHERE c.user_key = $1\n      ORDER BY c.computed_at DESC\n    `,
      [userKey]
    );
    const conflicts = cached.rows.map((row) => {
      const severity = Math.min(5, Math.round(((row.a_weight || 3) + (row.b_weight || 3)) / 2));
      const promptMap: Record<string, string> = {
        "value-tension": "Which value gets priority right now, and what can wait?",
        "resource-conflict": "What limit or tradeoff would release the shared resource?",
        "constraint-conflict": "Which constraint can be softened or rephrased?"
      };
      return {
        ...row,
        severity,
        resolutionPrompt: promptMap[row.conflict_type] || "Which assumption can shift?"
      };
    });
    return NextResponse.json({ conflicts });
  }

  const statementsResult = await pool.query(
    "SELECT id, text, weight, domain FROM statements WHERE user_key = $1",
    [userKey]
  );

  const statements: Statement[] = statementsResult.rows.map((row) => ({
    id: row.id,
    text: row.text,
    weight: row.weight,
    domain: row.domain
  }));

  const conflicts = detectConflicts(statements);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM conflicts WHERE user_key = $1", [userKey]);
    for (const conflict of conflicts) {
      await client.query(
        "INSERT INTO conflicts (id, user_key, a_id, b_id, conflict_type, reason, resolution_status) VALUES ($1, $2, $3, $4, $5, $6, 'open')",
        [crypto.randomUUID(), userKey, conflict.a.id, conflict.b.id, conflict.conflictType, conflict.reason]
      );
    }
    await client.query("COMMIT");
  } catch {
    await client.query("ROLLBACK");
  } finally {
    client.release();
  }

  return NextResponse.json({ conflicts });
}
