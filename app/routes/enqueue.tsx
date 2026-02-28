import type { ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form } from "@remix-run/react";
import { pool } from "~/utils/db.server";

const MAX_PAYLOAD = 65536;
const MAX_ATTEMPTS = 20;

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  const kind = String(form.get("kind") || "").trim();
  const payloadRaw = String(form.get("payload") || "{}");
  const priority = Number(form.get("priority") || 0);
  const maxAttempts = Math.min(Number(form.get("maxAttempts") || 5), MAX_ATTEMPTS);
  if (!kind) return json({ error: "kind is required" }, { status: 400 });
  if (payloadRaw.length > MAX_PAYLOAD) return json({ error: "payload too large" }, { status: 400 });

  const payload = JSON.parse(payloadRaw);
  await pool.query(
    `insert into jobs (kind, payload, priority, max_attempts)
     values ($1, $2, $3, $4)`,
    [kind, payload, priority, maxAttempts]
  );
  return redirect("/jobs");
}

export default function Enqueue() {
  return (
    <div className="shell">
      <h1>Enqueue Job</h1>
      <Form method="post" className="panel">
        <div className="row">
          <input name="kind" placeholder="kind" />
          <input name="priority" type="number" placeholder="priority" />
          <input name="maxAttempts" type="number" placeholder="max attempts" />
        </div>
        <textarea name="payload" rows={6} defaultValue={`{ "task": "example" }`} />
        <button type="submit">Create Job</button>
      </Form>
    </div>
  );
}
