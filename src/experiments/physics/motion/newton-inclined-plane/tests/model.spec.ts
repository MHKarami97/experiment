import { describe, it, expect } from 'vitest';
import {
  InclinedPlaneSimulation,
  computeAnalyticalInclinedPlane,
  type InclinedPlaneParams
} from '../model/inclinedPlane';

describe('Newton Inclined Plane Model Accuracy', () => {
  it('accurately reproduces frictionless downward acceleration on 30 deg incline', () => {
    const params: InclinedPlaneParams = {
      angle: 30,
      mass: 2.0,
      gravity: 9.80665,
      muS: 0,
      muK: 0,
      fPull: 0,
      initialPos: 10,
      initialSpeed: 0,
      inclineLength: 20,
      airDensity: 1.225,
      dragCoeff: 0,
      crossSection: 0.05
    };

    const sim = new InclinedPlaneSimulation(params, 'ideal');
    const dt = 0.01;
    const totalTime = 1.0;
    const steps = Math.round(totalTime / dt);

    for (let i = 0; i < steps; i++) {
      sim.step(dt);
    }

    const state = sim.getState();
    const analytical = computeAnalyticalInclinedPlane(params, 'ideal');

    const expectedS = analytical.positionAtT(totalTime);
    const expectedV = analytical.velocityAtT(totalTime);

    expect(Math.abs(state.s - expectedS) / expectedS).toBeLessThan(1e-3);
    expect(Math.abs(state.v - expectedV) / Math.abs(expectedV)).toBeLessThan(1e-3);
  });

  it('accurately matches kinetic friction slide dynamics at 45 deg incline', () => {
    const params: InclinedPlaneParams = {
      angle: 45,
      mass: 3.0,
      gravity: 9.80665,
      muS: 0.3,
      muK: 0.2,
      fPull: 0,
      initialPos: 15,
      initialSpeed: 0,
      inclineLength: 20,
      airDensity: 1.225,
      dragCoeff: 0,
      crossSection: 0.05
    };

    const sim = new InclinedPlaneSimulation(params, 'real');
    const dt = 0.01;
    const totalTime = 1.2;
    const steps = Math.round(totalTime / dt);

    for (let i = 0; i < steps; i++) {
      sim.step(dt);
    }

    const state = sim.getState();
    const analytical = computeAnalyticalInclinedPlane(params, 'real');

    const expectedS = analytical.positionAtT(totalTime);
    const expectedV = analytical.velocityAtT(totalTime);

    expect(Math.abs(state.s - expectedS) / expectedS).toBeLessThan(1e-3);
    expect(Math.abs(state.v - expectedV) / Math.abs(expectedV)).toBeLessThan(1e-3);
  });

  it('maintains static equilibrium when incline angle is below critical angle', () => {
    // tan(20 deg) ~ 0.364 < muS (0.50)
    const params: InclinedPlaneParams = {
      angle: 20,
      mass: 5.0,
      gravity: 9.80665,
      muS: 0.5,
      muK: 0.3,
      fPull: 0,
      initialPos: 8,
      initialSpeed: 0,
      inclineLength: 15,
      airDensity: 1.225,
      dragCoeff: 0,
      crossSection: 0.05
    };

    const sim = new InclinedPlaneSimulation(params, 'real');
    const dt = 0.01;

    for (let i = 0; i < 100; i++) {
      sim.step(dt);
    }

    const state = sim.getState();
    expect(state.isStatic).toBe(true);
    expect(state.v).toBe(0);
    expect(state.a).toBe(0);
    expect(state.s).toBe(8);
  });

  it('accurately accelerates block upwards under applied pulling force', () => {
    const params: InclinedPlaneParams = {
      angle: 30,
      mass: 2.0,
      gravity: 9.80665,
      muS: 0.2,
      muK: 0.1,
      fPull: 30, // Pulling up the plane
      initialPos: 2,
      initialSpeed: 0,
      inclineLength: 25,
      airDensity: 1.225,
      dragCoeff: 0,
      crossSection: 0.05
    };

    const sim = new InclinedPlaneSimulation(params, 'real');
    const dt = 0.01;
    const totalTime = 1.0;
    const steps = Math.round(totalTime / dt);

    for (let i = 0; i < steps; i++) {
      sim.step(dt);
    }

    const state = sim.getState();

    // Theoretical upward acceleration:
    // a_up = (F_pull - m*g*sin(30) - mu_k*m*g*cos(30)) / m
    const theta = (30 * Math.PI) / 180;
    const F_net = 30 - 2.0 * 9.80665 * Math.sin(theta) - 0.1 * 2.0 * 9.80665 * Math.cos(theta);
    const expectedA = F_net / 2.0;
    const expectedS = 2 + 0.5 * expectedA * totalTime * totalTime;
    const expectedV = expectedA * totalTime;

    expect(Math.abs(state.a - expectedA) / expectedA).toBeLessThan(1e-3);
    expect(Math.abs(state.s - expectedS) / expectedS).toBeLessThan(1e-3);
    expect(Math.abs(state.v - expectedV) / expectedV).toBeLessThan(1e-3);
  });
});
