import { HandlerContext, PageProps } from "$fresh/server.ts";
import { ensureDeviceKey } from "../utils/device.ts";
import { sql, getUserId } from "../lib/db.ts";

type View = {
  id: string;
  name: string;
  state: Record<string, string>;
  updated_at: string;
};

type Data = {
  views: View[];
};

export const handler = async (req: Request, ctx: HandlerContext) => {
  const { deviceKey, response } = ensureDeviceKey(req);
  const userId = await getUserId(deviceKey);
  const views = await sql<View[]>`
    select id, name, state, updated_at
    from fresh_views
    where user_id = ${userId}
    order by updated_at desc
  `;
  const res = await ctx.render({ views });
  return ensureDeviceKey(req, res);
};

export default function Views({ data }: PageProps<Data>) {
  return (
    <div class="page">
      <header class="hero">
        <h1>Saved Views</h1>
        <p>Manage the filter presets saved to Neon.</p>
      </header>
      <section class="grid">
        {data.views.map((view) => (
          <article key={view.id} class="card">
            <h3>{view.name}</h3>
            <p class="muted">Updated {new Date(view.updated_at).toLocaleString()}</p>
            <pre class="code">{JSON.stringify(view.state, null, 2)}</pre>
            <div class="actions">
              <a class="button" href={`/?${new URLSearchParams(view.state).toString()}`}>
                Apply View
              </a>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
