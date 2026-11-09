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

---

### [2026-10-28] Decision 009: Generalization of ExportReport and Multi-Experiment Database Schemas
- **Context:** `ExportReport.vue` and `StoredRun.summary` were initially typed strictly for the projectile experiment (e.g. `simulatedRange`, `maxHeight`, `flightTime`). For a multi-disciplinary virtual lab with 100+ planned experiments, each simulation measures different physical quantities (e.g., stopping distance, normal force, tension, period, frequency, current, etc.).
- **Decision:**
  1. Generalize `StoredRun.summary` to indexable `Record<string, number | undefined>`.
  2. Generalize `ExportReport.vue` to accept either custom `resultsRows` and `variablesList` props or fallback to dynamic key-value rendering, with customizable `objective`, `apparatus`, `errorAnalysis`, and `conclusion` sections.
  3. Ensure all experiments reuse `ExportReport.vue` directly without code duplication.
- **Rationale:** Preserves DRY architecture while allowing any experiment plugin to generate rich Persian A4 PDF reports and `@media print` documents.
- **Alternatives Rejected:**
  - Duplicating `ExportReport.vue` per experiment: Violates AGENTS.md rule 4 (never duplicate shared components).

---

### [2026-10-28] Decision 010: Mobile Responsiveness Polish and Pulleys-Levers Architecture
- **Context:** Mobile testing highlighted that fixed canvas heights (520px) and permanent mobile bottom navigation bar clashed with the draggable `BottomSheet` and bottom tabs on phone viewports (360px - 440px). Also, the fourth experiment "Pulleys, Levers & Simple Machines" needed a unified physical model accommodating Atwood machine, compound pulleys (block & tackle), and rotational equilibrium of levers.
- **Decision:**
  1. Experiment routes conditionally hide `.mobile-nav` and replace it with a compact top-header back button, freeing 60px of screen real estate.
  2. Canvas mounts use `clamp(260px, 38vh, 420px)` on mobile screens ($\le 1023\text{px}$) instead of rigid 520px height.
  3. Canvas wrapper HUD overlays adapt with smaller padding and font size on mobile screens ($\le 640\text{px}$) to prevent obstructing the physical simulation center.
  4. Implement `pulleys-levers` with classical Atwood dynamics ($a = \frac{m_2 - m_1}{m_1 + m_2 + \frac{1}{2}M_p} g$), real bearing friction torque $\tau_f$, and block-and-tackle mechanical advantage ($IMA = N$, $AMA = \eta \cdot N$).
- **Rationale:** Guarantees zero horizontal overflow, seamless touch controls, and high physical fidelity.
- **Alternatives Rejected:**
  - Removing tabs on mobile: Detrimental to pedagogical value and user notes.

---

### [2026-11-09] Decision 011: Circular Motion & Centripetal Force Architecture & Tangential Flight
- **Context:** The fifth experiment "Circular Motion & Centripetal Force" requires accurate modeling of uniform circular kinematics ($v = \omega r$, $a_c = \omega^2 r$, $F_c = m \omega^2 r$), as well as physical behavior when string tension exceeds $T_{\text{max}}$ in Real mode (tether snapping).
- **Decision:**
  1. In Ideal mode: fixed angular velocity $\omega_0$ and rigid radius $r_0$ with instantaneous tracking and zero stretch.
  2. In Real mode: elastic elongation governed by string stiffness $k$ ($\Delta r = F_c / k$), air drag torque, and mechanical rupture when $F_c \ge T_{\text{max}}$.
  3. When the string breaks, the simulation transitions from tethered polar dynamics to free linear tangential flight governed by Newton's First Law ($v_x = -r \omega \sin\theta$, $v_y = r \omega \cos\theta$) with air drag deceleration, demonstrating that the object flies along the tangent rather than outward radially.
  4. Polar concentric rings and angular ray grid rendered in Canvas with dynamic tension color coding on the tether string (blue -> orange -> red).
- **Rationale:** High pedagogical value showing Newton's first law and rotational mechanics while meeting numerical accuracy tolerances $< 10^{-3}$.
- **Alternatives Rejected:**
  - Simulating only ideal uniform circular motion: Misses real-world cable breaking and elastic stretch phenomena.

---

