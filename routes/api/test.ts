import { HandlerContext } from "$fresh/server.ts";
import { ensureDeviceKey } from "../../utils/device.ts";
import { getUserId, sql } from "../../lib/db.ts";
import { evaluateExpression } from "../../lib/eval.ts";

const MAX_INPUT = 65536;

export const handler = async (req: Request, _ctx: HandlerContext) => {
  const { deviceKey } = ensureDeviceKey(req);
  const userId = await getUserId(deviceKey);
  const body = await req.json().catch(() => ({}));
  const input = body.input ?? {};
  if (JSON.stringify(input).length > MAX_INPUT) {
    return new Response(JSON.stringify({ error: "input too large" }), { status: 400 });
  }

  const rules = await sql`
    select id, name, priority, is_enabled, when_expr, then_json
    from rf_rules
    where user_id = ${userId} and is_enabled = true
    order by priority desc
  `;

  const matched = [];
  let output: Record<string, unknown> = {};

  for (const rule of rules) {
    const match = evaluateExpression(rule.when_expr, input);
    if (match) {
      matched.push(rule.id);
      output = { ...output, ...(rule.then_json ?? {}) };
    }
  }

  await sql`
    insert into rf_test_runs (user_id, input_json, matched_rule_ids, output_json)
    values (${userId}, ${input}, ${matched}, ${output})
  `;

  return new Response(JSON.stringify({ matched, output }), {
    headers: { "content-type": "application/json" },
  });
};
