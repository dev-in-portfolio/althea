import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";
import { pool } from "~/utils/db.server";

type Counts = {
  ready: number;
  running: number;
  done: number;
  failed: number;
  dead: number;
};

export async function loader({ request }: LoaderFunctionArgs) {
  const passcode = process.env.APP_PASSCODE;
  if (passcode && request.headers.get("x-passcode") !== passcode) {
    // simple gate for now; UI can pass header later
  }
  const { rows } = await pool.query(
    "select status, count(*)::int as count from jobs group by status"
  );
  const counts: Counts = { ready: 0, running: 0, done: 0, failed: 0, dead: 0 };
  for (const row of rows) {
    counts[row.status as keyof Counts] = row.count;
  }
  return json({ counts });
}

export default function Dashboard() {
  const { counts } = useLoaderData<typeof loader>();
  return (
    <div className="shell">
      <header>
        <h1>QueueSplice</h1>
        <p className="muted">Job queue with leasing, retries, and dead-letter handling.</p>
      </header>
      <section className="panel row">
        <div className="pill ok">Ready {counts.ready}</div>
        <div className="pill warn">Running {counts.running}</div>
        <div className="pill">Done {counts.done}</div>
        <div className="pill warn">Failed {counts.failed}</div>
        <div className="pill bad">Dead {counts.dead}</div>
      </section>
      <section className="row">
        <Link className="pill" to="/jobs">Jobs</Link>
        <Link className="pill" to="/enqueue">Enqueue</Link>
      </section>
      <Form method="post" action="/r/reap">
        <button type="submit">Reap Expired Leases</button>
      </Form>
    </div>
  );
}
