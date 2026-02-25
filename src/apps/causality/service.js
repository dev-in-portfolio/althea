const db = require('../../db');
const { clampInt } = require('../../utils/validate');
const {
  buildGraph,
  detectCycle,
  computeReach,
  computePathThrough,
  normalizeScores
} = require('../../utils/graph');
const {
  explainLeverage,
  explainRoot,
  explainSink,
  explainBottleneck
} = require('../../utils/text');

const MAX_NODES = 200;
const MAX_EDGES = 400;

async function createChain(userKey, title) {
  const res = await db.query(
    'insert into chains (user_key, title) values ($1, $2) returning *',
    [userKey, title || 'Untitled Chain']
  );
  return res.rows[0];
}

async function listChains(userKey) {
  const res = await db.query(
    'select * from chains where user_key = $1 order by created_at desc',
    [userKey]
  );
  return res.rows;
}

async function updateChainTitle(userKey, chainId, title) {
  const res = await db.query(
    'update chains set title = $1 where id = $2 and user_key = $3 returning *',
    [title, chainId, userKey]
  );
  return res.rows[0];
}

async function getChain(userKey, chainId) {
  const chainRes = await db.query(
    'select * from chains where id = $1 and user_key = $2',
    [chainId, userKey]
  );
  const chain = chainRes.rows[0];
  if (!chain) return null;

  const nodesRes = await db.query(
    'select * from chain_nodes where chain_id = $1 order by created_at asc',
    [chainId]
  );
  const edgesRes = await db.query(
    'select * from chain_edges where chain_id = $1 order by created_at asc',
    [chainId]
  );

  return { chain, nodes: nodesRes.rows, edges: edgesRes.rows };
}

async function addNode(userKey, chainId, label, weight) {
  const countRes = await db.query(
    'select count(*)::int as count from chain_nodes where chain_id = $1',
    [chainId]
  );
  if (countRes.rows[0].count >= MAX_NODES) {
    throw new Error('Node limit reached');
  }
  const safeWeight = clampInt(weight, 1, 5, 3);
  const res = await db.query(
    'insert into chain_nodes (chain_id, user_key, label, weight) values ($1, $2, $3, $4) returning *',
    [chainId, userKey, label, safeWeight]
  );
  return res.rows[0];
}

async function addEdge(userKey, chainId, fromNodeId, toNodeId, strength) {
  const countRes = await db.query(
    'select count(*)::int as count from chain_edges where chain_id = $1',
    [chainId]
  );
  if (countRes.rows[0].count >= MAX_EDGES) {
    throw new Error('Edge limit reached');
  }
  const safeStrength = clampInt(strength, 1, 5, 3);
  const res = await db.query(
    'insert into chain_edges (chain_id, user_key, from_node_id, to_node_id, strength) values ($1, $2, $3, $4, $5) returning *',
    [chainId, userKey, fromNodeId, toNodeId, safeStrength]
  );
  return res.rows[0];
}

async function deleteNode(userKey, chainId, nodeId) {
  const res = await db.query(
    'delete from chain_nodes where id = $1 and chain_id = $2 and user_key = $3 returning id',
    [nodeId, chainId, userKey]
  );
  return res.rowCount > 0;
}

async function deleteEdge(userKey, chainId, edgeId) {
  const res = await db.query(
    'delete from chain_edges where id = $1 and chain_id = $2 and user_key = $3 returning id',
    [edgeId, chainId, userKey]
  );
  return res.rowCount > 0;
}

function computeInsights(nodes, edges) {
  const { nodesById, out, incoming } = buildGraph(nodes, edges);
  const nodeIds = nodes.map((node) => node.id);
  const hasCycle = detectCycle(out, nodeIds);

  const degree = new Map();
  for (const id of nodeIds) {
    degree.set(id, {
      inDegree: (incoming.get(id) || []).length,
      outDegree: (out.get(id) || []).length
    });
  }

  const reachData = new Map();
  for (const id of nodeIds) {
    reachData.set(id, computeReach(out, nodesById, id));
  }

  const pathThrough = computePathThrough(out, nodeIds);

  const leverageItems = nodeIds.map((id) => {
    const node = nodesById.get(id);
    const { reachCount, weightedReach } = reachData.get(id);
    const outEdges = out.get(id) || [];
    const avgStrength = outEdges.length
      ? outEdges.reduce((sum, edge) => sum + edge.strength, 0) / outEdges.length
      : 0;
    const leverageValue = (reachCount + weightedReach / 5) * avgStrength * (node.weight / 5);
    return {
      nodeId: id,
      label: node.label,
      reachCount,
      avgStrength,
      nodeWeight: node.weight,
      leverageValue
    };
  });

  const leverageScored = normalizeScores(leverageItems, 'leverageValue');
  const leverage = leverageScored
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((item) => ({
      nodeId: item.nodeId,
      label: item.label,
      score: hasCycle ? item.score * 0.9 : item.score,
      why: explainLeverage(item)
    }));

  const roots = leverageScored
    .filter((item) => degree.get(item.nodeId).inDegree === 0)
    .sort((a, b) => b.reachCount - a.reachCount)
    .slice(0, 5)
    .map((item) => ({
      nodeId: item.nodeId,
      label: item.label,
      score: item.score,
      why: explainRoot({
        reachCount: item.reachCount,
        outDegree: degree.get(item.nodeId).outDegree
      })
    }));

  const sinks = leverageScored
    .filter((item) => degree.get(item.nodeId).outDegree === 0)
    .sort((a, b) => degree.get(b.nodeId).inDegree - degree.get(a.nodeId).inDegree)
    .slice(0, 5)
    .map((item) => ({
      nodeId: item.nodeId,
      label: item.label,
      score: item.score,
      why: explainSink({ inDegree: degree.get(item.nodeId).inDegree })
    }));

  const bottleneckItems = nodeIds.map((id) => {
    return {
      nodeId: id,
      label: nodesById.get(id).label,
      pathThrough: pathThrough.get(id) || 0
    };
  });
  const bottleneckScored = normalizeScores(bottleneckItems, 'pathThrough');
  const bottlenecks = bottleneckScored
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((item) => ({
      nodeId: item.nodeId,
      label: item.label,
      score: item.score,
      why: explainBottleneck(item)
    }));

  const suggestions = leverage.slice(0, 3).map((item) => ({
    type: 'intervention',
    target: item.label,
    reason: 'High downstream impact and strong leverage score.'
  }));

  return {
    roots,
    sinks,
    leverage,
    bottlenecks,
    suggestions,
    meta: {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      hasCycle
    }
  };
}

async function computeAndStoreInsights(userKey, chainId) {
  const chainData = await getChain(userKey, chainId);
  if (!chainData) return null;
  const insights = computeInsights(chainData.nodes, chainData.edges);
  const payload = { chainId, insights };
  await db.query(
    'insert into chain_insights (chain_id, user_key, payload) values ($1, $2, $3)',
    [chainId, userKey, payload]
  );
  return payload;
}

async function getLatestInsights(userKey, chainId) {
  const res = await db.query(
    'select payload from chain_insights where chain_id = $1 and user_key = $2 order by computed_at desc limit 1',
    [chainId, userKey]
  );
  return res.rows[0] ? res.rows[0].payload : null;
}

module.exports = {
  createChain,
  listChains,
  updateChainTitle,
  getChain,
  addNode,
  addEdge,
  deleteNode,
  deleteEdge,
  computeAndStoreInsights,
  getLatestInsights
};
