import { json } from '@sveltejs/kit';
import { createSession } from '$lib/server/sessions';
import { validateSession } from '$lib/server/validate';

export async function POST({ request, locals }) {
  const body = await request.json();
  const items = Array.isArray(body.items) ? body.items : [];
  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const raw of items) {
    const input = {
      startedAt: String(raw.startedAt || ''),
      endedAt: String(raw.endedAt || ''),
      duration: Number(raw.duration || 0),
      tag: String(raw.tag || ''),
      feel: Number(raw.feel ?? 0),
      notes: raw.notes ? String(raw.notes) : ''
    };
    const error = validateSession(input);
    if (error) {
      errors.push(error);
      continue;
    }
    try {
      const created = await createSession(locals.userKey as string, input);
      if (created?.id) {
        imported += 1;
      } else {
        skipped += 1;
      }
    } catch (err) {
      errors.push(err instanceof Error ? err.message : 'Import failed.');
    }
  }

  return json({ imported, skipped, errors });
}
