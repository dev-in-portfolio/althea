import { json } from '@sveltejs/kit';
import { getProject } from '$lib/server/projects';

export async function GET({ params, locals }) {
  const result = await getProject(locals.userKey as string, params.id);
  if (!result) return json({ error: 'Not found' }, { status: 404 });
  return json(result);
}
