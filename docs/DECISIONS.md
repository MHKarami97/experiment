# Architectural & Design Decisions Log

This is an append-only log. Every design choice is documented with date, context, decision, rationale, and alternatives considered & rejected. Before making any new design decision, consult this log. Never silently contradict an earlier decision.

---

### [2026-10-28] Decision 001: Architecture & Experiment Plugin Boundary
- **Context:** Virtual Science Lab requires hundreds of realistic scientific simulations across 11 major subjects, with high modularity and zero core code pollution when adding experiments.
- **Decision:** Every experiment is an isolated plugin in `src/experiments/<subject>/<topic>/<experiment-id>/` containing `config.ts`, `model/`, `view/`, `ui/`, `i18n/`, and `tests/`. All experiments register in `src/experiments/registry.ts` using Vite dynamic imports (`() => import(...)`).
- **Rationale:** Strict code separation keeps math engines (`model/`) testable in node/vitest without DOM/Vue dependencies, views switchable (Canvas 2D / Three.js 3D), and controls standardized across all labs.
- **Alternatives Rejected:**
  - Monolithic experiment components: Violates separation of concerns, makes headless numerical verification impossible.
  - Micro-frontends: Excessive complexity for an offline-first client-side PWA with no backend.

---

### [2026-10-28] Decision 002: Persian RTL-First Layout & LTR Island Strategy
- **Context:** Persian is the primary default language (`dir="rtl"`, `lang="fa"`), with English secondary (`dir="ltr"`, `lang="en"`). Formulas, code, SI units, and chemical notations are strictly LTR, and physical coordinate spaces (like motion trajectories) must not mirror or distort scientific directionality.
- **Decision:** 
  1. Base styling uses 100% CSS logical properties (`margin-inline`, `padding-inline`, `inset-inline-start`, `text-align: start`).
  2. Formulas, numbers with SI units, and chemical formulas are isolated in `<bdi dir="ltr">` or `.ltr` classes.
  3. Simulation renderers (Canvas/WebGL) do NOT invert coordinates when locale changes (e.g. initial velocity angle $\theta$ remains counter-clockwise from horizontal ground).
  4. Local Vazirmatn font loaded via `@font-face` without external CDN requests.
- **Rationale:** Keeps physics physically accurate while providing authentic Persian typography and natural RTL app flow.
- **Alternatives Rejected:**
  - Flipping canvas coordinates horizontally: Inverts standard Cartesian quadrants and violates vector physics conventions.
  - CDN Google Fonts: Fails offline requirement.

---

### [2026-10-28] Decision 003: Persian PDF Export Strategy
- **Context:** Standard jsPDF text rendering does not support OpenType complex text shaping, HarfBuzz bidi reordering, or Vazirmatn glyph connections, resulting in reversed or disconnected Persian characters.
- **Decision:** 
  Implement two distinct, verified PDF paths:
  1. **Download PDF:** Construct an off-screen A4 HTML report template with Vazirmatn typography, clean RTL styling, rendered KaTeX math, charts, and data tables; render to canvas via `html2canvas-pro` at 2x scale, then slice into multi-page jsPDF vector document.
  2. **Print / Save as PDF:** Use `@media print` CSS rules and trigger `window.print()` to provide 100% native selectable text and native browser print-to-PDF rendering.
- **Rationale:** Guarantees 100% visually correct Persian shaping, proper mathematical formatting, and selectable text when printed.
- **Alternatives Rejected:**
  - Direct `doc.text()` in jsPDF: Produces unshaped, inverted Persian characters.
  - Backend PDF rendering: Violates serverless, offline-first mandate.

---

### [2026-10-28] Decision 004: Numerical Integrator & Fixed Timestep Accumulator
- **Context:** Simulating projectile motion with quadratic air drag and realistic forces requires numerical stability that plain Euler integration cannot provide without diverging.
- **Decision:**
  1. Use 4th-order Runge-Kutta (RK4) integration for all kinematics with non-linear velocity-dependent drag.
  2. Fixed physics timestep $dt = 1/120\text{ s}$ or $1/60\text{ s}$ with a time accumulator loop decoupled from `requestAnimationFrame` render rate.
  3. Seeded PRNG (`mulberry32` / `xoshiro128`) for deterministic measurement noise and reproducible scientific runs.
- **Rationale:** Guarantees analytical match within $10^{-3}$ tolerance in Ideal mode, stability under high velocities, and reproducibility across different monitor refresh rates (60Hz, 120Hz, 144Hz).
- **Alternatives Rejected:**
  - Explicit Euler integration: Energy drift and severe inaccuracies with drag.
  - Variable `dt` in physics step: Causes non-deterministic physics bugs when frame rates drop.

