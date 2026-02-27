import { NextResponse } from 'next/server';
import { requireAuth } from '$lib/server/auth';
import { logAdminAction, updateLocation } from '$lib/server/queries';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { uid } = await requireAuth(request);
    const body = await request.json();
    const updated = await updateLocation(params.id, {
      name: body.name !== undefined ? String(body.name) : undefined,
      category: body.category !== undefined ? String(body.category) : undefined,
      active: body.active !== undefined ? Boolean(body.active) : undefined
    });
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await logAdminAction(uid, 'location.update', { locationId: params.id });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unauthorized' }, { status: 401 });
  }
}
