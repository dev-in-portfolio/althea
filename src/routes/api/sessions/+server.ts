import { json } from '@sveltejs/kit';
import { createSession, listSessions } from '$lib/server/sessions';
import { validateSession } from '$lib/server/validate';

export async function GET({ url, locals }) {
  const limit = Number(url.searchParams.get('limit') || '100');
  const before = url.searchParams.get('before') || undefined;
  try {
    const items = await listSessions(locals.userKey as string, limit, before);
    return json({ items });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Database unavailable.' }, { status: 503 });
  }
}

export async function POST({ request, locals }) {
  const body = await request.json();
  const input = {
    startedAt: String(body.startedAt || ''),
    endedAt: String(body.endedAt || ''),
    duration: Number(body.duration || 0),
    tag: String(body.tag || ''),
    feel: Number(body.feel ?? 0),
    notes: body.notes ? String(body.notes) : ''
  };
  const error = validateSession(input);
  if (error) return json({ error }, { status: 400 });

  try {
    const session = await createSession(locals.userKey as string, input);
    return json(session);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Database unavailable.' }, { status: 503 });
  }
}
