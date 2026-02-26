import { json } from '@sveltejs/kit';
import { getPool } from '$lib/server/db';

export async function GET() {
  try {
    const pool = getPool();
    await pool.query('select 1');
    return json({ ok: true });
  } catch (error) {
    return json({ ok: false, error: 'DB unavailable' }, { status: 500 });
  }
}
