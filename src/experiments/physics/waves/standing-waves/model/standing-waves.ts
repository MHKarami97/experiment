/**
 * Physics Model: Standing Waves on a String & Air Columns (امواج ایستاده در سیم و لوله)
 *
 * Simulates:
 * 1. String fixed at both ends (Melde vibrator apparatus):
 *    - Wave speed: v = sqrt(T / μ)
 *    - Wavelength: λ_n = 2L / n
 *    - Natural resonant frequency: f_n = n * v / (2L)
 *    - Wave profile: y(x, t) = 2A * sin(k_n * x) * cos(ω * t)
 *    - Nodes at x_m = m * λ / 2, antinodes at x_m = (m + 0.5) * λ / 2
 *
 * 2. Open-Open acoustic pipe:
 *    - Displacement antinodes / pressure nodes at both ends
 *    - λ_n = 2L / n, f_n = n * v_sound / (2L) (all integer harmonics n = 1, 2, 3...)
 *    - Acoustic displacement s(x, t) = s0 * cos(k_n * x) * cos(ω * t)
 *
 * 3. Open-Closed acoustic pipe (one end closed):
 *    - Closed end (x = 0): displacement node / pressure antinode
 *    - Open end (x = L): displacement antinode / pressure node
 *    - λ_n = 4L / (2n - 1), f_n = (2n - 1) * v_sound / (4L) (odd harmonics only)
 *    - End correction in real mode: L_eff = L + 0.61 * r_pipe
 *
 * 4. Driver Resonance Response:
 *    - Amplitude response under driver frequency f:
 *      A_eff(f) = A0 / sqrt( (1 - (f / f_n)^2)^2 + (2*ζ*f / f_n)^2 )
 */

export type StandingWaveSystem = 'string' | 'open_pipe' | 'closed_pipe';

export interface StandingWaveParams {
  system: StandingWaveSystem;
  harmonicNumber: number;      // n (1, 2, 3, 4, 5...)
  length: number;              // m (0.4 to 3.0 m, default 1.2 m)
  tension: number;             // N (for string, 5 to 100 N, default 40 N)
  linearDensityGPerM: number;  // g/m (for string, 0.5 to 10 g/m, default 2.0 g/m)
  soundSpeed: number;          // m/s (for acoustic pipe, 320 to 360 m/s, default 343 m/s)
  driverFrequency?: number;    // Hz (optional external vibrator frequency)
  autoResonance: boolean;      // true if driver is locked to exact harmonic f_n
  damping: number;             // ζ damping ratio (0 to 0.08)
  realMode: boolean;
  pipeRadiusMm?: number;       // mm (pipe radius for end correction, default 25 mm)
}

export interface StandingWaveDerived {
  waveSpeed: number;           // m/s
  effectiveLength: number;     // m (with end correction in real mode)
  fundamentalFrequency: number;// Hz (f_1)
  resonantFrequency: number;   // Hz (f_n for selected harmonic)
  actualFrequency: number;     // Hz (driver frequency or f_n)
  wavelength: number;          // m (λ_n)
  wavenumber: number;          // rad/m (k_n)
  angularFrequency: number;    // rad/s (ω)
  amplitudeMultiplier: number; // resonance magnification factor Q
  nodeCount: number;           // number of displacement nodes
  antinodeCount: number;       // number of displacement antinodes
  nodePositions: number[];     // m along x ∈ [0, L]
  antinodePositions: number[]; // m along x ∈ [0, L]
}

/**
 * Calculates fundamental standing wave parameters, eigenfrequencies, and node/antinode coordinates.
 */
