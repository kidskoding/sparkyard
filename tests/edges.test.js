import { test, expect } from '@jest/globals';
import { createGraph, addNode, getNode, canConnect, addEdge, removeNode } from '../engine.js';

test('valid edge connects source→bronze', () => {
  const g = createGraph();
  const s = addNode(g, { type: 'source', x: 0, y: 0 });
  const b = addNode(g, { type: 'bronze', x: 100, y: 0 });
  expect(canConnect(g, s.id, b.id).ok).toBe(true);
  const e = addEdge(g, s.id, b.id);
  expect(e.from).toBe(s.id);
  expect(e.to).toBe(b.id);
  expect(g.edges.length).toBe(1);
});

test('rejects self-loop, duplicate, source-as-target, and cycles', () => {
  const g = createGraph();
  const s = addNode(g, { type: 'source', x: 0, y: 0 });
  const b = addNode(g, { type: 'bronze', x: 1, y: 0 });
  const sv = addNode(g, { type: 'silver', x: 2, y: 0 });
  addEdge(g, s.id, b.id);
  addEdge(g, b.id, sv.id);
  expect(canConnect(g, b.id, b.id).ok).toBe(false);   // self
  expect(canConnect(g, s.id, b.id).ok).toBe(false);   // duplicate
  expect(canConnect(g, b.id, s.id).ok).toBe(false);   // source as target
  expect(canConnect(g, sv.id, b.id).ok).toBe(false);  // cycle sv→b→sv
});

test('removeNode drops the node and its edges', () => {
  const g = createGraph();
  const s = addNode(g, { type: 'source', x: 0, y: 0 });
  const b = addNode(g, { type: 'bronze', x: 1, y: 0 });
  addEdge(g, s.id, b.id);
  removeNode(g, b.id);
  expect(getNode(g, b.id)).toBeUndefined();
  expect(g.edges.length).toBe(0);
});
