import { HandlerContext, PageProps } from "$fresh/server.ts";
import { ensureDeviceKey } from "../../utils/device.ts";
import { sql } from "../../lib/db.ts";
import Editor from "../../islands/Editor.tsx";

type Page = {
  id: string;
  title: string;
  slug: string;
  status: string;
  published_slug: string | null;
};

type Card = {
  id: string;
  type: string;
  ord: number;
  title: string;
  body: string;
  image_url: string;
  embed_url: string;
};

type Data = {
  page: Page | null;
  cards: Card[];
};

export const handler = async (req: Request, ctx: HandlerContext) => {
  const { id } = ctx.params;
  const pageRows = await sql<Page[]>`
    select id, title, slug, status, published_slug from dr_pages where id = ${id}
  `;
  const cards = await sql<Card[]>`
    select id, type, ord, title, body, image_url, embed_url
    from dr_cards
    where page_id = ${id}
    order by ord asc
  `;
  const response = await ctx.render({ page: pageRows[0] ?? null, cards });
  return ensureDeviceKey(req, response);
};

export default function EditorPage({ data }: PageProps<Data>) {
  if (!data.page) {
    return (
      <div class="page">
        <h1>Draft not found</h1>
      </div>
    );
  }
  return (
    <div class="page">
      <header class="hero">
        <h1>{data.page.title}</h1>
        <p>Draft editor for /{data.page.slug}</p>
      </header>
      <Editor page={data.page} initialCards={data.cards} />
    </div>
  );
}
