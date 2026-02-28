import { getUserId, pool } from '../../utils/db';

const MAX_VIEWS = 500;
const MAX_STATE = 32768;

export default defineEventHandler(async (event) => {
  const deviceKey = getHeader(event, 'x-device-key');
  if (!deviceKey) {
    throw createError({ statusCode: 400, statusMessage: 'Missing X-Device-Key header' });
  }
  const body = await readBody(event);
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const route = typeof body?.route === 'string' ? body.route : '/';
  const state = body?.state ?? {};
  if (!name) {
    throw createError({ statusCode: 400, statusMessage: 'name is required' });
  }
  if (JSON.stringify(state).length > MAX_STATE) {
    throw createError({ statusCode: 400, statusMessage: 'state too large' });
  }
  const userId = await getUserId(deviceKey);
  const { rows: countRows } = await pool.query(
    'select count(*)::int as count from nuxt_views where user_id = $1',
    [userId]
  );
  if (countRows[0].count >= MAX_VIEWS) {
    throw createError({ statusCode: 400, statusMessage: 'view limit reached' });
  }
  const { rows } = await pool.query(
    `insert into nuxt_views (user_id, name, route, state)
     values ($1, $2, $3, $4)
     on conflict (user_id, name) do update set state = excluded.state, updated_at = now()
     returning id, name, route, state, updated_at`,
    [userId, name, route, state]
  );
  return { view: rows[0] };
});
