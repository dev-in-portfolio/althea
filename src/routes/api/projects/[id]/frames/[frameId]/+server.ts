import { json } from '@sveltejs/kit';
import { deleteFrame, updateFrame } from '$lib/server/frames';
import { validateFrameInput } from '$lib/server/validate';

export async function PATCH({ request, params, locals }) {
  const body = await request.json();
  const input = {
    title: String(body.title || ''),
    body: String(body.body || ''),
    imageUrl: body.imageUrl ? String(body.imageUrl) : null
  };
  const error = validateFrameInput(input);
  if (error) return json({ error }, { status: 400 });

  try {
    const frame = await updateFrame(locals.userKey as string, params.id, params.frameId, input);
    if (!frame) return json({ error: 'Not found' }, { status: 404 });
    return json(frame);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Database unavailable.' }, { status: 503 });
  }
}

export async function DELETE({ params, locals }) {
  try {
    const ok = await deleteFrame(locals.userKey as string, params.id, params.frameId);
    if (!ok) return json({ error: 'Not found' }, { status: 404 });
    return json({ ok: true });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Database unavailable.' }, { status: 503 });
  }
}
