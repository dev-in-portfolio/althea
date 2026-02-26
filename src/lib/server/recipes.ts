import { getDbError, getPool } from './db';
import type { SurfaceSettings } from '$lib/presets/types';

function requirePool() {
  const pool = getPool();
  if (!pool) {
    throw new Error(getDbError() || 'Database is unavailable.');
  }
  return pool;
}

export async function listRecipes(userKey: string) {
  const pool = requirePool();
  const result = await pool.query(
    'select id, name, settings, created_at from surface_recipes where user_key = $1 order by created_at desc',
    [userKey]
  );
  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    settings: row.settings,
    createdAt: row.created_at
  }));
}

export async function createRecipe(userKey: string, name: string, settings: SurfaceSettings) {
  const pool = requirePool();
  const result = await pool.query(
    'insert into surface_recipes (user_key, name, settings) values ($1, $2, $3) returning id',
    [userKey, name.trim(), settings]
  );
  return result.rows[0];
}

export async function getRecipe(userKey: string, id: string) {
  const pool = requirePool();
  const result = await pool.query(
    'select id, name, settings, created_at, updated_at from surface_recipes where id = $1 and user_key = $2',
    [id, userKey]
  );
  if (result.rowCount === 0) return null;
  const row = result.rows[0];
  return {
    id: row.id,
    name: row.name,
    settings: row.settings,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function updateRecipe(userKey: string, id: string, name: string, settings: SurfaceSettings) {
  const pool = requirePool();
  const result = await pool.query(
    'update surface_recipes set name = $1, settings = $2 where id = $3 and user_key = $4',
    [name.trim(), settings, id, userKey]
  );
  return result.rowCount > 0;
}

export async function deleteRecipe(userKey: string, id: string) {
  const pool = requirePool();
  const result = await pool.query(
    'delete from surface_recipes where id = $1 and user_key = $2',
    [id, userKey]
  );
  return result.rowCount > 0;
}

export async function duplicateRecipe(userKey: string, id: string) {
  const pool = requirePool();
  const result = await pool.query(
    'insert into surface_recipes (user_key, name, settings) select user_key, name || " Copy", settings from surface_recipes where id = $1 and user_key = $2 returning id',
    [id, userKey]
  );
  if (result.rowCount === 0) return null;
  return result.rows[0];
}

export async function countRecipes(userKey: string) {
  const pool = requirePool();
  const result = await pool.query(
    'select count(*)::int as count from surface_recipes where user_key = $1',
    [userKey]
  );
  return result.rows[0]?.count ?? 0;
}
