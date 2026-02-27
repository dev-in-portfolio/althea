import 'server-only';
import { getAdminAuth } from '$lib/firebase/admin';
import { ensureUser } from './queries';

export async function requireAuth(request: Request) {
  const header = request.headers.get('authorization') || '';
  const token = header.replace('Bearer ', '').trim();
  if (!token) throw new Error('Missing bearer token.');
  const auth = getAdminAuth();
  const decoded = await auth.verifyIdToken(token);
  if (!decoded.uid) throw new Error('Invalid token.');
  await ensureUser(decoded.uid);
  return { uid: decoded.uid };
}
