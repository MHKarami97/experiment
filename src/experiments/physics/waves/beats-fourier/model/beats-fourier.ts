/**
 * Physics Model: Acoustic Beats & Fourier Synthesis (ضربان صوتی و تجزیه فوریه)
 *
 * Simulates:
 * 1. Acoustic Beats (پدیده ضربان):
 *    - Superposition of two sinusoidal waves:
 *      y1(t) = A1 * sin(2π f1 t)
 *      y2(t) = A2 * sin(2π f2 t + φ)
 *      y_tot(t) = y1(t) + y2(t)
 *    - For equal amplitudes A1 = A2 = A:
 *      y_tot(t) = 2A * cos(2π * ((f1 - f2)/2) * t) * sin(2π * ((f1 + f2)/2) * t)
 *    - Beat frequency: f_beat = |f1 - f2|
 *    - Carrier frequency: f_carrier = (f1 + f2) / 2
 *    - Envelope: A_env(t) = sqrt(A1^2 + A2^2 + 2*A1*A2*cos(2π*(f1 - f2)*t - φ))
 *
 * 2. Fourier Harmonic Synthesis (سنتز هارمونیک‌های فوریه):
 *    - Square wave:     y(t) = sum_{k=1,3,5...}^{N} (4 / (π * k)) * sin(2π * k * f0 * t)
 *    - Sawtooth wave:   y(t) = sum_{k=1}^{N} (2 / (π * k)) * (-1)^(k+1) * sin(2π * k * f0 * t)
 *    - Triangle wave:   y(t) = sum_{k=1,3,5...}^{N} (8 / (π^2 * k^2)) * (-1)^((k-1)/2) * sin(2π * k * f0 * t)
 *
 * 3. Discrete Power Spectrum (FFT):
 *    - Magnitude spectrum |X(f)| showing frequency components.
 *
 * 4. Real mode effects:
 *    - Phase drift and thermal frequency jitter.
 *    - Harmonic overtone distortion.
 */

export type BeatsFourierMode = 'beats' | 'fourier_square' | 'fourier_sawtooth' | 'fourier_triangle';

export interface BeatsFourierParams {
  mode: BeatsFourierMode;
  freq1: number;             // Hz (for beats: tone 1, default 440 Hz)
  freq2: number;             // Hz (for beats: tone 2, default 444 Hz)
  amplitude1: number;        // a.u. (0.1 to 1.0, default 1.0)
  amplitude2: number;        // a.u. (0.1 to 1.0, default 1.0)
  phaseDiffDeg: number;      // degrees (0 to 360)
  fourierHarmonicsCount: number; // N (1 to 15, default 5)
  fundamentalFreq: number;   // Hz (for Fourier synthesis, default 220 Hz)
  noiseLevel: number;        // real mode noise / phase jitter
  realMode: boolean;
}

export interface BeatsFourierDerived {
  beatFrequency: number;     // Hz: |f1 - f2|
  beatPeriod: number;        // s: 1 / f_beat
  carrierFrequency: number;  // Hz: (f1 + f2) / 2
  maxEnvelope: number;       // A1 + A2
  minEnvelope: number;       // |A1 - A2|
  modulationDepth: number;   // 2 * min(A1, A2) / (A1 + A2)
  tuningStatus: 'in_tune' | 'slow_beat' | 'fast_beat' | 'roughness';
  activeHarmonics: { n: number; freq: number; amplitude: number }[];
}

export interface WaveSamplePoint {
  t: number;
  y1: number;
  y2: number;
  yTotal: number;
  envelopePos: number;
  envelopeNeg: number;
}

export interface SpectrumPeak {
  frequency: number;
  magnitude: number;
  label: string;
}

/**
 * Calculates acoustic beat properties and Fourier harmonic series coefficients.
 */
export function calculateBeatsDerived(params: BeatsFourierParams): BeatsFourierDerived {
  const {
    mode,
    freq1,
    freq2,
    amplitude1: A1,
    amplitude2: A2,
    fourierHarmonicsCount: N,
    fundamentalFreq: f0
  } = params;

  const fBeat = Math.abs(freq1 - freq2);
  const beatPeriod = fBeat > 1e-4 ? 1 / fBeat : Infinity;
  const fCarrier = (freq1 + freq2) / 2;
  const maxEnv = A1 + A2;
  const minEnv = Math.abs(A1 - A2);
  const modDepth = maxEnv > 0 ? (2 * Math.min(A1, A2)) / maxEnv : 0;

  // Tuning status description
  let tuningStatus: 'in_tune' | 'slow_beat' | 'fast_beat' | 'roughness' = 'in_tune';
  if (fBeat < 0.05) {
    tuningStatus = 'in_tune';      // Pure unmodulated unison
  } else if (fBeat <= 5.0) {
    tuningStatus = 'slow_beat';    // Clear rhythmic waxing and waning
  } else if (fBeat <= 20.0) {
    tuningStatus = 'fast_beat';    // Flutter / rapid pulsing
  } else {
    tuningStatus = 'roughness';    // Sensory dissonance / rough timbre
  }

  // Calculate active Fourier harmonics for the selected synthesis mode
  const activeHarmonics: { n: number; freq: number; amplitude: number }[] = [];

  if (mode === 'beats') {
    activeHarmonics.push({ n: 1, freq: freq1, amplitude: A1 });
    activeHarmonics.push({ n: 2, freq: freq2, amplitude: A2 });
  } else {
    const numHarmonics = Math.max(1, Math.min(15, Math.round(N)));

    for (let k = 1; k <= numHarmonics * 2; k++) {
      let amp = 0;
      if (mode === 'fourier_square') {
        if (k % 2 === 1) {
          amp = 4 / (Math.PI * k);
        }
      } else if (mode === 'fourier_sawtooth') {
        amp = (2 / (Math.PI * k)) * (k % 2 === 1 ? 1 : -1);
      } else if (mode === 'fourier_triangle') {
        if (k % 2 === 1) {
          const m = (k - 1) / 2;
          amp = (8 / (Math.PI * Math.PI * k * k)) * (m % 2 === 0 ? 1 : -1);
        }
      }

      if (Math.abs(amp) > 1e-5) {
        activeHarmonics.push({
          n: k,
          freq: k * f0,
          amplitude: Math.abs(amp)
        });
      }

      if (activeHarmonics.length >= numHarmonics) break;
    }
  }

  return {
    beatFrequency: fBeat,
    beatPeriod,
    carrierFrequency: fCarrier,
    maxEnvelope: maxEnv,
    minEnvelope: minEnv,
    modulationDepth: modDepth,
    tuningStatus,
    activeHarmonics
  };
}

