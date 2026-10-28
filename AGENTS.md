# AGENTS.md — Virtual Science Lab (PWA)

> Read this file fully at the start of every session. Then follow the Memory Protocol (section 2) instead of re-reading the whole codebase.

## 1. Project goal
An offline-first, serverless PWA of realistic, fully controllable science simulations (Physics, Chemistry, Biology, Earth & Space, Math & Statistics, Engineering & Electronics, Computer Science, Environment, Psychology, Astronomy, Economics).
- Categorized by **Subject > Topic > Experiment** (e.g. Physics > Motion > Projectile). NEVER by school grade. Grade is only an optional filter tag.
- Default language: Persian (RTL). English (LTR) supported.
- Master experiment list and statuses: `docs/experiments.md`.

## 2. Memory protocol (critical)
The agent must not re-read the entire project each session. Use these files as persistent memory:
- `docs/PROJECT_STATE.md` — current phase, what exists, folder map (one line per important folder/file), how to run/test, known issues, NEXT STEPS.
- `docs/DECISIONS.md` — append-only log: date, decision, reason, rejected alternatives.
- `docs/CONVENTIONS.md` — naming, file layout, config.ts schema, i18n key rules, design tokens, shared components with props.
- `docs/experiments.md` — all experiments with status: planned / in-progress / built / tested.

Rules:
1. Session start: read ONLY `PROJECT_STATE.md`, the latest entries of `DECISIONS.md`, `CONVENTIONS.md`, and the one skill relevant to the task. Then read only the files you will modify.
2. Before any design choice, check `DECISIONS.md`. Never contradict an earlier decision silently; if a change is needed, record a new decision that supersedes the old one and explain why.
3. Session end (every task): update `PROJECT_STATE.md` (state + next steps), append new decisions to `DECISIONS.md`, update `CONVENTIONS.md` if a shared piece or pattern was added, update the status in `docs/experiments.md`.
4. Keep these files short and factual. Prefer bullet points. Remove outdated info from `PROJECT_STATE.md` (history lives in `DECISIONS.md`).
5. If memory files and code disagree, trust the code, fix the docs, and log it.

## 3. Environment
- Windows, Antigravity IDE.
- MCP tools available: Playwright (browser testing/screenshots), GitHub MCP, PerfectVector (SVG generation), ThreejsResources (Three.js docs/examples). No Context7: for library APIs read installed types/README in `node_modules`; never guess APIs.
- Font: Vazirmatn already exists in the project. Locate and use it via local `@font-face`. Never download fonts or use a CDN.
- App icon already exists in the project. Never generate or replace it. If required sizes are missing, report which ones.
- Never push to GitHub, create repos, or open issues without asking the user.
- Ask before adding any dependency outside the approved list.

## 4. Stack (fixed)
Vue 3 (Composition API, `<script setup>`, TypeScript), Vite, vite-plugin-pwa (Workbox), Pinia, Vue Router, vue-i18n (fa default, en), Dexie (IndexedDB), uPlot (graphs), KaTeX (formulas), Three.js (3D) / Canvas + SVG (2D), Vitest, Playwright, lz-string (share links), html2canvas-pro + jsPDF (PDF), ESLint + Prettier.
- Heavy math in Web Workers.
- No backend. No runtime network calls.

## 5. Architecture rules
1. Every experiment is an independent plugin: `src/experiments/<subject>/<topic>/<experiment-id>/` containing `config.ts`, `model/`, `view/`, `ui/`, `i18n/`, `tests/`.
2. Strict separation: `model/` = pure TypeScript (no Vue, no DOM); `view/` = rendering only; `ui/` = controls.
3. Experiments register in `src/experiments/registry.ts` with lazy imports. Adding an experiment must not require changes to core code.
4. Shared components live in `src/shared/` (UnitSlider, VariableGroup, GraphPanel, DataTable, FormulaPanel, ToolWidgets, PresetPicker, SlotManager, Toolbar, GuidedSteps, Toast, Modal, BottomSheet). Never duplicate them inside an experiment.
5. Variables are declared in `config.ts`: id, labelKey, unit (SI), min, max, step, default, descKey, realModeEffect.
6. Every experiment has Ideal mode and Real mode (friction, drag, noise, instrument error).
7. Fixed-timestep loop (accumulator) decoupled from rendering. Randomness uses a seeded PRNG.

