import { describe, it, expect } from 'vitest';
import {
  computeViscosityModel,
  calculateViscosity,
  createViscosityModel,
  stepViscosityModel,
  getLocalVelocity,
  FLUID_DATABASE,
  type ViscosityParams,
} from '../model/viscosity-pipe';

describe('Viscosity and Pipe Flow Physical Model', () => {
  const laminarGlycerinParams: ViscosityParams = {
    fluidType: 'glycerin',
    pressureDiff: 800, // 800 Pa
    pipeDiameter: 0.02, // 2 cm diameter (R = 0.01 m)
    pipeLength: 1.5, // 1.5 m
    temperatureC: 20,
    wallRoughnessMm: 0.01,
    isRealMode: false,
  };

  const turbulentWaterParams: ViscosityParams = {
    fluidType: 'water',
    pressureDiff: 3000, // 3000 Pa
    pipeDiameter: 0.05, // 5 cm
    pipeLength: 1.0,
    temperatureC: 20,
    wallRoughnessMm: 0.05,
    isRealMode: false,
  };

  it('accurately computes Poiseuille volumetric flow rate in laminar regime', () => {
    const derived = computeViscosityModel(laminarGlycerinParams);

    const r = laminarGlycerinParams.pipeDiameter / 2; // 0.01 m
    const l = laminarGlycerinParams.pipeLength; // 1.5 m
    const deltaP = laminarGlycerinParams.pressureDiff; // 800 Pa
    const eta = derived.dynamicViscosity;

    // Poiseuille equation: Q = (pi * R^4 * DeltaP) / (8 * eta * L)
    const expectedQ = (Math.PI * Math.pow(r, 4) * deltaP) / (8 * eta * l);

    expect(derived.volumeFlowRate).toBeCloseTo(expectedQ, 8);
    expect(derived.regime).toBe('laminar');
  });

  it('verifies centerline velocity is exactly twice average velocity in laminar flow', () => {
    const derived = computeViscosityModel(laminarGlycerinParams);

    expect(derived.maxVelocity).toBeCloseTo(2 * derived.avgVelocity, 5);
  });

  it('verifies laminar Darcy friction factor f = 64 / Re', () => {
    const derived = computeViscosityModel(laminarGlycerinParams);

    const expectedF = 64 / derived.reynoldsNumber;
    expect(derived.darcyFrictionFactor).toBeCloseTo(expectedF, 4);
  });

  it('verifies Reynolds number threshold separates laminar and turbulent flow', () => {
    const laminar = computeViscosityModel(laminarGlycerinParams);
    expect(laminar.reynoldsNumber).toBeLessThan(2300);
    expect(laminar.regime).toBe('laminar');

    const turbulent = computeViscosityModel(turbulentWaterParams);
    expect(turbulent.reynoldsNumber).toBeGreaterThan(4000);
    expect(turbulent.regime).toBe('turbulent');
  });

  it('verifies temperature elevation decreases liquid viscosity (Andrade law)', () => {
    const coldGlycerin = calculateViscosity(FLUID_DATABASE.glycerin, 10);
    const warmGlycerin = calculateViscosity(FLUID_DATABASE.glycerin, 50);

    expect(warmGlycerin).toBeLessThan(coldGlycerin);
    // At 50 C glycerin is over 4x less viscous than at 10 C
    expect(coldGlycerin / warmGlycerin).toBeGreaterThan(3.0);
  });

  it('verifies parabolic velocity profile reaches zero at walls and max at center', () => {
    const derived = computeViscosityModel(laminarGlycerinParams);

    // Center (rNorm = 0)
    const vCenter = getLocalVelocity(derived, 0);
    expect(vCenter).toBeCloseTo(derived.maxVelocity, 5);

    // Wall (rNorm = 1)
    const vWall = getLocalVelocity(derived, 1);
    expect(vWall).toBeCloseTo(0, 5);

    // Half-radius (rNorm = 0.5): v = vMax * (1 - 0.25) = 0.75 * vMax
    const vHalf = getLocalVelocity(derived, 0.5);
    expect(vHalf).toBeCloseTo(0.75 * derived.maxVelocity, 5);
  });

  it('advances tracer particles and maintains state across simulation steps', () => {
    const state = createViscosityModel(laminarGlycerinParams);
    expect(state.t).toBe(0);
    expect(state.dyeParticles.length).toBeGreaterThan(0);

    const stepped = stepViscosityModel(state, laminarGlycerinParams, 0.05);
    expect(stepped.t).toBeCloseTo(0.05, 4);
    expect(stepped.dyeParticles[0].x).not.toBe(state.dyeParticles[0].x);
  });
});
