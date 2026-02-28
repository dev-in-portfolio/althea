import { HandlerContext, PageProps } from "$fresh/server.ts";
import FiltersIsland from "../islands/Filters.tsx";
import { items, type Item } from "../lib/items.ts";
import { ensureDeviceKey } from "../utils/device.ts";

type Data = {
  items: Item[];
  total: number;
  query: Record<string, string>;
};

export const handler = async (req: Request, ctx: HandlerContext) => {
  const url = new URL(req.url);
  const search = url.searchParams.get("search")?.toLowerCase() ?? "";
  const tag = url.searchParams.get("tag") ?? "";
  const sort = url.searchParams.get("sort") ?? "newest";
  const page = Number(url.searchParams.get("page") ?? "1");
  const pageSize = 12;

  let filtered = items.filter((item) =>
    (!search || item.title.toLowerCase().includes(search)) &&
    (!tag || item.tags.includes(tag))
  );

  filtered = [...filtered].sort((a, b) => {
    if (sort === "score") return b.score - a.score;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const total = filtered.length;
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const response = await ctx.render({
    items: paged,
    total,
    query: {
      search,
      tag,
      sort,
      page: String(page),
    },
  });

  return ensureDeviceKey(req, response);
};

export default function Home({ data }: PageProps<Data>) {
  return (
    <div class="page">
      <header class="hero">
        <h1>Island Index</h1>
        <p>
          Fresh SSR index with islands that manage filters, saved views, and live
          pagination.
        </p>
      </header>
      <FiltersIsland initialQuery={data.query} total={data.total} />
      <section class="grid">
        {data.items.map((item) => (
          <article key={item.id} class="card">
            <div class="card-header">
              <h3>{item.title}</h3>
              <span class="pill">Score {item.score}</span>
            </div>
            <p>{item.summary}</p>
            <div class="meta">
              <span>{new Date(item.createdAt).toLocaleDateString()}</span>
              <span>{item.tags.join(" · ")}</span>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
