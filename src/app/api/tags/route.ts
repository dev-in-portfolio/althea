import { NextResponse } from 'next/server';
import { requireAuth } from '$lib/server/auth';
import { listTags } from '$lib/server/queries';

export async function GET(request: Request) {
  try {
    const { uid } = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get('limit') || '20');
    const items = await listTags(uid, limit);
    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unauthorized' }, { status: 401 });
  }
}
