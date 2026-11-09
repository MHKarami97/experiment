/**
 * Physical model for Thermal Expansion (Linear, Bimetallic Strip, Volumetric & Anomalous Water).
 * Pure TypeScript — no DOM, no Vue dependencies.
 */

export type ExpansionType = 'linear' | 'bimetal' | 'waterAnomaly' | 'areaVolume';
export type MetalMaterial = 'invar' | 'steel' | 'copper' | 'brass' | 'aluminum' | 'lead';

export interface MetalProperties {
  name: MetalMaterial;
  alpha: number; // Linear expansion coefficient (1 / K)
  youngsModulusGPa: number; // Young's modulus E (GPa) for thermal stress
  densityKgM3: number;
  colorHex: string;
}

export const METALS_DATABASE: Record<MetalMaterial, MetalProperties> = {
  invar: { name: 'invar', alpha: 1.2e-6, youngsModulusGPa: 140, densityKgM3: 8050, colorHex: '#94a3b8' },
  steel: { name: 'steel', alpha: 12.0e-6, youngsModulusGPa: 200, densityKgM3: 7850, colorHex: '#64748b' },
  copper: { name: 'copper', alpha: 16.5e-6, youngsModulusGPa: 110, densityKgM3: 8960, colorHex: '#ea580c' },
  brass: { name: 'brass', alpha: 19.0e-6, youngsModulusGPa: 100, densityKgM3: 8500, colorHex: '#eab308' },
  aluminum: { name: 'aluminum', alpha: 23.0e-6, youngsModulusGPa: 70, densityKgM3: 2700, colorHex: '#cbd5e1' },
  lead: { name: 'lead', alpha: 29.0e-6, youngsModulusGPa: 16, densityKgM3: 11340, colorHex: '#475569' },
};

export interface ThermalExpansionParams {
  expansionType: ExpansionType;
  metal1: MetalMaterial; // Primary rod or top layer of bimetal
  metal2: MetalMaterial; // Bottom layer of bimetal (e.g. invar or steel)

  initialLengthMm: number; // L_0 in mm (e.g. 500 mm to 2000 mm)
  stripThicknessMm: number; // d in mm for bimetal (e.g. 1.0 to 5.0 mm)
  initialTempC: number; // T_0 (°C, usually 20°C)
  currentTempC: number; // T (°C, e.g. -20°C to 400°C)

  initialVolumeCm3: number; // V_0 in cm^3 (for water / liquid anomaly)
  isRealMode: boolean; // Enables temperature-dependent alpha and thermal stress calculation
}

export interface LinearExpansionDerived {
  deltaL_Mm: number; // elongation in mm
  finalLengthMm: number; // L_final in mm
  expansionFractionPercent: number; // (dL / L0) * 100
  thermalStressMPa: number; // sigma = E * alpha * dT (if fixed ends)
}

export interface BimetalDerived {
  tipDeflectionMm: number; // vertical deflection of strip tip in mm
  curvatureRadiusM: number; // bending radius rho in meters
  switchContactClosed: boolean; // electrical circuit contact status
  deltaAlpha: number; // alpha2 - alpha1
}

export interface WaterAnomalyDerived {
  densityGPerCm3: number; // water density at current temperature
  relativeVolume: number; // V(T) / V(4°C)
  volumeChangeCm3: number; // delta V
  anomalousRegion: boolean; // true if T in [0, 4°C] where water expands on cooling
}

export interface ThermalExpansionDerived {
  deltaTC: number; // T - T_0
  linear: LinearExpansionDerived;
  bimetal: BimetalDerived;
  water: WaterAnomalyDerived;
}

export interface ThermalExpansionState {
  t: number;
  temperatureC: number; // dynamic temperature tracking
  derived: ThermalExpansionDerived;
}

/**
 * High-accuracy water density polynomial near 4°C (Tanaka et al. standard):
 * rho(T) = a0 * [1 - (T - T_max)^2 * (T + a1) / (a2 * (T + a3))]
 */
export function calculateWaterDensity(tCelsius: number): number {
  const t = Math.max(-10, Math.min(100, tCelsius));
  if (t < 0) {
    // Supercooled liquid / ice transition boundary approximation
    return 0.99984 - 0.00015 * Math.abs(t);
  }
  // Tanaka water density formula parameters:
  const a0 = 0.999972; // g/cm^3 peak at 3.983°C
  const tMax = 3.983035; // °C
  const a1 = 283.094;
  const a2 = 508929.2;
  const a3 = 68.12963;

  const num = Math.pow(t - tMax, 2) * (t + a1);
  const den = a2 * (t + a3);
  return a0 * (1.0 - num / den);
}

