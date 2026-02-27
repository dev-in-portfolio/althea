import { NextResponse } from 'next/server';
import { requireAuth } from '$lib/server/auth';
import { createLocation, listLocations, logAdminAction } from '$lib/server/queries';

export async function GET() {
  try {
    const items = await listLocations();
    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Database unavailable' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { uid } = await requireAuth(request);
    const body = await request.json();
    const code = String(body.code || '').trim();
    const name = String(body.name || '').trim();
    const category = String(body.category || 'General').trim();
    const active = body.active !== undefined ? Boolean(body.active) : true;
    if (!code || !name) {
      return NextResponse.json({ error: 'Code and name are required.' }, { status: 400 });
    }
    const location = await createLocation(code, name, category, active);
    await logAdminAction(uid, 'location.create', { locationId: location.id, code });
    return NextResponse.json(location);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unauthorized' }, { status: 401 });
  }
}
