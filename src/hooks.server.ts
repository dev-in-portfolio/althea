import type { Handle } from '@sveltejs/kit';

const hits = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 120;

function allowRequest(key: string) {
  const now = Date.now();
  const current = hits.get(key) ?? { count: 0, resetAt: now + WINDOW_MS };
  if (now > current.resetAt) {
    current.count = 0;
    current.resetAt = now + WINDOW_MS;
  }
  current.count += 1;
  hits.set(key, current);
  return current.count <= MAX_REQUESTS;
}

export const handle: Handle = async ({ event, resolve }) => {
  const userKey = event.request.headers.get('x-user-key');
  const exemptPaths = ['/api/health'];

  if (event.url.pathname.startsWith('/api')) {
    if (!exemptPaths.includes(event.url.pathname) && (!userKey || userKey.length > 200)) {
      return new Response(JSON.stringify({ error: 'Missing or invalid x-user-key header.' }), {
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }
    event.locals.userKey = userKey ?? null;
    const key = `${event.getClientAddress()}:${userKey ?? 'anon'}`;
    if (!allowRequest(key)) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded.' }), {
        status: 429,
        headers: { 'content-type': 'application/json' }
      });
    }
  } else {
    event.locals.userKey = userKey && userKey.length <= 200 ? userKey : null;
  }

  return resolve(event);
};
