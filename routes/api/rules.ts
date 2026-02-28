import { HandlerContext } from "$fresh/server.ts";
import { ensureDeviceKey } from "../../utils/device.ts";
import { getUserId, sql } from "../../lib/db.ts";

const MAX_RULES = 10000;
const MAX_EXPR = 2000;
const MAX_THEN = 32768;

export const handler = async (req: Request, _ctx: HandlerContext) => {
  const { deviceKey } = ensureDeviceKey(req);
  const userId = await getUserId(deviceKey);

  if (req.method === "GET") {
    const rules = await sql`
      select id, name, priority, is_enabled, when_expr, then_json
      from rf_rules
      where user_id = ${userId}
      order by priority desc
    `;
    return new Response(JSON.stringify({ rules }), { headers: { "content-type": "application/json" } });
  }

  if (req.method === "POST") {
    const body = await req.json().catch(() => ({}));
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const priority = Number(body.priority ?? 0);
    const whenExpr = typeof body.when_expr === "string" ? body.when_expr.trim() : "";
    const thenJson = body.then_json ?? {};
    const isEnabled = Boolean(body.is_enabled ?? true);
    if (!name || !whenExpr) {
      return new Response(JSON.stringify({ error: "name and when_expr required" }), { status: 400 });
    }
    if (whenExpr.length > MAX_EXPR) {
      return new Response(JSON.stringify({ error: "when_expr too long" }), { status: 400 });
    }
    if (JSON.stringify(thenJson).length > MAX_THEN) {
      return new Response(JSON.stringify({ error: "then_json too large" }), { status: 400 });
    }
    const countRows = await sql<{ count: number }[]>`
      select count(*)::int as count from rf_rules where user_id = ${userId}
    `;
    if ((countRows[0]?.count ?? 0) >= MAX_RULES) {
      return new Response(JSON.stringify({ error: "rule limit reached" }), { status: 400 });
    }
    const rows = await sql`
      insert into rf_rules (user_id, name, priority, is_enabled, when_expr, then_json)
      values (${userId}, ${name}, ${priority}, ${isEnabled}, ${whenExpr}, ${thenJson})
      returning id, name, priority, is_enabled, when_expr, then_json
    `;
    return new Response(JSON.stringify({ rule: rows[0] }), { headers: { "content-type": "application/json" } });
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
};
