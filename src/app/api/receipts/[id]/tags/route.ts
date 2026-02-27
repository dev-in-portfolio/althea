import { NextResponse } from 'next/server';
import { requireAuth } from '$lib/server/auth';
import { addTag, removeTag } from '$lib/server/queries';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { uid } = await requireAuth(request);
    const body = await request.json();
    const name = String(body.name || '').trim();
    if (!name) return NextResponse.json({ error: 'Missing tag.' }, { status: 400 });
    const tag = await addTag(uid, params.id, name);
    return NextResponse.json(tag);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unauthorized' }, { status: 401 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { uid } = await requireAuth(request);
    const body = await request.json();
    const tagId = String(body.tagId || '').trim();
    if (!tagId) return NextResponse.json({ error: 'Missing tag.' }, { status: 400 });
    const removed = await removeTag(uid, params.id, tagId);
    if (!removed) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(removed);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unauthorized' }, { status: 401 });
  }
}
