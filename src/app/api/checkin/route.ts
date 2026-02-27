import { NextResponse } from 'next/server';
import { requireAuth } from '$lib/server/auth';
import { createCheckin, getLastCheckin, getLocationByCode } from '$lib/server/queries';

const IDEM_TTL_MS = 10 * 60 * 1000;
const COOLDOWN_MS = 5 * 60 * 1000;
const idemCache = new Map<string, number>();

function pruneIdem() {
  const now = Date.now();
  for (const [key, ts] of idemCache.entries()) {
    if (now - ts > IDEM_TTL_MS) idemCache.delete(key);
  }
}

export async function POST(request: Request) {
  try {
    const { uid } = await requireAuth(request);
    const body = await request.json();
    const locationCode = String(body.locationCode || '').trim();
    const notes = String(body.notes || '').trim();
    if (!locationCode) {
      return NextResponse.json({ error: 'Missing location code.' }, { status: 400 });
    }

    const idemKey = request.headers.get('idempotency-key');
    if (idemKey) {
      pruneIdem();
      const cacheKey = `${uid}:${idemKey}`;
      if (idemCache.has(cacheKey)) {
        return NextResponse.json({ ok: true, deduped: true });
      }
      idemCache.set(cacheKey, Date.now());
    }

    const location = await getLocationByCode(locationCode);
    if (!location || !location.active) {
      return NextResponse.json({ error: 'Unknown or inactive location code.' }, { status: 404 });
    }

    const last = await getLastCheckin(uid, location.id);
    if (last && Date.now() - last.getTime() < COOLDOWN_MS) {
      return NextResponse.json({ error: 'Check-in cooldown active.' }, { status: 429 });
    }

    const checkin = await createCheckin(uid, locationCode, notes);
    if (!checkin) {
      return NextResponse.json({ error: 'Unknown location code.' }, { status: 404 });
    }
    return NextResponse.json({ ok: true, checkin });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unauthorized' }, { status: 401 });
  }
}
