import { NextResponse } from 'next/server';
import { requireAuth } from '$lib/server/auth';
import { listHistory } from '$lib/server/queries';

export async function GET(request: Request) {
  try {
    const { uid } = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get('limit') || '50');
    const items = await listHistory(uid, limit);
    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unauthorized' }, { status: 401 });
  }
}
