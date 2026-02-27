import { NextResponse } from 'next/server';
import { requireAuth } from '$lib/server/auth';
import { joinRoom } from '$lib/server/queries';

export async function POST(request: Request) {
  try {
    const { uid } = await requireAuth(request);
    const body = await request.json();
    const inviteCode = String(body.inviteCode || '').trim().toUpperCase();
    if (!inviteCode) {
      return NextResponse.json({ error: 'Invite code required.' }, { status: 400 });
    }
    if (inviteCode.length < 6 || inviteCode.length > 16) {
      return NextResponse.json({ error: 'Invite code length invalid.' }, { status: 400 });
    }
    const room = await joinRoom(uid, inviteCode);
    if (!room) return NextResponse.json({ error: 'Invalid invite code.' }, { status: 404 });
    return NextResponse.json(room);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unauthorized' }, { status: 401 });
  }
}
