import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";
import { pool } from "~/utils/db.server";

export async function loader({}: LoaderFunctionArgs) {
  const { rows } = await pool.query(
    `select id, name, key_field, created_at from diff_jobs order by created_at desc`
  );
  return json({ jobs: rows });
}

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  const name = String(form.get("name") || "").trim();
  const keyField = String(form.get("keyField") || "").trim();
  if (!name || !keyField) {
    return json({ error: "name and key field required" }, { status: 400 });
  }
  const { rows } = await pool.query(
    `insert into diff_jobs (name, key_field) values ($1, $2) returning id`,
    [name, keyField]
  );
  return redirect(`/job/${rows[0].id}`);
}

export default function Home() {
  const { jobs } = useLoaderData<typeof loader>();
  return (
    <div className="shell">
      <header>
        <h1>DiffAtlas</h1>
        <p className="muted">Compare dataset snapshots and classify changes.</p>
      </header>
      <Form method="post" className="panel">
        <div className="row">
          <input name="name" placeholder="Job name" />
          <input name="keyField" placeholder="Key field (id, slug)" />
          <button type="submit">Create Job</button>
        </div>
      </Form>
      <section className="grid">
        {jobs.map((job: any) => (
          <div className="panel" key={job.id}>
            <h3>{job.name}</h3>
            <p className="muted">Key: {job.key_field}</p>
            <Link to={`/job/${job.id}`}>Open</Link>
          </div>
        ))}
      </section>
    </div>
  );
}
