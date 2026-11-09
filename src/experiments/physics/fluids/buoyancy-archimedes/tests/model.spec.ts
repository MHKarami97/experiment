import { describe, it, expect } from 'vitest';
import {
  createBuoyancyModel,
  stepBuoyancyModel,
  getMaterialDensity,
  getFluidDensity,
  computeTheoreticalSubmergedFraction,
  computeBuoyantForce,
  computeApparentWeight,
  type BuoyancyParams,
} from '../model/buoyancy';

describe('Buoyancy & Archimedes Principle Physics Model', () => {
  it('strictly validates Archimedes floating fraction (rho_block / rho_fluid) within 1e-4', () => {
    // Pine wood (600 kg/m^3) in pure water (1000 kg/m^3) => exactly 0.60 (60% submerged)
    const rhoWood = getMaterialDensity('wood-pine', 600);
    const rhoWater = getFluidDensity('water');
    const fractionWood = computeTheoreticalSubmergedFraction(rhoWood, rhoWater);

    expect(fractionWood).toBeCloseTo(0.60, 4);

    // Ice (917 kg/m^3) in water => 0.917 (91.7% submerged iceberg)
    const rhoIce = getMaterialDensity('ice', 917);
    const fractionIce = computeTheoreticalSubmergedFraction(rhoIce, rhoWater);
    expect(fractionIce).toBeCloseTo(0.917, 3);
  });

  it('validates buoyant force equals weight of displaced fluid within 1e-4', () => {
    const rhoFluid = 1000; // kg/m^3
    const vSub = 0.002; // 2 Liters = 0.002 m^3
    const g = 9.80665; // m/s^2

    const fb = computeBuoyantForce(rhoFluid, vSub, g);
    const expectedFb = 1000 * 0.002 * 9.80665; // 19.6133 N

    expect(fb).toBeCloseTo(expectedFb, 4);
  });

  it('verifies apparent weight reduction for submerged aluminum in water', () => {
    const params: BuoyancyParams = {
      material: 'aluminum', // 2700 kg/m^3
      customBlockDensity: 2700,
      fluidType: 'water', // 1000 kg/m^3
      blockVolume: 0.001, // 1 Liter
      blockCrossSection: 0.01,
      gravity: 9.80665,
      fluidViscosity: 0.001,
      sensorNoiseLevel: 0,
      isRealMode: false,
      tetherAttached: true,
      suspensionHeight: -0.15, // fully submerged
    };

    const state = createBuoyancyModel(params);
    const expectedMass = 2700 * 0.001; // 2.7 kg
    const expectedWeight = expectedMass * 9.80665; // 26.477955 N
    const expectedFb = 1000 * 0.001 * 9.80665; // 9.80665 N
    const expectedAppWeight = expectedWeight - expectedFb; // 16.6713 N

    expect(state.weight).toBeCloseTo(expectedWeight, 3);
    expect(state.buoyantForce).toBeCloseTo(expectedFb, 3);
    expect(state.apparentWeight).toBeCloseTo(expectedAppWeight, 3);
    expect(computeApparentWeight(state.weight, state.buoyantForce)).toBeCloseTo(expectedAppWeight, 3);
  });

  it('proves that heavy iron floats on liquid mercury (Archimedes density contrast)', () => {
    const rhoIron = getMaterialDensity('iron', 7870); // 7870 kg/m^3
    const rhoMercury = getFluidDensity('mercury'); // 13600 kg/m^3
    const fraction = computeTheoreticalSubmergedFraction(rhoIron, rhoMercury);

    // fraction = 7870 / 13600 = 0.578676...
    expect(fraction).toBeLessThan(1.0); // Floats!
    expect(fraction).toBeCloseTo(7870 / 13600, 4);
  });

  it('steps dynamic vertical bobbing oscillation and records time', () => {
    const params: BuoyancyParams = {
      material: 'wood-pine',
      customBlockDensity: 600,
      fluidType: 'water',
      blockVolume: 0.001,
      blockCrossSection: 0.01,
      gravity: 9.80665,
      fluidViscosity: 0.05,
      sensorNoiseLevel: 0.1,
      isRealMode: true,
      tetherAttached: false,
      suspensionHeight: 0,
    };

    const state0 = createBuoyancyModel(params);
    const state1 = stepBuoyancyModel(state0, params, 0.02);

    expect(state1.t).toBeCloseTo(0.02, 4);
    expect(state1.isFloating).toBe(true);
    expect(state1.submergedFraction).toBeCloseTo(0.60, 2);
  });
});
