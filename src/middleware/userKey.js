function isValidUserKey(value) {
  if (!value) return false;
  if (typeof value !== 'string') return false;
  if (value.length > 200) return false;
  return true;
}

function requireUserKey(req, res, next) {
  const headerKey = req.get('x-user-key');
  if (!isValidUserKey(headerKey)) {
    return res.status(400).json({ error: 'Missing or invalid x-user-key header.' });
  }
  req.userKey = headerKey;
  next();
}

module.exports = {
  isValidUserKey,
  requireUserKey
};
