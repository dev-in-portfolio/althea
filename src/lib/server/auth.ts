import 'server-only';
import { getAdminAuth } from '$lib/firebase/admin';
import { ensureUserAndPass } from './queries';
import { checkRateLimit } from './rateLimit';

function getClientKey(request: Request, uid: string) {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || 'unknown';
  return `${uid}:${ip}`;
}

export async function requireAuth(request: Request) {
  const auth = request.headers.get('authorization') || '';
  const match = auth.match(/^Bearer (.+)$/);
  if (!match) {
    throw new Error('Missing bearer token.');
  }
  const token = match[1];
  const decoded = await getAdminAuth().verifyIdToken(token);
  const limit = checkRateLimit(getClientKey(request, decoded.uid));
  if (!limit.ok) {
    throw new Error('Rate limit exceeded.');
  }
  const pass = await ensureUserAndPass(decoded.uid);
  return { uid: decoded.uid, pass };
}
