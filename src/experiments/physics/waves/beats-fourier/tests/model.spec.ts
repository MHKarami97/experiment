import { describe, it, expect } from 'vitest';
import {
  calculateBeatsDerived,
  evaluateWaveformAt,
  sampleWaveformWindow,
  computeFrequencySpectrum,
  type BeatsFourierParams
} from '../model/beats-fourier';

describe('Beats and Fourier Analysis Physics Model', () => {
  const baseParams: BeatsFourierParams = {
    mode: 'beats',
    freq1: 440,
    freq2: 444,
    amplitude1: 1.0,
    amplitude2: 1.0,
    phaseDiffDeg: 0,
    fourierHarmonicsCount: 5,
    fundamentalFreq: 220,
    noiseLevel: 0,
    realMode: false
  };

  it('1. Calculates exact beat frequency, period, and carrier frequency', () => {
    const derived = calculateBeatsDerived(baseParams);

    expect(derived.beatFrequency).toBeCloseTo(4.0, 4);
    expect(derived.beatPeriod).toBeCloseTo(0.25, 4);
    expect(derived.carrierFrequency).toBeCloseTo(442.0, 4);
    expect(derived.maxEnvelope).toBeCloseTo(2.0, 4);
    expect(derived.minEnvelope).toBeCloseTo(0.0, 4);
    expect(derived.tuningStatus).toBe('slow_beat');
  });

  it('2. Unison condition produces zero beat frequency and in_tune status', () => {
    const unisonParams: BeatsFourierParams = {
      ...baseParams,
      freq1: 440,
      freq2: 440
    };

    const derived = calculateBeatsDerived(unisonParams);
    expect(derived.beatFrequency).toBeCloseTo(0, 4);
    expect(derived.tuningStatus).toBe('in_tune');
  });

  it('3. Unequal amplitudes produce correct modulation depth and nonzero minimum envelope', () => {
    const unequalParams: BeatsFourierParams = {
      ...baseParams,
      amplitude1: 1.0,
      amplitude2: 0.6
    };

    const derived = calculateBeatsDerived(unequalParams);
    expect(derived.maxEnvelope).toBeCloseTo(1.6, 4);
    expect(derived.minEnvelope).toBeCloseTo(0.4, 4);
    // modDepth = 2 * 0.6 / 1.6 = 1.2 / 1.6 = 0.75
    expect(derived.modulationDepth).toBeCloseTo(0.75, 4);
  });

  it('4. Instantaneous waveform and envelope match analytical modulation formula', () => {
    // At t = 0: y1 = 0, y2 = 0 => yTotal = 0, env = A1 + A2 = 2.0
    const pt0 = evaluateWaveformAt(0, baseParams);
    expect(pt0.yTotal).toBeCloseTo(0, 4);
    expect(pt0.env).toBeCloseTo(2.0, 4);

    // At t = T_beat / 2 = 0.125 s: cos(2π * 4 * 0.125) = cos(π) = -1 => envelope is destructive (0.0)
    const ptNode = evaluateWaveformAt(0.125, baseParams);
    expect(ptNode.env).toBeCloseTo(0, 4);
    expect(Math.abs(ptNode.yTotal)).toBeLessThanOrEqual(1e-4);
  });

  it('5. Fourier square wave synthesis harmonics have correct odd harmonic coefficients', () => {
    const squareParams: BeatsFourierParams = {
      ...baseParams,
      mode: 'fourier_square',
      fourierHarmonicsCount: 3,
      fundamentalFreq: 220
    };

    const derived = calculateBeatsDerived(squareParams);
    expect(derived.activeHarmonics.length).toBe(3);

    // Harmonic 1: f = 220 Hz, amp = 4 / π ≈ 1.2732
    expect(derived.activeHarmonics[0].n).toBe(1);
    expect(derived.activeHarmonics[0].freq).toBeCloseTo(220, 2);
    expect(derived.activeHarmonics[0].amplitude).toBeCloseTo(4 / Math.PI, 4);

    // Harmonic 3: f = 660 Hz, amp = 4 / (3π) ≈ 0.4244
    expect(derived.activeHarmonics[1].n).toBe(3);
    expect(derived.activeHarmonics[1].freq).toBeCloseTo(660, 2);
    expect(derived.activeHarmonics[1].amplitude).toBeCloseTo(4 / (3 * Math.PI), 4);

    // Harmonic 5: f = 1100 Hz, amp = 4 / (5π) ≈ 0.2546
    expect(derived.activeHarmonics[2].n).toBe(5);
    expect(derived.activeHarmonics[2].freq).toBeCloseTo(1100, 2);
    expect(derived.activeHarmonics[2].amplitude).toBeCloseTo(4 / (5 * Math.PI), 4);
  });

  it('6. Frequency spectrum analyzer extracts discrete spectral lines', () => {
    const derived = calculateBeatsDerived(baseParams);
    const peaks = computeFrequencySpectrum(baseParams, derived);

    expect(peaks.length).toBe(2);
    expect(peaks[0].frequency).toBe(440);
    expect(peaks[0].magnitude).toBe(1.0);
    expect(peaks[1].frequency).toBe(444);
    expect(peaks[1].magnitude).toBe(1.0);

    const windowPoints = sampleWaveformWindow(0, 0.5, baseParams, 50);
    expect(windowPoints.length).toBe(50);
  });
});
