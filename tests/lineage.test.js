import { test, expect } from '@jest/globals';
import { createGraph, addNode, addEdge, upstream, downstream } from '../engine.js';

test('upstream and downstream walk the DAG transitively', () => {
  const g = createGraph();
  const s = addNode(g, { type: 'source', x: 0, y: 0 });
  const b = addNode(g, { type: 'bronze', x: 1, y: 0 });
  const sv = addNode(g, { type: 'silver', x: 2, y: 0 });
  const go = addNode(g, { type: 'gold', x: 3, y: 0 });
  addEdge(g, s.id, b.id); addEdge(g, b.id, sv.id); addEdge(g, sv.id, go.id);
  expect(upstream(g, go.id).sort((a, z) => a - z)).toEqual([s.id, b.id, sv.id]);
  expect(downstream(g, s.id).sort((a, z) => a - z)).toEqual([b.id, sv.id, go.id]);
  expect(upstream(g, s.id)).toEqual([]);
});
