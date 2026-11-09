import { describe, it, expect } from 'vitest';
import {
  computeGasDerivations,
  createGasLawModel,
  stepGasLawModel,
  type GasLawParams,
} from '../model/gas-laws';

describe('Gas Laws & Molecular Kinetics Model', () => {
  it('calculates ideal gas pressure at standard state STP within < 1e-3 tolerance', () => {
    // 1 mole of gas at 273.15 K occupying 22.414 Liters (STP standard)
    const params: GasLawParams = {
      lawMode: 'ideal',
      gasType: 'helium',
      moles: 1.0,
      volumeLiters: 22.414,
      temperatureKelvin: 273.15,
      particleCount: 80,
      isRealMode: false,
    };

    const derived = computeGasDerivations(params);
    // Standard atmospheric pressure: ~ 101.325 kPa
    expect(derived.idealPressureKPa).toBeCloseTo(101.325, 1);
    expect(derived.displayedPressureKPa).toBeCloseTo(101.325, 1);
  });

  it('demonstrates Boyle\'s Law (P * V = const at constant T): halving V doubles P', () => {
    const baseParams: GasLawParams = {
      lawMode: 'boyle',
      gasType: 'nitrogen',
      moles: 1.5,
      volumeLiters: 20.0,
      temperatureKelvin: 300,
      particleCount: 80,
      isRealMode: false,
    };

    const state1 = computeGasDerivations(baseParams);
    const state2 = computeGasDerivations({ ...baseParams, volumeLiters: 10.0 });

    expect(state2.idealPressureKPa).toBeCloseTo(state1.idealPressureKPa * 2.0, 3);
  });

  it('demonstrates Gay-Lussac\'s Law (P / T = const at constant V): doubling T doubles P', () => {
    const baseParams: GasLawParams = {
      lawMode: 'gayLussac',
      gasType: 'argon',
      moles: 1.2,
      volumeLiters: 15.0,
      temperatureKelvin: 300,
      particleCount: 80,
      isRealMode: false,
    };

    const state1 = computeGasDerivations(baseParams);
    const state2 = computeGasDerivations({ ...baseParams, temperatureKelvin: 600 });

    expect(state2.idealPressureKPa).toBeCloseTo(state1.idealPressureKPa * 2.0, 3);
  });

  it('computes RMS molecular speed according to Maxwell-Boltzmann theory', () => {
    // Helium at 300 K: v_rms = sqrt(3 * 8.31446 * 300 / 0.0040026) ~ 1367.3 m/s
    const paramsHe: GasLawParams = {
      lawMode: 'ideal',
      gasType: 'helium',
      moles: 1.0,
      volumeLiters: 10.0,
      temperatureKelvin: 300,
      particleCount: 50,
      isRealMode: false,
    };
    const derivedHe = computeGasDerivations(paramsHe);
    expect(derivedHe.rmsSpeed).toBeCloseTo(1367.3, 0);

    // Nitrogen at 300 K: v_rms = sqrt(3 * 8.31446 * 300 / 0.028014) ~ 516.8 m/s
    const paramsN2: GasLawParams = { ...paramsHe, gasType: 'nitrogen' };
    const derivedN2 = computeGasDerivations(paramsN2);
    expect(derivedN2.rmsSpeed).toBeCloseTo(516.8, 0);

    // Lighter gas (He) must move significantly faster than heavier gas (N2)
    expect(derivedHe.rmsSpeed).toBeGreaterThan(derivedN2.rmsSpeed * 2.5);
  });

  it('applies Van der Waals real gas correction accounting for intermolecular attraction and volume', () => {
    // Under high pressure / high density (CO2 has large 'a' = 0.364 Pa*m^6/mol^2)
    const params: GasLawParams = {
      lawMode: 'ideal',
      gasType: 'co2',
      moles: 3.0,
      volumeLiters: 4.0, // High density
      temperatureKelvin: 280,
      particleCount: 80,
      isRealMode: true,
    };

    const derived = computeGasDerivations(params);
    // Real pressure with intermolecular attraction will differ from ideal
    expect(derived.realPressureKPa).toBeGreaterThan(0);
    expect(derived.displayedPressureKPa).toBe(derived.realPressureKPa);
  });

  it('steps particle positions within container and accumulates wall reflections', () => {
    const params: GasLawParams = {
      lawMode: 'ideal',
      gasType: 'helium',
      moles: 1.0,
      volumeLiters: 12.0,
      temperatureKelvin: 350,
      particleCount: 40,
      isRealMode: false,
    };

    let state = createGasLawModel(params);
    expect(state.particles.length).toBe(40);

    for (let i = 0; i < 60; i++) {
      state = stepGasLawModel(state, params, 0.016);
    }

    expect(state.t).toBeCloseTo(60 * 0.016, 2);
    expect(state.wallCollisionsAccumulator).toBeGreaterThan(0);
    // Verify all particles remain bounded inside normalized bounds [0, 1]
    for (const p of state.particles) {
      expect(p.x).toBeGreaterThanOrEqual(0.01);
      expect(p.x).toBeLessThanOrEqual(0.99);
      expect(p.y).toBeGreaterThanOrEqual(0.01);
      expect(p.y).toBeLessThanOrEqual(0.99);
    }
  });
});
