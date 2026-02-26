import { listSessions } from '$lib/server/sessions';

export async function load({ locals }) {
  try {
    const limit = 50;
    const items = await listSessions(locals.userKey as string, limit);
    return { items, error: '', hasMore: items.length === limit };
  } catch (error) {
    return { items: [], error: error instanceof Error ? error.message : 'Database unavailable.', hasMore: false };
  }
}