/**
 * Evaluates the instantaneous value of the acoustic wave at time t.
 */
export function evaluateWaveformAt(
  t: number,
  params: BeatsFourierParams
): { y1: number; y2: number; yTotal: number; env: number } {
  const {
    mode,
    freq1,
    freq2,
    amplitude1: A1,
    amplitude2: A2,
    phaseDiffDeg,
    fourierHarmonicsCount: N,
    fundamentalFreq: f0,
    noiseLevel,
    realMode
  } = params;

  // Real mode slight phase jitter
  const jitter = realMode ? Math.sin(t * 13.7) * (noiseLevel * 0.05) : 0;
  const phi = (phaseDiffDeg * Math.PI) / 180 + jitter;

  if (mode === 'beats') {
    const y1 = A1 * Math.sin(2 * Math.PI * freq1 * t);
    const y2 = A2 * Math.sin(2 * Math.PI * freq2 * t + phi);
    const yTotal = y1 + y2;

    // Exact theoretical envelope magnitude
    const deltaOmega = 2 * Math.PI * (freq1 - freq2);
    const env = Math.sqrt(
      Math.max(0, A1 * A1 + A2 * A2 + 2 * A1 * A2 * Math.cos(deltaOmega * t - phi))
    );

    return { y1, y2, yTotal, env };
  } else {
    // Fourier Synthesis Mode
    let yTotal = 0;
    const numHarmonics = Math.max(1, Math.min(15, Math.round(N)));
    let addedCount = 0;

    for (let k = 1; addedCount < numHarmonics && k <= 30; k++) {
      let coeff = 0;
      if (mode === 'fourier_square') {
        if (k % 2 === 1) coeff = 4 / (Math.PI * k);
      } else if (mode === 'fourier_sawtooth') {
        coeff = (2 / (Math.PI * k)) * (k % 2 === 1 ? 1 : -1);
      } else if (mode === 'fourier_triangle') {
        if (k % 2 === 1) {
          const m = (k - 1) / 2;
          coeff = (8 / (Math.PI * Math.PI * k * k)) * (m % 2 === 0 ? 1 : -1);
        }
      }

      if (Math.abs(coeff) > 1e-5) {
        yTotal += coeff * Math.sin(2 * Math.PI * k * f0 * t);
        addedCount++;
      }
    }

    return { y1: yTotal, y2: 0, yTotal, env: 1.0 };
  }
}

/**
 * Samples a window of points for the time-domain oscilloscope display.
 */
export function sampleWaveformWindow(
  startTime: number,
  durationSec: number,
  params: BeatsFourierParams,
  samplesCount: number = 240
): WaveSamplePoint[] {
  const points: WaveSamplePoint[] = [];
  const dt = durationSec / Math.max(10, samplesCount - 1);

  for (let i = 0; i < samplesCount; i++) {
    const t = startTime + i * dt;
    const { y1, y2, yTotal, env } = evaluateWaveformAt(t, params);

    points.push({
      t,
      y1,
      y2,
      yTotal,
      envelopePos: env,
      envelopeNeg: -env
    });
  }

  return points;
}

/**
 * Computes discrete frequency spectrum peaks for display in the spectral analyzer.
 */
export function computeFrequencySpectrum(
  params: BeatsFourierParams,
  derived: BeatsFourierDerived
): SpectrumPeak[] {
  const peaks: SpectrumPeak[] = [];

  if (params.mode === 'beats') {
    peaks.push({
      frequency: params.freq1,
      magnitude: params.amplitude1,
      label: `f₁ (${params.freq1.toFixed(1)} Hz)`
    });
    peaks.push({
      frequency: params.freq2,
      magnitude: params.amplitude2,
      label: `f₂ (${params.freq2.toFixed(1)} Hz)`
    });
  } else {
    for (let i = 0; i < derived.activeHarmonics.length; i++) {
      const h = derived.activeHarmonics[i];
      peaks.push({
        frequency: h.freq,
        magnitude: h.amplitude,
        label: `n=${h.n} (${h.freq.toFixed(0)} Hz)`
      });
    }
  }

  return peaks.sort((a, b) => a.frequency - b.frequency);
}
