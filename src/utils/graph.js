function buildGraph(nodes, edges) {
  const nodesById = new Map();
  const out = new Map();
  const incoming = new Map();
  for (const node of nodes) {
    nodesById.set(node.id, node);
    out.set(node.id, []);
    incoming.set(node.id, []);
  }
  for (const edge of edges) {
    if (!nodesById.has(edge.from_node_id) || !nodesById.has(edge.to_node_id)) {
      continue;
    }
    out.get(edge.from_node_id).push({ to: edge.to_node_id, strength: edge.strength });
    incoming.get(edge.to_node_id).push({ from: edge.from_node_id, strength: edge.strength });
  }
  return { nodesById, out, incoming };
}

function detectCycle(out, nodeIds) {
  const color = new Map();
  for (const id of nodeIds) color.set(id, 0);

  let hasCycle = false;
  function dfs(id) {
    if (hasCycle) return;
    color.set(id, 1);
    const edges = out.get(id) || [];
    for (const edge of edges) {
      const next = edge.to;
      const c = color.get(next) || 0;
      if (c === 1) {
        hasCycle = true;
        return;
      }
      if (c === 0) dfs(next);
    }
    color.set(id, 2);
  }

  for (const id of nodeIds) {
    if (color.get(id) === 0) dfs(id);
  }
  return hasCycle;
}

function computeReach(out, nodesById, startId) {
  const visited = new Set();
  const stack = [startId];
  visited.add(startId);
  let reachCount = 0;
  let weightedReach = 0;

  while (stack.length) {
    const current = stack.pop();
    const edges = out.get(current) || [];
    for (const edge of edges) {
      const next = edge.to;
      if (!visited.has(next)) {
        visited.add(next);
        stack.push(next);
        reachCount += 1;
        const nextNode = nodesById.get(next);
        weightedReach += edge.strength * (nextNode ? nextNode.weight : 1);
      }
    }
  }

  return { reachCount, weightedReach };
}

function computePathThrough(out, nodeIds) {
  const pathThrough = new Map();
  for (const id of nodeIds) pathThrough.set(id, 0);

  const roots = nodeIds.filter((id) => {
    let inDegree = 0;
    for (const other of nodeIds) {
      const edges = out.get(other) || [];
      if (edges.some((e) => e.to === id)) inDegree += 1;
    }
    return inDegree === 0;
  });

  const startNodes = roots.length ? roots : nodeIds;

  for (const root of startNodes) {
    const visited = new Set([root]);
    const queue = [root];
    while (queue.length) {
      const current = queue.shift();
      const edges = out.get(current) || [];
      for (const edge of edges) {
        const next = edge.to;
        if (!visited.has(next)) {
          visited.add(next);
          queue.push(next);
          pathThrough.set(next, (pathThrough.get(next) || 0) + 1);
        }
      }
    }
  }

  return pathThrough;
}

function normalizeScores(items, valueKey) {
  const values = items.map((item) => item[valueKey]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) {
    return items.map((item) => ({ ...item, score: 0 }));
  }
  return items.map((item) => ({ ...item, score: (item[valueKey] - min) / (max - min) }));
}

module.exports = {
  buildGraph,
  detectCycle,
  computeReach,
  computePathThrough,
  normalizeScores
};
