export const NODE_TYPES = {
  source: { label: 'CSV Source',   kind: 'source',    tier: null,     concept: 'Raw file landing — an external dataset entering the Lakehouse.' },
  bronze: { label: 'Bronze Table', kind: 'table',     tier: 'bronze', concept: 'Delta table of raw ingested rows — the medallion bronze layer.' },
  clean:  { label: 'Clean',        kind: 'transform', tier: null,     concept: 'A Spark transformation — dedupe/cast rows as they pass through.' },
  silver: { label: 'Silver Table', kind: 'table',     tier: 'silver', concept: 'Delta table of cleaned, conformed rows — the medallion silver layer.' },
  agg:    { label: 'Aggregate',    kind: 'transform', tier: null,     concept: 'A Spark aggregation — groupBy/sum to business metrics.' },
  gold:   { label: 'Gold Table',   kind: 'table',     tier: 'gold',   concept: 'Delta table of business-ready aggregates — the medallion gold layer.' },
};

export function createGraph() {
  return { nodes: [], edges: [], nextId: 1 };
}

export function addNode(graph, { type, x, y }) {
  if (!NODE_TYPES[type]) throw new Error(`unknown node type: ${type}`);
  const node = { id: graph.nextId++, type, x, y };
  graph.nodes.push(node);
  return node;
}

export function getNode(graph, id) {
  return graph.nodes.find(n => n.id === id);
}

export function moveNode(graph, id, x, y) {
  const n = getNode(graph, id);
  if (!n) throw new Error(`no node ${id}`);
  n.x = x; n.y = y;
  return n;
}

function hasPath(graph, fromId, toId) {
  // is there already a directed path from→...→to?
  const stack = [fromId], seen = new Set();
  while (stack.length) {
    const cur = stack.pop();
    if (cur === toId) return true;
    if (seen.has(cur)) continue;
    seen.add(cur);
    for (const e of graph.edges) if (e.from === cur) stack.push(e.to);
  }
  return false;
}

export function canConnect(graph, fromId, toId) {
  const from = getNode(graph, fromId), to = getNode(graph, toId);
  if (!from || !to) return { ok: false, reason: 'node missing' };
  if (fromId === toId) return { ok: false, reason: 'cannot wire a node to itself' };
  if (NODE_TYPES[to.type].kind === 'source') return { ok: false, reason: 'a source has no input' };
  if (graph.edges.some(e => e.from === fromId && e.to === toId)) return { ok: false, reason: 'already wired' };
  if (hasPath(graph, toId, fromId)) return { ok: false, reason: 'that would make a loop' };
  return { ok: true, reason: '' };
}

export function addEdge(graph, fromId, toId) {
  const check = canConnect(graph, fromId, toId);
  if (!check.ok) throw new Error(check.reason);
  const edge = { id: graph.nextId++, from: fromId, to: toId };
  graph.edges.push(edge);
  return edge;
}

export function removeNode(graph, id) {
  graph.nodes = graph.nodes.filter(n => n.id !== id);
  graph.edges = graph.edges.filter(e => e.from !== id && e.to !== id);
}
