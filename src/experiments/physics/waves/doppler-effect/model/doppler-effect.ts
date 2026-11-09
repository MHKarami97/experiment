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
 *    - Transonic (M = 1): Acoustic barrier / constructive coalescence at source nose.
 *    - Supersonic (M > 1): Mach cone formation with half-angle sin(μ) = v / v_s = 1 / M.
 * 4. Acoustic regions in supersonic flow:
 *    - Zone of Silence: Ahead of the Mach cone shock front where no sound has reached yet.
 *    - Shock Front / Sonic Boom: Discontinuity at the cone envelope surface.
 *    - Inside Cone: Region where sound waves have reached.
 * 5. Real mode effects:
 *    - Wind drift v_wind blowing the sound propagation medium.
 *    - Spherical spreading amplitude attenuation ~ 1 / r.
 *    - Musical pitch shift in cents: Δcents = 1200 * log2(f' / f_0).
 */

export interface DopplerParams {
  sourceSpeed: number;        // v_s (m/s), can be positive (forward) or negative
  observerSpeed: number;      // v_o (m/s)
  soundSpeed: number;         // v (m/s, default 343 m/s)
  sourceFrequency: number;    // f_0 (Hz, default 440 Hz)
  sourceY: number;            // m (y-coordinate of flight path, default 0)
  observerX: number;          // m (observer x-position, default 130 m)
  observerY: number;          // m (observer y-offset from flight path, default 35 m)
  windSpeed: number;          // m/s (horizontal wind, positive = rightward)
  realMode: boolean;
}

export type AcousticZone = 'subsonic' | 'silence' | 'sonic_boom' | 'inside_cone';

export interface DopplerDerived {
  machNumber: number;          // M = |v_s| / v
  isSupersonic: boolean;       // M >= 1
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
  observerAcousticZone: AcousticZone;
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
 * Checks whether the observer is inside, outside, or on the Mach cone boundary for supersonic motion.
 */
export function checkAcousticZone(
  sourceX: number,
  sourceY: number,
  sourceSpeed: number,
  soundSpeed: number,
  observerX: number,
  observerY: number
): AcousticZone {
  const absVs = Math.abs(sourceSpeed);
  if (absVs < soundSpeed) {
    return 'subsonic';
  }

  const mach = absVs / soundSpeed;
  const mu = Math.asin(Math.min(1.0, 1.0 / mach));

  const dir = sourceSpeed >= 0 ? 1 : -1;
  // Distance behind the source along flight path
  const dxBehind = dir * (sourceX - observerX);
  const lateralDist = Math.abs(observerY - sourceY);

  if (dxBehind < 0) {
    // Observer is ahead of the source => Zone of Silence
    return 'silence';
  }

  // Width of Mach cone at distance dxBehind
  const coneHalfWidth = dxBehind * Math.tan(mu);
  const diff = lateralDist - coneHalfWidth;

  if (Math.abs(diff) <= 8.0) {
    return 'sonic_boom';
  } else if (lateralDist < coneHalfWidth) {
    return 'inside_cone';
  } else {
    return 'silence';
  }
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
  let observedFrequency1DApp = f0;
  if (effectiveV - absVs > 0.1) {
    observedFrequency1DApp = f0 * ((effectiveV + vo) / (effectiveV - absVs));
  } else {
    // Transonic/supersonic singularity cap
    observedFrequency1DApp = f0 * 10;
  }

  // 1D Receding
  const observedFrequency1DRec = f0 * ((effectiveV - vo) / (effectiveV + absVs));

  // Determine acoustic zone
  const observerAcousticZone = checkAcousticZone(
    currentSourceX,
    sourceY,
    vs,
    effectiveV,
    observerX,
    observerY
  );

  // 2D Directional Frequency at observer position
  const dx = observerX - currentSourceX;
  const dy = observerY - sourceY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  let observedFrequency2D = f0;

  if (isSupersonic && observerAcousticZone === 'silence') {
    // In supersonic flight, ahead of Mach cone no sound has reached observer yet
    observedFrequency2D = 0;
  } else if (dist > 1e-4) {
    // Unit vector pointing from source towards observer
    const ux = dx / dist;

    // Component of source velocity along the line of sight (towards observer)
    const vsRadial = vs * ux;

    // Observer velocity along line of sight (towards source)
    const voRadialTowardsSource = -vo * ux;

    // Doppler equation: f' = f0 * (v + vo_towards) / (v - vs_towards)
    const denominator = effectiveV - vsRadial;
    if (denominator > 1.0) {
      observedFrequency2D = f0 * ((effectiveV + voRadialTowardsSource) / denominator);
    } else {
      // In supersonic / shock boundary regime inside cone
      observedFrequency2D = f0 * Math.min(10, effectiveV / Math.max(1.0, Math.abs(denominator)));
    }
  }

  // Guard limits
  if (observedFrequency2D > 0) {
    observedFrequency2D = Math.max(10, Math.min(20000, observedFrequency2D));
  }

  const dopplerFactor = observedFrequency2D > 0 ? observedFrequency2D / f0 : 0;
  const pitchShiftCents = dopplerFactor > 0 ? 1200 * Math.log2(dopplerFactor) : -9999;

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
    dopplerFactor,
    observerAcousticZone
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

  const totalEmittedCount = Math.floor(simTime / emitIntervalSec);
  const startIndex = Math.max(0, totalEmittedCount - maxWavefronts);

  for (let i = startIndex; i <= totalEmittedCount; i++) {
    const tEmit = i * emitIntervalSec;
    const age = simTime - tEmit;
    if (age < 0) continue;

    const emitX = vs * tEmit;
    const emitY = sourceY;

    const windDriftX = realMode ? windSpeed * age : 0;
    const centerX = emitX + windDriftX;
    const centerY = emitY;

    const currentRadius = v * age;

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
  coneLength: number = 420
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
