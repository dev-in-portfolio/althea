import { getDbError, getPool } from './db';

function requirePool() {
  const pool = getPool();
  if (!pool) {
    throw new Error(getDbError() || 'Database is unavailable.');
  }
  return pool;
}

export async function createProject(userKey: string, title: string) {
  const pool = requirePool();
  const result = await pool.query(
    'insert into timeslice_projects (user_key, title) values ($1, $2) returning id, title',
    [userKey, title.trim()]
  );
  return result.rows[0];
}

export async function listProjects(userKey: string) {
  const pool = requirePool();
  const result = await pool.query(
    'select id, title, created_at from timeslice_projects where user_key = $1 order by created_at desc',
    [userKey]
  );
  return result.rows.map((row) => ({
    id: row.id,
    title: row.title,
    createdAt: row.created_at
  }));
}

export async function getProject(userKey: string, projectId: string) {
  const pool = requirePool();
  const projectResult = await pool.query(
    'select id, title from timeslice_projects where id = $1 and user_key = $2',
    [projectId, userKey]
  );
  if (projectResult.rowCount === 0) return null;
  const framesResult = await pool.query(
    'select id, order_index, title, body, image_url from timeslice_frames where project_id = $1 and user_key = $2 order by order_index asc',
    [projectId, userKey]
  );
  return {
    project: projectResult.rows[0],
    frames: framesResult.rows.map((row) => ({
      id: row.id,
      orderIndex: row.order_index,
      title: row.title,
      body: row.body,
      imageUrl: row.image_url
    }))
  };
}
