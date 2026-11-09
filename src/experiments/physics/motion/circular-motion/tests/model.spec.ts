import { describe, it, expect } from 'vitest';
import {
  CircularMotionSimulation,
  computeIdealCircularAnalytical,
  type CircularMotionParams
} from '../model/circularMotion';

describe('Circular Motion & Centripetal Force Simulation Model', () => {
  const defaultParams: CircularMotionParams = {
    radius: 2.0,
    mass: 1.5,
    angularVelocity: 4.0,
    maxTension: 200,
    dragCoeff: 0.47,
    stringStiffness: 2000,
    frictionMu: 0.05,
    airDensity: 1.225
  };

  it('calculates linear speed v = ω * r within 1e-3 of analytical solution', () => {
    const sim = new CircularMotionSimulation(defaultParams, 'ideal');
    const analytical = computeIdealCircularAnalytical(
      defaultParams.radius,
      defaultParams.mass,
      defaultParams.angularVelocity
    );

    const state = sim.step(0.01);
    const relError = Math.abs(state.speed - analytical.speed) / analytical.speed;
    expect(relError).toBeLessThan(1e-3);
    expect(state.speed).toBeCloseTo(8.0, 3);
  });

  it('calculates centripetal acceleration a_c = ω² * r matching analytical solution', () => {
    const sim = new CircularMotionSimulation(defaultParams, 'ideal');
    const analytical = computeIdealCircularAnalytical(
      defaultParams.radius,
      defaultParams.mass,
      defaultParams.angularVelocity
    );

    const state = sim.step(0.05);
    const relError = Math.abs(state.centripetalAcc - analytical.centripetalAcc) / analytical.centripetalAcc;
    expect(relError).toBeLessThan(1e-3);
    expect(state.centripetalAcc).toBeCloseTo(32.0, 3);
  });

  it('calculates string tension / centripetal force F_c = m * ω² * r with error < 1e-3', () => {
    const sim = new CircularMotionSimulation(defaultParams, 'ideal');
    const analytical = computeIdealCircularAnalytical(
      defaultParams.radius,
      defaultParams.mass,
      defaultParams.angularVelocity
    );

    const state = sim.step(0.05);
    const relError = Math.abs(state.tension - analytical.centripetalForce) / analytical.centripetalForce;
    expect(relError).toBeLessThan(1e-3);
    expect(state.tension).toBeCloseTo(48.0, 3);
  });

  it('verifies period T and frequency f match 2π/ω and ω/(2π)', () => {
    const sim = new CircularMotionSimulation(defaultParams, 'ideal');
    const analytical = computeIdealCircularAnalytical(
      defaultParams.radius,
      defaultParams.mass,
      defaultParams.angularVelocity
    );

    const state = sim.getState();
    expect(state.period).toBeCloseTo(analytical.period, 4);
    expect(state.frequency).toBeCloseTo(analytical.frequency, 4);
    expect(state.period * state.frequency).toBeCloseTo(1.0, 4);
  });

  it('triggers string rupture when tension exceeds T_max in Real mode and initiates tangential flight', () => {
    // Set high angular velocity that will exceed maxTension (e.g. w = 12 rad/s => F_c = 1.5 * 144 * 2 = 432 N > 100 N)
    const highSpeedParams: CircularMotionParams = {
      ...defaultParams,
      angularVelocity: 12.0,
      maxTension: 100.0
    };

    const sim = new CircularMotionSimulation(highSpeedParams, 'real');
    
    // Step forward
    let snapped = false;
    for (let i = 0; i < 20; i++) {
      const s = sim.step(0.01);
      if (s.isSnapped) {
        snapped = true;
        // Verify tension dropped to 0 after snap
        expect(s.tension).toBe(0);
        // Verify tangential speed is maintained initially
        expect(s.speed).toBeGreaterThan(0);
        break;
      }
    }

    expect(snapped).toBe(true);
  });
});
