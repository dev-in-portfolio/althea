import { NextResponse } from "next/server";
import { getPool } from "../../../lib/db";

export const runtime = "nodejs";

const MAX_TAGS = 12;
const MAX_TEXT_LENGTH = 300;

export async function POST(request: Request) {
  const payload = await request.json();
  const userKey = String(payload.userKey || "");
  const text = String(payload.text || "").trim();
  const weight = Math.min(Math.max(Number(payload.weight || 3), 1), 5);
  const domain = payload.domain ? String(payload.domain).slice(0, 80) : null;
  const tags = Array.isArray(payload.tags) ? payload.tags.slice(0, MAX_TAGS) : [];

  if (!userKey) {
    return NextResponse.json({ error: "userKey required" }, { status: 400 });
  }
  if (!text || text.length > MAX_TEXT_LENGTH) {
    return NextResponse.json({ error: "statement must be 1-300 characters" }, { status: 400 });
  }

  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const statementId = crypto.randomUUID();
    await client.query(
      "INSERT INTO statements (id, user_key, text, weight, domain) VALUES ($1, $2, $3, $4, $5)",
      [statementId, userKey, text, weight, domain]
    );

    for (const tag of tags) {
      await client.query(
        "INSERT INTO statement_tags (statement_id, user_key, tag) VALUES ($1, $2, $3)",
        [statementId, userKey, String(tag).toLowerCase()]
      );
    }

    await client.query("COMMIT");
    return NextResponse.json({ id: statementId });
  } catch {
    await client.query("ROLLBACK");
    return NextResponse.json({ error: "failed" }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userKey = String(searchParams.get("userKey") || "");
  const domain = searchParams.get("domain");

  if (!userKey) {
    return NextResponse.json({ error: "userKey required" }, { status: 400 });
  }

  const pool = getPool();
  const values: Array<string> = [userKey];
  let where = "s.user_key = $1";
  if (domain) {
    values.push(domain);
    where += ` AND s.domain = $${values.length}`;
  }

  const { rows } = await pool.query(
    `
    SELECT s.id, s.text, s.weight, s.domain, s.created_at,
      COALESCE(array_agg(st.tag ORDER BY st.tag) FILTER (WHERE st.tag IS NOT NULL), '{}') AS tags
    FROM statements s
    LEFT JOIN statement_tags st ON s.id = st.statement_id AND s.user_key = st.user_key
    WHERE ${where}
    GROUP BY s.id, s.text, s.weight, s.domain, s.created_at
    ORDER BY s.created_at DESC
  `,
    values
  );

  return NextResponse.json({ statements: rows });
}
