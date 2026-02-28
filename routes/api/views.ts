import { HandlerContext } from "$fresh/server.ts";
import { ensureDeviceKey } from "../../utils/device.ts";
import { getUserId, sql } from "../../lib/db.ts";

export const handler = async (req: Request, _ctx: HandlerContext) => {
  const { deviceKey, response } = ensureDeviceKey(req);
  const userId = await getUserId(deviceKey);
  const url = new URL(req.url);

  if (req.method === "GET") {
    const views = await sql`select id, name, state, updated_at from fresh_views where user_id = ${userId}`;
    return new Response(JSON.stringify({ views }), {
      headers: { "content-type": "application/json" },
    });
  }

  if (req.method === "POST") {
    const body = await req.json().catch(() => ({}));
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const state = body.state ?? {};
    if (!name) {
      return new Response(JSON.stringify({ error: "name is required" }), { status: 400 });
    }
    const rows = await sql`
      insert into fresh_views (user_id, name, route, state)
      values (${userId}, ${name}, '/', ${state})
      on conflict (user_id, name)
      do update set state = excluded.state, updated_at = now()
      returning id, name, state, updated_at
    `;
    return new Response(JSON.stringify({ view: rows[0] }), {
      headers: { "content-type": "application/json" },
    });
  }

  if (req.method === "DELETE") {
    const id = url.searchParams.get("id");
    if (!id) return new Response(JSON.stringify({ error: "id is required" }), { status: 400 });
    await sql`delete from fresh_views where user_id = ${userId} and id = ${id}`;
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "content-type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
};
