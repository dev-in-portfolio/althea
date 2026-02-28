import { neon } from "@neon/serverless";

const DATABASE_URL = Deno.env.get("DATABASE_URL") ?? "";

if (!DATABASE_URL) {
  console.warn("DATABASE_URL is not set. Rule Furnace will fail to persist.");
}

export const sql = neon(DATABASE_URL);

export async function getUserId(deviceKey: string) {
  const rows = await sql<{ id: string }[]>`
    insert into users (device_key)
    values (${deviceKey})
    on conflict (device_key) do update set device_key = excluded.device_key
    returning id
  `;
  return rows[0].id;
}