## 6. Scientific accuracy (non-negotiable)
- SI units internally; convert only at the UI boundary.
- Use RK4 or Velocity-Verlet (or adaptive/implicit for stiff systems), not plain Euler unless justified and logged.
- Every model has unit tests vs an analytical solution or known reference (tolerance documented, default 1e-3).
- Show governing formulas in the UI and update computed quantities live.
- Constants only from `src/shared/constants.ts`; never invent values.
- Guard NaN, division by zero, and extreme inputs.

## 7. UI/UX rules
- Responsive: must look great on large desktop screens and on phones.
  - Desktop (>=1024px): sidebar/topbar, central scene, side control panel, bottom tabs (Graph, Table, Notes, Theory).
  - Tablet/mobile: bottom navigation, scene on top, controls in a draggable bottom sheet, scrollable tabs, touch targets >= 44px, no horizontal scroll, safe-area insets, fullscreen button.
- RTL/LTR: CSS logical properties only. Formulas, units, and chemical formulas are LTR islands. Physical scene canvases are never mirrored.
- Typography: Vazirmatn. Optional Persian digits setting.
- Design via tokens in `src/styles/tokens.css` (light/dark, per-subject accents). No magic colors or sizes.
- Soft glass cards, subtle gradients/shadows, 150-250ms transitions, respect `prefers-reduced-motion`. WCAG AA contrast, visible focus.
- Scenes should look realistic and polished; use PerfectVector for SVG assets and ThreejsResources for Three.js guidance.
- Every experiment includes: play/pause/step/rewind/reset, speed control, measurement tools, live graph, data table, notes, theory tab, guided mode, save/load, export, share.

## 8. Persistence & export
- Dexie tables: runs, slots, notes, settings, reports. Versioned schema with migrations. Full backup export/import as JSON. Request `navigator.storage.persist()`.
- Export: CSV (UTF-8 BOM, units in header), JSON, PNG, PDF report, share via URL hash (lz-string) or downloadable file.
- **Persian PDF rule:** do NOT draw Persian text with jsPDF text APIs (no proper shaping/bidi). Use (a) hidden A4 HTML report -> html2canvas-pro -> multi-page jsPDF for "Download PDF", and (b) `@media print` styles with `window.print()` for "Print / Save as PDF" (selectable text). Always verify Persian shaping and number/formula direction visually.

## 9. Workflow
1. Read memory files (section 2), state a short plan (files to create/change).
2. Work on ONE experiment or module at a time.
3. After coding: lint, type-check, unit tests, production build; then verify with Playwright (screenshots at 360x800, 768x1024, 1440x900, 1920x1080; fa/RTL and en/LTR; light and dark).
4. Update memory files (section 2, rule 3).
5. Small commits: `feat(physics/motion): projectile - add drag model`. Do not push without permission.
6. After finishing a phase or experiment batch, report to the user and WAIT for approval before continuing.

## 10. Skills (`.agents/skills/`)
- `experiment-plugin` — scaffold a new experiment
- `physics-accuracy` — numerical/scientific correctness
- `vue-pwa-offline` — PWA, caching, Dexie
- `persian-rtl-ui` — RTL, i18n, typography
- `lab-report-export` — CSV/JSON/PNG/PDF export (follow the Persian PDF rule above)
- `ui-design-system` — tokens, shared components, look and feel

## 11. Definition of done (per experiment)
- [ ] config + model + view + ui implemented
- [ ] Ideal and Real modes work
- [ ] Unit tests pass vs reference values
- [ ] fa/en translations complete
- [ ] Works offline after first load
- [ ] Save/load/export verified (including Persian PDF)
- [ ] Responsive screenshots checked on 4 viewports
- [ ] Memory files and `docs/experiments.md` updated
