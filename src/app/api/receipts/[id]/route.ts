import { NextResponse } from 'next/server';
import { requireAuth } from '$lib/server/auth';
import { deleteReceipt, getReceipt, updateReceipt } from '$lib/server/queries';
import { getAdminBucket } from '$lib/firebase/admin';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { uid } = await requireAuth(request);
    const receipt = await getReceipt(uid, params.id);
    if (!receipt) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(receipt);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unauthorized' }, { status: 401 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { uid } = await requireAuth(request);
    const deleted = await deleteReceipt(uid, params.id);
    if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (deleted.storage_path) {
      const bucket = getAdminBucket();
      if (bucket) {
        try {
          await bucket.file(deleted.storage_path).delete({ ignoreNotFound: true });
        } catch {
          // Ignore storage deletion failures; metadata deletion already succeeded.
        }
      }
    }
    return NextResponse.json({ ok: true, storagePath: deleted.storage_path });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unauthorized' }, { status: 401 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { uid } = await requireAuth(request);
    const body = await request.json();
    const title = body.title !== undefined ? String(body.title).trim() : undefined;
    const vendor = body.vendor !== undefined ? String(body.vendor).trim() : undefined;
    const amountCents = body.amountCents !== undefined ? Number(body.amountCents) : undefined;
    const receiptDate = body.receiptDate !== undefined ? (body.receiptDate ? String(body.receiptDate) : null) : undefined;
    if (title !== undefined && !title) {
      return NextResponse.json({ error: 'Title required.' }, { status: 400 });
    }
    if (vendor !== undefined && !vendor) {
      return NextResponse.json({ error: 'Vendor required.' }, { status: 400 });
    }
    const updated = await updateReceipt(uid, params.id, { title, vendor, amountCents, receiptDate });
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unauthorized' }, { status: 401 });
  }
}
