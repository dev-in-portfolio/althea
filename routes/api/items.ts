import { HandlerContext } from "$fresh/server.ts";
import { items } from "../../lib/items.ts";

export const handler = (_req: Request, _ctx: HandlerContext) => {
  return new Response(JSON.stringify({ items }), {
    headers: { "content-type": "application/json" },
  });
};
