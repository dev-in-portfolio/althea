import { pool } from './db';

const RATE_LIMIT = Number(process.env.RATE_LIMIT_PER_MIN || 120);

function windowStart(now = new Date()) {
  const stamp = new Date(now);
  stamp.setSeconds(0, 0);
  return stamp;
}

export async function enforceRateLimit(tokenHash: string) {
  const window = windowStart();
  const { rows } = await pool.query<{ count: number }>(
    `insert into rate_limits (token_hash, window_start, count)
     values ($1, $2, 1)
     on conflict (token_hash, window_start)
     do update set count = rate_limits.count + 1
     returning count`,
    [tokenHash, window]
  );
  const count = rows[0]?.count ?? 0;
  return {
    ok: count <= RATE_LIMIT,
    remaining: Math.max(RATE_LIMIT - count, 0),
    reset: window,
    limit: RATE_LIMIT,
  };
}
