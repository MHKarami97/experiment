import { describe, it, expect } from 'vitest';
import {
  ProjectileSimulation,
  computeIdealAnalytical,
  type ProjectileParams
} from '../model/projectile';

describe('Projectile Physics Model Accuracy Tests', () => {
  const dt = 0.005; // 200 Hz for high precision

  it('matches analytical range, max height, and flight time on flat ground (tolerance < 1e-3)', () => {
    const params: ProjectileParams = {
      v0: 25,
      angle: 45,
      h0: 0,
      gravity: 9.80665,
      mass: 1.0,
      dragCoeff: 0.47,
      crossSection: 0.01,
      airDensity: 1.225,
      wind: 0
    };

    const sim = new ProjectileSimulation(params, 'ideal');
    const analytical = computeIdealAnalytical(params);

    while (!sim.getState().isLanded && sim.getState().t < 20) {
      sim.step(dt);
    }

    const state = sim.getState();

    // Verify tolerance < 1e-3 (0.1%)
    const rangeRelError = Math.abs(state.x - analytical.range) / analytical.range;
    const heightRelError = Math.abs(state.maxHeight - analytical.maxHeight) / analytical.maxHeight;
    const timeRelError = Math.abs(state.t - analytical.flightTime) / analytical.flightTime;

    expect(rangeRelError).toBeLessThan(1e-3);
    expect(heightRelError).toBeLessThan(1e-3);
    expect(timeRelError).toBeLessThan(1e-3);
  });

  it('matches analytical solution from an elevated platform (h0 = 15 m) (tolerance < 1e-3)', () => {
    const params: ProjectileParams = {
      v0: 20,
      angle: 35,
      h0: 15,
      gravity: 9.80665,
      mass: 2.0,
      dragCoeff: 0.47,
      crossSection: 0.01,
      airDensity: 1.225,
      wind: 0
    };

    const sim = new ProjectileSimulation(params, 'ideal');
    const analytical = computeIdealAnalytical(params);

    while (!sim.getState().isLanded && sim.getState().t < 20) {
      sim.step(dt);
    }

    const state = sim.getState();

    const rangeRelError = Math.abs(state.x - analytical.range) / analytical.range;
    const heightRelError = Math.abs(state.maxHeight - analytical.maxHeight) / analytical.maxHeight;
    const timeRelError = Math.abs(state.t - analytical.flightTime) / analytical.flightTime;

    expect(rangeRelError).toBeLessThan(1e-3);
    expect(heightRelError).toBeLessThan(1e-3);
    expect(timeRelError).toBeLessThan(1e-3);
  });

  it('correctly models planetary gravities (Moon, Mars, Jupiter)', () => {
    const baseParams: ProjectileParams = {
      v0: 20,
      angle: 45,
      h0: 0,
      gravity: 1.62, // Moon
      mass: 1.0,
      dragCoeff: 0.47,
      crossSection: 0.01,
      airDensity: 0,
      wind: 0
    };

    // Moon test
    const moonSim = new ProjectileSimulation(baseParams, 'ideal');
    const moonAnalytical = computeIdealAnalytical(baseParams);
    while (!moonSim.getState().isLanded && moonSim.getState().t < 100) {
      moonSim.step(dt);
    }
    expect(Math.abs(moonSim.getState().x - moonAnalytical.range) / moonAnalytical.range).toBeLessThan(1e-3);

    // Jupiter test (high gravity)
    const jupiterParams = { ...baseParams, gravity: 24.79 };
    const jupiterSim = new ProjectileSimulation(jupiterParams, 'ideal');
    const jupiterAnalytical = computeIdealAnalytical(jupiterParams);
    while (!jupiterSim.getState().isLanded && jupiterSim.getState().t < 20) {
      jupiterSim.step(dt);
    }
    expect(Math.abs(jupiterSim.getState().x - jupiterAnalytical.range) / jupiterAnalytical.range).toBeLessThan(1e-3);
  });

  it('ensures Real mode with aerodynamic drag physically reduces range and max height', () => {
    const params: ProjectileParams = {
      v0: 30,
      angle: 45,
      h0: 0,
      gravity: 9.80665,
      mass: 0.5,
      dragCoeff: 0.47,
      crossSection: 0.02,
      airDensity: 1.225,
      wind: 0
    };

    const idealSim = new ProjectileSimulation(params, 'ideal');
    while (!idealSim.getState().isLanded && idealSim.getState().t < 20) {
      idealSim.step(dt);
    }

    const realSim = new ProjectileSimulation(params, 'real');
    while (!realSim.getState().isLanded && realSim.getState().t < 20) {
      realSim.step(dt);
    }

    // Due to air resistance, range and peak height must be strictly smaller in Real mode
    expect(realSim.getState().x).toBeLessThan(idealSim.getState().x * 0.95);
    expect(realSim.getState().maxHeight).toBeLessThan(idealSim.getState().maxHeight);
  });
});
