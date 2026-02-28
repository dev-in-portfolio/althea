import { Hono } from 'hono';
import { pool } from './db';
import { generateToken, hashToken, requireAdminToken } from './auth';

export const admin = new Hono();

admin.use('*', requireAdminToken);

admin.post('/keys', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const label = typeof body.label === 'string' ? body.label : '';
  const scopes = Array.isArray(body.scopes) ? body.scopes : [];
  const rawToken = generateToken();
  const tokenHash = hashToken(rawToken);
  const { rows } = await pool.query(
    `insert into api_keys (token_hash, label, scopes)
     values ($1, $2, $3)
     returning id, label, scopes, is_active, created_at`,
    [tokenHash, label, scopes]
  );
  return c.json({
    token: rawToken,
    key: rows[0],
  });
});

admin.patch('/keys/:id', async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json().catch(() => ({}));
  const scopes = Array.isArray(body.scopes) ? body.scopes : null;
  const isActive = typeof body.isActive === 'boolean' ? body.isActive : null;

  const { rows } = await pool.query(
    `update api_keys
     set scopes = coalesce($1, scopes),
         is_active = coalesce($2, is_active)
     where id = $3
     returning id, label, scopes, is_active, created_at`,
    [scopes, isActive, id]
  );
  if (!rows[0]) {
    return c.json({ error: 'Key not found' }, 404);
  }
  return c.json({ key: rows[0] });
});

admin.get('/keys', async (c) => {
  const { rows } = await pool.query(
    'select id, label, scopes, is_active, created_at from api_keys order by created_at desc'
  );
  return c.json({ keys: rows });
});

admin.delete('/keys/:id', async (c) => {
  const { id } = c.req.param();
  const { rowCount } = await pool.query('delete from api_keys where id = $1', [id]);
  if (!rowCount) {
    return c.json({ error: 'Key not found' }, 404);
  }
  return c.json({ ok: true });
});
