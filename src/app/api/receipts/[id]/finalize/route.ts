import { NextResponse } from 'next/server';
import { requireAuth } from '$lib/server/auth';
import { finalizeReceipt } from '$lib/server/queries';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { uid } = await requireAuth(request);
    const body = await request.json();
    const storagePath = String(body.storagePath || '').trim();
    const mimeType = String(body.mimeType || '').trim();
    if (!storagePath || !mimeType) {
      return NextResponse.json({ error: 'Missing storage path.' }, { status: 400 });
    }
    const receipt = await finalizeReceipt(uid, params.id, { storagePath, mimeType });
    if (!receipt) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unauthorized' }, { status: 401 });
  }
}
