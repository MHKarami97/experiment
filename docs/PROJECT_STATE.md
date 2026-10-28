# Virtual Science Lab — Project State

## Current Phase: Phase 1 (Foundation + Reference Experiment) — COMPLETED
**Status:** Phase 1 Complete (Waiting for user approval before Phase 2)
**Date:** 2026-10-28

## What Exists & Has Been Built
- **Project Foundation:** Vue 3 (Composition API, `<script setup>`, TypeScript), Vite, vite-plugin-pwa (Workbox), Pinia, Vue Router (HashHistory), vue-i18n, Dexie 4.0, uPlot, KaTeX, Vitest, Playwright.
- **Design System:** `src/styles/tokens.css` (Light/Dark themes, 11 subject accent colors, soft glass surfaces, radii, shadows, typography, motion respecting `prefers-reduced-motion`) and `src/styles/global.css` (100% CSS logical properties, LTR islands for formulas/math, canvas unmirrored).
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
- **Shared Components:**
  - `UnitSlider.vue`: Range slider + numeric input + SI unit + validation + Persian digits.
  - `VariableGroup.vue`: Collapsible parameter grouping.
  - `GraphPanel.vue`: High-performance uPlot chart with multi-series comparison overlay & responsive resize.
  - `DataTable.vue`: Data series inspection with UTF-8 BOM CSV export for Excel/Persian.
  - `FormulaPanel.vue`: KaTeX LaTeX rendering with live substituted values.
  - `ToolWidgets/`: Graduated Ruler and Digital Stopwatch measurement tools.
  - `PresetPicker.vue`: Planetary/setup chips.
  - `SlotManager.vue`: 3 persistent memory slots.
  - `Toolbar.vue`: Full playback, mode, speed, and instrument toggles.
  - `GuidedSteps.vue`: Interactive lab steps.
  - `BottomSheet.vue`: Mobile draggable controls sheet.
  - `Modal.vue` & `Toast.vue`: Dialogs and status notifications.
  - `ExportReport.vue`: Persian PDF generation (html2canvas-pro -> multi-page jsPDF) + native `@media print` (`window.print()`).
- **Reference Experiment (`physics/motion/projectile`):**
  - Model: RK4 integration with quadratic air drag, wind, and planetary gravities.
  - View: Realistic 2D canvas with rotatable cannon, trajectory arc, velocity/force vectors, and HUD.
  - Unit Tests: Verified vs analytical solutions with error $< 10^{-3}$ (4/4 tests pass).
  - Translations: Complete fa and en dictionaries.
- **Visual & Offline Verification:**
  - Playwright visual tests across 4 viewports (360x800, 768x1024, 1440x900, 1920x1080) in fa/RTL, en/LTR, light/dark.
  - Full offline PWA test passing: service worker caching, network disconnect, reload, simulation execution and persistence verified.

## Folder Map
- `public/fonts/` — Vazirmatn woff2 local font files and `@font-face` css
- `public/icons/` — App icons (48, 72, 96, 144, 192, 512). Maskable icon missing reported.
- `docs/` — Persistent memory: `PROJECT_STATE.md`, `DECISIONS.md`, `CONVENTIONS.md`, `experiments.md`, `screenshots/`
- `src/app/` — Root shell (`App.vue`), Router, Pinia store, i18n
- `src/core/` — Physics loop accumulator, PRNG, units, constants
- `src/db/` — Dexie IndexedDB persistence layer
- `src/experiments/` — Plugins (`physics/motion/projectile`)
- `src/shared/` — Reusable lab components
- `src/styles/` — Tokens and global CSS
- `src/views/` — `HomeView`, `ExperimentView`, `SettingsView`

## How to Run & Test
- Unit tests: `pnpm run test`
- Type check: `pnpm run type-check`
- Production build: `pnpm run build`
- Playwright tests: `pnpm exec playwright test`
- Preview server: `pnpm run preview`

## Known Issues & Notes for User
- Maskable app icon variant (`maskable` purpose in manifest) is currently missing in `public/icons/` (regular 48, 72, 96, 144, 192, 512 are present).
- Direct jsPDF text API does not shape Persian; using html2canvas-pro + multi-page jsPDF and `@media print`.
- [Resolved] Fixed variable control sidebar flex squashing (`flex-shrink: 0`) and enabled typing editability with Persian digits in `UnitSlider.vue` (Decision 007).
- [Resolved] Full bilingual i18n parity verified in both fa and en across all views, controls, HUD, presets, tools, and settings (Decision 008).

## Next Steps (Awaiting User Approval for Phase 2)
1. User reviews Phase 1 report and screenshots.
2. Upon approval, begin Phase 2: Next batch of Physics > Motion experiments (e.g. 1D/2D Kinematics, Newton's Laws on Inclined Plane, Simple & Double Pendulum).
