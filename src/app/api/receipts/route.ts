import { NextResponse } from 'next/server';
import { requireAuth } from '$lib/server/auth';
import { createReceipt, listReceipts, listReceiptsBefore } from '$lib/server/queries';

export async function GET(request: Request) {
  try {
    const { uid } = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get('tag') || undefined;
    const q = searchParams.get('q') || undefined;
    const from = searchParams.get('from') || undefined;
    const to = searchParams.get('to') || undefined;
    const status = searchParams.get('status') || undefined;
    const sort = searchParams.get('sort') || undefined;
    const before = searchParams.get('before') || undefined;
    const limit = Number(searchParams.get('limit') || '50');
    const items = before
      ? await listReceiptsBefore(uid, { tag, q, from, to, status, limit, before, sort })
      : await listReceipts(uid, { tag, q, from, to, status, limit, sort });
    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const { uid } = await requireAuth(request);
    const body = await request.json();
    const title = String(body.title || '').trim();
    const vendor = String(body.vendor || '').trim();
    const amountCents = body.amountCents !== undefined ? Number(body.amountCents) : null;
    const receiptDate = body.receiptDate ? String(body.receiptDate) : null;
    if (!title || !vendor) {
      return NextResponse.json({ error: 'Title and vendor required.' }, { status: 400 });
    }
    const receipt = await createReceipt(uid, { title, vendor, amountCents, receiptDate });
    return NextResponse.json({ id: receipt.id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unauthorized' }, { status: 401 });
  }
}
