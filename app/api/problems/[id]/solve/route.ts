import { NextResponse } from "next/server";
import { getPool } from "../../../../../lib/db";
import { solveTasks } from "../../../../../lib/solve/engine";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const payload = await request.json();
  const userKey = String(payload.userKey || "");
  const problemId = params.id;

  if (!userKey) {
    return NextResponse.json({ error: "userKey required" }, { status: 400 });
  }

  const pool = getPool();
  const problemResult = await pool.query(
    "SELECT params FROM problems WHERE id = $1 AND user_key = $2",
    [problemId, userKey]
  );
  if (!problemResult.rows.length) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const availableMinutes = Number(problemResult.rows[0].params?.availableMinutes || 0);

  const tasksResult = await pool.query(
    "SELECT id, label, duration_min, must FROM tasks WHERE problem_id = $1 AND user_key = $2",
    [problemId, userKey]
  );
  const tasks = tasksResult.rows.map((row) => ({
    id: row.id,
    label: row.label,
    duration: row.duration_min,
    must: row.must
  }));

  const result = solveTasks(availableMinutes, tasks);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM solutions WHERE problem_id = $1 AND user_key = $2", [problemId, userKey]);
    let rank = 1;
    for (const solution of result.solutions) {
      await client.query(
        "INSERT INTO solutions (id, problem_id, user_key, rank, payload) VALUES ($1, $2, $3, $4, $5)",
        [crypto.randomUUID(), problemId, userKey, rank, solution]
      );
      rank += 1;
    }
    await client.query("COMMIT");
  } catch {
    await client.query("ROLLBACK");
  } finally {
    client.release();
  }

  return NextResponse.json(result);
}
