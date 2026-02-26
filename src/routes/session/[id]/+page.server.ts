import { getSession } from '$lib/server/sessions';

export async function load({ locals, params }) {
  try {
    const session = await getSession(locals.userKey as string, params.id);
    return { session };
  } catch {
    return { session: null };
  }
}
