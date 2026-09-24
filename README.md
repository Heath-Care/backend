# PRECURSOR-X — Safety Intelligence Platform

> **DEMO ENVIRONMENT • SYNTHETIC DATA**
> This application is a production-grade frontend prototype for high-hazard industrial safety intelligence (oil & gas, chemicals, offshore, energy). It operates with high-fidelity deterministic synthetic datasets. **No external Gemini API key or backend server is required to run this demo.**

---

## Overview

PRECURSOR-X transforms unstructured incident reports, near-misses, and barrier telemetry into actionable precursor intelligence to prevent Serious Injuries and Fatalities (SIF).

The platform implements 9 specialized operational workspaces derived from Google Stitch UI/UX specifications:

1. **/dashboard** — Executive Risk Command with live pulse telemetry, facility filtering (14 global assets), trajectory curves, and real JSON dossier export.
2. **/report-analyzer** — Interactive NLP Diagnostics extracting precursors, hazards, barrier breaches, mitigating controls (SWA), and an interactive Bowtie Model SVG.
3. **/risk-intelligence** — Multi-dimensional risk vector console featuring a dynamic 5×5 Consequence Severity vs Probability Frequency Matrix, asset benchmark ratios, and facility leading indicator tables.
4. **/safety-dna** — Precursor Pattern Discovery with genomic clustering (DBSCAN), causal-chain topological pathways, and phenotype failure mode inspection.
5. **/safety-memory** — Institutional Corpus Search across 142,890 historical records with three distinct search modes:
   - **Semantic**: Multi-field weighted matching (precursors, narrative, title, LSR, facility) with dynamic similarity scoring.
   - **Keyword**: Exact and partial term frequency filtering.
   - **Fingerprint**: Precursor and failure-vector Jaccard similarity.
6. **/knowledge-graph** — Relational Safety Ontology featuring Force-Directed, Causal Chain, and Barrier Tree layouts, node search, and a live Barrier Restoration Simulation propagating risk adjustments across connected nodes.
7. **/what-changed** — Precursor Velocity Shift Monitor providing 2-interval differential comparisons (e.g. 7D vs 30D baseline, 24h emergency windows), divergence SVG charts, and direct CAPA dispatch.
8. **/interventions** — Preventive Action Dispatch & CAPA Tracker with full `localStorage` persistence, lifecycle status transitions (Proposed → Approved → In Progress → Completed), quick verification, and new CAPA authoring.
9. **/human-review** — Specialist Sign-Off & AI Governance queue supporting certified approval, calibration adjustments, and board escalation workflows.

---

## Architecture & Data Flow

```
React View Layer (Tailwind CSS, Inter / JetBrains Mono)
   ↓
Service Abstraction Layer (`src/services/api.ts` & `src/services/aiService.ts`)
   ↓
Local Synthetic Data Engine (`src/data/*` + `localStorage` persistence)
```

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS v4 + React Router v7
- **Data Integrity**: 100% deterministic, synthetic, and labeled `DEMO ENVIRONMENT • SYNTHETIC DATA`
- **Future Integration**: The `api.ts` abstraction layer is architected for drop-in replacement with FastAPI / PostgreSQL endpoints.

---

## Development & Verification

```bash
# Start development server
npm run dev

# Validate TypeScript type safety and linting
npm run lint

# Build production bundle
npm run build
```
