import { Hono } from 'hono';
import { pool } from './db';

export const adminRoutes = new Hono();

adminRoutes.use('*', async (c, next) => {
  const token = c.req.header('authorization')?.replace(/bearer\s+/i, '').trim() || '';
  const adminToken = process.env.ADMIN_TOKEN || '';
  if (!adminToken || token !== adminToken) {
    return c.json({ error: 'Unauthorized admin token' }, 401);
  }
  await next();
});

adminRoutes.post('/cleanup', async (c) => {
  const { rowCount } = await pool.query('delete from cache_entries where expires_at <= now()');
  return c.json({ ok: true, removed: rowCount });
});
