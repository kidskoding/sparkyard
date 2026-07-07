# Sparkyard — design spec

**One-liner:** A real-time, sandbox data-platform sim where you wire up Spark, Delta,
Unity Catalog, and orchestration as a living node graph — build it, run it, watch data
flow, break it, trace the wire, heal it. Makes abstract Databricks concepts *physical*.

**Audience:** high-schoolers → 30+. No coding required to play (concept mode); optional
pro mode types real SQL/PySpark.

**Goal:** a student walks away able to point at any Databricks / Spark / Airflow screen
and orient — because they built the same thing as a living machine.

---

## The kind of game

Direct-manipulation **canvas sim** — Factorio × Blender node editor × wiring puzzle.
Sandbox-first: a free-build canvas is the heart; the campaign is guided challenges
running on the *same* engine.

Core interaction loop:
```
wire the graph → hit Run → data flows (particles) →
something goes red → click it → lineage lights up →
drag the fix → Run again → green → 💰 cash + ⭐ quality
```
Never read walls of text — operate a machine. Every object is grab-able; every click
self-explains in one line naming the real Databricks concept.

## Design principle: spatialize the abstraction

Databricks is invisible plumbing. Every abstract concept becomes a physical on-screen
thing you grab, connect, and watch react. Spark is the load-bearing floor — the game
says it out loud: "Databricks is Spark, made managed."

| Concept | Made physical |
|---|---|
| Table | Glowing box filling with visible rows |
| Bronze→silver→gold | Pipes you draw; data flows through |
| Transform | Node dropped on a pipe; data changes passing through |
| Delta / time travel | Version slider on a table — drag back, rows revert |
| Spark partitions | Data box splits into visible chunks |
| Spark workers/executors | Worker units grabbing partitions, chewing in parallel |
| Transformations (lazy) | Ghost/plan outline — nothing runs yet |
| Actions (eager) | Fires the plan; workers light up |
| Shuffle / skew | Data crosses the canvas between chunks — visibly slow; straggler chunk |
| Cache | Pin a table → glows "in memory" → re-run instant |
| Unity Catalog | Lock icons + permission wires user→table (wrong = breach) |
| Lineage | Click a table → pipes light up tracing back to source |
| Orchestrator (Workflows/Airflow/DLT) | Conductor/clock panel above canvas; ticks fire the pipeline |
| MLflow | Model box fed by a table; runs stack as comparable cards |
| Dashboard/BI/Genie | Gold table → chart lights up |
| Incident | Pipe turns red and stops flowing — trace + fix |

## The three layers (the connective lesson)

The game gives each its own visible zone so students stop confusing them:
```
ORCHESTRATION (Workflows / Airflow / DLT)   ← when things run
        ↓ triggers
COMPUTE ENGINE (Spark)                        ← how data is processed
        ↓ operates on
STORAGE + GOVERNANCE (Delta + Unity Catalog)  ← where data lives, who sees it
```

## Full key-Databricks inventory (all pinned)

- Orchestration: Workflows/Jobs, Airflow (external), DLT
- Compute (Spark): core, transformations/actions, shuffle/skew/cache, clusters, SQL warehouse, Photon
- Storage/format: Delta Lake, time travel, ACID/schema, medallion, Lakehouse
- Governance: Unity Catalog, lineage, catalog/schema/table, PII tags/access
- AI/ML + consumption: MLflow (track/register/serve), model serving, notebooks, dashboards/Genie/BI, Mosaic AI agent (capstone)

## Campaign (8 levels, JSON-driven)

1. Ingest → Bronze (Lakehouse, Delta)
2. Spark under the hood (partitions, lazy/action, workers)
3. Clean → Silver (medallion, quality, schema drift)
4. Aggregate → Gold + dashboard (business value)
5. Optimize (shuffle/skew/cache/Photon — the Spark boss)
6. Govern (Unity Catalog, lineage, PII)
7. Orchestrate (Workflows + Airflow + DLT, 2am failure)
8. Ship AI (MLflow → serve the agent — capstone)

**Content engine, not a fixed game:** each level = a JSON blob (scenario, node palette,
win condition, concept taught). Same engine renders all. Adding any future topic
(vector search, streaming) = one JSON entry, zero code.

## Architecture (buildable this session)

- Single self-contained `index.html`. Vanilla JS. No framework, no build step.
- Nodes = absolutely-positioned DOM divs; wires = SVG paths; data = animated particles.
- State: `nodes[]`, `edges[]`, real-time sim tick (requestAnimationFrame).
- Save: localStorage.
- Ships as an Artifact — playable in-browser immediately.
- Difficulty: concept mode default; per-level "pro mode" toggle for real SQL/PySpark
  (ponytail: if pro mode balloons, ships level-1 only, expands later).

## Success criteria

- A student wires a bronze→silver→gold pipeline, runs it, sees Spark workers process
  partitions, breaks it via schema drift, traces lineage, and fixes it — without reading
  a manual.
- Every mechanic maps 1:1 to a real Databricks/Spark concept via a one-line self-doc.
