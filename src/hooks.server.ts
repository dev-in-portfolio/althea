import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  const userKey = event.request.headers.get('x-user-key');
  const exemptPaths = ['/api/health', '/api/health/db'];

  if (event.url.pathname.startsWith('/api')) {
    if (!exemptPaths.includes(event.url.pathname) && (!userKey || userKey.length > 200)) {
      return new Response(JSON.stringify({ error: 'Missing or invalid x-user-key header.' }), {
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }
    event.locals.userKey = userKey;
  } else {
    event.locals.userKey = userKey && userKey.length <= 200 ? userKey : null;
  }

  return resolve(event);
};
