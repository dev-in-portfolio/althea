import { getDbError, getPool } from './db';

function requirePool() {
  const pool = getPool();
  if (!pool) {
    throw new Error(getDbError() || 'Database is unavailable.');
  }
  return pool;
}

export async function listSessions(userKey: string, limit = 100, before?: string) {
  const pool = requirePool();
  const params: any[] = [userKey, Math.min(Math.max(limit, 1), 500)];
  let clause = '';
  if (before) {
    params.push(before);
    clause = 'and started_at < $3';
  }
  const result = await pool.query(
    `select id, started_at, ended_at, duration_seconds, tag, feel, notes
     from momentum_sessions
     where user_key = $1 ${clause}
     order by started_at desc
     limit $2`,
    params
  );
  return result.rows.map((row: any) => ({
    id: row.id,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    duration: row.duration_seconds,
    tag: row.tag,
    feel: row.feel,
    notes: row.notes
  }));
}

export async function listAllSessions(userKey: string, max = 10000) {
  const pool = requirePool();
  const result = await pool.query(
    `select id, started_at, ended_at, duration_seconds, tag, feel, notes
     from momentum_sessions
     where user_key = $1
     order by started_at desc
     limit $2`,
    [userKey, Math.min(max, 10000)]
  );
  return result.rows.map((row: any) => ({
    id: row.id,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    duration: row.duration_seconds,
    tag: row.tag,
    feel: row.feel,
    notes: row.notes
  }));
}

export async function getSession(userKey: string, id: string) {
  const pool = requirePool();
  const result = await pool.query(
    `select id, started_at, ended_at, duration_seconds, tag, feel, notes
     from momentum_sessions
     where id = $1 and user_key = $2`,
    [id, userKey]
  );
  if (result.rowCount === 0) return null;
  const row = result.rows[0];
  return {
    id: row.id,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    duration: row.duration_seconds,
    tag: row.tag,
    feel: row.feel,
    notes: row.notes
  };
}

export async function createSession(userKey: string, input: { startedAt: string; endedAt: string; duration: number; tag: string; feel: number; notes?: string }) {
  const pool = requirePool();
  const dup = await pool.query(
    `select id from momentum_sessions
     where user_key = $1
       and started_at = $2
       and ended_at = $3
       and duration_seconds = $4
       and tag = $5
       and feel = $6
       and coalesce(notes, '') = coalesce($7, '')
     limit 1`,
    [userKey, input.startedAt, input.endedAt, input.duration, input.tag.trim(), input.feel, input.notes?.trim() || '']
  );
  if (dup.rowCount > 0) {
    return { id: dup.rows[0].id };
  }
  const result = await pool.query(
    `insert into momentum_sessions (user_key, started_at, ended_at, duration_seconds, tag, feel, notes)
     values ($1, $2, $3, $4, $5, $6, $7) returning id`,
    [userKey, input.startedAt, input.endedAt, input.duration, input.tag.trim(), input.feel, input.notes?.trim() || null]
  );
  return result.rows[0];
}

export async function updateSession(userKey: string, id: string, input: Partial<{ startedAt: string; endedAt: string; duration: number; tag: string; feel: number; notes?: string }>) {
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (input.startedAt) {
    fields.push(`started_at = $${idx++}`);
    values.push(input.startedAt);
  }
  if (input.endedAt) {
    fields.push(`ended_at = $${idx++}`);
    values.push(input.endedAt);
  }
  if (input.duration !== undefined) {
    fields.push(`duration_seconds = $${idx++}`);
    values.push(input.duration);
  }
  if (input.tag) {
    fields.push(`tag = $${idx++}`);
    values.push(input.tag.trim());
  }
  if (input.feel !== undefined) {
    fields.push(`feel = $${idx++}`);
    values.push(input.feel);
  }
  if (input.notes !== undefined) {
    fields.push(`notes = $${idx++}`);
    values.push(input.notes?.trim() || null);
  }

  if (!fields.length) return false;

  values.push(id, userKey);
  const pool = requirePool();
  const result = await pool.query(
    `update momentum_sessions
     set ${fields.join(', ')}
     where id = $${idx++} and user_key = $${idx}
     returning id`,
    values
  );
  return result.rowCount > 0;
}

export async function deleteSession(userKey: string, id: string) {
  const pool = requirePool();
  const result = await pool.query('delete from momentum_sessions where id = $1 and user_key = $2', [id, userKey]);
  return result.rowCount > 0;
}
