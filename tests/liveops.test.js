import { test, expect } from '@jest/globals';
import {
  createGraph, addNode, addEdge, createSim, stepSim,
  breakEdge, repairEdge, tierRows, spawnOrder, CASH_PER_GOLD_ROW,
} from '../engine.js';

function chain(...types) {
  const g = createGraph();
  const ids = types.map((t, i) => addNode(g, { type: t, x: i * 100, y: 0 }).id);
  const edges = [];
  for (let i = 0; i < ids.length - 1; i++) edges.push(addEdge(g, ids[i], ids[i + 1]));
  return { g, ids, edges };
}

test('broken edge stops flow; repair resumes it', () => {
  const { g, ids, edges } = chain('source', 'bronze');
  const sim = createSim(g);
  breakEdge(g, edges[0].id);
  for (let i = 0; i < 30; i++) stepSim(sim, g, 0.1); // 3s broken
  expect(sim.rows[ids[1]]).toBe(0);
  repairEdge(g, edges[0].id);
  for (let i = 0; i < 30; i++) stepSim(sim, g, 0.1); // 3s repaired
  expect(sim.rows[ids[1]]).toBeGreaterThanOrEqual(1);
});

test('particles already in flight are lost when their edge breaks', () => {
  const { g, ids, edges } = chain('source', 'bronze');
  const sim = createSim(g);
  for (let i = 0; i < 15; i++) stepSim(sim, g, 0.1); // 1.5s → one emitted at t=1, mid-transit
  expect(sim.inflight.length).toBeGreaterThanOrEqual(1);
  breakEdge(g, edges[0].id);
  stepSim(sim, g, 0.1);
  expect(sim.inflight.length).toBe(0); // dropped, not delivered
  expect(sim.rows[ids[1]]).toBe(0);
});

test('rows arriving at a gold table earn cash', () => {
  const { g, ids } = chain('source', 'gold');
  const sim = createSim(g);
  expect(sim.cash).toBe(0);
  for (let i = 0; i < 25; i++) stepSim(sim, g, 0.1); // first row lands ~t=2
  expect(sim.rows[ids[1]]).toBeGreaterThanOrEqual(1);
  expect(sim.cash).toBe(sim.rows[ids[1]] * CASH_PER_GOLD_ROW);
});

test('tierRows sums rows across all nodes of a tier', () => {
  const g = createGraph();
  const a = addNode(g, { type: 'gold', x: 0, y: 0 });
  const b = addNode(g, { type: 'gold', x: 1, y: 0 });
  const sim = createSim(g);
  sim.rows[a.id] = 2; sim.rows[b.id] = 3;
  expect(tierRows(sim, g, 'gold')).toBe(5);
});

test('order fulfilled within ttl pays bounty', () => {
  const { g } = chain('source', 'gold');
  const sim = createSim(g);
  const o = spawnOrder(sim, g, { tier: 'gold', rows: 2, ttl: 10, bounty: 100, penalty: 50 });
  expect(o.status).toBe('open');
  for (let i = 0; i < 40; i++) stepSim(sim, g, 0.1); // 4s → ≥2 gold rows
  expect(o.status).toBe('fulfilled');
  expect(sim.cash).toBe(tierRows(sim, g, 'gold') * CASH_PER_GOLD_ROW + 100);
});

test('order that expires costs the penalty', () => {
  const { g, edges } = chain('source', 'gold');
  const sim = createSim(g);
  breakEdge(g, edges[0].id); // nothing will arrive
  const o = spawnOrder(sim, g, { tier: 'gold', rows: 1, ttl: 1, bounty: 100, penalty: 50 });
  for (let i = 0; i < 15; i++) stepSim(sim, g, 0.1); // 1.5s > ttl
  expect(o.status).toBe('failed');
  expect(sim.cash).toBe(-50);
});

test('order progress counts only rows delivered after it spawned', () => {
  const { g, ids } = chain('source', 'gold');
  const sim = createSim(g);
  sim.rows[ids[1]] = 5; // pre-existing rows must not count
  const o = spawnOrder(sim, g, { tier: 'gold', rows: 1, ttl: 0.5, bounty: 100, penalty: 50 });
  expect(o.baseline).toBe(5);
  for (let i = 0; i < 8; i++) stepSim(sim, g, 0.1); // expires before any new row (first lands ~t=2)
  expect(o.status).toBe('failed');
});
