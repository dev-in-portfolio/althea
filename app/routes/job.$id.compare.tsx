import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { pool } from "~/utils/db.server";

export async function loader({ params }: LoaderFunctionArgs) {
  const { rows: snapshots } = await pool.query(
    `select id, label from diff_snapshots where job_id = $1 order by created_at desc`,
    [params.id]
  );
  return json({ snapshots, jobId: params.id });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const form = await request.formData();
  const baseId = String(form.get("base") || "");
  const compareId = String(form.get("compare") || "");
  if (!baseId || !compareId) return json({ error: "Select snapshots" }, { status: 400 });

  const { rows: baseRows } = await pool.query(
    `select record_key, record_hash, record_json from diff_records where snapshot_id = $1`,
    [baseId]
  );
  const { rows: compareRows } = await pool.query(
    `select record_key, record_hash, record_json from diff_records where snapshot_id = $1`,
    [compareId]
  );

  const baseMap = new Map(baseRows.map((row: any) => [row.record_key, row]));
  const compareMap = new Map(compareRows.map((row: any) => [row.record_key, row]));

  const added: any[] = [];
  const removed: any[] = [];
  const modified: any[] = [];

  for (const [key, record] of compareMap) {
    if (!baseMap.has(key)) added.push(record.record_json);
    else if (baseMap.get(key).record_hash !== record.record_hash) {
      const before = baseMap.get(key).record_json;
      const after = record.record_json;
      const changed_fields = Object.keys({ ...before, ...after }).filter(
        (field) => JSON.stringify(before[field]) !== JSON.stringify(after[field])
      );
      modified.push({ key, before, after, changed_fields });
    }
  }
  for (const [key, record] of baseMap) {
    if (!compareMap.has(key)) removed.push(record.record_json);
  }

  const { rows } = await pool.query(
    `insert into diff_results (job_id, base_snapshot, compare_snapshot, added, removed, modified)
     values ($1, $2, $3, $4, $5, $6)
     returning id`,
    [params.id, baseId, compareId, JSON.stringify(added), JSON.stringify(removed), JSON.stringify(modified)]
  );

  return redirect(`/diff/${rows[0].id}`);
}

export default function Compare() {
  const { snapshots } = useLoaderData<typeof loader>();
  return (
    <div className="shell">
      <h1>Compare Snapshots</h1>
      <Form method="post" className="panel">
        <div className="row">
          <select name="base">
            <option value="">Base snapshot</option>
            {snapshots.map((snap: any) => (
              <option key={snap.id} value={snap.id}>{snap.label}</option>
            ))}
          </select>
          <select name="compare">
            <option value="">Compare snapshot</option>
            {snapshots.map((snap: any) => (
              <option key={snap.id} value={snap.id}>{snap.label}</option>
            ))}
          </select>
          <button type="submit">Run Diff</button>
        </div>
      </Form>
    </div>
  );
}
