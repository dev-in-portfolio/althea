import 'server-only';
import { getAdminAuth } from '$lib/firebase/admin';
import { ensureUser } from './queries';

export async function requireAuth(request: Request) {
  const auth = request.headers.get('authorization') || '';
  const match = auth.match(/^Bearer (.+)$/);
  if (!match) {
    throw new Error('Missing bearer token.');
  }
  const token = match[1];
  const decoded = await getAdminAuth().verifyIdToken(token);
  await ensureUser(decoded.uid);
  return { uid: decoded.uid };
}
