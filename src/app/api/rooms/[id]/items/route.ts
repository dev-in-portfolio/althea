import { NextResponse } from 'next/server';
import { requireAuth } from '$lib/server/auth';
import { addItem, getRoomMembership } from '$lib/server/queries';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { uid } = await requireAuth(request);
    const membership = await getRoomMembership(uid, params.id);
    if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const title = String(body.title || '').trim();
    const bodyText = String(body.body || '').trim();
    if (!title) return NextResponse.json({ error: 'Title required.' }, { status: 400 });

    const item = await addItem(uid, params.id, { title, body: bodyText });
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unauthorized' }, { status: 401 });
  }
}