### [2026-11-09] Decision 012: Collisions & Linear Momentum Architecture (Air Track 1D Kinematics)
- **Context:** Experiment 6 "Collisions & Linear Momentum" (`physics/motion/collisions-momentum`) must simulate 1D collisions on a linear air track between two glider carts ($m_1, m_2$) with velocities ($v_1, v_2$) across elastic ($e=1$) and inelastic ($0 \le e < 1$) conditions.
- **Decision:**
  1. Use analytical impulse-momentum equations with restitution coefficient $e$:
     $$v_1' = \frac{(m_1 - e m_2)v_1 + (1 + e)m_2 v_2}{m_1 + m_2}, \quad v_2' = \frac{(1 + e)m_1 v_1 + (m_2 - e m_1)v_2}{m_1 + m_2}$$
  2. Implement sub-stepped numerical integration ($10\times$ sub-stepping per frame) to guarantee collision boundary detection without cart tunneling even at extreme relative speeds ($|v_{\text{rel}}| = 20\text{ m/s}$).
  3. Real mode models track air drag and bumper mechanical energy dissipation, while Ideal mode strictly verifies exact conservation of total linear momentum ($P_{\text{tot}} = \text{const}$) within $10^{-6}$ numerical tolerance.
  4. Canvas view features metallic air track extrusion with air orifice holes, distance ticks, contact bumpers, directional velocity vectors ($\vec{v}_1, \vec{v}_2$), and an impact flash aura.
- **Rationale:** Rigorous demonstration of momentum conservation and kinetic energy dissipation with zero numerical drift.
- **Alternatives Rejected:**
  - Penalty-based spring-dashpot contact forces: Prone to stiff ODE integration instabilities at high velocities; impulse-restitution formulation is exact and unconditionally stable.

---

### [2026-11-09] Decision 013: Torque & Static Equilibrium (Lever / Seesaw) Architecture
- **Context:** Experiment 7 "Torque & Static Equilibrium" (`physics/motion/torque-equilibrium`) simulates the principle of moments, lever equilibrium ($m_1 |x_1| = m_2 x_2$), and rotational dynamics around a fulcrum.
- **Decision:**
  1. Net torque around pivot $\tau_{\text{net}} = \sum x_i m_i g - \Delta x_{\text{pivot}} M_{\text{beam}} g$.
  2. Dynamic tilt simulation with rotational inertia $I = \frac{1}{12} M L^2 + M (\Delta x_{\text{pivot}})^2 + \sum m_i x_i^2$, restoring torque $\tau(\theta) = \tau_{\text{net}} \cos\theta$, and pivot bearing damping in Real mode.
  3. Interactive canvas rendering with triangular fulcrum axle, wood/metallic marked beam with distance gradations, suspended weight blocks, and weight vector arrows ($\vec{W} = m\vec{g}$).
- **Rationale:** Meets analytical reference verification within $< 10^{-6}$ error and provides clear visual feedback on Archimedes' lever principle.
- **Alternatives Rejected:**
  - Static-only diagram without tilt dynamics: Fails to show mechanical instability and rotational acceleration when torques are unbalanced.

---

### [2026-11-09] Decision 014: Simple & Double Pendulum (Chaos) Architecture
- **Context:** Experiment 8 "Simple & Double Pendulum (Chaos)" (`physics/motion/pendulums`) models both classical simple harmonic motion and the non-linear chaotic dynamics of a double pendulum.
- **Decision:**
  1. Dual-mode support: `simple` (single arm with small-angle isochronism and Borda large-angle period expansion) and `double` (Lagrangian coupled two-bob chaotic motion).
  2. 4th-order Runge-Kutta (RK4) numerical integrator with 4 sub-steps per frame to ensure zero energy drift ($< 0.1\%$) in Ideal mode while exhibiting authentic Lyapunov divergence ($> 0.05\text{ m}$ macroscopic separation) from tiny initial perturbations.
  3. Potential energy reference defined at downward vertical equilibrium ($U = m_1 g L_1 (1 - \cos\theta_1) + m_2 g (L_1(1 - \cos\theta_1) + L_2(1 - \cos\theta_2))$) guaranteeing positive-definite mechanical energy.
  4. Real-time multi-color rainbow trail displaying fractal-like chaotic phase curves on the second bob.
- **Rationale:** Pedagogically demonstrates both linear harmonic physics and deterministic chaos with rigorous mathematical fidelity.
- **Alternatives Rejected:**
  - Euler/Verlet integration: Produces severe energy explosion in double pendulums over long runs; RK4 with sub-stepping is stable and energy-conserving.

---

