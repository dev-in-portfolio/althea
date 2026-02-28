import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { withClient } from "~/utils/db.server";

export async function action({ request }: ActionFunctionArgs) {
  const body = await request.json().catch(() => ({}));
  const workerId = body.workerId || "worker";
  const leaseSeconds = 60;

  const job = await withClient(async (client) => {
    await client.query("begin");
    const { rows } = await client.query(
      `select id from jobs
       where status = 'ready' and available_at <= now()
       order by priority desc, available_at asc
       limit 1
       for update skip locked`
    );
    if (!rows[0]) {
      await client.query("commit");
      return null;
    }
    const { rows: updated } = await client.query(
      `update jobs
       set status = 'running',
           lease_owner = $1,
           lease_until = now() + interval '${leaseSeconds} seconds',
           attempts = attempts + 1,
           updated_at = now()
       where id = $2
       returning *`,
      [workerId, rows[0].id]
    );
    await client.query("commit");
    return updated[0];
  });

  return json({ job });
}
