import { json } from '@sveltejs/kit';
import { getDbError, getPool } from '$lib/server/db';

export async function GET() {
  try {
    const pool = getPool();
    if (!pool) {
      return json({ ok: false, error: getDbError() || 'DB unavailable' }, { status: 503 });
    }
    await pool.query('select 1');
    return json({ ok: true });
  } catch (error) {
    return json({ ok: false, error: 'DB unavailable' }, { status: 500 });
  }
}
