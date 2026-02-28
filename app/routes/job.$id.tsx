import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";
import { pool } from "~/utils/db.server";
import { hashRecord, parseDataset } from "~/utils/diff.server";

const MAX_UPLOAD = 10 * 1024 * 1024;

export async function loader({ params }: LoaderFunctionArgs) {
  const { rows: jobRows } = await pool.query(
    `select id, name, key_field from diff_jobs where id = $1`,
    [params.id]
  );
  if (!jobRows[0]) throw new Response("Not found", { status: 404 });
  const { rows: snapshots } = await pool.query(
    `select id, label, created_at from diff_snapshots where job_id = $1 order by created_at desc`,
    [params.id]
  );
  return json({ job: jobRows[0], snapshots });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const form = await request.formData();
  const label = String(form.get("label") || "").trim();
  const raw = String(form.get("dataset") || "");
  if (!label) return json({ error: "label required" }, { status: 400 });
  if (raw.length > MAX_UPLOAD) return json({ error: "dataset too large" }, { status: 400 });
  const { rows: jobRows } = await pool.query(
    `select key_field from diff_jobs where id = $1`,
    [params.id]
  );
  const keyField = jobRows[0].key_field;
  const records = parseDataset(raw);

  const { rows: snapRows } = await pool.query(
    `insert into diff_snapshots (job_id, label) values ($1, $2) returning id`,
    [params.id, label]
  );
  const snapshotId = snapRows[0].id;

  for (const record of records) {
    const recordKey = record[keyField];
    if (!recordKey) continue;
    const recordHash = hashRecord(record);
    await pool.query(
      `insert into diff_records (snapshot_id, record_key, record_hash, record_json)
       values ($1, $2, $3, $4)`,
      [snapshotId, String(recordKey), recordHash, record]
    );
  }
  return json({ ok: true });
}

export default function JobDetail() {
  const { job, snapshots } = useLoaderData<typeof loader>();
  return (
    <div className="shell">
      <h1>{job.name}</h1>
      <p className="muted">Key field: {job.key_field}</p>
      <Form method="post" className="panel">
        <input name="label" placeholder="Snapshot label" />
        <textarea name="dataset" rows={8} placeholder="Paste JSON array, NDJSON, or CSV" />
        <button type="submit">Create Snapshot</button>
      </Form>
      <section className="panel">
        <h2>Snapshots</h2>
        <ul>
          {snapshots.map((snap: any) => (
            <li key={snap.id}>
              {snap.label} · {new Date(snap.created_at).toLocaleString()}
            </li>
          ))}
        </ul>
        <Link to={`/job/${job.id}/compare`}>Compare Snapshots</Link>
      </section>
    </div>
  );
}
