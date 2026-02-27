import { NextResponse } from 'next/server';
import { requireAuth } from '$lib/server/auth';
import { deleteItemAsOwner, updateItem } from '$lib/server/queries';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { uid } = await requireAuth(request);
    const body = await request.json();
    const title = body.title !== undefined ? String(body.title).trim() : undefined;
    const bodyText = body.body !== undefined ? String(body.body).trim() : undefined;
    const status = body.status !== undefined ? String(body.status) : undefined;

    if (status && !['open', 'done'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
    }
    if (title !== undefined && !title) {
      return NextResponse.json({ error: 'Title required.' }, { status: 400 });
    }

    const item = await updateItem(uid, params.id, { title, body: bodyText, status });
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unauthorized' }, { status: 401 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { uid } = await requireAuth(request);
    const deleted = await deleteItemAsOwner(uid, params.id);
    if (!deleted) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unauthorized' }, { status: 401 });
  }
}
