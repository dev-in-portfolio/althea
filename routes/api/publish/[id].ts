import { HandlerContext } from "$fresh/server.ts";
import { sql } from "../../../lib/db.ts";

export const handler = async (req: Request, ctx: HandlerContext) => {
  const { id } = ctx.params;
  const body = await req.json().catch(() => ({}));
  const action = body.action ?? "publish";

  if (action === "unpublish") {
    const rows = await sql`
      update dr_pages
      set status = 'draft', published_slug = null, updated_at = now()
      where id = ${id}
      returning id, status, published_slug
    `;
    return new Response(JSON.stringify({ page: rows[0] }), { headers: { "content-type": "application/json" } });
  }

  const publishedSlug = body.publishedSlug ?? `relay-${crypto.randomUUID().slice(0, 8)}`;
  const rows = await sql`
    update dr_pages
    set status = 'published',
        published_slug = ${publishedSlug},
        updated_at = now()
    where id = ${id}
    returning id, status, published_slug
  `;
  return new Response(JSON.stringify({ page: rows[0] }), { headers: { "content-type": "application/json" } });
};
