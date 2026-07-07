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
