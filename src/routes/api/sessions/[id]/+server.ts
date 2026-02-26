import { json } from '@sveltejs/kit';
import { deleteSession, updateSession } from '$lib/server/sessions';
import { validatePartial } from '$lib/server/validate';

export async function PATCH({ request, params, locals }) {
  const body = await request.json();
  const input = {
    startedAt: body.startedAt ? String(body.startedAt) : undefined,
    endedAt: body.endedAt ? String(body.endedAt) : undefined,
    duration: body.duration !== undefined ? Number(body.duration) : undefined,
    tag: body.tag !== undefined ? String(body.tag) : undefined,
    feel: body.feel !== undefined ? Number(body.feel) : undefined,
    notes: body.notes !== undefined ? String(body.notes) : undefined
  };
  const error = validatePartial(input);
  if (error) return json({ error }, { status: 400 });

  try {
    const ok = await updateSession(locals.userKey as string, params.id, input);
    if (!ok) return json({ error: 'Not found' }, { status: 404 });
    return json({ ok: true });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Database unavailable.' }, { status: 503 });
  }
}

export async function DELETE({ params, locals }) {
  try {
    const ok = await deleteSession(locals.userKey as string, params.id);
    if (!ok) return json({ error: 'Not found' }, { status: 404 });
    return json({ ok: true });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Database unavailable.' }, { status: 503 });
  }
}
