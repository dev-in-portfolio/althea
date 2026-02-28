import { HandlerContext } from "$fresh/server.ts";
import { sql } from "../../../lib/db.ts";

const MAX_EXPR = 2000;
const MAX_THEN = 32768;

export const handler = async (req: Request, ctx: HandlerContext) => {
  const { id } = ctx.params;
  const body = await req.json().catch(() => ({}));

  if (req.method === "PATCH") {
    const name = typeof body.name === "string" ? body.name.trim() : null;
    const priority = body.priority != null ? Number(body.priority) : null;
    const whenExpr = typeof body.when_expr === "string" ? body.when_expr.trim() : null;
    const thenJson = body.then_json ?? null;
    const isEnabled = typeof body.is_enabled === "boolean" ? body.is_enabled : null;
    if (whenExpr && whenExpr.length > MAX_EXPR) {
      return new Response(JSON.stringify({ error: "when_expr too long" }), { status: 400 });
    }
    if (thenJson && JSON.stringify(thenJson).length > MAX_THEN) {
      return new Response(JSON.stringify({ error: "then_json too large" }), { status: 400 });
    }
    const rows = await sql`
      update rf_rules
      set name = coalesce(${name}, name),
          priority = coalesce(${priority}, priority),
          when_expr = coalesce(${whenExpr}, when_expr),
          then_json = coalesce(${thenJson}, then_json),
          is_enabled = coalesce(${isEnabled}, is_enabled),
          updated_at = now()
      where id = ${id}
      returning id, name, priority, is_enabled, when_expr, then_json
    `;
    return new Response(JSON.stringify({ rule: rows[0] }), { headers: { "content-type": "application/json" } });
  }

  if (req.method === "DELETE") {
    await sql`delete from rf_rules where id = ${id}`;
    return new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json" } });
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
};
