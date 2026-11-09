# Virtual Science Lab — Project State

## Current Phase: Phase 2 (Physics Experiments Batch) — IN PROGRESS
**Status:** 24 Experiments Built & Tested (124/124 Unit Tests Pass, 0 Missing i18n Keys, 100% Mobile Responsive)
**Date:** 2026-11-09

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
  5. `physics/motion/circular-motion`: Uniform & non-uniform circular motion, centripetal force ($F_c = m\omega^2 r$), tangential speed ($v = \omega r$), centripetal acceleration ($a_c = \omega^2 r$), elastic string compliance, tensile breaking threshold with Newton's 1st law tangential release.
  6. `physics/motion/collisions-momentum`: 1D collisions on air track, conservation of linear momentum ($P_{\text{tot}} = \text{const}$), coefficient of restitution $e \in [0, 1]$, elastic vs inelastic mechanical energy dissipation, velocity vectors & collision flash effects.
  7. `physics/motion/torque-equilibrium`: Torque, lever arm, principle of moments ($m_1 |x_1| = m_2 x_2$), seesaw rotational dynamics around fulcrum, self-weight torque of offset beam, and ground bumper contact.
  8. `physics/motion/pendulums`: Simple pendulum & double pendulum, small-angle isochronism, Borda amplitude correction, Lagrangian coupled RK4 dynamics, and chaotic fractal-like trajectory trails.
  9. `physics/motion/spring-shm`: Spring & simple harmonic motion, Hooke's law, natural period ($T_0 = 2\pi\sqrt{m/k}$), viscous damping, and periodic forced resonance.
  10. `physics/motion/orbital-gravity`: 2-body Newtonian gravity, Kepler's three laws ($T^2 = \frac{4\pi^2}{GM} a^3$), Vis-Viva speed ($v^2 = GM(2/r - 1/a)$), LEO/GEO/Molniya orbits, atmospheric decay perturbation, and Velocity-Verlet symplectic integrator.
- **Quality & Localization Verification:**
  - 44/44 Unit Tests Passing with analytical error $< 10^{-3}$.
  - 0 missing i18n keys across 565 keys scanned in all components and configurations.
  - Complete Mobile Responsiveness Overhaul: Fixed `.subject-chips` flexbox expansion bug, ensured `grid-template-columns: 1fr` on mobile for `.experiments-grid` and `.planned-grid`, wrapped `.badges` and `.card-meta`, added `max-width: 100vw; overflow-x: hidden; box-sizing: border-box;` on `html`, `body`, `.app-root`, `.app-main`, and `.home-view` to guarantee 0 overflow down to 320px screens.

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
- Unit tests: `pnpm run test` (57 passed)
- Type check: `pnpm run type-check` (0 errors)
- Production build: `pnpm run build` (PWA SW generated in ~6.4s)
- Playwright tests: `pnpm exec playwright test`
- Preview server: `pnpm run preview`

## Known Issues & Notes for User
- Maskable app icon variant (`maskable` purpose in manifest) is currently missing in `public/icons/` (regular 48, 72, 96, 144, 192, 512 are present).
- Direct jsPDF text API does not shape Persian; using html2canvas-pro + multi-page jsPDF and `@media print`.
- [Resolved] Fixed variable control sidebar flex squashing (`flex-shrink: 0`) and enabled typing editability with Persian digits in `UnitSlider.vue` (Decision 007).
- [Resolved] Full bilingual i18n parity verified in both fa and en across all views, controls, HUD, presets, tools, and settings (Decision 008).

