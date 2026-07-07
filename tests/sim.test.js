import { test, expect } from '@jest/globals';
import { createGraph, addNode, addEdge, createSim, stepSim, EMIT_INTERVAL, TRANSIT } from '../engine.js';

test('rows accumulate downstream deterministically', () => {
  const g = createGraph();
  const s = addNode(g, { type: 'source', x: 0, y: 0 });
  const b = addNode(g, { type: 'bronze', x: 1, y: 0 });
  addEdge(g, s.id, b.id);
  const sim = createSim(g);
  expect(sim.rows[b.id]).toBe(0);
  // emit at t=1 (into edge), transit 1s → arrives bronze at ~t=2
  for (let i = 0; i < 25; i++) stepSim(sim, g, 0.1); // 2.5s
  expect(sim.rows[b.id]).toBeGreaterThanOrEqual(1);
});

test('same dt sequence gives identical row counts (determinism)', () => {
  const build = () => {
    const g = createGraph();
    const s = addNode(g, { type: 'source', x: 0, y: 0 });
    const b = addNode(g, { type: 'bronze', x: 1, y: 0 });
    addEdge(g, s.id, b.id);
    const sim = createSim(g);
    for (let i = 0; i < 60; i++) stepSim(sim, g, 0.1);
    return sim.rows[b.id];
  };
  expect(build()).toBe(build());
});
