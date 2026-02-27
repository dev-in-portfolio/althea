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

function validateSettings(settings) {
  if (!settings || settings.version !== 1) return 'settings.version must be 1';
  if (!Array.isArray(settings.controls) || settings.controls.length < 1 || settings.controls.length > 32) {
    return 'controls length must be 1..32';
  }
  const ids = new Set();
  for (const control of settings.controls) {
    if (!control.id || control.id.length < 1 || control.id.length > 32) return 'invalid control id';
    if (ids.has(control.id)) return 'control id must be unique';
    ids.add(control.id);

    if (!['slider', 'toggle', 'segmented'].includes(control.type)) return 'invalid control type';

    if (control.type === 'slider') {
      const min = Number(control.min);
      const max = Number(control.max);
      const step = Number(control.step);
      const value = Number(control.value);
      if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max) return 'invalid slider bounds';
      if (!Number.isFinite(step) || step <= 0) return 'invalid slider step';
      if (!Number.isFinite(value) || value < min || value > max) return 'invalid slider value';
    }

    if (control.type === 'toggle') {
      if (typeof control.value !== 'boolean') return 'toggle value must be boolean';
    }

    if (control.type === 'segmented') {
      if (!Array.isArray(control.options) || control.options.length < 1) return 'segmented options required';
      if (!control.options.includes(control.value)) return 'segmented value must be in options';
    }
  }
  return null;
}

const router = express.Router();
router.use(requireDeviceKey);

router.get('/presets', async (req, res) => {
  try {
    const userId = await ensureUser(req.deviceKey);
    const result = await pool.query(
      'select id, name, created_at, updated_at from tapforge_presets where user_id = $1 order by updated_at desc',
      [userId]
    );
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to list presets.' });
  }
});

router.post('/presets', async (req, res) => {
  try {
    const userId = await ensureUser(req.deviceKey);
    const { name, settings } = req.body;
    if (!name || name.length < 1 || name.length > 80) {
      return res.status(400).json({ error: 'Name must be 1-80 chars.' });
    }
    const settingsError = validateSettings(settings);
    if (settingsError) return res.status(400).json({ error: settingsError });

    const countRes = await pool.query('select count(*) from tapforge_presets where user_id = $1', [userId]);
    if (Number(countRes.rows[0].count) >= 500) {
      return res.status(400).json({ error: 'Preset limit reached.' });
    }

    const result = await pool.query(
      'insert into tapforge_presets(user_id, name, settings) values ($1,$2,$3) returning *',
      [userId, name, settings]
    );
    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create preset.' });
  }
});

router.get('/presets/:id', async (req, res) => {
  try {
    const userId = await ensureUser(req.deviceKey);
    const result = await pool.query(
      'select * from tapforge_presets where id = $1 and user_id = $2',
      [req.params.id, userId]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found.' });
    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load preset.' });
  }
});

router.patch('/presets/:id', async (req, res) => {
  try {
    const userId = await ensureUser(req.deviceKey);
    const { name, settings } = req.body;
    if (name && (name.length < 1 || name.length > 80)) {
      return res.status(400).json({ error: 'Name must be 1-80 chars.' });
    }
    if (settings) {
      const settingsError = validateSettings(settings);
      if (settingsError) return res.status(400).json({ error: settingsError });
    }

    const existing = await pool.query(
      'select * from tapforge_presets where id = $1 and user_id = $2',
      [req.params.id, userId]
    );
    if (existing.rowCount === 0) return res.status(404).json({ error: 'Not found.' });

    const updated = await pool.query(
      'update tapforge_presets set name = $1, settings = $2 where id = $3 returning *',
      [name ?? existing.rows[0].name, settings ?? existing.rows[0].settings, req.params.id]
    );
    return res.json(updated.rows[0]);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update preset.' });
  }
});

router.post('/presets/:id/duplicate', async (req, res) => {
  try {
    const userId = await ensureUser(req.deviceKey);
    const existing = await pool.query(
      'select * from tapforge_presets where id = $1 and user_id = $2',
      [req.params.id, userId]
    );
    if (existing.rowCount === 0) return res.status(404).json({ error: 'Not found.' });
    const preset = existing.rows[0];
    const result = await pool.query(
      'insert into tapforge_presets(user_id, name, settings) values ($1, $2, $3) returning *',
      [userId, `${preset.name} Copy`, preset.settings]
    );
    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to duplicate preset.' });
  }
});

router.delete('/presets/:id', async (req, res) => {
  try {
    const userId = await ensureUser(req.deviceKey);
    const result = await pool.query(
      'delete from tapforge_presets where id = $1 and user_id = $2',
      [req.params.id, userId]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found.' });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete preset.' });
  }
});

app.use('/api/tapforge', router);

app.get('/', (req, res) => {
  res.json({ ok: true, service: 'tapforge-api' });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`TapForge API listening on ${port}`);
});