## Completed Experiments
1. `physics/motion/projectile` (tested) — Reference experiment: 2D projectile kinematics, gravity presets, aerodynamic drag, wind.
2. `physics/motion/1d-2d-kinematics` (tested) — 1D/2D motion: constant velocity/acceleration, Torricelli time-independent relation, surface friction $\mu_k$, quadratic aerodynamic drag, RK4 integrator.
3. `physics/motion/newton-inclined-plane` (tested) — Newton's laws & friction on inclined plane (angle $\theta$, static & kinetic friction $\mu_s, \mu_k$, applied pulling force, free body diagram FBD, critical angle threshold).
4. `physics/motion/pulleys-levers` (tested) — Pulleys, levers & simple machines (mechanical advantage, Atwood machine, ideal vs real efficiency with pulley mass/friction).
5. `physics/motion/circular-motion` (tested) — Circular motion & centripetal force ($F_c = m\omega^2 r$, string elasticity, rupture threshold, tangential release).
6. `physics/motion/collisions-momentum` (tested) — 1D collisions on linear air track, coefficient of restitution $e$, momentum conservation, and kinetic energy dissipation.
7. `physics/motion/torque-equilibrium` (tested) — Torque & static equilibrium, Archimedes' law of the lever ($m_1 |x_1| = m_2 x_2$), seesaw tilt dynamics, and fulcrum support reaction force.
8. `physics/motion/pendulums` (tested) — Simple & double pendulum, harmonic period isochronism, Borda amplitude correction, Lagrangian coupled RK4 dynamics, and chaotic sensitivity.
9. `physics/motion/spring-shm` (tested) — Spring & simple harmonic motion, Hooke's law, natural period ($T_0 = 2\pi\sqrt{m/k}$), viscous damping, and periodic forced resonance.
10. `physics/motion/orbital-gravity` (tested) — 2-body Newtonian gravity, Kepler's laws, Vis-Viva orbital speed, LEO/GEO/Molniya orbits, atmospheric drag perturbation, and Velocity-Verlet symplectic integrator.
11. `physics/motion/rotational-dynamics` (tested) — Rigid body rotation & gyroscope (moments of inertia for disk, hoop, sphere, rod, $\tau = I\alpha$, falling weight acceleration $a = \frac{mg}{m + I/r^2}$, energy conservation, bearing friction).
12. `physics/energy/skate-park` (tested) — Conservation of energy (Lagrangian curved track ODE, Torricelli speed $v = \sqrt{2g\Delta y}$, thermal dissipation work, live energy bar chart, U-ramp, double dip coaster, slope).
13. `physics/energy/work-power` (tested) — Work & Power ($W_{\text{net}} = \Delta K$, trapezoidal work integral $\int F \cos\theta dx$, instantaneous $P = \vec{F}\cdot\vec{v}$ and average power, electro-mechanical motor efficiency, FBD vector overlays).
14. `physics/fluids/pressure-density` (tested) — Fluid Pressure & Density (hydrostatic pressure $P = P_0 + \rho g h$, U-tube manometer equilibrium $\rho_1 h_1 = \rho_2 h_2$, thermal volumetric expansion, gauge vs absolute pressure, sensor transducer noise).
15. `physics/fluids/buoyancy-archimedes` (tested) — Buoyancy & Archimedes' Principle ($F_b = \rho_{\text{fluid}} V_{\text{disp}} g$, floating equilibrium fraction $\frac{V_{\text{sub}}}{V} = \frac{\rho_b}{\rho_f}$, spring balance apparent weight $W_{\text{app}} = W - F_b$, overflow displacement cylinder, iron on mercury).
16. `physics/fluids/pascal-bernoulli` (tested) — Pascal's Principle & Bernoulli ($P_1 + \frac{1}{2}\rho v_1^2 = P_2 + \frac{1}{2}\rho v_2^2$, Venturi tube with differential manometers and streamline particle flow, hydraulic lift press $F_1 / A_1 = F_2 / A_2$ with mechanical advantage, displacement conservation $A_1 d_1 = A_2 d_2$, and work efficiency).
17. `physics/fluids/viscosity-pipe-flow` (tested) — Viscosity & Pipe Flow (Poiseuille's law $Q = \frac{\pi R^4 \Delta P}{8 \eta L}$, Reynolds number $Re = \rho v D / \eta$, Reynolds dye streak experiment, parabolic laminar velocity profile $v(r) = v_{\max}(1 - r^2/R^2)$, no-slip wall boundary condition, transition & turbulent eddies, Andrade exponential temperature viscosity dependence).
18. `physics/thermo/heat-transfer` (tested) — Heat Transfer Mechanisms (Fourier solid conduction $\dot{Q}_{\text{cond}} = \frac{k A \Delta T}{L}$, Newton fluid convection $\dot{Q}_{\text{conv}} = h A \Delta T$ with buoyancy plumes & boundary layer, Stefan-Boltzmann photon radiation $\dot{Q}_{\text{rad}} = \varepsilon \sigma A (T_H^4 - T_C^4)$, Wien's displacement law $\lambda_{\max} = b / T$, incandescent blackbody glow colors, and multi-mode combined heat loss).
19. `physics/thermo/calorimetry` (tested) — Calorimetry & Specific Heat (thermal energy conservation $\sum Q = 0$, analytical equilibrium $T_{\text{eq}}$, specific heat capacities for copper/aluminum/iron/lead/glass, calorimeter water equivalent $C_{\text{cal}}$, latent heat of fusion $L_f$ for ice with 0°C thermal plateau, and motorized lab stirrer).
20. `physics/thermo/gas-laws` (tested) — Gas Laws & Molecular Kinetics (Ideal gas equation $PV = nRT$, Boyle isothermal compression, Charles isobaric thermal expansion, Gay-Lussac isochoric heating, Maxwell-Boltzmann RMS molecular speed $v_{\text{rms}} = \sqrt{3RT/M}$, Van der Waals real gas correction, movable piston with volume ruler, and Bourdon dial manometer).
21. `physics/thermo/thermal-expansion` (tested) — Thermal Expansion (linear $\Delta L = \alpha L_0 \Delta T$ with micrometer dial and optical zoom, bimetallic strip Timoshenko deflection and thermostat switch, water 4°C density maximum and anomaly dilatometer flask).
22. `physics/thermo/heat-engines` (tested) — Thermodynamic Heat Cycles & Heat Engines (Carnot, Otto, Diesel, and Stirling cycles, continuous trajectory $V(\theta), P(\theta)$, indicator $PV$ and $TS$ diagrams, mechanical power $P = W_{\text{net}} \times \frac{\text{RPM}}{60}$, First & Second law energy balance, and real mode losses).
23. `physics/waves/wave-interference` (tested) — Wave Superposition & Interference (Principle of linear superposition $y_{\text{tot}} = y_1 + y_2$, 2D ripple tank two-source interference with drag-and-drop probe, constructive $\Delta r = m\lambda$ and destructive $\Delta r = (m+0.5)\lambda$ nodal lines, 1D transverse string wave, and 1D longitudinal sound compression/rarefaction).
24. `physics/waves/standing-waves` (tested) — Standing Waves on Strings & Air Columns (Wave speed $v = \sqrt{T/\mu}$ on strings and sound speed $v$ in air columns, boundary conditions for fixed strings, open-open pipes, and open-closed pipes, harmonic series $f_n = n \frac{v}{2L}$ and $f_n = (2n-1) \frac{v}{4L}$, node/antinode markers, Kundt's tube acoustic dust clustering, acoustic end correction in real mode).

## Next Experiment
- `physics/waves/doppler-effect` — Doppler Effect (اثر دوپلر صوتی، انتقال بسامد، مخروط ماخ، موج شوک و حرکت چشمه و ناظر).
