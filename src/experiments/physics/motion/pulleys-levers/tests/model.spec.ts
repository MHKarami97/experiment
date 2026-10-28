import { describe, it, expect } from 'vitest';
import {
  PulleysLeversSimulation,
  computeIdealAtwoodAnalytical,
  computeIdealLeverAnalytical,
  type PulleysLeversParams
} from '../model/pulleysLevers';

describe('Pulleys, Levers & Simple Machines Model', () => {
  const defaultParams: PulleysLeversParams = {
    type: 'atwood',
    atwood: {
      m1: 3.0,
      m2: 5.0,
      pulleyMass: 0,
      pulleyRadius: 0.15,
      gravity: 9.80665,
      height: 2.0,
      frictionTorque: 0
    },
    pulleySystem: {
      loadMass: 20.0,
      effortMass: 6.0,
      strands: 4,
      pulleyMass: 0.5,
      efficiency: 0.85,
      gravity: 9.80665
    },
    lever: {
      loadMass: 10.0,
      loadArm: 0.5,
      effortForce: 49.03325,
      effortArm: 1.0,
      beamMass: 2.0,
      beamLength: 2.0,
      fulcrumOffset: 0,
      frictionCoeff: 0.1,
      gravity: 9.80665
    }
  };

  it('calculates Atwood acceleration matching analytical solution within 1e-3', () => {
    const sim = new PulleysLeversSimulation(defaultParams, 'ideal');
    const analytical = computeIdealAtwoodAnalytical(
      defaultParams.atwood.m1,
      defaultParams.atwood.m2,
      defaultParams.atwood.gravity
    );

    // Step 0.05s
    const state = sim.step(0.05);

    const relError = Math.abs(state.a - analytical.acceleration) / analytical.acceleration;
    expect(relError).toBeLessThan(1e-3);
  });

  it('calculates Atwood rope tensions within 1e-3 of analytical formula', () => {
    const sim = new PulleysLeversSimulation(defaultParams, 'ideal');
    const analytical = computeIdealAtwoodAnalytical(
      defaultParams.atwood.m1,
      defaultParams.atwood.m2,
      defaultParams.atwood.gravity
    );

    const state = sim.step(0.05);

    // In massless ideal pulley, T1 = T2
    const relErrorT1 = Math.abs(state.tension1 - analytical.tension) / analytical.tension;
    const relErrorT2 = Math.abs(state.tension2 - analytical.tension) / analytical.tension;

    expect(relErrorT1).toBeLessThan(1e-3);
    expect(relErrorT2).toBeLessThan(1e-3);
  });

  it('calculates Lever Ideal Mechanical Advantage and balance condition accurately', () => {
    const params: PulleysLeversParams = {
      ...defaultParams,
      type: 'lever'
    };
    const analytical = computeIdealLeverAnalytical(
      params.lever.loadMass,
      params.lever.loadArm,
      params.lever.effortArm,
      params.lever.gravity
    );

    expect(analytical.ima).toBeCloseTo(2.0, 4);
    // Required effort should be loadWeight / 2
    expect(analytical.requiredEffort).toBeCloseTo(params.lever.loadMass * params.lever.gravity / 2, 4);

    const sim = new PulleysLeversSimulation(params, 'ideal');
    const state = sim.step(0.01);
    expect(state.isBalanced).toBe(true);
  });

  it('correctly models Block & Tackle pulley systems with IMA = N and AMA = N * efficiency', () => {
    const params: PulleysLeversParams = {
      ...defaultParams,
      type: 'pulley-system'
    };

    const simIdeal = new PulleysLeversSimulation(params, 'ideal');
    const stateIdeal = simIdeal.getState();
    expect(stateIdeal.ima).toBe(4);
    expect(stateIdeal.ama).toBe(4);
    expect(stateIdeal.efficiencyPercent).toBe(100);

    const simReal = new PulleysLeversSimulation(params, 'real');
    const stateReal = simReal.getState();
    expect(stateReal.ima).toBe(4);
    expect(stateReal.ama).toBeCloseTo(4 * 0.85, 3);
    expect(stateReal.efficiencyPercent).toBeCloseTo(85, 1);
  });
});
