module.exports = function userKey(req, res, next) {
  const key = req.headers["x-user-key"];
  if (!key || typeof key !== "string" || key.length > 64) {
    return res.status(400).json({ error: "x-user-key required" });
  }
  req.userKey = key;
  next();
};
