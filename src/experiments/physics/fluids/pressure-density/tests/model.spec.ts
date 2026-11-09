import { describe, it, expect } from 'vitest';
import {
  createFluidPressureModel,
  stepFluidPressureModel,
  getBaseDensity,
  computeEffectiveDensity,
  computeHydrostaticPressure,
  computeUTubeEquilibrium,
  type FluidPressureParams,
} from '../model/fluidPressure';

describe('Fluid Pressure & Density Physics Model', () => {
  it('strictly validates hydrostatic gauge pressure P = rho * g * h within 1e-4', () => {
    const params: FluidPressureParams = {
      tankMode: 'tank',
      fluidType: 'water',
      customDensity: 1000,
      fluid2Density: 800,
      gravity: 9.80665,
      probeDepth: 2.5, // 2.5 m
      atmosphericPressure: 101325,
      includeAtmosphere: false,
      temperature: 20,
      sensorNoiseLevel: 0,
      isRealMode: false,
    };

    const state = createFluidPressureModel(params);
    const expectedGauge = 1000 * 9.80665 * 2.5; // 24516.625 Pa

    expect(state.gaugePressure).toBeCloseTo(expectedGauge, 3);
    expect(state.measuredPressure).toBeCloseTo(expectedGauge, 3);
  });

  it('verifies exact difference between absolute and gauge pressure is P_atm', () => {
    const params: FluidPressureParams = {
      tankMode: 'tank',
      fluidType: 'seawater', // 1025 kg/m^3
      customDensity: 1025,
      fluid2Density: 800,
      gravity: 9.80665,
      probeDepth: 4.0,
      atmosphericPressure: 101325,
      includeAtmosphere: true,
      temperature: 20,
      sensorNoiseLevel: 0,
      isRealMode: false,
    };

    const state = createFluidPressureModel(params);
    const diff = state.absolutePressure - state.gaugePressure;
    expect(diff).toBeCloseTo(101325, 3);
    expect(state.measuredPressure).toBeCloseTo(state.absolutePressure, 3);
  });

  it('accurately calculates U-tube manometer column balance (rho1 * h1 = rho2 * h2)', () => {
    const rho1 = 1000; // water
    const h1 = 0.30; // 30 cm
    const rho2 = 800; // oil

    const result = computeUTubeEquilibrium(rho1, h1, rho2);
    // h2 = 0.30 * (1000 / 800) = 0.375 m
    expect(result.h2).toBeCloseTo(0.375, 4);
    expect(rho1 * h1).toBeCloseTo(rho2 * result.h2, 4);
  });

  it('demonstrates thermal expansion density reduction in real mode', () => {
    const baseRho = 1000;
    const tempCold = 20;
    const tempHot = 80;

    const rhoCold = computeEffectiveDensity(baseRho, tempCold, true);
    const rhoHot = computeEffectiveDensity(baseRho, tempHot, true);

    expect(rhoCold).toBeCloseTo(1000, 3);
    expect(rhoHot).toBeLessThan(rhoCold); // Liquid expands and density drops
  });

  it('validates heavy mercury density vs water pressure ratio', () => {
    const pWater = computeHydrostaticPressure(1000, 1.0, 9.80665, 101325, false);
    const pMercury = computeHydrostaticPressure(13600, 1.0, 9.80665, 101325, false);

    expect(pMercury.gauge / pWater.gauge).toBeCloseTo(13.6, 4);
    expect(getBaseDensity('mercury', 0)).toBe(13600);
    expect(getBaseDensity('water', 0)).toBe(1000);
  });

  it('steps fluid pressure model time and updates state correctly', () => {
    const params: FluidPressureParams = {
      tankMode: 'tank',
      fluidType: 'water',
      customDensity: 1000,
      fluid2Density: 800,
      gravity: 9.80665,
      probeDepth: 1.5,
      atmosphericPressure: 101325,
      includeAtmosphere: false,
      temperature: 20,
      sensorNoiseLevel: 10,
      isRealMode: true,
    };

    const state0 = createFluidPressureModel(params);
    const state1 = stepFluidPressureModel(state0, params, 0.05);

    expect(state1.t).toBeCloseTo(0.05, 4);
    expect(state1.depth).toBe(1.5);
    expect(state1.measuredPressure).toBeGreaterThan(0);
  });
});
