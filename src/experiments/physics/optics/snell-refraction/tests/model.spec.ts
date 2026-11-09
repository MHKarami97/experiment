import { describe, it, expect } from 'vitest';
import {
  calculateSnellAngle,
  calculateCriticalAngle,
  calculateBrewsterAngle,
  calculateFresnelCoefficients,
  calculateDispersedIndex,
  calculateSnellDerived,
  SPEED_OF_LIGHT
} from '../model/snell-refraction';

describe('Snell-Descartes Refraction Model', () => {
  it('accurately calculates refraction angle θ2 for Air to Water interface', () => {
    // Air (n1 = 1.0) to Water (n2 = 1.333) at θ1 = 30°
    const n1 = 1.0;
    const n2 = 1.333;
    const theta1Rad = (30 * Math.PI) / 180;

    const { theta2Rad, isTir } = calculateSnellAngle(n1, n2, theta1Rad);
    expect(isTir).toBe(false);
    expect(theta2Rad).not.toBeNull();

    const theta2Deg = (theta2Rad! * 180) / Math.PI;
    // Analytical: arcsin(sin(30°) / 1.333) = arcsin(0.5 / 1.333) = 22.0824°
    const analyticalDeg = (Math.asin(0.5 / 1.333) * 180) / Math.PI;

    expect(Math.abs(theta2Deg - analyticalDeg)).toBeLessThan(1e-3);
    expect(theta2Deg).toBeCloseTo(22.030, 2);
  });

  it('accurately calculates critical angle θ_c for Water to Air and Glass to Air', () => {
    // Water (n1 = 1.333) to Air (n2 = 1.0)
    const criticalWaterRad = calculateCriticalAngle(1.333, 1.0);
    expect(criticalWaterRad).not.toBeNull();
    const criticalWaterDeg = (criticalWaterRad! * 180) / Math.PI;
    // arcsin(1 / 1.333) = 48.61°
    expect(criticalWaterDeg).toBeCloseTo(48.61, 1);

    // Crown Glass (n1 = 1.5) to Air (n2 = 1.0)
    const criticalGlassRad = calculateCriticalAngle(1.5, 1.0);
    const criticalGlassDeg = (criticalGlassRad! * 180) / Math.PI;
    // arcsin(1 / 1.5) = 41.81°
    expect(criticalGlassDeg).toBeCloseTo(41.81, 1);

    // Less dense to denser medium has no critical angle
    expect(calculateCriticalAngle(1.0, 1.5)).toBeNull();
  });

  it('detects Total Internal Reflection (TIR) and enforces R = 1.0, T = 0.0', () => {
    // Glass (1.5) to Air (1.0) at θ1 = 50° (> 41.81°)
    const theta1Rad = (50 * Math.PI) / 180;
    const { theta2Rad, isTir } = calculateSnellAngle(1.5, 1.0, theta1Rad);

    expect(isTir).toBe(true);
    expect(theta2Rad).toBeNull();

    const { r, t } = calculateFresnelCoefficients(1.5, 1.0, theta1Rad, theta2Rad);
    expect(r).toBe(1.0);
    expect(t).toBe(0.0);
  });

  it('accurately calculates Brewster polarization angle θ_B', () => {
    // Air (1.0) to Glass (1.5)
    const brewsterRad = calculateBrewsterAngle(1.0, 1.5);
    const brewsterDeg = (brewsterRad * 180) / Math.PI;
    // arctan(1.5 / 1.0) = 56.3099°
    expect(brewsterDeg).toBeCloseTo(56.31, 2);
  });

  it('calculates normal incidence Fresnel reflectance R = ((n1 - n2) / (n1 + n2))²', () => {
    // Air (1.0) to Glass (1.5) at normal incidence (θ1 = 0)
    const { r, t } = calculateFresnelCoefficients(1.0, 1.5, 0, 0);
    // ((1.0 - 1.5) / (1.0 + 1.5))² = (-0.5 / 2.5)² = (-0.2)² = 0.04 (4%)
    expect(r).toBeCloseTo(0.04, 4);
    expect(t).toBeCloseTo(0.96, 4);
    expect(r + t).toBeCloseTo(1.0, 6);
  });

  it('demonstrates Cauchy dispersion with blue light refracting more than red light', () => {
    const baseN = 1.52;
    const nRed = calculateDispersedIndex(baseN, 680);   // Red (680 nm)
    const nBlue = calculateDispersedIndex(baseN, 440);  // Blue (440 nm)

    expect(nBlue).toBeGreaterThan(nRed);

    // When incident from air at 45°, higher n means smaller refraction angle (more bent)
    const theta1Rad = (45 * Math.PI) / 180;
    const angleRed = calculateSnellAngle(1.0, nRed, theta1Rad).theta2Rad!;
    const angleBlue = calculateSnellAngle(1.0, nBlue, theta1Rad).theta2Rad!;

    expect(angleBlue).toBeLessThan(angleRed);
  });

  it('correctly calculates derived parameters including light speed in media', () => {
    const derived = calculateSnellDerived({
      theta1Deg: 45,
      n1: 1.0,
      n2: 1.5,
      wavelengthNm: 532,
      geometry: 'planar',
      whiteLight: false,
      realMode: false
    });

    expect(derived.speed1).toBeCloseTo(SPEED_OF_LIGHT, 0);
    expect(derived.speed2).toBeLessThan(SPEED_OF_LIGHT);
    expect(derived.speed2).toBeGreaterThan(1.9e8);
    expect(derived.thetaReflectedDeg).toBe(45);
  });
});
