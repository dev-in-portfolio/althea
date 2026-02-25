function userKey(req, res, next) {
  const key = req.header('x-user-key');
  if (!key || typeof key !== 'string') {
    return res.status(401).json({ error: 'Missing x-user-key' });
  }
  if (key.length > 128) {
    return res.status(400).json({ error: 'User key too long' });
  }
  req.userKey = key;
  return next();
}

module.exports = userKey;
