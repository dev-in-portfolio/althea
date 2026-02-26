import { json } from '@sveltejs/kit';
import { addFrame, countFrames } from '$lib/server/frames';
import { validateFrameInput } from '$lib/server/validate';

export async function POST({ request, params, locals }) {
  const body = await request.json();
  const input = {
    title: String(body.title || ''),
    body: String(body.body || ''),
    imageUrl: body.imageUrl ? String(body.imageUrl) : null
  };
  const error = validateFrameInput(input);
  if (error) return json({ error }, { status: 400 });

  try {
    const count = await countFrames(locals.userKey as string, params.id);
    if (count >= 500) return json({ error: 'Max frames reached.' }, { status: 400 });

    const frame = await addFrame(locals.userKey as string, params.id, input);
    return json(frame);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Database unavailable.' }, { status: 503 });
  }
}
