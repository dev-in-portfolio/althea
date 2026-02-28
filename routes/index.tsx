import { HandlerContext, PageProps } from "$fresh/server.ts";
import { ensureDeviceKey } from "../utils/device.ts";
import { getUserId, sql } from "../lib/db.ts";
import CreatePage from "../islands/CreatePage.tsx";

type Page = {
  id: string;
  title: string;
  slug: string;
  status: string;
  published_slug: string | null;
  updated_at: string;
};

type Data = {
  pages: Page[];
};

export const handler = async (req: Request, ctx: HandlerContext) => {
  const { deviceKey } = ensureDeviceKey(req);
  const userId = await getUserId(deviceKey);
  const pages = await sql<Page[]>`
    select id, title, slug, status, published_slug, updated_at
    from dr_pages
    where user_id = ${userId}
    order by updated_at desc
  `;
  const response = await ctx.render({ pages });
  return ensureDeviceKey(req, response);
};

export default function Dashboard({ data }: PageProps<Data>) {
  return (
    <div class="page">
      <header class="hero">
        <h1>Draft Relay</h1>
        <p>Compose, reorder, and publish card-driven pages.</p>
      </header>
      <CreatePage />
      <section class="grid">
        {data.pages.map((page) => (
          <article key={page.id} class="card">
            <div class="card-header">
              <div>
                <h3>{page.title}</h3>
                <span class="muted">/{page.slug}</span>
              </div>
              <span class={`pill ${page.status}`}>{page.status}</span>
            </div>
            <p class="muted">Updated {new Date(page.updated_at).toLocaleString()}</p>
            <div class="actions">
              <a class="button" href={`/edit/${page.id}`}>
                Open Editor
              </a>
              {page.published_slug ? (
                <a class="button ghost" href={`/p/${page.published_slug}`} target="_blank">
                  Public Link
                </a>
              ) : null}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
