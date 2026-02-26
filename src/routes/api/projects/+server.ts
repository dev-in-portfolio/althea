import { json } from '@sveltejs/kit';
import { createProject, listProjects } from '$lib/server/projects';
import { validateProjectTitle } from '$lib/server/validate';

export async function GET({ locals }) {
  const items = await listProjects(locals.userKey as string);
  return json({ items });
}

export async function POST({ request, locals }) {
  const body = await request.json();
  const title = String(body.title || '').trim();
  const error = validateProjectTitle(title);
  if (error) return json({ error }, { status: 400 });
  const project = await createProject(locals.userKey as string, title);
  return json(project);
}
