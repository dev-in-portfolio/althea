import { Hono } from 'hono';
import { requireApiKey, requireScope } from './auth';
import { enforceRateLimit } from './ratelimit';

export const proxy = new Hono();

const READ_BASE = process.env.UPSTREAM_READ_BASE || '';
const WRITE_BASE = process.env.UPSTREAM_WRITE_BASE || '';

async function forwardRequest(c: any, upstreamBase: string) {
  if (!upstreamBase) {
    return c.json({ error: 'Upstream base not configured' }, 500);
  }
  const tokenHash = c.get('tokenHash') as string;
  const rate = await enforceRateLimit(tokenHash);
  if (!rate.ok) {
    return c.json({ error: 'Rate limit exceeded', limit: rate.limit, reset: rate.reset }, 429);
  }

  const path = c.req.path.replace(/^\/proxy/, '');
  const url = `${upstreamBase}${path}${c.req.url.includes('?') ? `?${c.req.queryString()}` : ''}`;

  const upstreamResponse = await fetch(url, {
    method: c.req.method,
    headers: {
      'content-type': c.req.header('content-type') || 'application/json',
      'x-gatekeeper-token': tokenHash,
    },
    body: ['GET', 'HEAD'].includes(c.req.method) ? undefined : await c.req.text(),
  });

  const text = await upstreamResponse.text();
  return c.text(text, upstreamResponse.status, Object.fromEntries(upstreamResponse.headers.entries()));
}

proxy.use('*', requireApiKey);

proxy.get('/proxy/*', requireScope('read'), (c) => forwardRequest(c, READ_BASE));
proxy.post('/proxy/*', requireScope('write'), (c) => forwardRequest(c, WRITE_BASE));
