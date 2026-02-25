import { NextResponse } from "next/server";
import { getPool } from "../../../../lib/db";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(request.url);
  const userKey = String(searchParams.get("userKey") || "");
  const problemId = params.id;

  if (!userKey) {
    return NextResponse.json({ error: "userKey required" }, { status: 400 });
  }

  const pool = getPool();
  const problemResult = await pool.query(
    "SELECT id, title, params, created_at FROM problems WHERE id = $1 AND user_key = $2",
    [problemId, userKey]
  );

  if (!problemResult.rows.length) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const tasksResult = await pool.query(
    "SELECT id, label, duration_min, must, constraints FROM tasks WHERE problem_id = $1 AND user_key = $2 ORDER BY created_at ASC",
    [problemId, userKey]
  );

  return NextResponse.json({ problem: problemResult.rows[0], tasks: tasksResult.rows });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(request.url);
  const userKey = String(searchParams.get("userKey") || "");
  const problemId = params.id;

  if (!userKey) {
    return NextResponse.json({ error: "userKey required" }, { status: 400 });
  }

  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM solutions WHERE problem_id = $1 AND user_key = $2", [problemId, userKey]);
    await client.query("DELETE FROM tasks WHERE problem_id = $1 AND user_key = $2", [problemId, userKey]);
    await client.query("DELETE FROM problems WHERE id = $1 AND user_key = $2", [problemId, userKey]);
    await client.query("COMMIT");
    return NextResponse.json({ deleted: true });
  } catch {
    await client.query("ROLLBACK");
    return NextResponse.json({ error: "failed" }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const payload = await request.json();
  const userKey = String(payload.userKey || "");
  const problemId = params.id;
  const title = String(payload.title || "Untitled problem").trim().slice(0, 120);
  const availableMinutes = Number(payload.availableMinutes || 0);
  const tasks = Array.isArray(payload.tasks) ? payload.tasks : [];

  if (!userKey) {
    return NextResponse.json({ error: "userKey required" }, { status: 400 });
  }
  if (!availableMinutes || availableMinutes <= 0 || availableMinutes > 1440) {
    return NextResponse.json({ error: "available minutes must be 1-1440" }, { status: 400 });
  }

  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "UPDATE problems SET title = $1, params = $2 WHERE id = $3 AND user_key = $4",
      [title, { availableMinutes }, problemId, userKey]
    );
    await client.query("DELETE FROM tasks WHERE problem_id = $1 AND user_key = $2", [problemId, userKey]);

    for (const task of tasks) {
      const duration = Number(task.duration_min || 0);
      if (!duration || duration <= 0 || duration > 480) continue;
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
    return NextResponse.json({ ok: true });
  } catch {
    await client.query("ROLLBACK");
    return NextResponse.json({ error: "failed" }, { status: 500 });
  } finally {
    client.release();
  }
}
