import { json } from '@sveltejs/kit';
import { listAllSessions } from '$lib/server/sessions';

export async function GET({ locals }) {
  try {
    const items = await listAllSessions(locals.userKey as string, 10000);
    return json({ items });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Database unavailable.' }, { status: 503 });
  }
}
