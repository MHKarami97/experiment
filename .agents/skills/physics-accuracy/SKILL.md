---
name: physics-accuracy
description: Enforces scientific and numerical correctness for simulation models (physics, chemistry, biology, math). Use when writing or reviewing any model/ code, equations, units, or constants.
---

# Scientific accuracy

## Checklist
1. Identify governing equations and write them in a comment block + UI formula panel.
2. Internal units = SI. Convert at UI boundary with `src/shared/units.ts`.
3. Integrator choice:
   - Conservative systems (orbits, pendulum): Velocity-Verlet or RK4 with small dt.
   - Stiff systems (chemical kinetics): implicit methods or adaptive RK45.
   - Stochastic systems: seeded PRNG, report mean ± SD over N runs.
4. Fixed timestep physics loop (accumulator) decoupled from rendering frame rate.
5. Validate against analytical solutions:
   - Projectile range without drag, pendulum small-angle period, RC time constant, half-life decay, ideal gas law, Snell's law.
6. Check invariants: energy, momentum, mass, charge conservation (tolerance documented in tests).
7. Real mode: add documented, physically motivated effects (drag \(F=\tfrac12\rho C_d A v^2\), friction, sensor noise, resolution limits).
8. Constants only from `src/shared/constants.ts` with source noted.
9. Guard edge cases: division by zero, NaN, extreme slider values, unit mismatches; clamp or warn.
10. Display significant figures consistent with instrument precision.

## Test pattern
```ts
expect(Math.abs(simulated - analytical) / analytical).toBeLessThan(1e-3)
```
Never mark an experiment "tested" without such comparisons.
