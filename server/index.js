import express from 'express';
import cors from 'cors';
import pg from 'pg';

const { Pool } = pg;
const app = express();

app.use(cors());
app.use(express.json({ limit: '64kb' }));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
});

function requireDeviceKey(req, res, next) {
  const deviceKey = req.header('X-Device-Key');
  if (!deviceKey || deviceKey.length < 8) {
    return res.status(401).json({ error: 'Missing device key.' });
  }
  req.deviceKey = deviceKey;
  next();
}

async function ensureUser(deviceKey) {
  await pool.query('insert into users(device_key) values ($1) on conflict do nothing', [deviceKey]);
  const result = await pool.query('select id from users where device_key = $1', [deviceKey]);
  return result.rows[0].id;
}

function normalizeTag(name) {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

function validateEntry(body) {
  if (!body || body.trim().length === 0) return 'Body required.';
  if (body.length > 20000) return 'Body too long.';
  return null;
}

app.get('/', (req, res) => {
  res.json({ ok: true, service: 'pocket-dossier-api' });
});

const router = express.Router();
router.use(requireDeviceKey);

router.get('/entries', async (req, res) => {
  try {
    const userId = await ensureUser(req.deviceKey);
    const { q, tag, from, to, cursor, limit = '50' } = req.query;

    const filters = ['e.user_id = $1'];
    const values = [userId];
    let idx = 2;

    if (from) {
      values.push(from);
      filters.push(`e.occurred_at >= $${idx++}`);
    }
    if (to) {
      values.push(to);
      filters.push(`e.occurred_at <= $${idx++}`);
    }
    if (cursor) {
      values.push(cursor);
      filters.push(`e.occurred_at < $${idx++}`);
    }
    if (q) {
      values.push(`%${q}%`);
      filters.push(`(e.title ilike $${idx} or e.body ilike $${idx})`);
      idx++;
    }
    let tagJoin = '';
    if (tag) {
      values.push(normalizeTag(tag));
      tagJoin = `join dossier_entry_tags det on det.entry_id = e.id join dossier_tags dt on dt.id = det.tag_id and dt.name = $${idx++}`;
    }

    values.push(Math.min(Number(limit), 100));
    const sql = `
      select e.*, coalesce(array_agg(dt.name) filter (where dt.name is not null), '{}') as tags
      from dossier_entries e
      left join dossier_entry_tags det_all on det_all.entry_id = e.id
      left join dossier_tags dt on dt.id = det_all.tag_id
      ${tagJoin}
      where ${filters.join(' and ')}
      group by e.id
      order by e.occurred_at desc
      limit $${idx}
    `;

    const result = await pool.query(sql, values);
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to list entries.' });
  }
});

router.post('/entries', async (req, res) => {
  try {
    const userId = await ensureUser(req.deviceKey);
    const { title = '', body, occurredAt, tags = [] } = req.body;
    const validation = validateEntry(body);
    if (validation) return res.status(400).json({ error: validation });

    const result = await pool.query(
      'insert into dossier_entries(user_id, title, body, occurred_at) values ($1,$2,$3,$4) returning *',
      [userId, title, body, occurredAt ?? new Date().toISOString()]
    );
    const entry = result.rows[0];

    if (Array.isArray(tags) && tags.length > 0) {
      await replaceTags(userId, entry.id, tags);
    }

    const tagNames = Array.isArray(tags) ? tags.map(normalizeTag) : [];
    return res.json({ ...entry, tags: tagNames });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create entry.' });
  }
});

router.get('/entries/:id', async (req, res) => {
  try {
    const userId = await ensureUser(req.deviceKey);
    const result = await pool.query(
      'select * from dossier_entries where id = $1 and user_id = $2',
      [req.params.id, userId]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found.' });
    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load entry.' });
  }
});

router.patch('/entries/:id', async (req, res) => {
  try {
    const userId = await ensureUser(req.deviceKey);
    const { title, body, occurredAt, tags } = req.body;
    if (body) {
      const validation = validateEntry(body);
      if (validation) return res.status(400).json({ error: validation });
    }

    const existing = await pool.query(
      'select * from dossier_entries where id = $1 and user_id = $2',
      [req.params.id, userId]
    );
    if (existing.rowCount === 0) return res.status(404).json({ error: 'Not found.' });

    const updated = await pool.query(
      'update dossier_entries set title = $1, body = $2, occurred_at = $3 where id = $4 returning *',
      [title ?? existing.rows[0].title, body ?? existing.rows[0].body, occurredAt ?? existing.rows[0].occurred_at, req.params.id]
    );

    if (Array.isArray(tags)) {
      await replaceTags(userId, req.params.id, tags);
    }

    return res.json({ ...updated.rows[0], tags: Array.isArray(tags) ? tags.map(normalizeTag) : [] });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update entry.' });
  }
});

router.delete('/entries/:id', async (req, res) => {
  try {
    const userId = await ensureUser(req.deviceKey);
    const result = await pool.query(
      'delete from dossier_entries where id = $1 and user_id = $2',
      [req.params.id, userId]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found.' });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete entry.' });
  }
});

router.get('/tags', async (req, res) => {
  try {
    const userId = await ensureUser(req.deviceKey);
    const result = await pool.query('select id, name from dossier_tags where user_id = $1 order by name asc', [userId]);
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to list tags.' });
  }
});

router.post('/tags', async (req, res) => {
  try {
    const userId = await ensureUser(req.deviceKey);
    const name = normalizeTag(req.body.name || '');
    if (!name || name.length > 32) return res.status(400).json({ error: 'Invalid tag.' });
    const result = await pool.query(
      'insert into dossier_tags(user_id, name) values ($1, $2) on conflict (user_id, name) do update set name = excluded.name returning id, name',
      [userId, name]
    );
    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create tag.' });
  }
});

router.post('/entries/:id/tags', async (req, res) => {
  try {
    const userId = await ensureUser(req.deviceKey);
    const tags = Array.isArray(req.body.tags) ? req.body.tags : [];
    await replaceTags(userId, req.params.id, tags);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update tags.' });
  }
});

router.delete('/entries/:id/tags/:tagId', async (req, res) => {
  try {
    const userId = await ensureUser(req.deviceKey);
    await pool.query(
      'delete from dossier_entry_tags where entry_id = $1 and tag_id = $2 and entry_id in (select id from dossier_entries where user_id = $3)',
      [req.params.id, req.params.tagId, userId]
    );
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete tag.' });
  }
});

async function replaceTags(userId, entryId, tags) {
  const normalized = tags.map(normalizeTag).filter(Boolean).slice(0, 25);
  const client = await pool.connect();
  try {
    await client.query('begin');
    const entry = await client.query('select id from dossier_entries where id = $1 and user_id = $2', [entryId, userId]);
    if (entry.rowCount === 0) {
      await client.query('rollback');
      throw new Error('Entry not found');
    }
    const tagIds = [];
    for (const name of normalized) {
      const tag = await client.query(
        'insert into dossier_tags(user_id, name) values ($1, $2) on conflict (user_id, name) do update set name = excluded.name returning id',
        [userId, name]
      );
      tagIds.push(tag.rows[0].id);
    }
    await client.query('delete from dossier_entry_tags where entry_id = $1', [entryId]);
    for (const tagId of tagIds) {
      await client.query('insert into dossier_entry_tags(entry_id, tag_id) values ($1, $2)', [entryId, tagId]);
    }
    await client.query('commit');
  } catch (err) {
    await client.query('rollback');
    throw err;
  } finally {
    client.release();
  }
}

app.use('/api/dossier', router);

const port = process.env.PORT || 4001;
app.listen(port, () => {
  console.log(`Pocket Dossier API listening on ${port}`);
});
