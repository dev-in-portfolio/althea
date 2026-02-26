const helmet = require('helmet');

function createRateLimiter({ windowMs, max }) {
  const hits = new Map();

  return function rateLimit(req, res, next) {
    const now = Date.now();
    const key = `${req.ip || 'unknown'}:${req.userKey || 'anon'}`;
    const entry = hits.get(key) || { count: 0, resetAt: now + windowMs };

    if (now > entry.resetAt) {
      entry.count = 0;
      entry.resetAt = now + windowMs;
    }

    entry.count += 1;
    hits.set(key, entry);

    if (entry.count > max) {
      return res.status(429).json({ error: 'Rate limit exceeded. Try again later.' });
    }

    next();
  };
}

function applySecurity(app) {
  app.use(helmet());
}

module.exports = {
  applySecurity,
  createRateLimiter
};
