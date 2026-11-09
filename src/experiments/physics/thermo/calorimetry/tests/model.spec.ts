import { describe, it, expect } from 'vitest';
import {
  computeEquilibrium,
  createCalorimetryModel,
  stepCalorimetryModel,
  type CalorimetryParams,
} from '../model/calorimetry';

describe('Calorimetry & Specific Heat Model', () => {
  it('calculates analytical equilibrium for copper in water accurately (< 1e-3 tolerance)', () => {
    const params: CalorimetryParams = {
      solidMaterial: 'copper',
      solidMassGrams: 200, // 0.2 kg, c=385
      solidInitialTempC: 100,
      liquidMedium: 'water',
      liquidMassGrams: 300, // 0.3 kg, c=4184
      liquidInitialTempC: 20,
      calorimeterWaterEquivalentGrams: 0,
      ambientTempC: 20,
      stirrerActive: false,
      isRealMode: false,
    };

    const derived = computeEquilibrium(params);
    // Expected: (0.2*385*100 + 0.3*4184*20) / (0.2*385 + 0.3*4184) = (7700 + 25104) / (77 + 1255.2) = 32804 / 1332.2 = 24.62393...
    const expectedT = (7700 + 25104) / 1332.2;
    expect(derived.theoreticalEquilibriumTempC).toBeCloseTo(expectedT, 3);
    expect(derived.heatTransferredJoules).toBeCloseTo(0.2 * 385 * (100 - expectedT), 2);
  });

  it('incorporates calorimeter water equivalent in real mode', () => {
    const params: CalorimetryParams = {
      solidMaterial: 'copper',
      solidMassGrams: 200,
      solidInitialTempC: 100,
      liquidMedium: 'water',
      liquidMassGrams: 300,
      liquidInitialTempC: 20,
      calorimeterWaterEquivalentGrams: 20, // 0.02 kg * 4184 = 83.68 J/K
      ambientTempC: 20,
      stirrerActive: false,
      isRealMode: true,
    };

    const derived = computeEquilibrium(params);
    const expectedNumerator = 7700 + (0.3 * 4184 + 0.02 * 4184) * 20;
    const expectedDenominator = 77 + 0.3 * 4184 + 0.02 * 4184;
    const expectedT = expectedNumerator / expectedDenominator;

    expect(derived.theoreticalEquilibriumTempC).toBeCloseTo(expectedT, 3);
    expect(derived.theoreticalEquilibriumTempC).toBeLessThan(24.6239); // cooler due to warming up calorimeter vessel
  });

  it('calculates aluminum in water analytical equilibrium', () => {
    const params: CalorimetryParams = {
      solidMaterial: 'aluminum',
      solidMassGrams: 100, // 0.1 kg, c=900
      solidInitialTempC: 95,
      liquidMedium: 'water',
      liquidMassGrams: 200, // 0.2 kg, c=4184
      liquidInitialTempC: 22,
      calorimeterWaterEquivalentGrams: 0,
      ambientTempC: 22,
      stirrerActive: false,
      isRealMode: false,
    };

    const derived = computeEquilibrium(params);
    // (0.1*900*95 + 0.2*4184*22) / (90 + 836.8) = (8550 + 18409.6) / 926.8 = 26959.6 / 926.8 = 29.0889...
    const expectedT = 26959.6 / 926.8;
    expect(derived.theoreticalEquilibriumTempC).toBeCloseTo(expectedT, 3);
  });

  it('handles latent heat of fusion when ice melts in warm water', () => {
    const params: CalorimetryParams = {
      solidMaterial: 'ice',
      solidMassGrams: 50, // 0.05 kg
      solidInitialTempC: 0, // at melting point
      liquidMedium: 'water',
      liquidMassGrams: 300, // 0.3 kg
      liquidInitialTempC: 40,
      calorimeterWaterEquivalentGrams: 0,
      ambientTempC: 20,
      stirrerActive: true,
      isRealMode: false,
    };

    const derived = computeEquilibrium(params);
    // Q_melt = 0.05 * 334000 = 16700 J
    // Q_available = 0.3 * 4184 * 40 = 50208 J
    // Q_excess = 50208 - 16700 = 33508 J
    // Total water = 0.35 kg
    // T_final = 33508 / (0.35 * 4184) = 22.88145...
    const expectedT = 33508 / (0.35 * 4184);

    expect(derived.iceMeltedFraction).toBe(1.0);
    expect(derived.theoreticalEquilibriumTempC).toBeCloseTo(expectedT, 3);
  });

  it('handles partial ice melting resulting in 0°C mixture plateau', () => {
    const params: CalorimetryParams = {
      solidMaterial: 'ice',
      solidMassGrams: 150, // 0.15 kg, needs 0.15 * 334000 = 50100 J to fully melt
      solidInitialTempC: 0,
      liquidMedium: 'water',
      liquidMassGrams: 200, // 0.2 kg
      liquidInitialTempC: 25, // provides only 0.2 * 4184 * 25 = 20920 J
      calorimeterWaterEquivalentGrams: 0,
      ambientTempC: 20,
      stirrerActive: false,
      isRealMode: false,
    };

    const derived = computeEquilibrium(params);
    expect(derived.theoreticalEquilibriumTempC).toBe(0.0);
    expect(derived.iceMeltedFraction).toBeGreaterThan(0.0);
    expect(derived.iceMeltedFraction).toBeLessThan(1.0);
    expect(derived.iceMeltedFraction).toBeCloseTo(20920 / 50100, 3);
  });

  it('steps dynamic heat transfer towards analytical equilibrium', () => {
    const params: CalorimetryParams = {
      solidMaterial: 'iron',
      solidMassGrams: 150,
      solidInitialTempC: 80,
      liquidMedium: 'water',
      liquidMassGrams: 250,
      liquidInitialTempC: 20,
      calorimeterWaterEquivalentGrams: 0,
      ambientTempC: 20,
      stirrerActive: true,
      isRealMode: false,
    };

    let state = createCalorimetryModel(params);
    const targetEq = state.derived.theoreticalEquilibriumTempC;

    // Simulate for 30 seconds
    const dt = 0.1;
    for (let step = 0; step < 300; step++) {
      state = stepCalorimetryModel(state, params, dt);
    }

    // Both liquid and solid should be extremely close to theoretical equilibrium
    expect(state.liquidTempC).toBeCloseTo(targetEq, 1);
    expect(state.solidTempC).toBeCloseTo(targetEq, 1);
    expect(state.isEquilibrated).toBe(true);
  });
});