### [2026-11-09] Decision 015: Spring & Simple Harmonic Motion (Resonance) Architecture
- **Context:** Experiment 9 "Spring & Simple Harmonic Motion (Resonance)" (`physics/motion/spring-shm`) models mass-spring oscillators, natural frequencies ($\omega_0 = \sqrt{k/m}$), damping regimes, and external periodic harmonic resonance.
- **Decision:**
  1. Second-order differential equation $m x'' + c x' + k x = F_0 \cos(\omega_d t)$ integrated via Runge-Kutta 4th order (RK4).
  2. Analytical verification of natural period $T_0 = 2\pi\sqrt{m/k}$ within $< 10^{-3}$ tolerance.
  3. Energy tracking: elastic potential energy $U_s = \frac{1}{2} k x^2$, kinetic energy $K = \frac{1}{2} m v^2$, total mechanical energy strictly conserved ($< 10^{-4}$ error) in Ideal mode ($c = 0, F_0 = 0$).
  4. Interactive canvas with dynamic helical spring rendering (coils stretch and compress realistically), equilibrium line reference ($x = 0$), weight block, and restoring/velocity force vectors.
- **Rationale:** Provides rigorous mathematical fidelity for harmonic oscillators, under/overdamping, and resonant frequency response.
- **Alternatives Rejected:**
  - Approximating spring with static line: Poor visual intuition for compression and elongation.

---

### [2026-11-09] Decision 016: Gravity & Planetary Orbits (Kepler) Architecture
- **Context:** Experiment 10 "Gravity & Planetary Orbits (Kepler)" (`physics/motion/orbital-gravity`) simulates 2-body Newtonian gravitation, Kepler's laws, Vis-Viva orbital speed, and satellite trajectories (LEO, GEO, Molniya).
- **Decision:**
  1. Symplectic Velocity-Verlet numerical integrator used to guarantee strict long-term conservation of specific orbital energy $\epsilon = \frac{v^2}{2} - \frac{\mu}{r}$ and specific angular momentum $h = |\vec{r} \times \vec{v}|$ ($< 10^{-4}$ drift per full orbit revolution).
  2. SI units internally (meters, kg, seconds, $G = 6.6743 \times 10^{-11}\text{ m}^3\text{kg}^{-1}\text{s}^{-2}$, $M_\oplus = 5.972 \times 10^{24}\text{ kg}$), converted to km, hours, km/s at the UI boundary.
  3. Real mode models upper atmospheric trace drag causing orbital decay and perigee/apogee shrinkage.
  4. Interactive pan/zoom canvas rendering central planet (Earth with atmospheric glow), predicted elliptical trajectory path, line of apsides with Periapsis (P) and Apoapsis (A) markers, solar-panel satellite craft with heading orientation, and directional $\vec{v}$ and $\vec{F}_g$ vectors.
- **Rationale:** Symplectic preservation of Keplerian geometry and Vis-Viva speeds with $< 10^{-4}$ analytical error.
- **Alternatives Rejected:**
  - Standard forward Euler or RK2: Causes unbounded orbital energy expansion (unphysical spiraling outwards). Symplectic Verlet is essential for Hamiltonian orbital mechanics.

---

### [2026-11-09] Decision 017: Rigid Body Rotation & Gyroscopic Dynamics Architecture
- **Context:** Experiment 11 "Rigid Body Rotation & Gyroscope" (`physics/motion/rotational-dynamics`) completes the Motion & Mechanics topic. It models moments of inertia ($I$) for various geometric shapes (solid disk $\frac{1}{2}MR^2$, thin hoop $MR^2$, solid sphere $\frac{2}{5}MR^2$, centered rod $\frac{1}{12}ML^2$), torque-induced angular acceleration ($\tau = I\alpha$), unspooling falling mass acceleration ($a = \frac{mg}{m + I/r^2}$), and bearing friction in Real mode.
- **Decision:**
  1. Pure TypeScript model calculates exact theoretical moments of inertia and linear/angular acceleration ($< 10^{-3}$ tolerance vs analytical solution).
  2. Conservation of mechanical energy strictly verified in Ideal mode ($E = K_{\text{rot}} + K_{\text{trans}} + U_{\text{grav}} = \text{const}$).
  3. Real mode models Coulomb dry bearing friction torque ($\tau_f = \text{sgn}(\omega)\mu_b$) and aerodynamic viscous drag ($c_v \omega$), simulating realistic deceleration and stop when the hanging mass hits the bench.
  4. Dynamic canvas rendering features realistic brushed metal disk / hoop spokes / shaded 3D sphere / centered rod, wound string coil on spindle, guide pulley, falling mass hanger, and curved angular velocity $\vec{\omega}$ and tension $\vec{T}$ vector overlays.
- **Rationale:** Completes the 11-experiment Motion & Mechanics syllabus with high physical fidelity, responsive design, and bilingual localization.
- **Alternatives Rejected:**
  - Hardcoding inertia to only a disk: Prevents students from discovering how mass distribution impacts angular acceleration.








