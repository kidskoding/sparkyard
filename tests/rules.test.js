import { test, expect } from '@jest/globals';
import { createGraph, addNode, addEdge, createSim, validateGraph, checkWin } from '../engine.js';

test('validateGraph flags nodes with no upstream', () => {
  const g = createGraph();
  const s = addNode(g, { type: 'source', x: 0, y: 0 });
  const b = addNode(g, { type: 'bronze', x: 1, y: 0 });
  const orphan = addNode(g, { type: 'silver', x: 2, y: 0 });
  addEdge(g, s.id, b.id);
  const errs = validateGraph(g);
  expect(errs.length).toBe(1);
  expect(errs[0].nodeId).toBe(orphan.id);
  expect(errs[0].error).toBe('no upstream — nothing to process');
});

test('checkWin true once gold rows reach threshold', () => {
  const g = createGraph();
  const gnode = addNode(g, { type: 'gold', x: 0, y: 0 });
  const sim = createSim(g);
  const cond = { type: 'goldRows', tier: 'gold', atLeast: 3 };
  expect(checkWin(sim, g, cond)).toBe(false);
  sim.rows[gnode.id] = 3;
  expect(checkWin(sim, g, cond)).toBe(true);
});
