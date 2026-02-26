import type { Handle } from '@sveltejs/kit';
import { checkRateLimit } from '$lib/server/rateLimit';

export const handle: Handle = async ({ event, resolve }) => {
  const userKey = event.request.headers.get('x-user-key') || '';

  if (event.url.pathname.startsWith('/api')) {
    if (!userKey) {
      return new Response(JSON.stringify({ error: 'Missing x-user-key' }), {
        status: 401,
        headers: { 'content-type': 'application/json' }
      });
    }
    const limit = checkRateLimit(userKey);
    if (!limit.ok) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
        headers: {
          'content-type': 'application/json',
          'x-rate-limit-remaining': '0',
          'x-rate-limit-reset': String(limit.resetAt)
        }
      });
    }
    event.locals.userKey = userKey;
  }

  return resolve(event);
};
