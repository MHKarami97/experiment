---
name: lab-report-export
description: Builds saving, history, comparison, and export features (CSV, JSON, PNG, PDF lab report, shareable link) fully client-side. Use for data export, report generation, run comparison, or share features.
---

# Lab report & export

## Data model
A **Run** = `{ id, experimentId, createdAt, params, mode (ideal/real), series[], summary, notes, thumbnail }`.

## Features
1. Save run to Dexie automatically on stop, or manually.
2. Run history list with filter by subject/experiment/date, compare up to 4 runs on one graph.
3. Export:
   - CSV: header with units, one column per quantity, UTF-8 with BOM (Excel-friendly for Persian).
   - JSON: full run + schema version.
   - PNG: graph and scene snapshot (canvas `toBlob`).
   - PDF (jsPDF): title, date, objective, apparatus, procedure, variables table, data table, graph image, results, error analysis, user notes, conclusion. RTL-aware with embedded Persian font.
4. Share: encode params in URL hash (compressed, e.g. lz-string) or download `.lab.json`; import via file picker or paste.
5. Auto-generate result summary: min, max, mean, slope/regression, R², percent error vs theory.

## Rules
- All client-side; no uploads.
- Validate imported files against schema and version.
- Keep large series downsampled in PDF but full in CSV/JSON.
