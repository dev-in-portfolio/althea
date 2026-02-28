import pg from "pg";

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL || "";

if (!DATABASE_URL) {
  console.warn("DATABASE_URL is not set. QueueSplice will fail until configured.");
}

export const pool = new Pool({ connectionString: DATABASE_URL });

export async function withClient<T>(fn: (client: pg.PoolClient) => Promise<T>) {
  const client = await pool.connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}
