import { HandlerContext, PageProps } from "$fresh/server.ts";
import { ensureDeviceKey } from "../utils/device.ts";
import { getUserId, sql } from "../lib/db.ts";

type Rule = {
  id: string;
  name: string;
  priority: number;
  is_enabled: boolean;
  when_expr: string;
  then_json: Record<string, unknown>;
};

type Data = {
  rules: Rule[];
};

export const handler = async (req: Request, ctx: HandlerContext) => {
  const { deviceKey } = ensureDeviceKey(req);
  const userId = await getUserId(deviceKey);
  const rules = await sql<Rule[]>`
    select id, name, priority, is_enabled, when_expr, then_json
    from rf_rules
    where user_id = ${userId}
    order by priority desc
  `;
  const response = await ctx.render({ rules });
  return ensureDeviceKey(req, response);
};

export default function RulesList({ data }: PageProps<Data>) {
  return (
    <div class="page">
      <header class="hero">
        <h1>Rule Furnace</h1>
        <p>Define rules, test payloads, and inspect runs.</p>
      </header>
      <div class="actions">
        <a class="button" href="/rules/new">
          New Rule
        </a>
        <a class="button ghost" href="/test">
          Test Harness
        </a>
        <a class="button ghost" href="/runs">
          Run History
        </a>
      </div>
      <section class="grid">
        {data.rules.map((rule) => (
          <article class="card" key={rule.id}>
            <div class="card-header">
              <h3>{rule.name}</h3>
              <span class={`pill ${rule.is_enabled ? "on" : "off"}`}>
                {rule.is_enabled ? "Enabled" : "Disabled"}
              </span>
            </div>
            <p class="muted">Priority {rule.priority}</p>
            <p class="code">{rule.when_expr}</p>
            <pre class="code">{JSON.stringify(rule.then_json, null, 2)}</pre>
            <div class="actions">
              <a class="button" href={`/rules/${rule.id}`}>
                Edit
              </a>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
