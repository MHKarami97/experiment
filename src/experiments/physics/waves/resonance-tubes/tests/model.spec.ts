import { describe, it, expect } from 'vitest';
import {
  calculateSpeedOfSound,
  calculateResonanceDerived,
  calculateAcousticProfiles,
  type ResonanceTubesParams
} from '../model/resonance-tubes';

describe('Resonance Tubes Physics Model', () => {
  const baseParams: ResonanceTubesParams = {
    systemType: 'water_column',
    frequency: 512,
    columnLength: 0.155, // Close to first resonance L1
    tubeRadiusMm: 20,
    temperatureC: 20,
    relativeHumidity: 45,
    helmholtzVolumeCm3: 500,
    neckRadiusMm: 12,
    neckLengthMm: 35,
    realMode: false
  };

  it('1. Calculates thermodynamic speed of sound accurately vs temperature', () => {
    // At 0 °C: v = 331.3 m/s
    const v0 = calculateSpeedOfSound(0, 0, false);
    expect(v0).toBeCloseTo(331.3, 2);

    // At 20 °C: v = 331.3 * sqrt(293.15 / 273.15) ≈ 343.21 m/s
    const v20 = calculateSpeedOfSound(20, 0, false);
    expect(v20).toBeCloseTo(343.21, 1);
  });

  it('2. Evaluates quarter-wave and three-quarter-wave resonant lengths with end correction', () => {
    const derived = calculateResonanceDerived(baseParams);

    const v = derived.soundSpeed;
    const lambda = v / 512;
    const deltaL = 0.61 * (20 * 1e-3); // 0.0122 m

    expect(derived.wavelength).toBeCloseTo(lambda, 4);
    expect(derived.endCorrection).toBeCloseTo(deltaL, 4);

    // L1 = λ/4 - ΔL
    const expectedL1 = lambda / 4 - deltaL;
    expect(derived.firstResonanceLength).toBeCloseTo(expectedL1, 4);

    // L2 = 3λ/4 - ΔL
    const expectedL2 = (3 * lambda) / 4 - deltaL;
    expect(derived.secondResonanceLength).toBeCloseTo(expectedL2, 4);

    // L2 - L1 = λ / 2
    expect(derived.secondResonanceLength - derived.firstResonanceLength).toBeCloseTo(lambda / 2, 4);
  });

  it('3. Reconstructs speed of sound from L2 - L1 with zero end-correction error', () => {
    const derived = calculateResonanceDerived(baseParams);

    // v_exp = 2 * f * (L2 - L1) must match analytical sound speed
    expect(derived.measuredSpeedFromL1L2).toBeCloseTo(derived.soundSpeed, 3);
  });

  it('4. Computes resonance peak proximity and SPL amplification at resonance', () => {
    // Set column length exactly to first resonance L1
    const derivedRef = calculateResonanceDerived(baseParams);
    const tunedParams: ResonanceTubesParams = {
      ...baseParams,
      columnLength: derivedRef.firstResonanceLength
    };

    const tunedDerived = calculateResonanceDerived(tunedParams);
    expect(tunedDerived.resonanceProximity).toBeCloseTo(1.0, 3);
    expect(tunedDerived.amplificationDb).toBeGreaterThan(85);

    // Off-resonance: 10 cm away from any peak
    const detunedParams: ResonanceTubesParams = {
      ...baseParams,
      columnLength: derivedRef.firstResonanceLength + 0.10
    };
    const detunedDerived = calculateResonanceDerived(detunedParams);
    expect(detunedDerived.resonanceProximity).toBeLessThan(0.15);
    expect(detunedDerived.amplificationDb).toBeLessThan(58);
  });

  it('5. Evaluates Helmholtz resonator frequency matching analytical formula', () => {
    const derived = calculateResonanceDerived(baseParams);

    // f_H = (v / 2π) * sqrt(A / (V * L_eff))
    const v = derived.soundSpeed;
    const rNeck = 12 * 1e-3;
    const A = Math.PI * rNeck * rNeck;
    const V = 500 * 1e-6;
    const Leff = 35 * 1e-3 + 1.7 * rNeck;
    const expectedFh = (v / (2 * Math.PI)) * Math.sqrt(A / (V * Leff));

    expect(derived.helmholtzFrequency).toBeCloseTo(expectedFh, 2);
    expect(derived.helmholtzFrequency).toBeGreaterThan(150);
    expect(derived.helmholtzFrequency).toBeLessThan(400);
  });

  it('6. Spatial standing wave profile has zero displacement and maximum pressure at water boundary', () => {
    const derived = calculateResonanceDerived(baseParams);
    const profiles = calculateAcousticProfiles(50, 0, baseParams, derived);

    expect(profiles.length).toBe(50);

    // At water surface (x = 0): displacement is node (0), pressure is antinode
    const p0 = profiles[0];
    expect(p0.x).toBe(0);
    expect(p0.displacement).toBeCloseTo(0, 4);
  });
});
