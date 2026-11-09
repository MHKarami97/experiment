import { describe, it, expect } from 'vitest';
import {
  createWorkPowerModel,
  stepWorkPowerModel,
  type WorkPowerParams,
} from '../model/workPower';

describe('Work & Power Physics Model', () => {
  it('strictly validates the Work-Energy Theorem (W_net = Delta K) within 1e-3', () => {
    const params: WorkPowerParams = {
      forceProfile: 'constant',
      appliedForceMax: 100, // N
      forceAngle: 25, // degrees
      payloadMass: 20, // kg
      surfaceFrictionMu: 0,
      springConstant: 100,
      gConst: 9.80665,
      motorEfficiency: 1.0,
      isRealMode: false,
    };

    let state = createWorkPowerModel(params);
    const dt = 0.005;

    for (let i = 0; i < 400; i++) {
      state = stepWorkPowerModel(state, params, dt);
    }

    // Work-Energy Theorem: W_net = Delta K = 0.5 * m * v^2 - 0
    const relError = Math.abs(state.workNet - state.kineticEnergy) / state.kineticEnergy;
    expect(relError).toBeLessThan(1e-3);
  });

  it('matches analytical constant force work W = F * x * cos(theta) within 1e-3', () => {
    const params: WorkPowerParams = {
      forceProfile: 'constant',
      appliedForceMax: 80, // N
      forceAngle: 30, // degrees
      payloadMass: 15,
      surfaceFrictionMu: 0,
      springConstant: 50,
      gConst: 9.80665,
      motorEfficiency: 1.0,
      isRealMode: false,
    };

    let state = createWorkPowerModel(params);
    const dt = 0.005;

    for (let i = 0; i < 200; i++) {
      state = stepWorkPowerModel(state, params, dt);
    }

    const cosTheta = Math.cos((30 * Math.PI) / 180);
    const expectedWork = 80 * state.x * cosTheta;
    const relDiff = Math.abs(state.workApplied - expectedWork) / expectedWork;
    expect(relDiff).toBeLessThan(1e-3);
  });

  it('verifies work done against friction in real mode matches W_f = -mu * N * x', () => {
    const params: WorkPowerParams = {
      forceProfile: 'constant',
      appliedForceMax: 150, // N
      forceAngle: 0, // horizontal pull
      payloadMass: 25, // kg
      surfaceFrictionMu: 0.15,
      springConstant: 50,
      gConst: 9.80665,
      motorEfficiency: 0.85,
      isRealMode: true,
    };

    let state = createWorkPowerModel(params);
    const dt = 0.005;

    for (let i = 0; i < 300; i++) {
      state = stepWorkPowerModel(state, params, dt);
    }

    // Normal force = m * g (for theta = 0)
    const expectedNormal = 25 * 9.80665;
    const expectedFrictionWork = -(0.15 * expectedNormal * state.x);

    const relDiff = Math.abs(state.workFriction - expectedFrictionWork) / Math.abs(expectedFrictionWork);
    expect(relDiff).toBeLessThan(1e-3);

    // Net work must equal W_applied + W_friction and also equal Delta K
    expect(state.workNet).toBeCloseTo(state.workApplied + state.workFriction, 2);
    const keDiff = Math.abs(state.workNet - state.kineticEnergy) / state.kineticEnergy;
    expect(keDiff).toBeLessThan(1e-3);
  });

  it('correctly calculates average power P_avg = W / t and motor efficiency', () => {
    const params: WorkPowerParams = {
      forceProfile: 'constant',
      appliedForceMax: 120,
      forceAngle: 0,
      payloadMass: 30,
      surfaceFrictionMu: 0.1,
      springConstant: 50,
      gConst: 9.80665,
      motorEfficiency: 0.80, // 80% efficiency
      isRealMode: true,
    };

    let state = createWorkPowerModel(params);
    const dt = 0.01;

    for (let i = 0; i < 150; i++) {
      state = stepWorkPowerModel(state, params, dt);
    }

    // Average power = workApplied / t
    const expectedPavg = state.workApplied / state.t;
    expect(state.averagePower).toBeCloseTo(expectedPavg, 2);

    // Motor total input energy must be workApplied / 0.80
    const usefulEnergy = state.workApplied;
    const expectedInputEnergy = usefulEnergy / 0.80;
    const relDiff = Math.abs(state.totalInputEnergy - expectedInputEnergy) / expectedInputEnergy;
    expect(relDiff).toBeLessThan(1e-3);
  });
});
