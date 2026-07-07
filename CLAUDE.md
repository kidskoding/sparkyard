# Sparkyard

A sandbox game that teaches Databricks (and Spark, Delta, Unity Catalog, orchestration)
by making the abstract plumbing physical — a live node graph you wire, run, break, and fix.

**Full design:** `docs/design.md` — read it first. `docs/` is gitignored (local only, never pushed).

## Build target
- Single self-contained `index.html`. Vanilla JS. No framework, no build step.
- Nodes = draggable DOM divs; wires = SVG paths; data = animated particles (rAF sim).
- Sandbox-first; 8-level campaign is JSON-driven challenges on the same engine.
- Ships as an Artifact, playable in-browser.

## Code layout (dev vs ship)
- Pure engine logic (graph model, edge validation, sim tick, lineage, win eval) lives in a
  DOM-free ESM module (`engine.js`) so it's unit-testable with `node --test` — no framework.
- `index.html` loads the module via `<script type="module">` and owns all DOM/render/rAF/CSS.
- At Artifact ship time, inline the module into one `index.html`.

## Workflow (non-negotiable)
- Build in phases. Each checkpoint = working slice + passing tests + commit. Don't advance
  until the current phase's tests are green and committed.
- Engine phases: TDD with `node --test` (built-in `node:test` + `node:assert`).
- DOM phases: Playwright MCP smoke check as the checkpoint test.
- Use superpowers skills (brainstorming → writing-plans → executing/subagent-driven, TDD).

## Repo & deploy
- GitHub: `kidskoding/sparkyard` (public), remote `origin` (ssh).
- Deploy: Vercel as a static site (framework preset "Other", no build) or as a Claude Artifact.
  No backend, no AWS — the whole "Databricks" is a JS simulation in-browser.

## Grounding
Modeled on the real CPG Trade Promotion Agent demo in `../cpg/` (Databricks stack:
Spark, Delta, Unity Catalog, MLflow, Mosaic AI) — the actual system Sparkyard teaches.
