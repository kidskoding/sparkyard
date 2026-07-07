import { test, expect } from '@jest/globals';
import { NODE_TYPES, createGraph, addNode, getNode, moveNode } from '../engine.js';

test('NODE_TYPES has source/silver/gold with concept strings', () => {
  expect(NODE_TYPES.source).toBeTruthy();
  expect(NODE_TYPES.source.kind).toBe('source');
  expect(NODE_TYPES.silver.tier).toBe('silver');
  expect(NODE_TYPES.bronze.concept).toMatch(/\S/);
});

test('addNode assigns incrementing ids and stores coords', () => {
  const g = createGraph();
  const a = addNode(g, { type: 'source', x: 10, y: 20 });
  const b = addNode(g, { type: 'bronze', x: 30, y: 40 });
  expect(a.id).toBe(1);
  expect(b.id).toBe(2);
  expect(g.nodes.length).toBe(2);
  expect(getNode(g, 1)).toEqual(a);
});

test('addNode rejects unknown type', () => {
  const g = createGraph();
  expect(() => addNode(g, { type: 'nope', x: 0, y: 0 })).toThrow();
});

test('moveNode updates coords', () => {
  const g = createGraph();
  const a = addNode(g, { type: 'source', x: 0, y: 0 });
  moveNode(g, a.id, 99, 88);
  expect(getNode(g, a.id).x).toBe(99);
  expect(getNode(g, a.id).y).toBe(88);
});
