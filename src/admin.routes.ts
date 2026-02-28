import { Hono } from 'hono';
import { pool } from './db';
import { hashContent } from './canonical';
import { validatePayload } from './validate';

export const adminRoutes = new Hono();

adminRoutes.use('*', async (c, next) => {
  const token = c.req.header('authorization')?.replace(/bearer\s+/i, '').trim() || '';
  const adminToken = process.env.ADMIN_TOKEN || '';
  if (!adminToken || token !== adminToken) {
    return c.json({ error: 'Unauthorized admin token' }, 401);
  }
  await next();
});

adminRoutes.post('/quarantine/:id/retry', async (c) => {
  const { id } = c.req.param();
  const { rows } = await pool.query(
    'select id, kind, external_id, raw_content from intake_quarantine where id = $1',
    [id]
  );
  const entry = rows[0];
  if (!entry) {
    return c.json({ error: 'Quarantine entry not found' }, 404);
  }
  const raw = { kind: entry.kind, externalId: entry.external_id, content: entry.raw_content };
  const { errors, normalizedKind, normalizedExternalId } = validatePayload(raw);
  if (errors.length) {
    return c.json({ status: 'quarantined', errors });
  }

  const contentHash = hashContent(entry.raw_content);
  const { rows: dupRows } = await pool.query('select id from intake_records where content_hash = $1', [
    contentHash,
  ]);
  if (dupRows[0]) {
    await pool.query('delete from intake_quarantine where id = $1', [id]);
    return c.json({ status: 'duplicate', id: dupRows[0].id, duplicate: true });
  }

  const { rows: inserted } = await pool.query(
    `insert into intake_records (kind, external_id, content, content_hash)
     values ($1, $2, $3, $4)
     returning id`,
    [normalizedKind, normalizedExternalId, entry.raw_content, contentHash]
  );
  await pool.query('delete from intake_quarantine where id = $1', [id]);
  return c.json({ status: 'accepted', id: inserted[0].id, duplicate: false });
});
