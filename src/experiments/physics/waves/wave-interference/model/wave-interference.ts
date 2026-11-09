/**
 * Physics Model: Wave Superposition & Interference (امواج طولی و عرضی و تداخل)
 *
 * Implements:
 * 1. 2D Ripple tank interference from two coherent point sources (S1, S2):
 *    - Wavefield: y_tot(x, y, t) = A1/sqrt(r1) * sin(k*r1 - ω*t) + A2/sqrt(r2) * sin(k*r2 - ω*t + Δφ)
 *    - Spatial path difference: Δr = |r1 - r2|
 *    - Phase difference: Δφ_tot = k * Δr + Δφ0
 *    - Interference type: constructive (Δr ≈ m*λ) or destructive (Δr ≈ (m+0.5)*λ)
 *
 * 2. 1D Transverse wave superposition:
 *    - Left & right travelling harmonic waves or pulses:
 *      y1(x, t) = A1 * sin(k*x - ω*t)
 *      y2(x, t) = A2 * sin(k*x + ω*t + Δφ0)
 *      y_tot(x, t) = y1 + y2
 *    - Particle vertical displacements displaying transverse motion.
 *
 * 3. 1D Longitudinal compression wave:
 *    - Horizontal particle displacements s(x, t) = s0 * cos(k*x - ω*t)
 *    - Local density perturbation ρ(x, t) = -ρ0 * ds/dx = ρ0 * s0 * k * sin(k*x - ω*t)
 *    - Compression (تراکم) and rarefaction (انبساط) bands.
 *
 * 4. Real mode:
 *    - Medium attenuation (damping e^(-γ*r))
 *    - Probe measurement noise (transducer Gaussian noise).
 */

export type WaveMode = 'ripple2d' | 'transverse1d' | 'longitudinal1d';

export interface WaveInterferenceParams {
  mode: WaveMode;
  amplitude1: number;         // cm (e.g. 2.0)
  amplitude2: number;         // cm (e.g. 2.0)
  frequency: number;          // Hz (e.g. 1.5)
  waveSpeed: number;          // cm/s (e.g. 20.0)
  sourceSeparation: number;    // cm (distance between S1 and S2 in 2D mode, e.g. 12.0)
  phaseDifferenceDeg: number;  // degrees (0 to 360, e.g. 0)
  damping: number;            // 1/s or 1/cm (damping coefficient, e.g. 0.03 in real mode)
  realMode: boolean;
  probeX: number;             // cm (detector probe X coordinate in 2D mode)
  probeY: number;             // cm (detector probe Y coordinate in 2D mode)
}

export interface ProbeMeasurement {
  r1: number;                 // cm (distance from Source 1)
  r2: number;                 // cm (distance from Source 2)
  pathDifference: number;     // cm (Δr = |r1 - r2|)
  pathDiffInWavelengths: number; // Δr / λ
  phaseDiffDeg: number;       // total phase difference in degrees
  displacement1: number;      // cm (y1 at probe position)
  displacement2: number;      // cm (y2 at probe position)
  totalDisplacement: number;  // cm (ytot at probe position)
  resultantAmplitude: number; // cm (theoretical envelope amplitude)
  isConstructive: boolean;    // true if constructive peak
  isDestructive: boolean;     // true if near nodal line
  interferenceQuality: number;// [-1, +1] where +1 = purely constructive, -1 = purely destructive
}

export interface WaveDerivedConstants {
  wavelength: number;         // cm (λ = v / f)
  wavenumber: number;         // rad/cm (k = 2π / λ)
  angularFrequency: number;   // rad/s (ω = 2π * f)
  period: number;             // s (T = 1 / f)
}

/**
 * Calculates fundamental wave kinematic constants: λ, k, ω, T.
 */
export function calculateWaveConstants(params: WaveInterferenceParams): WaveDerivedConstants {
  const f = Math.max(0.01, params.frequency);
  const v = Math.max(0.1, params.waveSpeed);
  const wavelength = v / f;
  const wavenumber = (2 * Math.PI) / wavelength;
  const angularFrequency = 2 * Math.PI * f;
  const period = 1 / f;

  return {
    wavelength,
    wavenumber,
    angularFrequency,
    period
  };
}

/**
 * Evaluates the 2D ripple tank field y(x, y, t) at any arbitrary point (x, y).
 * Source 1 is at (-d/2, 0) and Source 2 is at (+d/2, 0).
 */
export function evaluate2DRippleField(
  x: number,
  y: number,
  t: number,
  params: WaveInterferenceParams,
  constants: WaveDerivedConstants
): { y1: number; y2: number; yTot: number; r1: number; r2: number } {
  const d = params.sourceSeparation;
  const s1x = -d / 2;
  const s1y = 0;
  const s2x = d / 2;
  const s2y = 0;

  const r1 = Math.hypot(x - s1x, y - s1y);
  const r2 = Math.hypot(x - s2x, y - s2y);

  const k = constants.wavenumber;
  const omega = constants.angularFrequency;
  const deltaPhi0 = (params.phaseDifferenceDeg * Math.PI) / 180;

  // Geometric 2D spreading factor: 1 / sqrt(r) (softened near origin to avoid singularity)
  const spread1 = 1 / Math.sqrt(Math.max(1.0, r1));
  const spread2 = 1 / Math.sqrt(Math.max(1.0, r2));

  // Medium damping attenuation
  const atten1 = params.realMode ? Math.exp(-params.damping * r1) : 1.0;
  const atten2 = params.realMode ? Math.exp(-params.damping * r2) : 1.0;

  const effAmp1 = params.amplitude1 * spread1 * atten1;
  const effAmp2 = params.amplitude2 * spread2 * atten2;

  // Wave phase: (k*r - omega*t)
  const phi1 = k * r1 - omega * t;
  const phi2 = k * r2 - omega * t + deltaPhi0;

  const y1 = effAmp1 * Math.sin(phi1);
  const y2 = effAmp2 * Math.sin(phi2);

  return {
    y1,
    y2,
    yTot: y1 + y2,
    r1,
    r2
  };
}

