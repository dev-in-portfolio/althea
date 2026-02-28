import { HandlerContext, PageProps } from "$fresh/server.ts";
import { ensureDeviceKey } from "../utils/device.ts";
import { getUserId, sql } from "../lib/db.ts";

type Run = {
  id: string;
  input_json: Record<string, unknown>;
  output_json: Record<string, unknown>;
  matched_rule_ids: string[];
  created_at: string;
};

type Data = {
  runs: Run[];
};

export const handler = async (req: Request, ctx: HandlerContext) => {
  const { deviceKey } = ensureDeviceKey(req);
  const userId = await getUserId(deviceKey);
  const runs = await sql<Run[]>`
    select id, input_json, output_json, matched_rule_ids, created_at
    from rf_test_runs
    where user_id = ${userId}
    order by created_at desc
    limit 50
  `;
  const response = await ctx.render({ runs });
  return ensureDeviceKey(req, response);
};

export default function Runs({ data }: PageProps<Data>) {
  return (
    <div class="page">
      <header class="hero">
        <h1>Run History</h1>
      </header>
      <section class="grid">
        {data.runs.map((run) => (
          <article class="card" key={run.id}>
            <p class="muted">Run {new Date(run.created_at).toLocaleString()}</p>
            <pre class="code">{JSON.stringify(run.input_json, null, 2)}</pre>
            <p class="muted">Matched rules: {run.matched_rule_ids.length}</p>
            <pre class="code">{JSON.stringify(run.output_json, null, 2)}</pre>
          </article>
        ))}
      </section>
    </div>
  );
}
