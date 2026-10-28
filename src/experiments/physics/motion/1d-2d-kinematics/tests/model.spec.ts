import { describe, it, expect } from 'vitest';
import {
  KinematicsSimulation,
  computeIdealKinematicsAnalytical,
  type KinematicsParams
} from '../model/kinematics';

describe('1D & 2D Kinematics Simulation Model', () => {
  it('accurately simulates 1D uniform motion (a = 0) vs analytical solution', () => {
    const params: KinematicsParams = {
      x0: 5,
      y0: 0,
      v0x: 12.5,
      v0y: 0,
      ax: 0,
      ay: 0,
      mass: 1.0,
      frictionMu: 0,
      dragCoeff: 0,
      airDensity: 0,
      crossSection: 0.01
    };

    const sim = new KinematicsSimulation(params, 'ideal');
    const analytical = computeIdealKinematicsAnalytical(params);

    const dt = 0.01;
    const totalTime = 4.0;
    const steps = Math.round(totalTime / dt);

    for (let i = 0; i < steps; i++) {
      sim.step(dt);
    }

    const state = sim.getState();
    const expectedX = analytical.xAtT(totalTime);
    const expectedVx = analytical.vxAtT(totalTime);

    // x(4) = 5 + 12.5 * 4 = 55 m
    expect(expectedX).toBeCloseTo(55, 3);
    expect(Math.abs(state.x - expectedX) / expectedX).toBeLessThan(1e-3);
    expect(state.vx).toBeCloseTo(expectedVx, 3);
  });

  it('accurately simulates 1D uniformly accelerated motion (a > 0) vs analytical solution', () => {
    const params: KinematicsParams = {
      x0: 0,
      y0: 0,
      v0x: 2.0,
      v0y: 0,
      ax: 3.5,
      ay: 0,
      mass: 2.0,
      frictionMu: 0,
      dragCoeff: 0,
      airDensity: 0,
      crossSection: 0.01
    };

    const sim = new KinematicsSimulation(params, 'ideal');
    const analytical = computeIdealKinematicsAnalytical(params);

    const dt = 0.01;
    const totalTime = 3.0;
    const steps = Math.round(totalTime / dt);

    for (let i = 0; i < steps; i++) {
      sim.step(dt);
    }

    const state = sim.getState();
    const expectedX = analytical.xAtT(totalTime); // 0 + 2*3 + 0.5*3.5*9 = 6 + 15.75 = 21.75
    const expectedVx = analytical.vxAtT(totalTime); // 2 + 3.5*3 = 12.5

    expect(expectedX).toBeCloseTo(21.75, 2);
    expect(Math.abs(state.x - expectedX) / expectedX).toBeLessThan(1e-3);
    expect(state.vx).toBeCloseTo(expectedVx, 2);
  });

  it('accurately verifies Torricelli stopping distance for decelerated motion (a < 0)', () => {
    const params: KinematicsParams = {
      x0: 0,
      y0: 0,
      v0x: 20.0,
      v0y: 0,
      ax: -4.0,
      ay: 0,
      mass: 1.0,
      frictionMu: 0,
      dragCoeff: 0,
      airDensity: 0,
      crossSection: 0.01
    };

    const analytical = computeIdealKinematicsAnalytical(params);
    // v^2 - v0^2 = 2*a*dx -> 0 - 400 = 2*(-4)*dx -> dx = 50 m
    expect(analytical.stoppingDistance).toBeCloseTo(50, 3);
    expect(analytical.stoppingTime).toBeCloseTo(5.0, 3);

    const sim = new KinematicsSimulation(params, 'ideal');
    const dt = 0.005;
    const steps = Math.round(5.0 / dt);

    for (let i = 0; i < steps; i++) {
      sim.step(dt);
    }

    const state = sim.getState();
    expect(Math.abs(state.x - 50) / 50).toBeLessThan(1e-3);
    expect(Math.abs(state.vx)).toBeLessThan(1e-2);
  });

  it('accurately simulates 2D parabolic trajectory with orthogonal components', () => {
    const params: KinematicsParams = {
      x0: 0,
      y0: 0,
      v0x: 15.0,
      v0y: 0,
      ax: 0,
      ay: 4.0,
      mass: 1.5,
      frictionMu: 0,
      dragCoeff: 0,
      airDensity: 0,
      crossSection: 0.01
    };

    const sim = new KinematicsSimulation(params, 'ideal');
    const analytical = computeIdealKinematicsAnalytical(params);

    const dt = 0.01;
    const totalTime = 2.5;
    const steps = Math.round(totalTime / dt);

    for (let i = 0; i < steps; i++) {
      sim.step(dt);
    }

    const state = sim.getState();
    const expectedX = analytical.xAtT(totalTime); // 15 * 2.5 = 37.5
    const expectedY = analytical.yAtT(totalTime); // 0.5 * 4 * 6.25 = 12.5

    expect(Math.abs(state.x - expectedX) / expectedX).toBeLessThan(1e-3);
    expect(Math.abs(state.y - expectedY) / expectedY).toBeLessThan(1e-3);
  });
});
