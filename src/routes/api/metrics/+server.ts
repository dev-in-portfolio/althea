import { json } from '@sveltejs/kit';
import { getMetrics } from '$lib/server/metrics';

export async function GET({ locals }) {
  try {
    const metrics = await getMetrics(locals.userKey as string);
    return json(metrics);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Database unavailable.' }, { status: 503 });
  }
}
