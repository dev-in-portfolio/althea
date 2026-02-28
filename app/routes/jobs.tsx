import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { pool } from "~/utils/db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const kind = url.searchParams.get("kind");
  const { rows } = await pool.query(
    `select id, kind, status, priority, attempts, max_attempts, available_at, lease_owner, lease_until, updated_at
     from jobs
     where ($1::text is null or status = $1)
       and ($2::text is null or kind = $2)
     order by updated_at desc
     limit 200`,
    [status, kind]
  );
  return json({ jobs: rows });
}

export default function Jobs() {
  const { jobs } = useLoaderData<typeof loader>();
  return (
    <div className="shell">
      <h1>Jobs</h1>
      <div className="grid">
        {jobs.map((job: any) => (
          <div className="panel" key={job.id}>
            <div className="row">
              <strong>{job.kind}</strong>
              <span className={`pill ${job.status}`}>{job.status}</span>
            </div>
            <p className="muted">Attempts {job.attempts}/{job.max_attempts}</p>
            <p className="muted">Lease: {job.lease_owner || "—"}</p>
            <Link to={`/jobs/${job.id}`}>Open</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
