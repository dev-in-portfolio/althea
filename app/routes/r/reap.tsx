import type { ActionFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { pool } from "~/utils/db.server";

export async function action({}: ActionFunctionArgs) {
  await pool.query(
    `update jobs
     set status = 'ready',
         lease_owner = '',
         lease_until = null,
         updated_at = now()
     where status = 'running' and lease_until < now()`
  );
  return redirect("/");
}
