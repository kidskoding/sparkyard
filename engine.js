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

function walk(graph, id, pick) {
  const out = new Set(), stack = [id];
  while (stack.length) {
    const cur = stack.pop();
    for (const e of graph.edges) {
      const [a, b] = pick(e);
      if (a === cur && !out.has(b)) { out.add(b); stack.push(b); }
    }
  }
  out.delete(id);
  return [...out];
}
export const upstream   = (graph, id) => walk(graph, id, e => [e.to, e.from]);
export const downstream = (graph, id) => walk(graph, id, e => [e.from, e.to]);

export const EMIT_INTERVAL = 1; // seconds between source emissions
export const TRANSIT = 1;       // seconds a row spends crossing one edge
export const CASH_PER_GOLD_ROW = 10;

export function createSim(graph) {
  const rows = {}, emitTimers = {};
  for (const n of graph.nodes) {
    rows[n.id] = 0;
    if (NODE_TYPES[n.type].kind === 'source') emitTimers[n.id] = 0;
  }
  return { t: 0, rows, inflight: [], emitTimers, cash: 0, orders: [], nextOrderId: 1 };
}

export function breakEdge(graph, edgeId) {
  const e = graph.edges.find(x => x.id === edgeId);
  if (e) e.broken = true;
  return e;
}

export function repairEdge(graph, edgeId) {
  const e = graph.edges.find(x => x.id === edgeId);
  if (e) e.broken = false;
  return e;
}

export function tierRows(sim, graph, tier) {
  return graph.nodes
    .filter(n => NODE_TYPES[n.type].tier === tier)
    .reduce((sum, n) => sum + (sim.rows[n.id] || 0), 0);
}

export function spawnOrder(sim, graph, { tier, rows, ttl, bounty, penalty }) {
  const order = {
    id: sim.nextOrderId++,
    tier, rows, ttl, bounty, penalty,
    baseline: tierRows(sim, graph, tier),
    status: 'open',
  };
  sim.orders.push(order);
  return order;
}

function outEdges(graph, nodeId) {
  return graph.edges.filter(e => e.from === nodeId);
}

export function stepSim(sim, graph, dt) {
  sim.t += dt;
  // rows in flight on a broken (or removed) edge are lost
  sim.inflight = sim.inflight.filter(p => {
    const e = graph.edges.find(x => x.id === p.edgeId);
    return e && !e.broken;
  });
  // advance inflight
  const arrived = [];
  for (const p of sim.inflight) {
    p.progress += dt / TRANSIT;
    if (p.progress >= 1) arrived.push(p);
  }
  sim.inflight = sim.inflight.filter(p => p.progress < 1);
  for (const p of arrived) {
    const edge = graph.edges.find(e => e.id === p.edgeId);
    if (!edge) continue;
    sim.rows[edge.to] = (sim.rows[edge.to] || 0) + 1;
    const toNode = getNode(graph, edge.to);
    if (toNode && NODE_TYPES[toNode.type].tier === 'gold') sim.cash += CASH_PER_GOLD_ROW;
    for (const oe of outEdges(graph, edge.to)) {
      if (!oe.broken) sim.inflight.push({ edgeId: oe.id, progress: 0 });
    }
  }
  // source emission
  for (const n of graph.nodes) {
    if (NODE_TYPES[n.type].kind !== 'source') continue;
    sim.emitTimers[n.id] = (sim.emitTimers[n.id] || 0) + dt; // guard sources added after createSim
    while (sim.emitTimers[n.id] >= EMIT_INTERVAL) {
      sim.emitTimers[n.id] -= EMIT_INTERVAL;
      for (const oe of outEdges(graph, n.id)) {
        if (!oe.broken) sim.inflight.push({ edgeId: oe.id, progress: 0 });
      }
    }
  }
  // orders
  for (const o of sim.orders) {
    if (o.status !== 'open') continue;
    o.ttl -= dt;
    if (tierRows(sim, graph, o.tier) - o.baseline >= o.rows) {
      o.status = 'fulfilled';
      sim.cash += o.bounty;
    } else if (o.ttl <= 0) {
      o.status = 'failed';
      sim.cash -= o.penalty;
    }
  }
  return sim;
}

export function validateGraph(graph) {
  const out = [];
  for (const n of graph.nodes) {
    const kind = NODE_TYPES[n.type].kind;
    if (kind === 'source') continue;
    if (!graph.edges.some(e => e.to === n.id)) out.push({ nodeId: n.id, error: 'no upstream — nothing to process' });
  }
  return out;
}

export function checkWin(sim, graph, condition) {
  const total = graph.nodes
    .filter(n => NODE_TYPES[n.type].tier === condition.tier)
    .reduce((sum, n) => sum + (sim.rows[n.id] || 0), 0);
  return total >= condition.atLeast;
}
