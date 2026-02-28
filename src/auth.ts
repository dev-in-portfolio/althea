import crypto from 'crypto';
import type { Context, Next } from 'hono';
import { pool } from './db';

export type ApiKeyRecord = {
  id: string;
  token_hash: string;
  label: string;
  scopes: string[];
  is_active: boolean;
  created_at: string;
};

export function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateToken() {
  return crypto.randomBytes(24).toString('base64url');
}

export async function requireApiKey(c: Context, next: Next) {
  const authHeader = c.req.header('authorization') || '';
  const raw = authHeader.replace(/bearer\s+/i, '').trim();
  if (!raw) {
    return c.json({ error: 'Missing Authorization: Bearer <token>' }, 401);
  }
  const tokenHash = hashToken(raw);
  const { rows } = await pool.query<ApiKeyRecord>(
    'select * from api_keys where token_hash = $1 and is_active = true',
    [tokenHash]
  );
  if (!rows[0]) {
    return c.json({ error: 'Invalid or inactive token' }, 403);
  }
  c.set('tokenHash', tokenHash);
  c.set('apiKey', rows[0]);
  await next();
}

export function requireScope(scope: string) {
  return async (c: Context, next: Next) => {
    const apiKey = c.get('apiKey') as ApiKeyRecord | undefined;
    if (!apiKey) {
      return c.json({ error: 'API key not loaded' }, 500);
    }
    if (!apiKey.scopes.includes(scope) && !apiKey.scopes.includes('admin')) {
      return c.json({ error: `Missing required scope: ${scope}` }, 403);
    }
    await next();
  };
}

export async function requireAdminToken(c: Context, next: Next) {
  const master = process.env.MASTER_ADMIN_TOKEN || '';
  const authHeader = c.req.header('authorization') || '';
  const token = authHeader.replace(/bearer\s+/i, '').trim();
  if (!master || token !== master) {
    return c.json({ error: 'Unauthorized admin token' }, 401);
  }
  await next();
}
