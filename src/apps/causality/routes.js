const express = require('express');
const userKey = require('../../middleware/userKey');
const { rateLimit } = require('../../middleware/security');
const { assertString, clampInt } = require('../../utils/validate');
const service = require('./service');
const db = require('../../db');

const router = express.Router();

const editLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 200, keyPrefix: 'edit' });
const insightsLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 20, keyPrefix: 'insights' });

router.use('/api', userKey, editLimiter);

router.post('/api/chains', async (req, res) => {
  try {
    const title = req.body.title ? assertString(req.body.title, 'title', 120) : 'Untitled Chain';
    const chain = await service.createChain(req.userKey, title);
    res.json(chain);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/api/chains', async (req, res) => {
  const chains = await service.listChains(req.userKey);
  res.json({ chains });
});

router.get('/api/chains/:id', async (req, res) => {
  const data = await service.getChain(req.userKey, req.params.id);
  if (!data) return res.status(404).json({ error: 'Chain not found' });
  return res.json(data);
});

router.patch('/api/chains/:id', async (req, res) => {
  try {
    const title = assertString(req.body.title, 'title', 120);
    const updated = await service.updateChainTitle(req.userKey, req.params.id, title);
    if (!updated) return res.status(404).json({ error: 'Chain not found' });
    return res.json(updated);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

router.post('/api/chains/:id/nodes', async (req, res) => {
  try {
    const label = assertString(req.body.label, 'label', 120);
    const weight = clampInt(req.body.weight, 1, 5, 3);
    const node = await service.addNode(req.userKey, req.params.id, label, weight);
    res.json(node);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/api/chains/:id/edges', async (req, res) => {
  try {
    const { fromNodeId, toNodeId, fromLabel, toLabel } = req.body;
    let fromId = fromNodeId;
    let toId = toNodeId;

    if (!fromId || !toId) {
      const nodesRes = await db.query(
        'select id, label from chain_nodes where chain_id = $1',
        [req.params.id]
      );
      const labelMap = new Map(nodesRes.rows.map((row) => [row.label, row.id]));
      if (!fromId && fromLabel) fromId = labelMap.get(fromLabel);
      if (!toId && toLabel) toId = labelMap.get(toLabel);
    }

    if (!fromId || !toId) {
      throw new Error('from and to nodes are required');
    }
    if (fromId === toId) {
      throw new Error('from and to cannot be the same node');
    }

    const belongRes = await db.query(
      'select count(*)::int as count from chain_nodes where chain_id = $1 and id = any($2::uuid[])',
      [req.params.id, [fromId, toId]]
    );
    if (belongRes.rows[0].count !== 2) {
      throw new Error('Nodes must belong to this chain');
    }

    const strength = clampInt(req.body.strength, 1, 5, 3);
    const edge = await service.addEdge(req.userKey, req.params.id, fromId, toId, strength);
    res.json(edge);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/api/chains/:id/nodes/:nodeId', async (req, res) => {
  const removed = await service.deleteNode(req.userKey, req.params.id, req.params.nodeId);
  if (!removed) return res.status(404).json({ error: 'Node not found' });
  return res.json({ ok: true });
});

router.delete('/api/chains/:id/edges/:edgeId', async (req, res) => {
  const removed = await service.deleteEdge(req.userKey, req.params.id, req.params.edgeId);
  if (!removed) return res.status(404).json({ error: 'Edge not found' });
  return res.json({ ok: true });
});

router.post('/api/chains/:id/insights', insightsLimiter, async (req, res) => {
  const payload = await service.computeAndStoreInsights(req.userKey, req.params.id);
  if (!payload) return res.status(404).json({ error: 'Chain not found' });
  return res.json(payload);
});

router.get('/api/chains/:id/insights', async (req, res) => {
  const payload = await service.getLatestInsights(req.userKey, req.params.id);
  if (!payload) return res.status(404).json({ error: 'No insights yet' });
  return res.json(payload);
});

module.exports = router;