/**
 * Calculates high-precision probe readings at the detector location.
 */
export function calculateProbeMeasurement(
  t: number,
  params: WaveInterferenceParams,
  constants: WaveDerivedConstants
): ProbeMeasurement {
  const { y1, y2, yTot, r1, r2 } = evaluate2DRippleField(
    params.probeX,
    params.probeY,
    t,
    params,
    constants
  );

  const pathDifference = Math.abs(r1 - r2);
  const lambda = constants.wavelength;
  const pathDiffInWavelengths = lambda > 0 ? pathDifference / lambda : 0;

  const deltaPhi0 = (params.phaseDifferenceDeg * Math.PI) / 180;
  const k = constants.wavenumber;
  // Total phase difference: Δφ = k * (r2 - r1) + Δφ0
  const totalPhaseDiffRad = k * (r2 - r1) + deltaPhi0;
  const normPhaseDiffDeg = (((totalPhaseDiffRad * 180) / Math.PI) % 360 + 360) % 360;

  // Two harmonic waves with amplitudes a1 and a2 and phase difference Δφ:
  // Resultant amplitude envelope: A_res = sqrt(a1^2 + a2^2 + 2*a1*a2*cos(Δφ))
  const a1 = Math.abs(y1);
  const a2 = Math.abs(y2);
  const cosDiff = Math.cos(totalPhaseDiffRad);
  const resultantAmplitude = Math.sqrt(
    Math.max(0, a1 * a1 + a2 * a2 + 2 * a1 * a2 * cosDiff)
  );

  // Remainder to nearest integer wavelength
  const fracDiff = Math.abs(pathDiffInWavelengths - Math.round(pathDiffInWavelengths));
  const isConstructive = fracDiff < 0.15;
  const isDestructive = Math.abs(fracDiff - 0.5) < 0.15;

  return {
    r1,
    r2,
    pathDifference,
    pathDiffInWavelengths,
    phaseDiffDeg: normPhaseDiffDeg,
    displacement1: y1,
    displacement2: y2,
    totalDisplacement: yTot,
    resultantAmplitude,
    isConstructive,
    isDestructive,
    interferenceQuality: cosDiff
  };
}

/**
 * Calculates 1D transverse string displacements along x ∈ [0, L] for N particles.
 */
export function calculate1DTransverseField(
  length: number,
  particleCount: number,
  t: number,
  params: WaveInterferenceParams,
  constants: WaveDerivedConstants
): Array<{ x: number; y1: number; y2: number; yTot: number }> {
  const result: Array<{ x: number; y1: number; y2: number; yTot: number }> = [];
  const k = constants.wavenumber;
  const omega = constants.angularFrequency;
  const deltaPhi = (params.phaseDifferenceDeg * Math.PI) / 180;

  for (let i = 0; i < particleCount; i++) {
    const x = (i / (particleCount - 1)) * length;
    const atten = params.realMode ? Math.exp(-params.damping * 0.1 * x) : 1.0;

    // Wave 1 propagating to the right (+x)
    const y1 = params.amplitude1 * atten * Math.sin(k * x - omega * t);
    // Wave 2 propagating to the left (-x)
    const y2 = params.amplitude2 * atten * Math.sin(k * (length - x) - omega * t + deltaPhi);

    result.push({
      x,
      y1,
      y2,
      yTot: y1 + y2
    });
  }

  return result;
}

/**
 * Calculates 1D longitudinal wave particle positions and local density perturbations.
 */
export function calculate1DLongitudinalField(
  length: number,
  particleCount: number,
  t: number,
  params: WaveInterferenceParams,
  constants: WaveDerivedConstants
): Array<{
  equilibriumX: number;
  displacedX: number;
  displacement: number;
  densityFactor: number; // > 1 is compression, < 1 is rarefaction
}> {
  const result: Array<{
    equilibriumX: number;
    displacedX: number;
    displacement: number;
    densityFactor: number;
  }> = [];

  const k = constants.wavenumber;
  const omega = constants.angularFrequency;
  const maxDisplacement = params.amplitude1 * 0.4; // Scaled for visible coil spacing

  for (let i = 0; i < particleCount; i++) {
    const x0 = (i / (particleCount - 1)) * length;
    // Longitudinal displacement s(x, t) = s0 * cos(k*x - omega*t)
    const s = maxDisplacement * Math.cos(k * x0 - omega * t);
    const displacedX = x0 + s;

    // Gradient ds/dx = -s0 * k * sin(k*x - omega*t)
    // Relative density change: Δρ / ρ0 = -ds/dx
    const strain = -maxDisplacement * Math.min(0.5, k) * Math.sin(k * x0 - omega * t);
    const densityFactor = 1.0 - strain;

    result.push({
      equilibriumX: x0,
      displacedX,
      displacement: s,
      densityFactor: Math.max(0.2, Math.min(2.0, densityFactor))
    });
  }

  return result;
}
