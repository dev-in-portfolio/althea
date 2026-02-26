import { getMetrics } from '$lib/server/metrics';

export async function load({ locals }) {
  try {
    const metrics = await getMetrics(locals.userKey as string);
    return { metrics };
  } catch {
    return { metrics: null };
  }
}
