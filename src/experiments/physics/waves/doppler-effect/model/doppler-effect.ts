/**
 * Physics Model: Doppler Effect & Sonic Shock Waves (اثر دوپلر صوتی و مخروط ماخ)
 *
 * Simulates:
 * 1. Sound wave emission from a stationary or moving acoustic source.
 * 2. 1D & 2D Doppler pitch shift:
 *    - 1D Approaching: f' = f_0 * (v + v_o) / (v - v_s)
 *    - 1D Receding:    f' = f_0 * (v - v_o) / (v + v_s)
 *    - 2D Directional: f' = f_0 * (v - v_o * cos(theta_o)) / (v - v_s * cos(theta_s))
 * 3. Aerodynamic regimes:
 *    - Subsonic (M < 1): Wavefront compression ahead, expansion behind.
 *    - Transonic (M = 1): Acoustic barrier / constructive coalescence.
 *    - Supersonic (M > 1): Mach cone formation with half-angle sin(μ) = v / v_s = 1 / M.
 * 4. Real mode effects:
 *    - Wind drift v_wind blowing the sound propagation medium.
 *    - Spherical spreading amplitude attenuation ~ 1 / r.
 *    - Musical pitch shift in cents: Δcents = 1200 * log2(f' / f_0).
 */

export interface DopplerParams {
  sourceSpeed: number;        // v_s (m/s), can be positive (forward) or negative
  observerSpeed: number;      // v_o (m/s)
  soundSpeed: number;         // v (m/s, default 343 m/s)
  sourceFrequency: number;    // f_0 (Hz, default 500 Hz)
  sourceY: number;            // m (y-coordinate of source trajectory, default 0)
  observerX: number;          // m (observer x-position, default 150 m)
  observerY: number;          // m (observer y-offset from flight path, default 60 m)
  windSpeed: number;          // m/s (horizontal wind, positive = rightward)
  realMode: boolean;
}

export interface DopplerDerived {
  machNumber: number;          // M = |v_s| / v
  isSupersonic: boolean;       // M > 1
  isSonicBarrier: boolean;     // |M - 1| < 0.03
  machAngleRad: number;        // μ = arcsin(1 / M) if M >= 1, else 0
  machAngleDeg: number;        // μ in degrees
  observedFrequency1DApp: number; // Hz (head-on approaching)
  observedFrequency1DRec: number; // Hz (receding behind)
  observedFrequency2D: number;    // Hz (at current probe coordinates)
  wavelengthAhead: number;     // m (subsonic ahead)
  wavelengthBehind: number;    // m (subsonic behind)
  pitchShiftCents: number;     // musical cents difference at observer
  dopplerFactor: number;       // f' / f_0
}

export interface EmittedWavefront {
  id: number;
  emitTime: number;
  emitX: number;
  emitY: number;
  currentRadius: number;
  centerX: number;             // with wind drift in real mode
  centerY: number;
  amplitude: number;           // attenuation with age and distance
}

/**
 * Calculates instantaneous Doppler derived quantities, Mach cone properties, and observed frequencies.
 */
