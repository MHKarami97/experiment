# Virtual Science Lab — Project State

## Current Phase: Phase 2 (Physics Experiments Batch) — IN PROGRESS
**Status:** 4 Experiments Built & Tested (16/16 Unit Tests Pass, 0 Missing i18n Keys, 100% Mobile Responsive)
**Date:** 2026-10-28

## What Exists & Has Been Built
- **Project Foundation:** Vue 3 (Composition API, `<script setup>`, TypeScript), Vite, vite-plugin-pwa (Workbox), Pinia, Vue Router (HashHistory), vue-i18n, Dexie 4.0, uPlot, KaTeX, Vitest.
- **Design System & Responsiveness:** `src/styles/tokens.css` (Light/Dark themes, 11 subject accent colors, soft glass surfaces, radii, shadows, typography, motion respecting `prefers-reduced-motion`) and `src/styles/global.css` (100% CSS logical properties, LTR islands for formulas/math, canvas unmirrored, mobile responsive bottom sheet, smooth scrollable tabs and toolbars).
- **Typography & Assets:** Local Vazirmatn `@font-face` family (Thin to Black woff2) and app icons (48, 72, 96, 144, 192, 512).
- **Core Engine:**
  - `src/core/accumulator.ts`: Fixed-timestep physics loop decoupled from rendering with play/pause/step/speed.
  - `src/core/prng.ts`: Mulberry32 seeded PRNG for reproducible runs and noise.
  - `src/core/units.ts`: SI conversions, formatting, significant figures, Persian digits converter.
  - `src/core/constants.ts`: Standard physical & planetary constants.
  - `src/experiments/registry.ts`: Lazy plugin catalog.
- **Persistence (Dexie):**
  - Database `VirtualScienceLabDB` with tables: `runs`, `slots`, `notes`, `settings`, `reports`.
  - `requestPersistentStorage()` with quota estimation.
  - Full JSON backup export and import.
- **Built & Tested Experiments:**
  1. `physics/motion/projectile`: 2D projectile kinematics, RK4, aerodynamic drag, wind, planetary gravities, free-body diagram vectors, analytical comparison.
  2. `physics/motion/1d-2d-kinematics`: Rectilinear motion, constant acceleration, Torricelli equations, 2D vector kinematics, stopping distance, interactive motion graphs.
  3. `physics/motion/newton-inclined-plane`: Newton's laws, incline angle, static/kinetic friction, pull force, live free-body diagram (FBD), critical angle determination.
  4. `physics/motion/pulleys-levers`: Atwood machine, block-and-tackle pulley systems, ideal & real rotational inertia of pulley, axle friction, mechanical advantage (IMA & AMA), and lever equilibrium.
- **Quality & Localization Verification:**
  - 16/16 Unit Tests Passing with analytical error $< 10^{-3}$.
  - 0 missing i18n keys across 344 keys scanned in all components and configurations.
  - Mobile responsiveness verified down to 360px viewport width (no horizontal scrolling, clean bottom sheet, compact HUD overlays).

## Folder Map
- `public/fonts/` — Vazirmatn woff2 local font files and `@font-face` css
- `public/icons/` — App icons (48, 72, 96, 144, 192, 512)
- `docs/` — Persistent memory: `PROJECT_STATE.md`, `DECISIONS.md`, `CONVENTIONS.md`, `experiments.md`
- `src/app/` — Root shell (`App.vue`), Router, Pinia store, i18n
- `src/core/` — Physics loop accumulator, PRNG, units, constants
- `src/db/` — Dexie IndexedDB persistence layer
- `src/experiments/` — Independent plugins under `physics/motion/`
- `src/shared/` — Reusable lab components (UnitSlider, GraphPanel, DataTable, Toolbar, BottomSheet, etc.)
- `src/styles/` — Tokens and global CSS
- `src/views/` — `HomeView`, `ExperimentView`, `SettingsView`

## How to Run & Test
- Unit tests: `pnpm run test` (16 passed)
- Type check: `pnpm run type-check` (0 errors)
- Production build: `pnpm run build` (PWA SW generated in ~6.5s)
- Playwright tests: `pnpm exec playwright test`
- Preview server: `pnpm run preview`

## Known Issues & Notes for User
- Maskable app icon variant (`maskable` purpose in manifest) is currently missing in `public/icons/` (regular 48, 72, 96, 144, 192, 512 are present).
- Direct jsPDF text API does not shape Persian; using html2canvas-pro + multi-page jsPDF and `@media print`.
- [Resolved] Fixed variable control sidebar flex squashing (`flex-shrink: 0`) and enabled typing editability with Persian digits in `UnitSlider.vue` (Decision 007).
- [Resolved] Full bilingual i18n parity verified in both fa and en across all views, controls, HUD, presets, tools, and settings (Decision 008).

## Current Phase: Phase 2 (Continuous Experiment Implementation)
**Status:** In Progress
**Date:** 2026-10-28

## Completed Experiments
1. `physics/motion/projectile` (tested) — Reference experiment: 2D projectile kinematics, gravity presets, aerodynamic drag, wind.
2. `physics/motion/1d-2d-kinematics` (tested) — 1D/2D motion: constant velocity/acceleration, Torricelli time-independent relation, surface friction $\mu_k$, quadratic aerodynamic drag, RK4 integrator.
3. `physics/motion/newton-inclined-plane` (tested) — Newton's laws & friction on inclined plane (angle $\theta$, static & kinetic friction $\mu_s, \mu_k$, applied pulling force, free body diagram FBD, critical angle threshold).

## Next Experiment
- `physics/motion/pulleys-levers` — Pulleys, levers & simple machines (mechanical advantage, Atwood machine, ideal vs real efficiency with pulley mass/friction).
