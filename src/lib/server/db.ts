import { Pool } from 'pg';

const databaseUrl = process.env.DATABASE_URL || '';

if (!databaseUrl) {
  console.warn('DATABASE_URL is not set.');
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: databaseUrl ? { rejectUnauthorized: false } : undefined
});

export function getPool() {
  return pool;
}
