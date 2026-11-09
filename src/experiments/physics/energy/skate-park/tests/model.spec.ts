import { describe, it, expect } from 'vitest';
import {
  createSkateParkModel,
  stepSkateParkModel,
  getTrackGeometry,
  type SkateParkParams,
} from '../model/skatePark';

describe('Conservation of Energy (Skate Park) Physics Model', () => {
  it('strictly conserves mechanical energy in ideal mode (drift < 1e-3)', () => {
    const params: SkateParkParams = {
      trackShape: 'u-ramp',
      skaterMass: 60, // kg
      gravity: 9.80665,
      trackFrictionMu: 0,
      initialHeight: 4.0, // m
      isRealMode: false,
    };

    let state = createSkateParkModel(params);
    const initialEnergy = state.totalEnergy;
    const dt = 0.002;

    // Simulate for 2 seconds (roughly half an oscillation cycle)
    for (let i = 0; i < 1000; i++) {
      state = stepSkateParkModel(state, params, dt);
      const currentE = state.potentialEnergy + state.kineticEnergy;
      const relDiff = Math.abs(currentE - initialEnergy) / initialEnergy;
      expect(relDiff).toBeLessThan(1e-3);
    }
  });

  it('verifies maximum bottom speed matches Torricelli v = sqrt(2gh) within 1e-3', () => {
    const params: SkateParkParams = {
      trackShape: 'u-ramp',
      skaterMass: 70,
      gravity: 9.80665,
      trackFrictionMu: 0,
      initialHeight: 3.5, // m
      isRealMode: false,
    };

    let state = createSkateParkModel(params);
    const expectedMaxSpeed = Math.sqrt(2 * params.gravity * params.initialHeight);

    let maxObservedSpeed = 0;
    const dt = 0.001;

    // Simulate through lowest point (x ~ 0, y ~ 0)
    for (let i = 0; i < 2000; i++) {
      state = stepSkateParkModel(state, params, dt);
      if (state.speed > maxObservedSpeed) {
        maxObservedSpeed = state.speed;
      }
    }

    const relError = Math.abs(maxObservedSpeed - expectedMaxSpeed) / expectedMaxSpeed;
    expect(relError).toBeLessThan(1e-3);
  });

  it('accurately accounts for thermal dissipation in real mode (PE + KE + Thermal = const)', () => {
    const params: SkateParkParams = {
      trackShape: 'u-ramp',
      skaterMass: 65,
      gravity: 9.80665,
      trackFrictionMu: 0.05,
      initialHeight: 4.0,
      isRealMode: true,
    };

    let state = createSkateParkModel(params);
    const initialEnergy = state.totalEnergy;
    const dt = 0.002;

    for (let i = 0; i < 500; i++) {
      state = stepSkateParkModel(state, params, dt);
    }

    // Thermal energy has accumulated
    expect(state.thermalEnergy).toBeGreaterThan(0);

    // Sum of all energy forms PE + KE + Thermal must equal initial energy
    const sumAll = state.potentialEnergy + state.kineticEnergy + state.thermalEnergy;
    const relDiff = Math.abs(sumAll - initialEnergy) / initialEnergy;
    expect(relDiff).toBeLessThan(1e-3);
  });

  it('correctly calculates track geometry and curvature for double-well track', () => {
    const geom0 = getTrackGeometry(0, 'double-well');
    expect(geom0.y).toBeCloseTo(2.5, 4);
    expect(geom0.slope).toBeCloseTo(0, 4);
  });
});
