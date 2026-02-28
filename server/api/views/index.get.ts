import { getUserId, pool } from '../../utils/db';

export default defineEventHandler(async (event) => {
  const deviceKey = getHeader(event, 'x-device-key');
  if (!deviceKey) {
    throw createError({ statusCode: 400, statusMessage: 'Missing X-Device-Key header' });
  }
  const route = getQuery(event).route?.toString() || '/';
  const userId = await getUserId(deviceKey);
  const { rows } = await pool.query(
    `select id, name, route, state, updated_at
     from nuxt_views
     where user_id = $1 and route = $2
     order by updated_at desc`,
    [userId, route]
  );
  return { views: rows };
});