export function calculateDopplerDerived(
  params: DopplerParams,
  currentSourceX: number = 0
): DopplerDerived {
  const {
    sourceSpeed: vs,
    observerSpeed: vo,
    soundSpeed: vRaw,
    sourceFrequency: f0,
    observerX,
    observerY,
    sourceY,
    windSpeed = 0,
    realMode
  } = params;

  const v = Math.max(100, vRaw);
  const effectiveV = realMode ? v + windSpeed * 0.2 : v;

  const absVs = Math.abs(vs);
  const machNumber = absVs / effectiveV;
  const isSonicBarrier = Math.abs(machNumber - 1) < 0.03;
  const isSupersonic = machNumber >= 1.0;

  // Mach cone half-angle
  let machAngleRad = 0;
  if (machNumber >= 1.0) {
    machAngleRad = Math.asin(Math.min(1.0, 1.0 / machNumber));
  }
  const machAngleDeg = (machAngleRad * 180) / Math.PI;

  // Subsonic wavelengths
  const lambdaAhead = machNumber < 1.0 ? Math.max(0.01, (effectiveV - absVs) / f0) : 0;
  const lambdaBehind = (effectiveV + absVs) / f0;

  // 1D Head-on Approaching: source moving towards stationary observer (or moving observer)
  // f' = f0 * (v + vo) / (v - vs)
  let observedFrequency1DApp = f0;
  if (effectiveV - absVs > 0.1) {
    observedFrequency1DApp = f0 * ((effectiveV + vo) / (effectiveV - absVs));
  } else {
    // Transonic/supersonic singularity cap
    observedFrequency1DApp = f0 * 10;
  }

  // 1D Receding
  const observedFrequency1DRec = f0 * ((effectiveV - vo) / (effectiveV + absVs));

  // 2D Directional Frequency at observer position
  // Line of sight vector from source to observer:
  const dx = observerX - currentSourceX;
  const dy = observerY - sourceY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  let observedFrequency2D = f0;
  if (dist > 1e-4) {
    // Unit vector pointing from source towards observer
    const ux = dx / dist;

    // Component of source velocity along the line of sight (towards observer)
    // Source velocity is (vs, 0)
    const vsRadial = vs * ux;

    // Observer velocity is (vo, 0)
    // Component of observer velocity along line of sight (towards source):
    // Since unit vector points from source to observer, motion towards source is in -u direction
    const voRadialTowardsSource = -vo * ux;

    // Standard Doppler formula: f' = f0 * (v + vo_towards) / (v - vs_towards)
    const denominator = effectiveV - vsRadial;
    if (denominator > 1.0) {
      observedFrequency2D = f0 * ((effectiveV + voRadialTowardsSource) / denominator);
    } else {
      // Supersonic / shock front regime
      observedFrequency2D = f0 * Math.min(15, effectiveV / Math.max(0.5, Math.abs(denominator)));
    }
  }

  // Guard limits
  observedFrequency2D = Math.max(10, Math.min(20000, observedFrequency2D));

  const dopplerFactor = observedFrequency2D / f0;
  const pitchShiftCents = 1200 * Math.log2(Math.max(0.001, dopplerFactor));

  return {
    machNumber,
    isSupersonic,
    isSonicBarrier,
    machAngleRad,
    machAngleDeg,
    observedFrequency1DApp,
    observedFrequency1DRec,
    observedFrequency2D,
    wavelengthAhead: lambdaAhead,
    wavelengthBehind: lambdaBehind,
    pitchShiftCents,
    dopplerFactor
  };
}

/**
 * Generates expanding circular wavefronts emitted by the moving source over time.
 */
export function generateWavefronts(
  simTime: number,
  params: DopplerParams,
  emitIntervalSec: number = 0.22,
  maxWavefronts: number = 32
): EmittedWavefront[] {
  const {
    sourceSpeed: vs,
    soundSpeed: v,
    sourceY,
    windSpeed = 0,
    realMode
  } = params;

  const wavefronts: EmittedWavefront[] = [];

  // Determine how many wavefronts could have been emitted up to simTime
  const totalEmittedCount = Math.floor(simTime / emitIntervalSec);
  const startIndex = Math.max(0, totalEmittedCount - maxWavefronts);

  for (let i = startIndex; i <= totalEmittedCount; i++) {
    const tEmit = i * emitIntervalSec;
    const age = simTime - tEmit;
    if (age < 0) continue;

    // Source position at emission time:
    const emitX = vs * tEmit;
    const emitY = sourceY;

    // In real mode, horizontal wind drifts the wave center:
    const windDriftX = realMode ? windSpeed * age : 0;
    const centerX = emitX + windDriftX;
    const centerY = emitY;

    const currentRadius = v * age;

    // Attenuation with age/radius:
    const maxRadius = v * (maxWavefronts * emitIntervalSec);
    const lifeRatio = Math.max(0, 1 - currentRadius / maxRadius);
    const amplitude = realMode
      ? Math.max(0.05, Math.pow(lifeRatio, 1.4) * (1 / (1 + currentRadius * 0.005)))
      : lifeRatio;

    wavefronts.push({
      id: i,
      emitTime: tEmit,
      emitX,
      emitY,
      currentRadius,
      centerX,
      centerY,
      amplitude
    });
  }

  return wavefronts;
}

/**
 * Computes Mach Cone envelope lines for supersonic motion (M > 1).
 */
export function calculateMachLines(
  sourceX: number,
  sourceY: number,
  sourceSpeed: number,
  soundSpeed: number,
  coneLength: number = 400
): { x1: number; y1: number; x2: number; y2: number }[] {
  const absVs = Math.abs(sourceSpeed);
  if (absVs <= soundSpeed) return [];

  const mach = absVs / soundSpeed;
  const mu = Math.asin(1 / mach); // Mach cone half-angle

  const direction = sourceSpeed >= 0 ? 1 : -1;
  const trailX = sourceX - direction * coneLength;

  // Tan(mu) gives half-width at distance dx = coneLength
  const halfH = coneLength * Math.tan(mu);

  return [
    // Top shock boundary
    { x1: sourceX, y1: sourceY, x2: trailX, y2: sourceY - halfH },
    // Bottom shock boundary
    { x1: sourceX, y1: sourceY, x2: trailX, y2: sourceY + halfH }
  ];
}