---

### [2026-10-28] Decision 005: Client-Side Persistence with Dexie
- **Context:** Lab runs, presets, notes, and user settings must persist across sessions completely offline and support full JSON backup/restore.
- **Decision:** Use Dexie.js (IndexedDB wrapper) with 5 versioned tables: `runs`, `slots`, `notes`, `settings`, `reports`. Call `navigator.storage.persist()` on boot to request persistent storage quota.
- **Rationale:** IndexedDB handles binary blobs (scene snapshots, charts) and large historical datasets far beyond `localStorage`'s 5MB limit.
- **Alternatives Rejected:**
  - `localStorage`: Limited to 5MB, synchronous blocking I/O, no blob support.

---

### [2026-10-28] Decision 006: Canvas Absolute Positioning & Explicit Height Constraints
- **Context:** On screens with devicePixelRatio > 1 (common on Windows displays, e.g. 1.25x or 1.5x scaling), setting `canvas.height = canvas.clientHeight * dpr` inside a requestAnimationFrame render loop with flow/flex elements causes a positive feedback loop: the canvas intrinsic height expands the parent, which increases `clientHeight`, causing runaway infinite page growth.
- **Decision:**
  1. Position canvas elements as `position: absolute; inset: 0; width: 100%; height: 100%;` within an explicitly bounded container (`.canvas-wrapper`).
  2. Measure wrapper container dimensions (`wrapper.clientWidth/clientHeight`) rather than canvas intrinsic dimensions.
  3. Lock container heights for scenes, sidebars, and uPlot chart containers (`.chart-container`).
- **Rationale:** Completely eliminates layout feedback loops, ensuring zero runaway page scroll while keeping sharp high-DPI rendering.
- **Alternatives Rejected:**
  - Debouncing canvas resize: Still flickers and does not stop runaway flex growth.
  - Ignoring DPR: Blurry rendering on Retina and scaled displays.

---

### [2026-10-28] Decision 007: Variable Controls Flex Layout & Decoupled Numeric Input Editing
- **Context:** In `Experiment.vue`, the variable control sidebar was squashing nested `VariableGroup` accordions into flat, seemingly closed/collapsed bars because flex children had default `flex-shrink: 1` inside a fixed-height flex container with `overflow: hidden`. Furthermore, numeric input fields clamped values immediately on every `@input` keystroke, preventing backspacing, clearing, and typing decimal points or Persian keyboard digits.
- **Decision:**
  1. Add `flex-shrink: 0` to `.variable-group`, `.slot-manager`, and `.unit-slider` to prevent flexbox from squashing cards.
  2. Set `min-height: 0` on `.sidebar-scroll` and expand sidebar grid width to `390px`.
  3. Decouple input typing state (`localInputValue`) with `isFocused` tracking in `UnitSlider.vue`: support Persian/Arabic digits (`۰-۹`, `٠-٩`) and decimal separators (`٫`, `,`), select text on focus, defer clamping/precision rounding to `blur` / `Enter`, and provide quick `+` / `−` stepper buttons.
- **Rationale:** Ensures all variable boxes remain open, spacious, comfortable to read, and fully editable via both typing and slider/stepper controls in RTL Persian and LTR English.
- **Alternatives Rejected:**
  - Raw HTML `type="number"` with native clamp on input: Completely breaks editing on Persian keyboards and intermediate float typing.

---

### [2026-10-28] Decision 008: Comprehensive Multi-Language (i18n) Architecture Across All Modules
- **Context:** Several labels in the reference experiment (variable controls sidebar, presets, canvas HUD overlay, bottom tab navigation, formula panel, notes, guided steps, and settings storage status) contained hardcoded Persian strings that remained untranslated when switching to English (`en`).
- **Decision:**
  1. Register experiment-specific language files directly in `src/app/i18n.ts` under the experiment namespace (`projectile`), eliminating async registration races.
  2. Refactor all component template and script strings to dynamic vue-i18n expressions (`$t(...)` and `computed(() => t(...))`).
  3. Ensure all measurement tooltips (ruler, stopwatch), chart axis/tab options, slot names, and storage persistence status descriptions react dynamically to `store.locale`.
- **Rationale:** Ensures 100% complete bilingual parity (Persian RTL and English LTR) without any hardcoded text left in the UI.
- **Alternatives Rejected:**
  - Inline ternary checks (`locale === 'fa' ? ... : ...`): Unmaintainable and violates centralized translation key conventions.


