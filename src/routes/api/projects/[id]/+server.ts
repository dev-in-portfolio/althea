import { json } from '@sveltejs/kit';
import { getProject } from '$lib/server/projects';

export async function GET({ params, locals }) {
  try {
    const result = await getProject(locals.userKey as string, params.id);
    if (!result) return json({ error: 'Not found' }, { status: 404 });
    return json(result);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Database unavailable.' }, { status: 503 });
  }
}
