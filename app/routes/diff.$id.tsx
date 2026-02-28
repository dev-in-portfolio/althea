import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { pool } from "~/utils/db.server";

export async function loader({ params }: LoaderFunctionArgs) {
  const { rows } = await pool.query(
    `select added, removed, modified, created_at from diff_results where id = $1`,
    [params.id]
  );
  if (!rows[0]) throw new Response("Not Found", { status: 404 });
  return json({ diff: rows[0] });
}

export default function DiffView() {
  const { diff } = useLoaderData<typeof loader>();
  const added = diff.added || [];
  const removed = diff.removed || [];
  const modified = diff.modified || [];
  return (
    <div className="shell">
      <h1>Diff Results</h1>
      <div className="row">
        <div className="pill">Added {added.length}</div>
        <div className="pill">Removed {removed.length}</div>
        <div className="pill">Modified {modified.length}</div>
      </div>
      <section className="panel">
        <h2>Added</h2>
        <pre>{JSON.stringify(added, null, 2)}</pre>
      </section>
      <section className="panel">
        <h2>Removed</h2>
        <pre>{JSON.stringify(removed, null, 2)}</pre>
      </section>
      <section className="panel">
        <h2>Modified</h2>
        <pre>{JSON.stringify(modified, null, 2)}</pre>
      </section>
    </div>
  );
}
