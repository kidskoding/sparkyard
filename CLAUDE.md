# Sparkyard

A sandbox game that teaches Databricks (and Spark, Delta, Unity Catalog, orchestration)
by making the abstract plumbing physical — a live node graph you wire, run, break, and fix.

**Full design:** `docs/design.md` — read it first.

## Build target
- Single self-contained `index.html`. Vanilla JS. No framework, no build step.
- Nodes = draggable DOM divs; wires = SVG paths; data = animated particles (rAF sim).
- Sandbox-first; 8-level campaign is JSON-driven challenges on the same engine.
- Ships as an Artifact, playable in-browser.

## Grounding
Modeled on the real CPG Trade Promotion Agent demo in `../cpg/` (Databricks stack:
Spark, Delta, Unity Catalog, MLflow, Mosaic AI) — the actual system Sparkyard teaches.