export function calculateStandingWaveDerived(params: StandingWaveParams): StandingWaveDerived {
  const {
    system,
    harmonicNumber: nRaw,
    length,
    tension,
    linearDensityGPerM,
    soundSpeed,
    autoResonance,
    damping: zeta,
    realMode,
    pipeRadiusMm = 25
  } = params;

  // Harmonic integer n >= 1
  const n = Math.max(1, Math.round(nRaw));

  // Determine wave speed v (m/s)
  let waveSpeed = 0;
  if (system === 'string') {
    // μ in kg/m = g/m * 1e-3
    const mu = Math.max(1e-5, linearDensityGPerM * 1e-3);
    const T = Math.max(0.1, tension);
    waveSpeed = Math.sqrt(T / mu);
  } else {
    waveSpeed = Math.max(100, soundSpeed);
  }

  // Effective acoustic length (with end correction in real mode)
  let effectiveLength = length;
  if (realMode && system !== 'string') {
    const r = (pipeRadiusMm * 1e-3);
    if (system === 'open_pipe') {
      // Both ends open: 2 * 0.61 * r
      effectiveLength = length + 2 * 0.61 * r;
    } else {
      // One end open: 0.61 * r
      effectiveLength = length + 0.61 * r;
    }
  }

  let fundamentalFrequency = 0;
  let resonantFrequency = 0;
  let wavelength = 0;
  const nodePositions: number[] = [];
  const antinodePositions: number[] = [];

  if (system === 'string') {
    // String fixed at x = 0 and x = L
    // λ_n = 2L / n
    // f_n = n * v / (2L)
    fundamentalFrequency = waveSpeed / (2 * effectiveLength);
    resonantFrequency = n * fundamentalFrequency;
    wavelength = (2 * effectiveLength) / n;

    // Nodes: x_m = m * λ / 2 = m * L / n for m = 0, 1, ..., n
    for (let m = 0; m <= n; m++) {
      nodePositions.push((m * effectiveLength) / n);
    }
    // Antinodes: x_m = (m + 0.5) * L / n for m = 0, 1, ..., n - 1
    for (let m = 0; m < n; m++) {
      antinodePositions.push(((m + 0.5) * effectiveLength) / n);
    }

  } else if (system === 'open_pipe') {
    // Open-Open pipe:
    // λ_n = 2L / n
    // f_n = n * v / (2L)
    fundamentalFrequency = waveSpeed / (2 * effectiveLength);
    resonantFrequency = n * fundamentalFrequency;
    wavelength = (2 * effectiveLength) / n;

    // Displacement antinodes at x = 0 and x = L (open ends):
    // Antinodes count = n + 1
    for (let m = 0; m <= n; m++) {
      antinodePositions.push((m * effectiveLength) / n);
    }
    // Displacement nodes in between: nodes count = n
    for (let m = 0; m < n; m++) {
      nodePositions.push(((m + 0.5) * effectiveLength) / n);
    }

  } else {
    // Open-Closed pipe (x = 0 closed, x = L open):
    // Fundamental: λ_1 = 4L
    // Odd harmonics: f_n = (2n - 1) * v / (4L)
    const harmonicOrder = 2 * n - 1; // 1, 3, 5, 7...
    fundamentalFrequency = waveSpeed / (4 * effectiveLength);
    resonantFrequency = harmonicOrder * fundamentalFrequency;
    wavelength = (4 * effectiveLength) / harmonicOrder;

    // Closed end (x = 0) is displacement node
    // Open end (x = L) is displacement antinode
    // Nodes at x = 0, λ/2, 2(λ/2)...
    // x_m = m * (λ / 2) for m = 0, 1, ..., n - 1
    for (let m = 0; m < n; m++) {
      const pos = m * (wavelength / 2);
      if (pos <= effectiveLength + 1e-4) {
        nodePositions.push(Math.min(effectiveLength, pos));
      }
    }
    // Antinodes at x = (m + 0.5) * (λ / 2)
    for (let m = 0; m < n; m++) {
      const pos = (m + 0.5) * (wavelength / 2);
      if (pos <= effectiveLength + 1e-4) {
        antinodePositions.push(Math.min(effectiveLength, pos));
      }
    }
  }

  // Determine actual driving frequency
  const actualFrequency = autoResonance || !params.driverFrequency
    ? resonantFrequency
    : params.driverFrequency;

  // Resonance amplitude response
  let amplitudeMultiplier = 1.0;
  if (!autoResonance && actualFrequency !== resonantFrequency) {
    const freqRatio = actualFrequency / Math.max(1, resonantFrequency);
    const z = Math.max(0.01, zeta);
    const denom = Math.sqrt(
      Math.pow(1 - freqRatio * freqRatio, 2) + Math.pow(2 * z * freqRatio, 2)
    );
    amplitudeMultiplier = Math.min(10.0, 1.0 / denom);
  } else {
    // Pure resonance with finite Q in real mode
    amplitudeMultiplier = realMode ? Math.min(8.0, 1.0 / (2 * Math.max(0.02, zeta))) : 5.0;
  }

  const k = (2 * Math.PI) / wavelength;
  const omega = 2 * Math.PI * actualFrequency;

  return {
    waveSpeed,
    effectiveLength,
    fundamentalFrequency,
    resonantFrequency,
    actualFrequency,
    wavelength,
    wavenumber: k,
    angularFrequency: omega,
    amplitudeMultiplier,
    nodeCount: nodePositions.length,
    antinodeCount: antinodePositions.length,
    nodePositions,
    antinodePositions
  };
}

