import { json } from '@sveltejs/kit';
import { reorderFrames } from '$lib/server/frames';
import { getProject } from '$lib/server/projects';
import { validateOrder } from '$lib/server/validate';

export async function POST({ request, params, locals }) {
  const body = await request.json();
  const order = Array.isArray(body.order) ? body.order.map(String) : [];
  const current = await getProject(locals.userKey as string, params.id);
  if (!current) return json({ error: 'Not found' }, { status: 404 });

  const existing = current.frames.map((frame) => frame.id);
  const error = validateOrder(order, existing);
  if (error) return json({ error }, { status: 400 });

  await reorderFrames(locals.userKey as string, params.id, order);
  return json({ ok: true });
}
