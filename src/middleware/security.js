const helmet = require("helmet");
const compression = require("compression");

const rateStore = new Map();

function rateLimit({ windowMs, max }) {
  return (req, res, next) => {
    const key = `${req.ip}:${req.headers["x-user-key"] || "anon"}`;
    const now = Date.now();
    const entry = rateStore.get(key) || { count: 0, start: now };
    if (now - entry.start > windowMs) {
      entry.count = 0;
      entry.start = now;
    }
    entry.count += 1;
    rateStore.set(key, entry);
    if (entry.count > max) {
      return res.status(429).json({ error: "rate limit exceeded" });
    }
    return next();
  };
}

function security(app) {
  app.use(helmet());
  app.use(compression());
  app.use(require("express").json({ limit: "64kb" }));
  app.use(require("express").urlencoded({ extended: true, limit: "64kb" }));
}

module.exports = { security, rateLimit };
