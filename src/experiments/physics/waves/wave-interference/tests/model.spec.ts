import { describe, it, expect } from 'vitest';
import {
  calculateWaveConstants,
  evaluate2DRippleField,
  calculateProbeMeasurement,
  calculate1DTransverseField,
  calculate1DLongitudinalField,
  WaveInterferenceParams
} from '../model/wave-interference';

describe('Wave Superposition & Interference Model', () => {
  it('correctly calculates fundamental wave constants (λ = v/f, k, ω, T)', () => {
    const params: WaveInterferenceParams = {
      mode: 'ripple2d',
      amplitude1: 2.0,
      amplitude2: 2.0,
      frequency: 2.0, // 2 Hz
      waveSpeed: 20.0, // 20 cm/s
      sourceSeparation: 10.0,
      phaseDifferenceDeg: 0,
      damping: 0,
      realMode: false,
      probeX: 0,
      probeY: 10
    };

    const c = calculateWaveConstants(params);

    // λ = 20 / 2 = 10 cm
    expect(c.wavelength).toBeCloseTo(10.0, 4);
    // k = 2π / 10 = 0.6283 rad/cm
    expect(c.wavenumber).toBeCloseTo((2 * Math.PI) / 10, 4);
    // ω = 2π * 2 = 12.566 rad/s
    expect(c.angularFrequency).toBeCloseTo(4 * Math.PI, 4);
    // T = 1 / 2 = 0.5 s
    expect(c.period).toBeCloseTo(0.5, 4);
  });

  it('demonstrates constructive interference on the central perpendicular bisector for in-phase sources', () => {
    const params: WaveInterferenceParams = {
      mode: 'ripple2d',
      amplitude1: 2.0,
      amplitude2: 2.0,
      frequency: 2.0,
      waveSpeed: 20.0, // λ = 10 cm
      sourceSeparation: 12.0, // S1 at (-6, 0), S2 at (+6, 0)
      phaseDifferenceDeg: 0,
      damping: 0,
      realMode: false,
      probeX: 0, // Central bisector x = 0
      probeY: 8.0 // (0, 8)
    };

    const c = calculateWaveConstants(params);
    const probe = calculateProbeMeasurement(0, params, c);

    // On x = 0, distance to S1 and S2 is identical: r1 = r2 = sqrt(6^2 + 8^2) = 10 cm
    expect(probe.r1).toBeCloseTo(10.0, 3);
    expect(probe.r2).toBeCloseTo(10.0, 3);
    expect(probe.pathDifference).toBeCloseTo(0.0, 4);
    expect(probe.pathDiffInWavelengths).toBeCloseTo(0.0, 4);
    expect(probe.isConstructive).toBe(true);
    expect(probe.isDestructive).toBe(false);
    expect(probe.interferenceQuality).toBeCloseTo(1.0, 3); // cos(0) = 1
  });

  it('demonstrates complete destructive interference along central line when sources are 180° out-of-phase', () => {
    const params: WaveInterferenceParams = {
      mode: 'ripple2d',
      amplitude1: 2.0,
      amplitude2: 2.0,
      frequency: 2.0,
      waveSpeed: 20.0,
      sourceSeparation: 12.0,
      phaseDifferenceDeg: 180, // Out of phase
      damping: 0,
      realMode: false,
      probeX: 0,
      probeY: 10.0
    };

    const c = calculateWaveConstants(params);

    // Check multiple time instances along the central line: total displacement should be identically 0
    const times = [0, 0.1, 0.25, 0.35, 0.5];
    for (const t of times) {
      const field = evaluate2DRippleField(0, 10.0, t, params, c);
      expect(Math.abs(field.yTot)).toBeLessThan(1e-4);
      expect(field.y1).toBeCloseTo(-field.y2, 4);
    }

    const probe = calculateProbeMeasurement(0, params, c);
    expect(probe.interferenceQuality).toBeCloseTo(-1.0, 3); // cos(180°) = -1
  });

  it('identifies constructive (m*λ) and destructive ((m+0.5)*λ) path difference points', () => {
    const params: WaveInterferenceParams = {
      mode: 'ripple2d',
      amplitude1: 2.0,
      amplitude2: 2.0,
      frequency: 2.0,
      waveSpeed: 20.0, // λ = 10 cm
      sourceSeparation: 16.0, // S1 at (-8, 0), S2 at (8, 0)
      phaseDifferenceDeg: 0,
      damping: 0,
      realMode: false,
      probeX: 0,
      probeY: 0
    };

    const c = calculateWaveConstants(params);

    // Case A: Test point with Δr = 10 cm = 1.0 * λ (Constructive)
    // S1 at (-8, 0), S2 at (8, 0).
    // On the x-axis to the right: at x = 12.5 cm, y = 0:
    // r1 = 12.5 - (-8) = 20.5 cm
    // r2 = 12.5 - 8 = 4.5 cm
    // Δr = 20.5 - 4.5 = 16.0 cm = 1.6 λ (not integer)
    // Let's set probe directly to an analytical constructive point:
    // At x = 0: Δr = 0 (Constructive)
    const probeCenter = calculateProbeMeasurement(0, { ...params, probeX: 0, probeY: 15 }, c);
    expect(probeCenter.isConstructive).toBe(true);

    // Case B: At a point where Δr ≈ 0.5 λ = 5 cm (Destructive)
    // Hyperbola with focus at (-8, 0) and (8, 0) with |r1 - r2| = 5 cm:
    // When y = 0, between the sources, r1 + r2 = 16.
    // r1 - r2 = 5 => 2*r1 = 21 => r1 = 10.5, r2 = 5.5.
    // x = r1 - 8 = 10.5 - 8 = 2.5 cm.
    const probeNodal = calculateProbeMeasurement(0, { ...params, probeX: 2.5, probeY: 0 }, c);
    expect(probeNodal.r1 - probeNodal.r2).toBeCloseTo(5.0, 3);
    expect(probeNodal.pathDiffInWavelengths).toBeCloseTo(0.5, 3);
    expect(probeNodal.isDestructive).toBe(true);
  });

  it('verifies linear superposition principle in 1D transverse wave propagation', () => {
    const params: WaveInterferenceParams = {
      mode: 'transverse1d',
      amplitude1: 3.0,
      amplitude2: 2.0,
      frequency: 1.5,
      waveSpeed: 30.0,
      sourceSeparation: 10.0,
      phaseDifferenceDeg: 45,
      damping: 0,
      realMode: false,
      probeX: 0,
      probeY: 0
    };

    const c = calculateWaveConstants(params);
    const particles = calculate1DTransverseField(100, 30, 0.4, params, c);

    expect(particles.length).toBe(30);
    for (const pt of particles) {
      expect(pt.yTot).toBeCloseTo(pt.y1 + pt.y2, 5);
      expect(Number.isFinite(pt.yTot)).toBe(true);
    }
  });

  it('models 1D longitudinal waves with continuous particle displacements and density peaks', () => {
    const params: WaveInterferenceParams = {
      mode: 'longitudinal1d',
      amplitude1: 2.5,
      amplitude2: 2.5,
      frequency: 1.0,
      waveSpeed: 20.0,
      sourceSeparation: 10.0,
      phaseDifferenceDeg: 0,
      damping: 0,
      realMode: false,
      probeX: 0,
      probeY: 0
    };

    const c = calculateWaveConstants(params);
    const particles = calculate1DLongitudinalField(80, 40, 0.2, params, c);

    expect(particles.length).toBe(40);
    let hasCompression = false;
    let hasRarefaction = false;

    for (const p of particles) {
      expect(Number.isFinite(p.displacedX)).toBe(true);
      expect(Number.isFinite(p.densityFactor)).toBe(true);
      if (p.densityFactor > 1.05) hasCompression = true;
      if (p.densityFactor < 0.95) hasRarefaction = true;
    }

    expect(hasCompression).toBe(true);
    expect(hasRarefaction).toBe(true);
  });
});
