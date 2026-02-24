import { Client } from "pg";

export async function getClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;
  const client = new Client({ connectionString });
  await client.connect();
  return client;
}
