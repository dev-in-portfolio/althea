import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { pool } from "~/utils/db.server";

export async function loader({ params }: LoaderFunctionArgs) {
  const { rows } = await pool.query(
    `select id, kind, status, payload, priority, attempts, max_attempts, available_at, lease_owner, lease_until, last_error
     from jobs where id = $1`,
    [params.id]
  );
  if (!rows[0]) throw new Response("Not Found", { status: 404 });
  return json({ job: rows[0] });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const form = await request.formData();
  const intent = form.get("intent");
  if (intent === "retry") {
    await pool.query(
      `update jobs set status = 'ready', available_at = now(), last_error = '' where id = $1`,
      [params.id]
    );
  }
  if (intent === "dead") {
    await pool.query(
      `update jobs set status = 'dead', updated_at = now() where id = $1`,
      [params.id]
    );
  }
  if (intent === "extend") {
    await pool.query(
      `update jobs set lease_until = now() + interval '60 seconds' where id = $1`,
      [params.id]
    );
  }
  return redirect("/jobs");
}

export default function JobDetail() {
  const { job } = useLoaderData<typeof loader>();
  return (
    <div className="shell">
      <h1>Job {job.id}</h1>
      <div className="panel">
        <p>Status: {job.status}</p>
        <p>Kind: {job.kind}</p>
        <pre>{JSON.stringify(job.payload, null, 2)}</pre>
        <p className="muted">Attempts {job.attempts}/{job.max_attempts}</p>
        <p className="muted">Last error {job.last_error || "—"}</p>
      </div>
      <Form method="post" className="row">
        <button name="intent" value="retry">Retry Now</button>
        <button name="intent" value="dead" className="danger">Send to Dead</button>
        <button name="intent" value="extend" className="ghost">Extend Lease</button>
      </Form>
    </div>
  );
}
