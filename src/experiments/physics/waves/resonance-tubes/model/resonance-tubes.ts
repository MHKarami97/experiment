/**
 * Physics Model: Resonance Tubes & Acoustic Cavities (لوله‌های صوتی و اندازه‌گیری تندی صوت)
 *
 * Simulates:
 * 1. Water-Column Resonance Tube (Closed-Pipe Acoustic System):
 *    - Water surface acts as an acoustic hard closed boundary (displacement node, pressure antinode).
 *    - Open mouth acts as an acoustic soft boundary (displacement antinode, pressure node).
 *    - Resonant air column lengths:
 *        L_n + ΔL = (2n - 1) * (λ / 4)   (n = 1, 2, 3...)
 *        where ΔL = 0.61 * r_tube is the acoustic end correction.
 *    - Successive resonance difference eliminates end correction:
 *        L_(n+1) - L_n = λ / 2  =>  λ = 2 * (L_(n+1) - L_n)
 *        Speed of sound: v = f * λ = 2 * f * (L_(n+1) - L_n)
 *        End correction: ΔL = (L_2 - 3 * L_1) / 2
 *
 * 2. Temperature & Humidity Dependence of Sound Speed:
 *    - v(T) = 331.3 * sqrt(1 + T_C / 273.15)
 *    - Moisture correction: + 0.05 * (RH% / 100) * (T_C / 20) m/s
 *
 * 3. Acoustic Cavity Resonance (Helmholtz Resonator):
 *    - f_H = (v / (2π)) * sqrt(A / (V * L_eff))
 *      where L_eff = L_neck + 1.7 * r_neck
 *
 * 4. Acoustic Standing Wave & Resonant Amplification:
 *    - Resonance quality factor Q and frequency/length response.
 */

export type ResonanceSystemType = 'water_column' | 'helmholtz';

export interface ResonanceTubesParams {
  systemType: ResonanceSystemType;
  frequency: number;          // Hz: tuning fork / generator frequency (default 512 Hz)
  columnLength: number;       // m: length of air column (water level to mouth, 0.05 to 1.10 m)
  tubeRadiusMm: number;       // mm: tube inner radius (default 20 mm)
  temperatureC: number;       // °C: air temperature (default 20 °C)
  relativeHumidity: number;   // %: 0 to 100% (default 45%)
  helmholtzVolumeCm3: number; // cm³: cavity volume for Helmholtz mode (default 500 cm³)
  neckRadiusMm: number;       // mm: neck radius (default 12 mm)
  neckLengthMm: number;       // mm: neck length (default 35 mm)
  realMode: boolean;
}

export interface ResonancePeak {
  harmonicOrder: number;      // n (1 for λ/4, 2 for 3λ/4, 3 for 5λ/4...)
  theoreticalLength: number;  // m: L_n
  isWithinReach: boolean;     // whether within the physical tube length
}

export interface ResonanceTubesDerived {
  soundSpeed: number;         // m/s: v(T, RH)
  wavelength: number;         // m: λ = v / f
  endCorrection: number;      // m: ΔL = 0.61 * r
  effectiveLength: number;    // m: L + ΔL
  resonancePeaks: ResonancePeak[];
  firstResonanceLength: number;  // m: L_1
  secondResonanceLength: number; // m: L_2
  thirdResonanceLength: number;  // m: L_3
  measuredSpeedFromL1L2: number; // m/s: 2 * f * (L_2 - L_1)
  resonanceProximity: number;    // [0, 1]: 1.0 when perfectly at a resonance peak
  amplificationDb: number;       // dB: sound pressure level gain relative to background
  nearestResonanceOrder: number; // n
  helmholtzFrequency: number;    // Hz: f_H
}

/**
 * Calculates thermodynamic sound speed in air as a function of temperature and humidity.
 */
export function calculateSpeedOfSound(
  temperatureC: number,
  relativeHumidity: number = 45,
  realMode: boolean = false
): number {
  // Laplace-Newton adiabatic formula for air: v = sqrt(gamma * R * T / M)
  const T_kelvin = Math.max(200, 273.15 + temperatureC);
  let v = 331.3 * Math.sqrt(T_kelvin / 273.15);

  if (realMode) {
    // Slight increase in sound speed due to lower molecular mass of water vapor
    const humidityBoost = 0.12 * (relativeHumidity / 100) * Math.max(0, temperatureC / 25);
    v += humidityBoost;
  }

  return v;
}

/**
 * Calculates acoustic resonance derived values, resonance peak positions, and SPL response.
 */
