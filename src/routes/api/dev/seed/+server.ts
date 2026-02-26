import { json } from '@sveltejs/kit';
import { createProject } from '$lib/server/projects';
import { addFrame } from '$lib/server/frames';

const SAMPLE = [
  { title: 'Dawn', body: 'Soft light spills into the studio.', imageUrl: null },
  { title: 'Midday', body: 'The timeline sharpens with clear decisions.', imageUrl: null },
  { title: 'Dusk', body: 'We close the loop with golden reflections.', imageUrl: null }
];

export async function POST({ locals }) {
  if (process.env.APP_ENV !== 'development') {
    return json({ error: 'Seed only available in development.' }, { status: 403 });
  }

  try {
    const project = await createProject(locals.userKey as string, 'Sample Timeline');
    for (const frame of SAMPLE) {
      await addFrame(locals.userKey as string, project.id, frame);
    }
    return json({ ok: true, project });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Database unavailable.' }, { status: 503 });
  }
}
