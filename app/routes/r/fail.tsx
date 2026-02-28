import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { pool } from "~/utils/db.server";

export async function action({ request }: ActionFunctionArgs) {
  const body = await request.json().catch(() => ({}));
  const id = body.id;
  const error = body.error || "Failed";
  if (!id) return json({ error: "id required" }, { status: 400 });

  const { rows } = await pool.query(
    `select attempts, max_attempts from jobs where id = $1`,
    [id]
  );
  if (!rows[0]) return json({ error: "job not found" }, { status: 404 });
  const attempts = rows[0].attempts;
  const maxAttempts = rows[0].max_attempts;
  if (attempts >= maxAttempts) {
    const { rows: dead } = await pool.query(
      `update jobs set status = 'dead', last_error = $2, updated_at = now() where id = $1 returning *`,
      [id, error]
    );
    return json({ job: dead[0], status: "dead" });
  }
  const delay = Math.min(Math.pow(2, attempts), 60);
  const { rows: failed } = await pool.query(
    `update jobs
     set status = 'failed',
         last_error = $2,
         available_at = now() + ($3 || ' minutes')::interval,
         updated_at = now()
     where id = $1
     returning *`,
    [id, error, delay]
  );
  return json({ job: failed[0], status: "failed" });
}
