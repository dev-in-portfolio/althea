const express = require("express");
const { classify } = require("../../utils/classify");
const { generateOutputs } = require("./service");
const { getPool } = require("../../db");
const userKey = require("../../middleware/userKey");
const { validateInput } = require("../../utils/validate");

const router = express.Router();

router.post("/api/angle", userKey, async (req, res) => {
  const { text, lensSet = "default", maxOutputLen = 420 } = req.body || {};
  const validation = validateInput(text);
  if (!validation.ok) {
    return res.status(400).json({ error: validation.error });
  }

  const classification = classify(text);
  const lensCount = lensSet === "all" ? 8 : 5;
  const maxLen = Math.min(Math.max(Number(maxOutputLen) || 420, 50), 1000);
  const outputs = generateOutputs({ text, classification, lensCount, maxOutputLen: maxLen });

  const pool = getPool();
  const { rows } = await pool.query(
    "INSERT INTO angle_runs (user_key, input, classification, outputs) VALUES ($1, $2, $3, $4) RETURNING id",
    [req.userKey, text, classification, outputs]
  );

  return res.json({
    id: rows[0].id,
    classification,
    outputs
  });
});

router.get("/api/history", userKey, async (req, res) => {
  const pool = getPool();
  const page = Math.max(Number(req.query.page || 1), 1);
  const limit = Math.min(Number(req.query.limit || 50), 100);
  const offset = (page - 1) * limit;
  const { rows } = await pool.query(
    "SELECT id, input, classification, created_at FROM angle_runs WHERE user_key = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
    [req.userKey, limit, offset]
  );
  return res.json({ runs: rows, page, limit });
});

router.get("/api/run/:id", userKey, async (req, res) => {
  const pool = getPool();
  const { rows } = await pool.query(
    "SELECT id, input, classification, outputs, created_at FROM angle_runs WHERE id = $1 AND user_key = $2",
    [req.params.id, req.userKey]
  );
  if (!rows.length) {
    return res.status(404).json({ error: "not found" });
  }
  return res.json(rows[0]);
});

router.delete("/api/run/:id", userKey, async (req, res) => {
  const pool = getPool();
  await pool.query("DELETE FROM angle_runs WHERE id = $1 AND user_key = $2", [req.params.id, req.userKey]);
  return res.json({ deleted: true });
});

module.exports = router;
