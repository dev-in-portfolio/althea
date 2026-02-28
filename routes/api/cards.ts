import { HandlerContext } from "$fresh/server.ts";
import { sql } from "../../lib/db.ts";

const MAX_CARDS = 500;
const MAX_BODY = 20000;

export const handler = async (req: Request, _ctx: HandlerContext) => {
  if (req.method === "GET") {
    const url = new URL(req.url);
    const pageId = url.searchParams.get("pageId");
    if (!pageId) return new Response(JSON.stringify({ error: "pageId required" }), { status: 400 });
    const cards = await sql`
      select id, type, ord, title, body, image_url, embed_url
      from dr_cards
      where page_id = ${pageId}
      order by ord asc
    `;
    return new Response(JSON.stringify({ cards }), { headers: { "content-type": "application/json" } });
  }

  const body = await req.json().catch(() => ({}));
  if (req.method === "POST") {
    const { pageId, type, title = "", body: text = "", imageUrl = "", embedUrl = "", ord } = body;
    if (!pageId || !type) return new Response(JSON.stringify({ error: "pageId and type required" }), { status: 400 });
    if (text.length > MAX_BODY) return new Response(JSON.stringify({ error: "body too long" }), { status: 400 });
    const { rows: countRows } = await sql<{ count: number }[]>`
      select count(*)::int as count from dr_cards where page_id = ${pageId}
    `;
    if ((countRows[0]?.count ?? 0) >= MAX_CARDS) {
      return new Response(JSON.stringify({ error: "max cards reached" }), { status: 400 });
    }
    const rows = await sql`
      insert into dr_cards (page_id, type, ord, title, body, image_url, embed_url)
      values (${pageId}, ${type}, ${ord ?? countRows[0].count + 1}, ${title}, ${text}, ${imageUrl}, ${embedUrl})
      returning id, type, ord, title, body, image_url, embed_url
    `;
    return new Response(JSON.stringify({ card: rows[0] }), { headers: { "content-type": "application/json" } });
  }

  if (req.method === "PATCH") {
    const { id, title, body: text, imageUrl, embedUrl, ord } = body;
    if (!id) return new Response(JSON.stringify({ error: "id required" }), { status: 400 });
    if (text && text.length > MAX_BODY) return new Response(JSON.stringify({ error: "body too long" }), { status: 400 });
    const rows = await sql`
      update dr_cards
      set title = coalesce(${title}, title),
          body = coalesce(${text}, body),
          image_url = coalesce(${imageUrl}, image_url),
          embed_url = coalesce(${embedUrl}, embed_url),
          ord = coalesce(${ord}, ord)
      where id = ${id}
      returning id, type, ord, title, body, image_url, embed_url
    `;
    return new Response(JSON.stringify({ card: rows[0] }), { headers: { "content-type": "application/json" } });
  }

  if (req.method === "DELETE") {
    const { id } = body;
    if (!id) return new Response(JSON.stringify({ error: "id required" }), { status: 400 });
    await sql`delete from dr_cards where id = ${id}`;
    return new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json" } });
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
};
