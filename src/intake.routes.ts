import { Hono } from 'hono';
import { pool } from './db';
import { byteSize, hashContent } from './canonical';
import { validatePayload } from './validate';

export const intakeRoutes = new Hono();

const MAX_BODY_BYTES = Number(process.env.MAX_BODY_BYTES || 131072);
const MAX_CONTENT_BYTES = Number(process.env.MAX_CONTENT_BYTES || 65536);

intakeRoutes.post('/', async (c) => {
  const raw = await c.req.json().catch(() => null);
  if (!raw) return c.json({ status: 'quarantined', errors: ['invalid JSON body'] }, 400);

  const bodySize = byteSize(raw);
  if (bodySize > MAX_BODY_BYTES) {
    return c.json({ status: 'quarantined', errors: ['body too large'] }, 413);
  }

  const { errors, normalizedKind, normalizedExternalId } = validatePayload(raw);
  const content = raw.content;

  if (content && typeof content === 'object') {
    const contentSize = byteSize(content);
    if (contentSize > MAX_CONTENT_BYTES) {
      errors.push('content too large');
    }
  }

  const contentHash = content ? hashContent(content) : hashContent({});

  if (errors.length) {
    await pool.query(
      `insert into intake_quarantine (kind, external_id, raw_content, errors, content_hash)
       values ($1, $2, $3, $4, $5)`,
      [normalizedKind || 'unknown', normalizedExternalId, raw, errors, contentHash]
    );
    return c.json({ status: 'quarantined', errors });
  }

  const { rows: dupRows } = await pool.query('select id from intake_records where content_hash = $1', [
    contentHash,
  ]);
  if (dupRows[0]) {
    return c.json({ status: 'duplicate', id: dupRows[0].id, duplicate: true });
  }

  const { rows } = await pool.query(
    `insert into intake_records (kind, external_id, content, content_hash)
     values ($1, $2, $3, $4)
     returning id`,
    [normalizedKind, normalizedExternalId, content, contentHash]
  );

  return c.json({ status: 'accepted', id: rows[0].id, duplicate: false });
});

intakeRoutes.get('/records', async (c) => {
  const kind = c.req.query('kind');
  const limit = Math.min(Number(c.req.query('limit') || 50), 200);
  const { rows } = await pool.query(
    `select id, kind, external_id, content, created_at
     from intake_records
     where ($1::text is null or kind = $1)
     order by created_at desc
     limit $2`,
    [kind || null, limit]
  );
  return c.json({ records: rows });
});

intakeRoutes.get('/quarantine', async (c) => {
  const kind = c.req.query('kind');
  const limit = Math.min(Number(c.req.query('limit') || 50), 200);
  const { rows } = await pool.query(
    `select id, kind, external_id, raw_content, errors, created_at
     from intake_quarantine
     where ($1::text is null or kind = $1)
     order by created_at desc
     limit $2`,
    [kind || null, limit]
  );
  return c.json({ quarantine: rows });
});
