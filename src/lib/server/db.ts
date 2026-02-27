import 'server-only';
import { Pool } from 'pg';

let pool: Pool | null = null;
let dbError = '';

export function getPool() {
  if (pool) return pool;
  if (!process.env.DATABASE_URL) {
    dbError = 'DATABASE_URL is not set.';
    return null;
  }
  pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
  return pool;
}

export function getDbError() {
  return dbError;
}