/**
 * Calculates continuous standing wave displacement profile y(x, t) across N points.
 */
export function calculateWaveProfile(
  pointCount: number,
  t: number,
  params: StandingWaveParams,
  derived: StandingWaveDerived,
  baseAmplitudeCm: number = 3.0
): Array<{
  x: number;
  displacement: number;
  envelope: number;
  pressurePerturbation: number;
}> {
  const result: Array<{
    x: number;
    displacement: number;
    envelope: number;
    pressurePerturbation: number;
  }> = [];

  const L = derived.effectiveLength;
  const k = derived.wavenumber;
  const omega = derived.angularFrequency;
  const system = params.system;
  const amp = baseAmplitudeCm * (derived.amplitudeMultiplier / 5.0);

  // Time harmonic factor
  const timeFactor = Math.cos(omega * t);

  for (let i = 0; i < pointCount; i++) {
    const x = (i / (pointCount - 1)) * L;

    let spatialFactor = 0;
    let spatialEnvelope = 0;
    let pressureFactor = 0; // acoustic pressure ΔP ∝ -∂s/∂x

    if (system === 'string') {
      // String fixed at both ends: y = 2A * sin(k*x) * cos(ω*t)
      spatialEnvelope = Math.abs(Math.sin(k * x));
      spatialFactor = Math.sin(k * x);
      pressureFactor = 0;
    } else if (system === 'open_pipe') {
      // Open-Open pipe: displacement s = s0 * cos(k*x) * cos(ω*t)
      // Antinodes at x = 0 and x = L
      spatialEnvelope = Math.abs(Math.cos(k * x));
      spatialFactor = Math.cos(k * x);
      // Pressure: ΔP ∝ -∂s/∂x = s0 * k * sin(k*x) * cos(ω*t) (Nodes at open ends!)
      pressureFactor = Math.sin(k * x);
    } else {
      // Open-Closed pipe: closed end (x = 0) is displacement node
      // s = s0 * sin(k*x) * cos(ω*t)
      spatialEnvelope = Math.abs(Math.sin(k * x));
      spatialFactor = Math.sin(k * x);
      // Pressure: ΔP ∝ -∂s/∂x = -s0 * k * cos(k*x) (Antinode at closed end x = 0!)
      pressureFactor = -Math.cos(k * x);
    }

    const displacement = amp * spatialFactor * timeFactor;
    const envelope = amp * spatialEnvelope;
    const pressurePerturbation = amp * pressureFactor * timeFactor;

    result.push({
      x,
      displacement,
      envelope,
      pressurePerturbation
    });
  }

  return result;
}

/**
 * Generates acoustic Kundt's tube dust pile / particle simulation coordinates
 * showing particle clustering at displacement nodes.
 */
export function generateKundtParticles(
  particleCount: number,
  t: number,
  params: StandingWaveParams,
  derived: StandingWaveDerived
): Array<{
  x: number;
  y: number;
  displacement: number;
}> {
  const particles: Array<{ x: number; y: number; displacement: number }> = [];
  const L = derived.effectiveLength;
  const k = derived.wavenumber;
  const omega = derived.angularFrequency;
  const system = params.system;
  const maxDisplacement = 0.02 * L * (derived.amplitudeMultiplier / 5.0);

  // Deterministic seed for particle distribution
  for (let i = 0; i < particleCount; i++) {
    // Baseline equilibrium x0 and vertical offset y0
    const frac = i / particleCount;
    const x0 = frac * L;
    // Layered in pipe height [-0.4, 0.4]
    const y0 = ((i % 7) - 3) * 0.12;

    let sFactor = 0;
    if (system === 'open_pipe') {
      sFactor = Math.cos(k * x0);
    } else {
      sFactor = Math.sin(k * x0);
    }

    const s = maxDisplacement * sFactor * Math.cos(omega * t);

    particles.push({
      x: x0 + s,
      y: y0,
      displacement: s
    });
  }

  return particles;
}
