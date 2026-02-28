import { pool } from '../../utils/db';

export default defineEventHandler(async (event) => {
  const deviceKey = getHeader(event, 'x-device-key');
  if (!deviceKey) {
    throw createError({ statusCode: 400, statusMessage: 'Missing X-Device-Key header' });
  }
  const id = event.context.params?.id;
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'id is required' });
  }
  await pool.query('delete from nuxt_views where id = $1', [id]);
  return { ok: true };
});
