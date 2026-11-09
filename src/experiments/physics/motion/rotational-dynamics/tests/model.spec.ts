import { describe, it, expect } from 'vitest';
import {
  computeMomentOfInertia,
  computeAnalyticalRotation,
  createRotationModel,
  stepRotationModel,
  type RotationParams,
} from '../model/rotation';

describe('Rigid Body Rotation & Gyroscopic Dynamics Physics Model', () => {
  it('correctly calculates moments of inertia for standard geometries', () => {
    const M = 2.0; // kg
    const R = 0.5; // m

    const iDisk = computeMomentOfInertia('disk', M, R);
    expect(iDisk).toBeCloseTo(0.5 * 2.0 * 0.25, 5); // 0.25 kg*m^2

    const iHoop = computeMomentOfInertia('hoop', M, R);
    expect(iHoop).toBeCloseTo(2.0 * 0.25, 5); // 0.50 kg*m^2

    const iSphere = computeMomentOfInertia('sphere', M, R);
    expect(iSphere).toBeCloseTo(0.4 * 2.0 * 0.25, 5); // 0.20 kg*m^2

    const iRod = computeMomentOfInertia('rod', M, R);
    // L = 2R = 1.0 m, I = 1/12 * M * L^2 = (1/12) * 2 * 1 = 1/6 kg*m^2
    expect(iRod).toBeCloseTo((1 / 6), 5);
  });

  it('matches analytical angular acceleration for falling weight drive within 1e-3', () => {
    const params: RotationParams = {
      rotorShape: 'disk',
      rotorMass: 2.0,
      rotorRadius: 0.3,
      hangingMass: 0.5,
      spindleRadius: 0.05,
      gConst: 9.80665,
      bearingFriction: 0,
      viscousDamping: 0,
      isRealMode: false,
    };

    const analytical = computeAnalyticalRotation(params);
    let state = createRotationModel(params);

    // Initial angular acceleration must match analytical value exactly
    expect(state.alpha).toBeCloseTo(analytical.angularAcc, 3);

    // Step forward 0.1 s
    const dt = 0.005;
    for (let i = 0; i < 20; i++) {
      state = stepRotationModel(state, params, dt);
    }

    // omega = alpha * t
    const expectedOmega = analytical.angularAcc * 0.1;
    expect(Math.abs(state.omega - expectedOmega) / expectedOmega).toBeLessThan(1e-3);
  });

  it('conserves total mechanical energy in ideal mode', () => {
    const params: RotationParams = {
      rotorShape: 'disk',
      rotorMass: 1.5,
      rotorRadius: 0.25,
      hangingMass: 0.4,
      spindleRadius: 0.04,
      gConst: 9.80665,
      bearingFriction: 0,
      viscousDamping: 0,
      isRealMode: false,
    };

    let state = createRotationModel(params);
    const dt = 0.002;
    const steps = 100; // 0.2 seconds of fall

    for (let i = 0; i < steps; i++) {
      state = stepRotationModel(state, params, dt);
    }

    // Potential energy lost by hanging mass = m * g * h
    const potentialLost = params.hangingMass * params.gConst * state.hangingPosition;

    // Kinetic energy gained:
    // K_rot = 1/2 * I * omega^2
    // K_trans = 1/2 * m * v_lin^2 (where v_lin = omega * r)
    const vLin = state.omega * params.spindleRadius;
    const kTrans = 0.5 * params.hangingMass * vLin * vLin;
    const kRot = state.rotationalKineticEnergy;
    const totalKinetic = kRot + kTrans;

    // Difference between potential energy lost and kinetic energy gained must be < 1e-3
    const relDiff = Math.abs(potentialLost - totalKinetic) / potentialLost;
    expect(relDiff).toBeLessThan(1e-3);
  });

  it('calculates gyroscopic precession frequency accurately', () => {
    const params: RotationParams = {
      rotorShape: 'disk',
      rotorMass: 1.0,
      rotorRadius: 0.2,
      hangingMass: 0,
      spindleRadius: 0.02,
      gConst: 9.80665,
      bearingFriction: 0,
      viscousDamping: 0,
      gyroSpinRate: 200, // 200 rad/s
      pivotDistance: 0.1, // 0.1 m
      isRealMode: false,
    };

    const analytical = computeAnalyticalRotation(params);
    // I = 0.5 * 1.0 * 0.04 = 0.02 kg*m^2
    // L = I * omega_s = 0.02 * 200 = 4.0 kg*m^2/s
    // tau = M * g * d = 1.0 * 9.80665 * 0.1 = 0.980665 N*m
    // Omega_p = 0.980665 / 4.0 = 0.245166 rad/s
    expect(analytical.precessionRate).toBeCloseTo(0.245166, 3);
  });

  it('demonstrates rotational kinetic energy dissipation in real mode due to bearing friction', () => {
    const paramsReal: RotationParams = {
      rotorShape: 'disk',
      rotorMass: 2.0,
      rotorRadius: 0.3,
      hangingMass: 0.5,
      spindleRadius: 0.05,
      gConst: 9.80665,
      bearingFriction: 0.05, // 0.05 N*m
      viscousDamping: 0.01,
      isRealMode: true,
    };

    const paramsIdeal: RotationParams = {
      ...paramsReal,
      bearingFriction: 0,
      viscousDamping: 0,
      isRealMode: false,
    };

    let stateReal = createRotationModel(paramsReal);
    let stateIdeal = createRotationModel(paramsIdeal);

    for (let i = 0; i < 50; i++) {
      stateReal = stepRotationModel(stateReal, paramsReal, 0.01);
      stateIdeal = stepRotationModel(stateIdeal, paramsIdeal, 0.01);
    }

    // Real mode omega must be strictly lower than ideal mode due to friction
    expect(stateReal.omega).toBeLessThan(stateIdeal.omega);
    expect(stateReal.rotationalKineticEnergy).toBeLessThan(stateIdeal.rotationalKineticEnergy);
  });
});
