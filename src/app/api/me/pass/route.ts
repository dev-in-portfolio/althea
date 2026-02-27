import { NextResponse } from 'next/server';
import { requireAuth } from '$lib/server/auth';
import { updatePass } from '$lib/server/queries';
import { signPass } from '$lib/server/qr';

export async function GET(request: Request) {
  try {
    const { pass, uid } = await requireAuth(request);
    const qrPayload = signPass({ passId: pass.id, uid, issuedAt: Date.now() });
    return NextResponse.json({
      id: pass.id,
      displayName: pass.display_name,
      status: pass.status,
      qrPayload: qrPayload || pass.id
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unauthorized' }, { status: 401 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { uid } = await requireAuth(request);
    const body = await request.json();
    const displayName = String(body.displayName || '').trim();
    const status = body.status ? String(body.status) : undefined;
    if (displayName.length > 40) {
      return NextResponse.json({ error: 'Display name too long.' }, { status: 400 });
    }
    if (status && !['active', 'suspended'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
    }
    const pass = await updatePass(uid, { displayName, status });
    if (!pass) return NextResponse.json({ error: 'No changes.' }, { status: 400 });
    return NextResponse.json({ id: pass.id, displayName: pass.display_name, status: pass.status });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unauthorized' }, { status: 401 });
  }
}