export function calculateResonanceDerived(params: ResonanceTubesParams): ResonanceTubesDerived {
  const {
    systemType: _systemType,
    frequency: f,
    columnLength: L,
    tubeRadiusMm,
    temperatureC,
    relativeHumidity,
    helmholtzVolumeCm3,
    neckRadiusMm,
    neckLengthMm,
    realMode
  } = params;

  const v = calculateSpeedOfSound(temperatureC, relativeHumidity, realMode);
  const lambda = Math.max(0.01, v / Math.max(10, f));

  // Acoustic end correction ΔL
  const rMeters = (tubeRadiusMm * 1e-3);
  const endCorrection = realMode ? 0.61 * rMeters : 0.61 * rMeters;
  const effectiveLength = L + endCorrection;

  // Maximum tube length in apparatus
  const maxTubeLength = 1.15;

  // Resonant lengths: L_n = (2n - 1) * (λ / 4) - ΔL
  const resonancePeaks: ResonancePeak[] = [];
  for (let n = 1; n <= 4; n++) {
    const theoreticalL = (2 * n - 1) * (lambda / 4) - endCorrection;
    resonancePeaks.push({
      harmonicOrder: n,
      theoreticalLength: Math.max(0, theoreticalL),
      isWithinReach: theoreticalL > 0 && theoreticalL <= maxTubeLength
    });
  }

  const L1 = resonancePeaks[0].theoreticalLength;
  const L2 = resonancePeaks[1].theoreticalLength;
  const L3 = resonancePeaks[2].theoreticalLength;

  // Speed of sound determined experimentally from difference of first two resonant heights:
  // L2 - L1 = λ / 2  =>  v_exp = 2 * f * (L2 - L1)
  const measuredSpeedFromL1L2 = 2 * f * (L2 - L1);

  // Proximity to the closest resonance peak
  let minDistanceToPeak = Infinity;
  let nearestOrder = 1;

  for (let i = 0; i < resonancePeaks.length; i++) {
    const p = resonancePeaks[i];
    if (p.isWithinReach) {
      const dist = Math.abs(L - p.theoreticalLength);
      if (dist < minDistanceToPeak) {
        minDistanceToPeak = dist;
        nearestOrder = p.harmonicOrder;
      }
    }
  }

  // Resonance resonance peak sharpness (Q factor)
  // Half-power bandwidth corresponds to ~ 1.5 cm deviation
  const resonanceBandwidth = realMode ? 0.022 : 0.015;
  const normalizedDev = minDistanceToPeak / resonanceBandwidth;
  const resonanceProximity = 1 / (1 + normalizedDev * normalizedDev);

  // Sound pressure level (dB): baseline 45 dB, up to 92 dB at peak resonance
  const maxGainDb = 42;
  const amplificationDb = 48 + maxGainDb * resonanceProximity;

  // Helmholtz resonator frequency
  // f_H = (v / 2π) * sqrt(A / (V * L_eff))
  const V_m3 = (helmholtzVolumeCm3 * 1e-6);
  const r_neck_m = (neckRadiusMm * 1e-3);
  const A_neck = Math.PI * r_neck_m * r_neck_m;
  const L_neck_m = (neckLengthMm * 1e-3);
  const L_eff_neck = L_neck_m + 1.7 * r_neck_m;

  let helmholtzFrequency = 0;
  if (V_m3 > 0 && L_eff_neck > 0) {
    helmholtzFrequency = (v / (2 * Math.PI)) * Math.sqrt(A_neck / (V_m3 * L_eff_neck));
  }

  return {
    soundSpeed: v,
    wavelength: lambda,
    endCorrection,
    effectiveLength,
    resonancePeaks,
    firstResonanceLength: L1,
    secondResonanceLength: L2,
    thirdResonanceLength: L3,
    measuredSpeedFromL1L2,
    resonanceProximity,
    amplificationDb,
    nearestResonanceOrder: nearestOrder,
    helmholtzFrequency
  };
}

/**
 * Evaluates spatial standing wave profiles along the tube height x ∈ [0, columnLength].
 * - Displacement wave s(x) has node at water surface x = 0, antinode near mouth x = L.
 * - Pressure wave p(x) has antinode at water surface x = 0, node near mouth x = L.
 */
export function calculateAcousticProfiles(
  numPoints: number,
  simTime: number,
  params: ResonanceTubesParams,
  derived: ResonanceTubesDerived
): {
  x: number;
  displacement: number;
  pressure: number;
  envelope: number;
}[] {
  const { columnLength: L, frequency: f } = params;
  const { wavelength, resonanceProximity } = derived;

  const k = (2 * Math.PI) / wavelength;
  const omega = 2 * Math.PI * f;
  const timeFactor = Math.cos(omega * simTime);

  const points: {
    x: number;
    displacement: number;
    pressure: number;
    envelope: number;
  }[] = [];

  const step = L / Math.max(1, numPoints - 1);
  const peakAmplitude = 0.15 + 0.85 * resonanceProximity;

  for (let i = 0; i < numPoints; i++) {
    const x = i * step;

    // x = 0 is water surface (closed end)
    // Displacement s(x) = s0 * sin(k * x) * cos(omega * t)
    // Pressure p(x) = p0 * cos(k * x) * sin(omega * t)
    const sinKx = Math.sin(k * x);
    const cosKx = Math.cos(k * x);

    const displacement = peakAmplitude * sinKx * timeFactor;
    const pressure = peakAmplitude * cosKx * Math.sin(omega * simTime);
    const envelope = peakAmplitude * Math.abs(sinKx);

    points.push({
      x,
      displacement,
      pressure,
      envelope
    });
  }

  return points;
}
