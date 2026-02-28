import { Hono } from 'hono';
import { pool } from './db';
import { hashPayload, payloadSize } from './utils';

export const cacheRoutes = new Hono();

const MAX_PAYLOAD_BYTES = Number(process.env.MAX_PAYLOAD_BYTES || 65536);
const DEFAULT_TTL = Number(process.env.DEFAULT_TTL_SECONDS || 300);
const MAX_TTL = Number(process.env.MAX_TTL_SECONDS || 86400);

function ttlFromQuery(value: string | undefined) {
  if (!value) return DEFAULT_TTL;
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed <= 0) return DEFAULT_TTL;
  return Math.min(parsed, MAX_TTL);
}

cacheRoutes.get('/:namespace/:key', async (c) => {
  const { namespace, key } = c.req.param();
  const { rows } = await pool.query(
    `select payload, expires_at
     from cache_entries
     where namespace = $1 and cache_key = $2`,
    [namespace, key]
  );
  if (!rows[0]) {
    return c.json({ error: 'Cache miss' }, 404, {
      'X-Cache': 'MISS',
    });
  }
  const expiresAt = new Date(rows[0].expires_at);
  if (expiresAt <= new Date()) {
    await pool.query('delete from cache_entries where namespace = $1 and cache_key = $2', [namespace, key]);
    return c.json({ error: 'Cache expired' }, 404, {
      'X-Cache': 'MISS',
      'X-Expires-At': expiresAt.toISOString(),
    });
  }
  return c.json(rows[0].payload, 200, {
    'X-Cache': 'HIT',
    'X-Expires-At': expiresAt.toISOString(),
  });
});

cacheRoutes.put('/:namespace/:key', async (c) => {
  const { namespace, key } = c.req.param();
  const payload = await c.req.json().catch(() => null);
  if (payload === null) {
    return c.json({ error: 'Invalid JSON payload' }, 400);
  }

  const size = payloadSize(payload);
  if (size > MAX_PAYLOAD_BYTES) {
    return c.json({ error: 'Payload exceeds max size', maxBytes: MAX_PAYLOAD_BYTES }, 413);
  }

  const ttlSeconds = ttlFromQuery(c.req.query('ttlSeconds'));
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
  const contentHash = hashPayload(payload);

  await pool.query(
    `insert into cache_entries (namespace, cache_key, payload, payload_bytes, content_hash, expires_at)
     values ($1, $2, $3, $4, $5, $6)
     on conflict (namespace, cache_key)
     do update set payload = excluded.payload,
                   payload_bytes = excluded.payload_bytes,
                   content_hash = excluded.content_hash,
                   expires_at = excluded.expires_at,
                   updated_at = now()`,
    [namespace, key, payload, size, contentHash, expiresAt]
  );

  return c.json({
    ok: true,
    namespace,
    key,
    expiresAt,
    ttlSeconds,
    contentHash,
    payloadBytes: size,
  });
});

cacheRoutes.delete('/:namespace/:key', async (c) => {
  const { namespace, key } = c.req.param();
  const { rowCount } = await pool.query(
    'delete from cache_entries where namespace = $1 and cache_key = $2',
    [namespace, key]
  );
  if (!rowCount) {
    return c.json({ error: 'Cache entry not found' }, 404);
  }
  return c.json({ ok: true });
});