/**
 * Compute derived physical quantities for all thermal expansion modes.
 */
export function computeThermalExpansion(params: ThermalExpansionParams): ThermalExpansionDerived {
  const deltaT = params.currentTempC - params.initialTempC;
  const m1 = METALS_DATABASE[params.metal1] || METALS_DATABASE.brass;
  const m2 = METALS_DATABASE[params.metal2] || METALS_DATABASE.invar;

  // 1. Linear Expansion: dL = alpha * L0 * dT
  // In real mode, alpha has a slight positive temperature coefficient (+0.05% per 100K)
  const realAlphaFactor = params.isRealMode ? 1.0 + (deltaT / 1000) * 0.05 : 1.0;
  const alphaEff1 = m1.alpha * realAlphaFactor;
  const deltaL_Mm = alphaEff1 * params.initialLengthMm * deltaT;
  const finalLengthMm = params.initialLengthMm + deltaL_Mm;
  const expPercent = (deltaL_Mm / params.initialLengthMm) * 100;

  // Thermal Stress if constrained: sigma = E * alpha * dT
  const thermalStressMPa = (m1.youngsModulusGPa * 1000) * alphaEff1 * Math.abs(deltaT);

  const linear: LinearExpansionDerived = {
    deltaL_Mm,
    finalLengthMm,
    expansionFractionPercent: expPercent,
    thermalStressMPa,
  };

  // 2. Bimetallic Strip Deflection (Timoshenko's beam deflection equation)
  // For two bonded strips of equal thickness d/2 (total thickness d):
  // delta_tip = (3 * (alpha1 - alpha2) * dT * L^2) / (4 * d)
  const totalThicknessMm = Math.max(0.5, params.stripThicknessMm);
  const deltaAlpha = m1.alpha - m2.alpha;
  const lStripMm = params.initialLengthMm;
  const tipDeflectionMm = (3 * deltaAlpha * deltaT * Math.pow(lStripMm, 2)) / (4 * totalThicknessMm);

  // Curvature radius: rho = L^2 / (2 * delta_tip)
  let curvatureRadiusM = 9999.0;
  if (Math.abs(tipDeflectionMm) > 0.001) {
    curvatureRadiusM = Math.abs((Math.pow(lStripMm / 1000, 2)) / (2 * (tipDeflectionMm / 1000)));
  }

  // Thermostat contact logic: contact opens if upward deflection exceeds 1.5 mm
  const contactGapThresholdMm = 1.5;
  const switchContactClosed = tipDeflectionMm < contactGapThresholdMm;

  const bimetal: BimetalDerived = {
    tipDeflectionMm,
    curvatureRadiusM,
    switchContactClosed,
    deltaAlpha,
  };

  // 3. Volumetric & Anomalous Water Expansion
  const currentDensity = calculateWaterDensity(params.currentTempC);
  const referenceDensity = calculateWaterDensity(params.initialTempC); // at T0
  const peakDensity = calculateWaterDensity(3.98); // maximum density at ~4°C

  // V(T) = V0 * (rho_0 / rho(T))
  const vCurrentCm3 = params.initialVolumeCm3 * (referenceDensity / currentDensity);
  const deltaVCm3 = vCurrentCm3 - params.initialVolumeCm3;
  const relVol = peakDensity / currentDensity; // V / V_min

  const water: WaterAnomalyDerived = {
    densityGPerCm3: currentDensity,
    relativeVolume: relVol,
    volumeChangeCm3: deltaVCm3,
    anomalousRegion: params.currentTempC >= 0 && params.currentTempC < 4.0,
  };

  return {
    deltaTC: deltaT,
    linear,
    bimetal,
    water,
  };
}

/**
 * Create initial simulation model state.
 */
export function createThermalExpansionModel(params: ThermalExpansionParams): ThermalExpansionState {
  return {
    t: 0,
    temperatureC: params.currentTempC,
    derived: computeThermalExpansion(params),
  };
}

/**
 * Step thermal expansion state towards target temperature.
 */
export function stepThermalExpansionModel(
  state: ThermalExpansionState,
  params: ThermalExpansionParams,
  dt: number,
): ThermalExpansionState {
  // Smoothly approach target temperature
  const tempDiff = params.currentTempC - state.temperatureC;
  const nextTemp = Math.abs(tempDiff) < 0.1 ? params.currentTempC : state.temperatureC + tempDiff * Math.min(1.0, dt * 6.0);

  const updatedParams: ThermalExpansionParams = {
    ...params,
    currentTempC: nextTemp,
  };

  return {
    t: state.t + dt,
    temperatureC: nextTemp,
    derived: computeThermalExpansion(updatedParams),
  };
}
