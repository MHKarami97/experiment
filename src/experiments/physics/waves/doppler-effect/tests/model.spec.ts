import { describe, it, expect } from 'vitest';
import {
  calculateDopplerDerived,
  generateWavefronts,
  calculateMachLines,
  type DopplerParams
} from '../model/doppler-effect';

describe('Doppler Effect Physics Model', () => {
  const baseParams: DopplerParams = {
    sourceSpeed: 0,
    observerSpeed: 0,
    soundSpeed: 340,
    sourceFrequency: 500,
    sourceY: 0,
    observerX: 100,
    observerY: 0,
    windSpeed: 0,
    realMode: false
  };

  it('1. Stationary source and observer produces nominal frequency and isotropic wavelength', () => {
    const derived = calculateDopplerDerived(baseParams, 0);

    expect(derived.machNumber).toBeCloseTo(0, 4);
    expect(derived.isSupersonic).toBe(false);
    expect(derived.observedFrequency1DApp).toBeCloseTo(500, 3);
    expect(derived.observedFrequency1DRec).toBeCloseTo(500, 3);
    expect(derived.observedFrequency2D).toBeCloseTo(500, 3);
    expect(derived.wavelengthAhead).toBeCloseTo(340 / 500, 4);
    expect(derived.wavelengthBehind).toBeCloseTo(340 / 500, 4);
    expect(derived.pitchShiftCents).toBeCloseTo(0, 2);
  });

  it('2. Subsonic moving source compresses wavelength ahead and increases approaching frequency', () => {
    const params: DopplerParams = {
      ...baseParams,
      sourceSpeed: 68 // M = 68 / 340 = 0.2
    };

    const derived = calculateDopplerDerived(params, 0);

    // Analytical: f_app = 500 * 340 / (340 - 68) = 500 * 340 / 272 = 625 Hz
    const expectedF = 500 * (340 / (340 - 68));
    expect(derived.observedFrequency1DApp).toBeCloseTo(expectedF, 3);
    expect(derived.observedFrequency1DApp).toBeCloseTo(625, 1);

    // Wavelength ahead: (340 - 68) / 500 = 272 / 500 = 0.544 m
    expect(derived.wavelengthAhead).toBeCloseTo(0.544, 4);

    // Receding: f_rec = 500 * 340 / (340 + 68) = 500 * 340 / 408 = 416.67 Hz
    const expectedRec = 500 * (340 / (340 + 68));
    expect(derived.observedFrequency1DRec).toBeCloseTo(expectedRec, 2);
  });

  it('3. Moving observer towards stationary source increases frequency linearly', () => {
    const params: DopplerParams = {
      ...baseParams,
      sourceSpeed: 0,
      observerSpeed: 34 // v_o = 34 m/s
    };

    const derived = calculateDopplerDerived(params, 0);

    // Analytical: f' = 500 * (340 + 34) / 340 = 500 * 1.1 = 550 Hz
    expect(derived.observedFrequency1DApp).toBeCloseTo(550, 3);
  });

  it('4. Supersonic motion (M > 1) forms Mach cone with exact theoretical angle', () => {
    const params: DopplerParams = {
      ...baseParams,
      sourceSpeed: 680, // M = 680 / 340 = 2.0
      soundSpeed: 340
    };

    const derived = calculateDopplerDerived(params, 0);

    expect(derived.machNumber).toBeCloseTo(2.0, 4);
    expect(derived.isSupersonic).toBe(true);

    // Mach angle: sin(mu) = 1 / 2 => mu = 30 degrees = pi / 6 rad
    expect(derived.machAngleDeg).toBeCloseTo(30, 2);
    expect(derived.machAngleRad).toBeCloseTo(Math.PI / 6, 4);

    const machLines = calculateMachLines(100, 0, 680, 340, 200);
    expect(machLines.length).toBe(2);
    // tan(30 deg) * 200 = (1 / sqrt(3)) * 200 = 115.47
    expect(Math.abs(machLines[0].y2)).toBeCloseTo(200 * Math.tan(Math.PI / 6), 2);
  });

  it('5. 2D directional frequency evaluates correctly for off-axis observer', () => {
    const params: DopplerParams = {
      ...baseParams,
      sourceSpeed: 100,
      observerX: 0,
      observerY: 50 // perpendicular when source is at x=0
    };

    // When source is directly abreast of observer (x_s = 0, x_o = 0):
    // Line of sight is purely along y-axis (perpendicular to horizontal velocity).
    // Radial velocity component is 0 => classical Doppler shift is 0 (f' = f_0).
    const derived = calculateDopplerDerived(params, 0);
    expect(derived.observedFrequency2D).toBeCloseTo(500, 1);
  });

  it('6. Wavefront emission and real-mode wind drift shift center coordinates', () => {
    const simTime = 1.0;
    const params: DopplerParams = {
      ...baseParams,
      sourceSpeed: 50,
      windSpeed: 20,
      realMode: true
    };

    const wavefronts = generateWavefronts(simTime, params, 0.2, 10);
    expect(wavefronts.length).toBeGreaterThan(0);

    // For wavefront emitted at t=0.4: age = 0.6 s
    const wf = wavefronts.find(w => Math.abs(w.emitTime - 0.4) < 1e-4);
    expect(wf).toBeDefined();
    if (wf) {
      // Wind drifts center by windSpeed * age = 20 * 0.6 = 12 m
      // Emit position was vs * tEmit = 50 * 0.4 = 20 m
      expect(wf.emitX).toBeCloseTo(20, 2);
      expect(wf.centerX).toBeCloseTo(20 + 12, 2);
    }
  });
});
