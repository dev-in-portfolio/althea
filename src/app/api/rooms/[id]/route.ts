import { NextResponse } from 'next/server';
import { requireAuth } from '$lib/server/auth';
import { getRoomDetail } from '$lib/server/queries';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { uid } = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || undefined;
    const status = searchParams.get('status') || undefined;
    const mine = searchParams.get('mine') === 'true';
    const sort = searchParams.get('sort') || undefined;
    const room = await getRoomDetail(uid, params.id, { q, status, mine, sort });
    if (!room) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(room);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unauthorized' }, { status: 401 });
  }
}
