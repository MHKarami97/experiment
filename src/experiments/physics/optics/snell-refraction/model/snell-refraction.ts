/**
 * Physics Model: Reflection & Snell's Law of Refraction (قانون بازتاب و شکست نور)
 *
 * Simulates:
 * 1. Law of Reflection:
 *    θ_r = θ_i (Angle of reflection equals angle of incidence)
 *
 * 2. Snell-Descartes Law of Refraction:
 *    n1 * sin(θ1) = n2 * sin(θ2) => sin(θ2) = (n1 / n2) * sin(θ1)
 *    θ2 = arcsin((n1 / n2) * sin(θ1))
 *
 * 3. Total Internal Reflection (TIR):
 *    Occurs when n1 > n2 and θ1 > θ_c
 *    Critical angle: θ_c = arcsin(n2 / n1)
 *
 * 4. Brewster's Angle (Polarization):
 *    θ_B = arctan(n2 / n1)  (where reflected light is completely s-polarized)
 *
 * 5. Fresnel Equations for Reflectance and Transmittance:
 *    R_s = |(n1 cos θ1 - n2 cos θ2) / (n1 cos θ1 + n2 cos θ2)|²
 *    R_p = |(n1 cos θ2 - n2 cos θ1) / (n1 cos θ2 + n2 cos θ1)|²
 *    R_unpolarized = (R_s + R_p) / 2
 *    T = 1 - R
 *
 * 6. Chromatic Dispersion (Cauchy's Formula):
 *    n(λ) = n_base + B / λ²  where B ≈ 0.004 µm² for optical glass
 *
 * 7. Speeds and Wavelengths in Media:
 *    v = c / n
 *    λ_medium = λ_0 / n
 */

export const SPEED_OF_LIGHT = 299792458; // m/s (c in vacuum)

export type MediumGeometry = 'planar' | 'semicircular' | 'prism';

export interface OpticalMaterial {
  id: string;
  nameKey: string;
  n: number;       // Refractive index at 589 nm (Sodium D line)
  dispersionB: number; // Cauchy coefficient B in µm²
  color: string;   // Tint for visualization
}

export const STANDARD_MATERIALS: OpticalMaterial[] = [
  { id: 'air', nameKey: 'snellRefraction.mat_air', n: 1.0003, dispersionB: 0.00001, color: 'rgba(255, 255, 255, 0.02)' },
  { id: 'water', nameKey: 'snellRefraction.mat_water', n: 1.333, dispersionB: 0.0033, color: 'rgba(56, 189, 248, 0.15)' },
  { id: 'acrylic', nameKey: 'snellRefraction.mat_acrylic', n: 1.492, dispersionB: 0.0041, color: 'rgba(168, 85, 247, 0.12)' },
  { id: 'crown_glass', nameKey: 'snellRefraction.mat_crown_glass', n: 1.520, dispersionB: 0.0045, color: 'rgba(99, 102, 241, 0.16)' },
  { id: 'flint_glass', nameKey: 'snellRefraction.mat_flint_glass', n: 1.660, dispersionB: 0.0098, color: 'rgba(236, 72, 153, 0.18)' },
  { id: 'diamond', nameKey: 'snellRefraction.mat_diamond', n: 2.417, dispersionB: 0.0125, color: 'rgba(45, 212, 191, 0.22)' }
];

export interface SnellParams {
  theta1Deg: number;       // Incident angle in degrees (0 to 89.9°)
  n1: number;              // Medium 1 refractive index (default 1.0003, air)
  n2: number;              // Medium 2 refractive index (default 1.52, crown glass)
  wavelengthNm: number;    // Laser wavelength in nm (default 532 nm, green laser)
  geometry: MediumGeometry;
  whiteLight: boolean;     // Whether to simulate white beam dispersion
  realMode: boolean;       // Real mode includes beam divergence and surface roughness scattering
}

export interface SnellDerived {
  theta1Rad: number;
  theta1Deg: number;
  theta2Rad: number | null; // null if Total Internal Reflection occurs
  theta2Deg: number | null;
  thetaReflectedDeg: number;
  criticalAngleRad: number | null;
  criticalAngleDeg: number | null;
  brewsterAngleRad: number;
  brewsterAngleDeg: number;
  isTotalInternalReflection: boolean;
  reflectance: number;       // R in [0, 1]
  transmittance: number;     // T in [0, 1]
  speed1: number;            // m/s
  speed2: number;            // m/s
  wavelength1Nm: number;
  wavelength2Nm: number;
  spectralRays?: {
    color: string;
    wavelengthNm: number;
    n2: number;
    theta2Deg: number | null;
  }[];
}

/**
 * Calculates refractive index with Cauchy dispersion: n(λ) = n_base + B * (1/λ² - 1/λ_d²)
 */
export function calculateDispersedIndex(baseN: number, wavelengthNm: number, bCoeff = 0.0045): number {
  if (baseN <= 1.0005) return baseN; // negligible dispersion in air/vacuum
  const lambdaMicrons = wavelengthNm * 1e-3;
  const dMicrons = 0.589; // sodium D line reference
  const delta = bCoeff * (1 / (lambdaMicrons * lambdaMicrons) - 1 / (dMicrons * dMicrons));
  return Math.max(1.0, baseN + delta);
}

/**
 * Calculates Snell's refraction angle θ2.
 * Returns null if Total Internal Reflection occurs.
 */
