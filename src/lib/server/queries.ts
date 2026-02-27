import 'server-only';
import { getDbError, getPool } from './db';

function requirePool() {
  const pool = getPool();
  if (!pool) {
    throw new Error(getDbError() || 'Database unavailable.');
  }
  return pool;
}

export async function ensureUser(uid: string) {
  const pool = requirePool();
  await pool.query('insert into users (uid) values ($1) on conflict do nothing', [uid]);
}

export async function createRoom(uid: string, name: string, inviteCode: string) {
  const pool = requirePool();
  const client = await pool.connect();
  try {
    await client.query('begin');
    const roomRes = await client.query(
      `insert into rooms (owner_uid, name, invite_code)
       values ($1, $2, $3)
       returning id, name, invite_code, created_at`,
      [uid, name.trim(), inviteCode]
    );
    const room = roomRes.rows[0];
    await client.query(
      `insert into room_members (room_id, uid, role)
       values ($1, $2, 'owner')
       on conflict do nothing`,
      [room.id, uid]
    );
    await client.query('commit');
    return room;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

export async function listRooms(uid: string) {
  const pool = requirePool();
  const result = await pool.query(
    `select r.id, r.name, r.invite_code, r.owner_uid, r.created_at, rm.role,
            (select count(*) from room_members m where m.room_id = r.id) as member_count,
            (select count(*) from room_items i where i.room_id = r.id) as item_count
     from room_members rm
     join rooms r on r.id = rm.room_id
     where rm.uid = $1
     order by r.created_at desc`,
    [uid]
  );
  return result.rows;
}

export async function joinRoom(uid: string, inviteCode: string) {
  const pool = requirePool();
  const room = await pool.query(
    'select id, name from rooms where invite_code = $1',
    [inviteCode]
  );
  if (room.rowCount === 0) return null;
  const roomId = room.rows[0].id as string;
  await pool.query(
    `insert into room_members (room_id, uid, role)
     values ($1, $2, 'member')
     on conflict do nothing`,
    [roomId, uid]
  );
  return { id: roomId, name: room.rows[0].name };
}

export async function getRoomMembership(uid: string, roomId: string) {
  const pool = requirePool();
  const result = await pool.query(
    'select role from room_members where room_id = $1 and uid = $2',
    [roomId, uid]
  );
  return result.rows[0] || null;
}

export async function getRoomDetail(
  uid: string,
  roomId: string,
  options?: { q?: string; status?: string; mine?: boolean; sort?: string }
) {
  const pool = requirePool();
  const room = await pool.query(
    `select r.id, r.name, r.invite_code, r.owner_uid, r.created_at, rm.role
     from rooms r
     join room_members rm on rm.room_id = r.id
     where r.id = $1 and rm.uid = $2`,
    [roomId, uid]
  );
  if (room.rowCount === 0) return null;
  const values: any[] = [roomId];
  let idx = 2;
  const filters: string[] = ['room_id = $1'];

  if (options?.q) {
    const terms = options.q.toLowerCase().split(/\s+/).filter(Boolean);
    for (const term of terms) {
      values.push(`%${term}%`);
      filters.push(`(lower(title) like $${idx} or lower(body) like $${idx})`);
      idx += 1;
    }
  }
  if (options?.status && ['open', 'done'].includes(options.status)) {
    values.push(options.status);
    filters.push(`status = $${idx}`);
    idx += 1;
  }
  if (options?.mine) {
    values.push(uid);
    filters.push(`created_by_uid = $${idx}`);
    idx += 1;
  }

  let orderBy = 'created_at desc';
  switch (options?.sort) {
    case 'created_at_asc':
      orderBy = 'created_at asc';
      break;
    case 'updated_at_desc':
      orderBy = 'updated_at desc';
      break;
    case 'status':
      orderBy = 'status asc, created_at desc';
      break;
    default:
      break;
  }

  const items = await pool.query(
    `select id, title, body, status, created_by_uid, created_at, updated_at
     from room_items
     where ${filters.join(' and ')}
     order by ${orderBy}`,
    values
  );
  const members = await pool.query(
    `select uid, role, created_at
     from room_members
     where room_id = $1
     order by role asc, created_at asc`,
    [roomId]
  );
  return { ...room.rows[0], items: items.rows, members: members.rows };
}

export async function addItem(uid: string, roomId: string, input: { title: string; body: string }) {
  const pool = requirePool();
  const result = await pool.query(
    `insert into room_items (room_id, created_by_uid, title, body)
     values ($1, $2, $3, $4)
     returning id, title, body, status, created_by_uid, created_at, updated_at`,
    [roomId, uid, input.title.trim(), input.body.trim()]
  );
  return result.rows[0];
}

export async function updateItem(uid: string, itemId: string, input: { title?: string; body?: string; status?: string }) {
  const pool = requirePool();
  const fields: string[] = [];
  const values: any[] = [uid, itemId];
  let idx = 3;

  if (input.title !== undefined) {
    fields.push(`title = $${idx}`);
    values.push(input.title.trim());
    idx += 1;
  }
  if (input.body !== undefined) {
    fields.push(`body = $${idx}`);
    values.push(input.body.trim());
    idx += 1;
  }
  if (input.status !== undefined) {
    fields.push(`status = $${idx}`);
    values.push(input.status);
    idx += 1;
  }
  if (!fields.length) return null;
  fields.push('updated_at = now()');

  const result = await pool.query(
    `update room_items i
     set ${fields.join(', ')}
     from room_members rm
     where i.id = $2 and rm.uid = $1 and rm.room_id = i.room_id
     returning i.id, i.title, i.body, i.status, i.created_by_uid, i.created_at, i.updated_at`,
    values
  );
  return result.rows[0] || null;
}

export async function deleteItemAsOwner(uid: string, itemId: string) {
  const pool = requirePool();
  const result = await pool.query(
    `delete from room_items i
     using room_members rm
     where i.id = $1 and rm.uid = $2 and rm.room_id = i.room_id and rm.role = 'owner'
     returning i.id`,
    [itemId, uid]
  );
  return result.rows[0] || null;
}
