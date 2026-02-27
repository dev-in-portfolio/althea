import 'server-only';
import { getDbError, getPool } from './db';

function requirePool() {
  const pool = getPool();
  if (!pool) {
    throw new Error(getDbError() || 'Database unavailable.');
  }
  return pool;
}

export async function ensureUserAndPass(uid: string) {
  const pool = requirePool();
  await pool.query('insert into users (uid) values ($1) on conflict do nothing', [uid]);
  await pool.query('insert into passes (uid) values ($1) on conflict do nothing', [uid]);
  const pass = await pool.query('select id, display_name, status from passes where uid = $1', [uid]);
  return pass.rows[0];
}

export async function updatePass(uid: string, input: { displayName?: string; status?: string }) {
  const pool = requirePool();
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;
  if (input.displayName !== undefined) {
    fields.push(`display_name = $${idx++}`);
    values.push(input.displayName.trim());
  }
  if (input.status !== undefined) {
    fields.push(`status = $${idx++}`);
    values.push(input.status);
  }
  if (!fields.length) return null;
  values.push(uid);
  const result = await pool.query(
    `update passes set ${fields.join(', ')} where uid = $${idx} returning id, display_name, status`,
    values
  );
  return result.rows[0];
}

export async function listHistory(uid: string, limit = 50) {
  const pool = requirePool();
  const result = await pool.query(
    `select c.id, c.checked_in_at, c.notes, l.code, l.name
     from checkins c
     join locations l on l.id = c.location_id
     where c.uid = $1
     order by c.checked_in_at desc
     limit $2`,
    [uid, Math.min(limit, 200)]
  );
  return result.rows;
}

export async function listLocations() {
  const pool = requirePool();
  const result = await pool.query('select id, code, name, category, active from locations order by created_at desc');
  return result.rows;
}

export async function createLocation(code: string, name: string, category: string, active: boolean) {
  const pool = requirePool();
  const result = await pool.query(
    'insert into locations (code, name, category, active) values ($1, $2, $3, $4) returning id, code, name, category, active',
    [code.trim(), name.trim(), category.trim() || 'General', active]
  );
  return result.rows[0];
}

export async function createCheckin(uid: string, locationCode: string, notes: string) {
  const pool = requirePool();
  const location = await pool.query('select id from locations where code = $1', [locationCode.trim()]);
  if (location.rowCount === 0) {
    return null;
  }
  const result = await pool.query(
    'insert into checkins (uid, location_id, notes) values ($1, $2, $3) returning id, checked_in_at, notes',
    [uid, location.rows[0].id, notes.trim()]
  );
  return result.rows[0];
}

export async function getLastCheckin(uid: string, locationId: string) {
  const pool = requirePool();
  const result = await pool.query(
    'select checked_in_at from checkins where uid = $1 and location_id = $2 order by checked_in_at desc limit 1',
    [uid, locationId]
  );
  return result.rows[0]?.checked_in_at ? new Date(result.rows[0].checked_in_at) : null;
}

export async function getLocationByCode(code: string) {
  const pool = requirePool();
  const result = await pool.query('select id, code, name, category, active from locations where code = $1', [code.trim()]);
  return result.rows[0] || null;
}

export async function updateLocation(id: string, input: { name?: string; category?: string; active?: boolean }) {
  const pool = requirePool();
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;
  if (input.name !== undefined) {
    fields.push(`name = $${idx++}`);
    values.push(input.name.trim());
  }
  if (input.category !== undefined) {
    fields.push(`category = $${idx++}`);
    values.push(input.category.trim() || 'General');
  }
  if (input.active !== undefined) {
    fields.push(`active = $${idx++}`);
    values.push(input.active);
  }
  if (!fields.length) return null;
  values.push(id);
  const result = await pool.query(
    `update locations set ${fields.join(', ')} where id = $${idx} returning id, code, name, category, active`,
    values
  );
  return result.rows[0] || null;
}

export async function logAdminAction(uid: string, action: string, payload: any) {
  const pool = requirePool();
  await pool.query(
    'insert into admin_audit (uid, action, payload) values ($1, $2, $3)',
    [uid, action, payload]
  );
}
