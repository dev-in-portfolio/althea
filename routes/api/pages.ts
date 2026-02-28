import { HandlerContext } from "$fresh/server.ts";
import { ensureDeviceKey } from "../../utils/device.ts";
import { getUserId, sql } from "../../lib/db.ts";

export const handler = async (req: Request, _ctx: HandlerContext) => {
  const { deviceKey } = ensureDeviceKey(req);
  const userId = await getUserId(deviceKey);

  if (req.method === "GET") {
    const pages = await sql`
      select id, title, slug, status, published_slug, updated_at
      from dr_pages
      where user_id = ${userId}
      order by updated_at desc
    `;
    return new Response(JSON.stringify({ pages }), {
      headers: { "content-type": "application/json" },
    });
  }

  if (req.method === "POST") {
    const body = await req.json().catch(() => ({}));
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const slug = typeof body.slug === "string" ? body.slug.trim() : "";
    if (!title || !slug) {
      return new Response(JSON.stringify({ error: "title and slug required" }), { status: 400 });
    }
    const rows = await sql`
      insert into dr_pages (user_id, title, slug)
      values (${userId}, ${title}, ${slug})
      returning id, title, slug, status, published_slug, updated_at
    `;
    return new Response(JSON.stringify({ page: rows[0] }), {
      headers: { "content-type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
};
