const helmet = require('helmet');
const compression = require('compression');

function rateLimit({ windowMs, max, keyPrefix }) {
  const store = new Map();
  return function limiter(req, res, next) {
    const key = `${keyPrefix}:${req.userKey || req.ip}`;
    const now = Date.now();
    const entry = store.get(key);
    if (!entry || entry.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    if (entry.count >= max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.set('Retry-After', String(retryAfter));
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }
    entry.count += 1;
    store.set(key, entry);
    return next();
  };
}

module.exports = {
  helmet,
  compression,
  rateLimit
};
