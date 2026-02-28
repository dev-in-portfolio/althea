import { pool } from '../../utils/db';

const MAX_STATE = 32768;

export default defineEventHandler(async (event) => {
  const deviceKey = getHeader(event, 'x-device-key');
  if (!deviceKey) {
    throw createError({ statusCode: 400, statusMessage: 'Missing X-Device-Key header' });
  }
  const id = event.context.params?.id;
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'id is required' });
  }
  const body = await readBody(event);
  const name = typeof body?.name === 'string' ? body.name.trim() : null;
  const state = body?.state ?? null;
  if (state && JSON.stringify(state).length > MAX_STATE) {
    throw createError({ statusCode: 400, statusMessage: 'state too large' });
  }
  const { rows } = await pool.query(
    `update nuxt_views
     set name = coalesce($1, name),
         state = coalesce($2, state),
         updated_at = now()
     where id = $3
     returning id, name, route, state, updated_at`,
    [name, state, id]
  );
  return { view: rows[0] };
});
