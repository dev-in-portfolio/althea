import { HandlerContext, PageProps } from "$fresh/server.ts";
import { sql } from "../../lib/db.ts";

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
  page: { title: string } | null;
  cards: Card[];
};

export const handler = async (_req: Request, ctx: HandlerContext) => {
  const { slug } = ctx.params;
  const pageRows = await sql<{ id: string; title: string }[]>`
    select id, title from dr_pages where published_slug = ${slug}
  `;
  const page = pageRows[0] ?? null;
  if (!page) {
    return ctx.render({ page: null, cards: [] });
  }
  const cards = await sql<Card[]>`
    select id, type, ord, title, body, image_url, embed_url
    from dr_cards
    where page_id = ${page.id}
    order by ord asc
  `;
  return ctx.render({ page, cards });
};

export default function PublicPage({ data }: PageProps<Data>) {
  if (!data.page) {
    return (
      <div class="page">
        <h1>Published page not found</h1>
      </div>
    );
  }
  return (
    <div class="page">
      <header class="hero">
        <h1>{data.page.title}</h1>
      </header>
      <section class="stack">
        {data.cards.map((card) => (
          <article key={card.id} class="card">
            <h3>{card.title}</h3>
            {card.type === "image" && card.image_url ? (
              <img src={card.image_url} alt={card.title} class="image" />
            ) : null}
            {card.type === "embed" && card.embed_url ? (
              <iframe src={card.embed_url} class="embed" />
            ) : null}
            {card.type === "quote" ? <blockquote>{card.body}</blockquote> : <p>{card.body}</p>}
          </article>
        ))}
      </section>
    </div>
  );
}
