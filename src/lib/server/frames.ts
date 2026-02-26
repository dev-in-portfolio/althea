import { getDbError, getPool } from './db';

function requirePool() {
  const pool = getPool();
  if (!pool) {
    throw new Error(getDbError() || 'Database is unavailable.');
  }
  return pool;
}

export async function countFrames(userKey: string, projectId: string) {
  const pool = requirePool();
  const result = await pool.query(
    'select count(*)::int as count from timeslice_frames where project_id = $1 and user_key = $2',
    [projectId, userKey]
  );
  return result.rows[0]?.count ?? 0;
}

export async function addFrame(userKey: string, projectId: string, input: { title: string; body: string; imageUrl: string | null }) {
  const pool = requirePool();
  const client = await pool.connect();
  try {
    await client.query('begin');
    const maxResult = await client.query(
      'select coalesce(max(order_index), -1) as max from timeslice_frames where project_id = $1 and user_key = $2',
      [projectId, userKey]
    );
    const nextIndex = Number(maxResult.rows[0].max) + 1;
    const insert = await client.query(
      'insert into timeslice_frames (project_id, user_key, order_index, title, body, image_url) values ($1, $2, $3, $4, $5, $6) returning id, order_index',
      [projectId, userKey, nextIndex, input.title || '', input.body, input.imageUrl]
    );
    await client.query('commit');
    return {
      id: insert.rows[0].id,
      orderIndex: insert.rows[0].order_index,
      title: input.title || '',
      body: input.body,
      imageUrl: input.imageUrl
    };
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

export async function updateFrame(userKey: string, projectId: string, frameId: string, input: { title: string; body: string; imageUrl: string | null }) {
  const pool = requirePool();
  const result = await pool.query(
    'update timeslice_frames set title = $1, body = $2, image_url = $3 where id = $4 and project_id = $5 and user_key = $6 returning id, order_index',
    [input.title || '', input.body, input.imageUrl, frameId, projectId, userKey]
  );
  if (result.rowCount === 0) return null;
  return {
    id: result.rows[0].id,
    orderIndex: result.rows[0].order_index,
    title: input.title || '',
    body: input.body,
    imageUrl: input.imageUrl
  };
}

export async function reorderFrames(userKey: string, projectId: string, order: string[]) {
  const pool = requirePool();
  const client = await pool.connect();
  try {
    await client.query('begin');
    const current = await client.query(
      'select id from timeslice_frames where project_id = $1 and user_key = $2 order by order_index asc for update',
      [projectId, userKey]
    );
    const existing = current.rows.map((row) => row.id);
    if (existing.length !== order.length) throw new Error('order length mismatch');
    const orderSet = new Set(order);
    if (orderSet.size !== order.length) throw new Error('order has duplicates');
    for (const id of existing) {
      if (!orderSet.has(id)) throw new Error('order missing id');
    }
    for (let idx = 0; idx < order.length; idx += 1) {
      await client.query(
        'update timeslice_frames set order_index = $1 where id = $2 and project_id = $3 and user_key = $4',
        [idx, order[idx], projectId, userKey]
      );
    }
    await client.query('commit');
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteFrame(userKey: string, projectId: string, frameId: string) {
  const pool = requirePool();
  const client = await pool.connect();
  try {
    await client.query('begin');
    await client.query(
      'select id from timeslice_frames where project_id = $1 and user_key = $2 order by order_index asc for update',
      [projectId, userKey]
    );
    const del = await client.query(
      'delete from timeslice_frames where id = $1 and project_id = $2 and user_key = $3',
      [frameId, projectId, userKey]
    );
    if (del.rowCount === 0) {
      await client.query('rollback');
      return false;
    }
    await client.query(
      `with ordered as (
        select id, row_number() over (order by order_index) - 1 as new_index
        from timeslice_frames
        where project_id = $1 and user_key = $2
      )
      update timeslice_frames
      set order_index = ordered.new_index
      from ordered
      where timeslice_frames.id = ordered.id`,
      [projectId, userKey]
    );
    await client.query('commit');
    return true;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}
