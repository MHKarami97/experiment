---
name: experiment-plugin
description: Scaffolds and implements a new virtual-lab experiment as an independent plugin (config, model, view, ui, tests, registry entry). Use whenever a new experiment is added or an existing one is restructured.
---

# Experiment plugin

## When to use
Creating or refactoring any experiment under `src/experiments/`.

## Steps
1. Choose path: `src/experiments/<subject>/<topic>/<experiment-id>/` (kebab-case ids, e.g. `physics/motion/projectile`).
2. Create files:
   - `config.ts` — metadata (id, subject, topic, titleKey, descKey, gradeTags[], difficulty), variables[], presets[], tools[], outputs[].
   - `model/` — pure TypeScript, no Vue/DOM. Exports `createModel(params)`, `step(state, dt)`, `derived(state)`.
   - `view/` — renderer (Canvas/SVG/Three.js) that only reads state.
   - `ui/Experiment.vue` — composes shared controls, graph, table, toolbar.
   - `i18n/fa.json`, `i18n/en.json`.
   - `tests/model.spec.ts`.
3. Register in `src/experiments/registry.ts` (lazy import).
4. Add row in `docs/experiments.md`.

## Variable definition template
```ts
{ id: 'v0', labelKey: 'projectile.v0', unit: 'm/s', min: 0, max: 100, step: 0.1,
  default: 20, descKey: 'projectile.v0.desc', realModeEffect: null }
```

## Required features checklist
Play/pause/step/reset · speed slider · Ideal/Real toggle · presets · live graph · data table · measurement tools · save slot · export · notes · guided mode steps.

## Rules
- Model must be deterministic given params + seed (noise uses a seeded PRNG).
- No shared state outside Pinia store created per experiment.
- Do not copy shared components; import from `src/shared/`.
- Finish by running tests and a Playwright check.
