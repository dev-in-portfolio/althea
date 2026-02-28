import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { pool } from "~/utils/db.server";

export async function action({ request }: ActionFunctionArgs) {
  const body = await request.json().catch(() => ({}));
  const id = body.id;
  if (!id) return json({ error: "id required" }, { status: 400 });
  const { rows } = await pool.query(
    `update jobs set status = 'done', lease_until = null, updated_at = now() where id = $1 returning *`,
    [id]
  );
  return json({ job: rows[0] });
}
