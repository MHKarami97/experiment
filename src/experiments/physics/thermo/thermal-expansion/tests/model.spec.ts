import { describe, it, expect } from 'vitest';
import {
  computeThermalExpansion,
  calculateWaterDensity,
  createThermalExpansionModel,
  stepThermalExpansionModel,
  type ThermalExpansionParams,
} from '../model/thermal-expansion';

describe('Thermal Expansion Physical Model', () => {
  it('calculates linear elongation for copper accurately (< 1e-3 tolerance)', () => {
    // 1000 mm copper rod heated by 100°C
    const params: ThermalExpansionParams = {
      expansionType: 'linear',
      metal1: 'copper',
      metal2: 'invar',
      initialLengthMm: 1000,
      stripThicknessMm: 2.0,
      initialTempC: 20,
      currentTempC: 120, // delta T = 100°C
      initialVolumeCm3: 500,
      isRealMode: false,
    };

    const derived = computeThermalExpansion(params);
    // dL = alpha * L0 * dT = 16.5e-6 * 1000 * 100 = 1.65 mm
    expect(derived.linear.deltaL_Mm).toBeCloseTo(1.65, 3);
    expect(derived.linear.finalLengthMm).toBeCloseTo(1001.65, 3);
  });

  it('demonstrates Invar minimal expansion compared to copper and aluminum', () => {
    const baseParams: ThermalExpansionParams = {
      expansionType: 'linear',
      metal1: 'invar',
      metal2: 'steel',
      initialLengthMm: 1000,
      stripThicknessMm: 2.0,
      initialTempC: 20,
      currentTempC: 120,
      initialVolumeCm3: 500,
      isRealMode: false,
    };

    const invarDerived = computeThermalExpansion(baseParams);
    const copperDerived = computeThermalExpansion({ ...baseParams, metal1: 'copper' });
    const alumDerived = computeThermalExpansion({ ...baseParams, metal1: 'aluminum' });

    // Invar dL = 1.2e-6 * 1000 * 100 = 0.12 mm
    expect(invarDerived.linear.deltaL_Mm).toBeCloseTo(0.12, 3);
    // Aluminum dL = 23e-6 * 1000 * 100 = 2.3 mm
    expect(alumDerived.linear.deltaL_Mm).toBeCloseTo(2.30, 3);

    expect(copperDerived.linear.deltaL_Mm).toBeGreaterThan(invarDerived.linear.deltaL_Mm * 13);
  });

  it('calculates bimetallic strip tip deflection using Timoshenko formula', () => {
    // Brass (19e-6) bonded with Invar (1.2e-6), L=200mm, d=2.0mm, dT=50°C
    const params: ThermalExpansionParams = {
      expansionType: 'bimetal',
      metal1: 'brass',
      metal2: 'invar',
      initialLengthMm: 200,
      stripThicknessMm: 2.0,
      initialTempC: 20,
      currentTempC: 70, // dT = 50°C
      initialVolumeCm3: 500,
      isRealMode: false,
    };

    const derived = computeThermalExpansion(params);
    // delta_tip = (3 * (19e-6 - 1.2e-6) * 50 * 200^2) / (4 * 2.0)
    // = (3 * 17.8e-6 * 50 * 40000) / 8 = 106.8 / 8 = 13.35 mm
    expect(derived.bimetal.tipDeflectionMm).toBeCloseTo(13.35, 2);
    expect(derived.bimetal.switchContactClosed).toBe(false); // Contact opened due to upward curling
  });

  it('verifies water density peak and anomalous expansion between 0°C and 4°C', () => {
    const rho0 = calculateWaterDensity(0);
    const rho2 = calculateWaterDensity(2);
    const rho4 = calculateWaterDensity(3.98);
    const rho8 = calculateWaterDensity(8);

    // Peak density must occur at ~ 3.98°C
    expect(rho4).toBeGreaterThan(rho0);
    expect(rho4).toBeGreaterThan(rho2);
    expect(rho4).toBeGreaterThan(rho8);

    // Cooling from 4°C to 0°C MUST decrease density (i.e. expand volume)
    expect(rho0).toBeLessThan(rho4);

    const paramsAnomaly: ThermalExpansionParams = {
      expansionType: 'waterAnomaly',
      metal1: 'copper',
      metal2: 'invar',
      initialLengthMm: 500,
      stripThicknessMm: 2.0,
      initialTempC: 4,
      currentTempC: 1, // Cooling towards freezing in anomaly zone
      initialVolumeCm3: 1000,
      isRealMode: false,
    };

    const derived = computeThermalExpansion(paramsAnomaly);
    expect(derived.water.anomalousRegion).toBe(true);
    // Cooling from 4°C to 1°C increases volume (deltaV > 0)
    expect(derived.water.volumeChangeCm3).toBeGreaterThan(0);
  });

  it('steps dynamic temperature transition smoothly towards equilibrium', () => {
    const params: ThermalExpansionParams = {
      expansionType: 'linear',
      metal1: 'steel',
      metal2: 'invar',
      initialLengthMm: 1000,
      stripThicknessMm: 2.0,
      initialTempC: 20,
      currentTempC: 80,
      initialVolumeCm3: 500,
      isRealMode: false,
    };

    let state = createThermalExpansionModel({ ...params, currentTempC: 20 });
    expect(state.temperatureC).toBeCloseTo(20, 1);

    for (let i = 0; i < 40; i++) {
      state = stepThermalExpansionModel(state, params, 0.05);
    }

    expect(state.temperatureC).toBeCloseTo(80, 0);
    expect(state.derived.linear.deltaL_Mm).toBeCloseTo(12e-6 * 1000 * 60, 1);
  });
});
