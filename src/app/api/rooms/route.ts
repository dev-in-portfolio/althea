import { NextResponse } from 'next/server';
import { requireAuth } from '$lib/server/auth';
import { createRoom, listRooms } from '$lib/server/queries';
import { generateInviteCode } from '$lib/server/invite';

export async function GET(request: Request) {
  try {
    const { uid } = await requireAuth(request);
    const rooms = await listRooms(uid);
    return NextResponse.json({ rooms });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const { uid } = await requireAuth(request);
    const body = await request.json();
    const name = String(body.name || '').trim();
    if (!name) {
      return NextResponse.json({ error: 'Room name required.' }, { status: 400 });
    }

    let lastError: unknown = null;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const inviteCode = generateInviteCode(10);
      try {
        const room = await createRoom(uid, name, inviteCode);
        return NextResponse.json(room);
      } catch (error) {
        lastError = error;
        const message = error instanceof Error ? error.message : '';
        if (!message.includes('duplicate') && !message.includes('unique')) {
          break;
        }
      }
    }

    return NextResponse.json({ error: lastError instanceof Error ? lastError.message : 'Failed to create room.' }, { status: 500 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unauthorized' }, { status: 401 });
  }
}
