import { describe, it, expect } from 'vitest';
import {
  computeVenturi,
  computeHydraulic,
  createPascalBernoulliModel,
  stepPascalBernoulliModel,
  type VenturiParams,
  type HydraulicParams,
} from '../model/pascal-bernoulli';

describe('Pascal and Bernoulli physical model', () => {
  const defaultVenturi: VenturiParams = {
    apparatusMode: 'venturi',
    fluidDensity: 1000, // Water
    inletVelocity: 2.0, // 2 m/s
    inletDiameter: 0.16, // 16 cm (r = 0.08 m)
    constrictionDiameter: 0.08, // 8 cm (r = 0.04 m -> A2 is 1/4 of A1)
    inletPressure: 150000, // 150 kPa
    pipeLength: 1.0,
    gravity: 9.8,
    isRealMode: false,
  };

  const defaultHydraulic: HydraulicParams = {
    apparatusMode: 'hydraulic',
    fluidDensity: 850, // Oil
    piston1Radius: 0.05, // 5 cm
    piston2Radius: 0.25, // 25 cm -> Area ratio = (25/5)^2 = 25
    inputForce: 200, // 200 N
    inputDisplacement: 0.25, // 25 cm
    gravity: 9.8,
    isRealMode: false,
  };

  it('verifies continuity equation in Venturi pipe (A1*v1 == A2*v2)', () => {
    const derived = computeVenturi(defaultVenturi);

    // D1/D2 = 2 => A1/A2 = 4 => v2 should be 4 * v1 = 8 m/s
    expect(derived.velocity2).toBeCloseTo(8.0, 4);

    const q1 = derived.area1 * derived.velocity1;
    const q2 = derived.area2 * derived.velocity2;
    expect(q1).toBeCloseTo(q2, 6);
  });

  it('verifies Bernoulli pressure drop in throat for ideal fluid', () => {
    const derived = computeVenturi(defaultVenturi);

    // v1 = 2, v2 = 8
    // Delta P = 0.5 * rho * (v2^2 - v1^2) = 0.5 * 1000 * (64 - 4) = 500 * 60 = 30,000 Pa
    const expectedDeltaP = 0.5 * 1000 * (64 - 4);
    expect(derived.deltaPressure).toBeCloseTo(expectedDeltaP, 2);

    // P2 = 150,000 - 30,000 = 120,000 Pa
    expect(derived.pressure2).toBeCloseTo(120000, 2);
  });

  it('verifies manometer height difference corresponds to deltaP / (rho*g)', () => {
    const derived = computeVenturi(defaultVenturi);

    // deltaH = 30000 / (1000 * 9.8) = 30 / 9.8 ~ 3.0612 m
    const expectedDeltaH = 30000 / (1000 * 9.8);
    expect(derived.deltaHeight).toBeCloseTo(expectedDeltaH, 3);
  });

  it('verifies Pascal hydraulic force multiplication: F2 = F1 * (A2/A1)', () => {
    const derived = computeHydraulic(defaultHydraulic);

    // r2/r1 = 5 => MA = 25
    expect(derived.mechanicalAdvantage).toBeCloseTo(25.0, 4);

    // F2 = 200 * 25 = 5000 N
    expect(derived.outputForce).toBeCloseTo(5000.0, 2);
  });

  it('verifies work and volume conservation in ideal hydraulic press', () => {
    const derived = computeHydraulic(defaultHydraulic);

    // d2 = d1 / 25 = 0.25 / 25 = 0.01 m (1 cm)
    expect(derived.outputDisplacement).toBeCloseTo(0.01, 4);

    // Ideal Work in = 200 N * 0.25 m = 50 J
    // Ideal Work out = 5000 N * 0.01 m = 50 J
    expect(derived.workInput).toBeCloseTo(50.0, 2);
    expect(derived.workOutput).toBeCloseTo(50.0, 2);
  });

  it('verifies real mode efficiency reduces hydraulic work output and Venturi minor loss', () => {
    const realHydraulic = computeHydraulic({ ...defaultHydraulic, isRealMode: true });
    // Efficiency is ~91%
    expect(realHydraulic.efficiency).toBeLessThan(1.0);
    expect(realHydraulic.workOutput).toBeLessThan(realHydraulic.workInput);

    const realVenturi = computeVenturi({ ...defaultVenturi, isRealMode: true });
    // In real mode, friction loss causes pressure drop to be greater than ideal
    expect(realVenturi.frictionHeadLoss).toBeGreaterThan(0);
    expect(realVenturi.pressure2).toBeLessThan(120000);
  });

  it('advances simulation state and particle positions across timesteps', () => {
    const state = createPascalBernoulliModel(defaultVenturi, defaultHydraulic);
    expect(state.t).toBe(0);
    expect(state.particles.length).toBeGreaterThan(0);

    const stepped = stepPascalBernoulliModel(state, defaultVenturi, 0.05);
    expect(stepped.t).toBeCloseTo(0.05, 4);
    expect(stepped.particles[0].x).not.toBe(state.particles[0].x);
  });
});