export function calculateSnellAngle(n1: number, n2: number, theta1Rad: number): {
  theta2Rad: number | null;
  isTir: boolean;
} {
  const sinTheta1 = Math.sin(theta1Rad);
  const sinTheta2 = (n1 / n2) * sinTheta1;

  if (Math.abs(sinTheta2) > 1.0) {
    return { theta2Rad: null, isTir: true };
  }

  return { theta2Rad: Math.asin(sinTheta2), isTir: false };
}

/**
 * Calculates the critical angle θ_c = arcsin(n2 / n1).
 * Returns null if n1 <= n2 (TIR impossible).
 */
export function calculateCriticalAngle(n1: number, n2: number): number | null {
  if (n1 <= n2) return null;
  return Math.asin(n2 / n1);
}

/**
 * Calculates Brewster's polarization angle θ_B = arctan(n2 / n1).
 */
export function calculateBrewsterAngle(n1: number, n2: number): number {
  return Math.atan(n2 / n1);
}

/**
 * Calculates Fresnel reflectance (R) and transmittance (T) for unpolarized light.
 */
export function calculateFresnelCoefficients(
  n1: number,
  n2: number,
  theta1Rad: number,
  theta2Rad: number | null
): { rs: number; rp: number; r: number; t: number } {
  // If Total Internal Reflection: 100% reflected
  if (theta2Rad === null) {
    return { rs: 1.0, rp: 1.0, r: 1.0, t: 0.0 };
  }

  const cos1 = Math.cos(theta1Rad);
  const cos2 = Math.cos(theta2Rad);

  // Normal incidence limit (θ1 = 0)
  if (Math.abs(theta1Rad) < 1e-6) {
    const r0 = Math.pow((n1 - n2) / (n1 + n2), 2);
    return { rs: r0, rp: r0, r: r0, t: 1 - r0 };
  }

  // s-polarization (TE mode)
  const n1cos1 = n1 * cos1;
  const n2cos2 = n2 * cos2;
  const rs = Math.pow((n1cos1 - n2cos2) / (n1cos1 + n2cos2), 2);

  // p-polarization (TM mode)
  const n1cos2 = n1 * cos2;
  const n2cos1 = n2 * cos1;
  const rp = Math.pow((n2cos1 - n1cos2) / (n2cos1 + n1cos2), 2);

  const r = (rs + rp) / 2;
  const t = Math.max(0, 1 - r);

  return { rs, rp, r, t };
}

/**
 * Solves complete Snell & Fresnel optics for given parameters.
 */
export function calculateSnellDerived(params: SnellParams): SnellDerived {
  const { theta1Deg, n1, n2, wavelengthNm, whiteLight, realMode } = params;

  const theta1Rad = (theta1Deg * Math.PI) / 180;
  const thetaReflectedDeg = theta1Deg;

  // Medium 2 effective refractive index with dispersion
  const effectiveN2 = calculateDispersedIndex(n2, wavelengthNm);

  // Refraction calculation
  const { theta2Rad, isTir } = calculateSnellAngle(n1, effectiveN2, theta1Rad);
  const theta2Deg = theta2Rad !== null ? (theta2Rad * 180) / Math.PI : null;

  // Critical angle
  const criticalAngleRad = calculateCriticalAngle(n1, effectiveN2);
  const criticalAngleDeg = criticalAngleRad !== null ? (criticalAngleRad * 180) / Math.PI : null;

  // Brewster's angle
  const brewsterAngleRad = calculateBrewsterAngle(n1, effectiveN2);
  const brewsterAngleDeg = (brewsterAngleRad * 180) / Math.PI;

  // Fresnel Reflectance & Transmittance
  let { r, t } = calculateFresnelCoefficients(n1, effectiveN2, theta1Rad, theta2Rad);

  if (realMode && !isTir) {
    // Optical interface roughness scattering (~ 0.5% - 1.5% diffuse scattering loss)
    const scattering = 0.012;
    t = Math.max(0, t - scattering);
  }

  // Speed and wavelength in media
  const speed1 = SPEED_OF_LIGHT / n1;
  const speed2 = SPEED_OF_LIGHT / effectiveN2;
  const wavelength1Nm = wavelengthNm / n1;
  const wavelength2Nm = wavelengthNm / effectiveN2;

  // Spectral dispersion rays if white light mode is active
  let spectralRays: SnellDerived['spectralRays'];
  if (whiteLight) {
    const spectralBands = [
      { color: '#ef4444', wavelengthNm: 680 }, // Red
      { color: '#f59e0b', wavelengthNm: 590 }, // Amber/Yellow
      { color: '#10b981', wavelengthNm: 532 }, // Green
      { color: '#06b6d4', wavelengthNm: 485 }, // Cyan
      { color: '#3b82f6', wavelengthNm: 440 }, // Blue
      { color: '#8b5cf6', wavelengthNm: 405 }  // Violet
    ];

    spectralRays = spectralBands.map((band) => {
      const dispersedN2 = calculateDispersedIndex(n2, band.wavelengthNm);
      const angle = calculateSnellAngle(n1, dispersedN2, theta1Rad);
      return {
        color: band.color,
        wavelengthNm: band.wavelengthNm,
        n2: dispersedN2,
        theta2Deg: angle.theta2Rad !== null ? (angle.theta2Rad * 180) / Math.PI : null
      };
    });
  }

  return {
    theta1Rad,
    theta1Deg,
    theta2Rad,
    theta2Deg,
    thetaReflectedDeg,
    criticalAngleRad,
    criticalAngleDeg,
    brewsterAngleRad,
    brewsterAngleDeg,
    isTotalInternalReflection: isTir,
    reflectance: r,
    transmittance: t,
    speed1,
    speed2,
    wavelength1Nm,
    wavelength2Nm,
    spectralRays
  };
}
