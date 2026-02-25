import { NextResponse } from "next/server";
import { getPool } from "../../../lib/db";

export const runtime = "nodejs";

const MAX_TASKS = 50;

export async function POST(request: Request) {
  const payload = await request.json();
  const userKey = String(payload.userKey || "");
  const title = String(payload.title || "Untitled problem").trim().slice(0, 120);
  const availableMinutes = Number(payload.availableMinutes || 0);
  const tasks = Array.isArray(payload.tasks) ? payload.tasks.slice(0, MAX_TASKS) : [];

  if (!userKey) {
    return NextResponse.json({ error: "userKey required" }, { status: 400 });
  }
  if (!availableMinutes || availableMinutes <= 0 || availableMinutes > 1440) {
    return NextResponse.json({ error: "available minutes must be > 0" }, { status: 400 });
  }

  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const problemId = crypto.randomUUID();
    await client.query(
      "INSERT INTO problems (id, user_key, title, params) VALUES ($1, $2, $3, $4)",
      [problemId, userKey, title, { availableMinutes }]
    );

    for (const task of tasks) {
      const duration = Number(task.duration_min || 0);
      if (!duration || duration <= 0 || duration > 480) {
        continue;
      }
      await client.query(
        "INSERT INTO tasks (id, problem_id, user_key, label, duration_min, must, constraints) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [
          crypto.randomUUID(),
          problemId,
          userKey,
          String(task.label || "").slice(0, 140),
          duration,
          Boolean(task.must),
          task.constraints || null
        ]
      );
    }

    await client.query("COMMIT");
    return NextResponse.json({ id: problemId });
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
  if (!userKey) {
    return NextResponse.json({ error: "userKey required" }, { status: 400 });
  }

  const pool = getPool();
  const { rows } = await pool.query(
    `
    SELECT p.id, p.title, p.params, p.created_at,
      COUNT(t.id) AS task_count
    FROM problems p
    LEFT JOIN tasks t ON p.id = t.problem_id AND p.user_key = t.user_key
    WHERE p.user_key = $1
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `,
    [userKey]
  );

  return NextResponse.json({ problems: rows });
}
