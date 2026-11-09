/**
 * Physical model for Heat Transfer Mechanisms (Conduction, Convection, Radiation).
 * Pure TypeScript — no DOM, no Vue dependencies.
 */

export const STEFAN_BOLTZMANN = 5.670374419e-8; // W / (m^2 * K^4)
export const WIEN_DISPLACEMENT = 2.897771955e-3; // m * K

export type TransferMode = 'conduction' | 'convection' | 'radiation' | 'combined';

export type ConductionMaterial = 'copper' | 'aluminum' | 'iron' | 'glass' | 'wood';

export interface MaterialProperties {
  name: ConductionMaterial;
  k: number; // Thermal conductivity (W / (m * K))
  density: number; // kg / m^3
  specificHeat: number; // J / (kg * K)
}

export const MATERIAL_DATABASE: Record<ConductionMaterial, MaterialProperties> = {
  copper: { name: 'copper', k: 385, density: 8960, specificHeat: 385 },
  aluminum: { name: 'aluminum', k: 205, density: 2700, specificHeat: 900 },
  iron: { name: 'iron', k: 50, density: 7870, specificHeat: 450 },
  glass: { name: 'glass', k: 0.8, density: 2500, specificHeat: 840 },
  wood: { name: 'wood', k: 0.15, density: 600, specificHeat: 1700 },
};

export interface HeatTransferParams {
  transferMode: TransferMode;
  material: ConductionMaterial;
  hotTempC: number; // T_hot (°C)
  coldTempC: number; // T_cold / ambient (°C)
  crossSectionArea: number; // A (m^2)
  rodLength: number; // L (m) for conduction
  convectionCoeff: number; // h (W / (m^2 * K))
  emissivity: number; // epsilon in [0.05, 1.0]
  isRealMode: boolean;
}

export interface PlumeParticle {
  x: number; // normalized along plate width
  y: number; // normalized height above plate (0 at surface, 1 high)
  vx: number;
  vy: number;
  temperature: number; // relative temperature
}

export interface ConductionDerived {
  thermalConductivity: number; // k (W/(m*K))
  heatFluxRate: number; // Q_dot (W)
  heatFluxDensity: number; // q_dot = Q_dot / A (W/m^2)
  tempProfile: number[]; // temperatures along rod at 10 sample stations (°C)
}

export interface ConvectionDerived {
  convectiveHeatRate: number; // Q_conv (W)
  nusseltEstimate: number; // dimensionless
  boundaryLayerThicknessMm: number; // mm
}

export interface RadiationDerived {
  radiativeHeatRate: number; // Q_rad (W)
  emissivePower: number; // E = eps * sigma * T_hot^4 (W/m^2)
  peakWavelengthUm: number; // lambda_max (micrometers)
  glowColorHex: string;
}

export interface HeatTransferDerived {
  conduction: ConductionDerived;
  convection: ConvectionDerived;
  radiation: RadiationDerived;
  totalHeatRate: number; // total W transferred
  dominantMode: TransferMode;
}

export interface HeatTransferState {
  t: number;
  derived: HeatTransferDerived;
  particles: PlumeParticle[];
}

/**
 * Compute derived physical quantities for all heat transfer modes.
 */
export function computeHeatTransfer(params: HeatTransferParams): HeatTransferDerived {
  const mat = MATERIAL_DATABASE[params.material] || MATERIAL_DATABASE.copper;
  const thKelvin = params.hotTempC + 273.15;
  const tcKelvin = params.coldTempC + 273.15;
  const deltaT = Math.max(0.1, thKelvin - tcKelvin);

  const a = Math.max(0.0001, params.crossSectionArea);
  const l = Math.max(0.02, params.rodLength);

  // 1. Conduction: Fourier's Law Q_cond = k * A * (Th - Tc) / L
  // In real mode, rod experiences lateral thermal loss
  const lossFactor = params.isRealMode ? 0.92 : 1.0;
  const qCond = (mat.k * a * deltaT * lossFactor) / l;
  const qCondFlux = qCond / a;

  // Temperature profile along rod at 11 positions from x=0 to x=L
  const tempProfile: number[] = [];
  for (let i = 0; i <= 10; i++) {
    const fraction = i / 10;
    // Linear in ideal, slightly curved in real due to ambient lateral cooling
    const linearT = params.hotTempC - fraction * (params.hotTempC - params.coldTempC);
    const realCurve = params.isRealMode ? Math.sin(fraction * Math.PI) * 2.5 : 0;
    tempProfile.push(linearT - realCurve);
  }

  const conductionDerived: ConductionDerived = {
    thermalConductivity: mat.k,
    heatFluxRate: qCond,
    heatFluxDensity: qCondFlux,
    tempProfile,
  };

  // 2. Convection: Newton's Law of Cooling Q_conv = h * A * (Ts - T_amb)
  const h = Math.max(1.0, params.convectionCoeff);
  const qConv = h * a * deltaT;
  // Nusselt number approximation Nu = h * L_char / k_fluid (k_air ~ 0.026)
  const nuEst = (h * 0.1) / 0.026;
  const deltaMm = Math.max(1, 15 / Math.pow(Math.max(1, nuEst), 0.5));

  const convectionDerived: ConvectionDerived = {
    convectiveHeatRate: qConv,
    nusseltEstimate: nuEst,
    boundaryLayerThicknessMm: deltaMm,
  };

  // 3. Radiation: Stefan-Boltzmann Law Q_rad = eps * sigma * A * (Th^4 - Tc^4)
  const eps = Math.min(1.0, Math.max(0.02, params.emissivity));
  const emissivePower = eps * STEFAN_BOLTZMANN * Math.pow(thKelvin, 4);
  const qRad = eps * STEFAN_BOLTZMANN * a * (Math.pow(thKelvin, 4) - Math.pow(tcKelvin, 4));

  // Wien's Displacement Law: lambda_max = b / T
  const peakWavelengthM = WIEN_DISPLACEMENT / thKelvin;
  const peakWavelengthUm = peakWavelengthM * 1e6; // in micrometers

  // Blackbody glow color estimation
  let glowColor = '#3b82f6'; // Cold
  if (params.hotTempC < 300) {
    glowColor = '#ef4444'; // Hot infrared invisible / deep red boundary
  } else if (params.hotTempC < 550) {
    glowColor = '#dc2626'; // Dull cherry red
  } else if (params.hotTempC < 750) {
    glowColor = '#ea580c'; // Bright red-orange
  } else if (params.hotTempC < 950) {
    glowColor = '#f59e0b'; // Orange-yellow
  } else {
    glowColor = '#fef08a'; // White-hot glow
  }

  const radiationDerived: RadiationDerived = {
    radiativeHeatRate: qRad,
    emissivePower,
    peakWavelengthUm,
    glowColorHex: glowColor,
  };

  // Total heat transfer based on active mode
  let totalRate = 0;
  if (params.transferMode === 'conduction') {
    totalRate = qCond;
  } else if (params.transferMode === 'convection') {
    totalRate = qConv;
  } else if (params.transferMode === 'radiation') {
    totalRate = qRad;
  } else {
    totalRate = qCond + qConv + qRad;
  }

  // Determine dominant mode in combined configuration
  let dominant: TransferMode = 'conduction';
  if (qConv > qCond && qConv > qRad) dominant = 'convection';
  else if (qRad > qCond && qRad > qConv) dominant = 'radiation';

  return {
    conduction: conductionDerived,
    convection: convectionDerived,
    radiation: radiationDerived,
    totalHeatRate: totalRate,
    dominantMode: dominant,
  };
}

/**
 * Initialize convection buoyant plume particles.
 */
export function initPlumeParticles(count: number = 80): PlumeParticle[] {
  const particles: PlumeParticle[] = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.05,
      vy: 0.15 + Math.random() * 0.35,
      temperature: 1.0 - Math.random() * 0.8,
    });
  }
  return particles;
}

/**
 * Initialize simulation state.
 */
export function createHeatTransferModel(params: HeatTransferParams): HeatTransferState {
  return {
    t: 0,
    derived: computeHeatTransfer(params),
    particles: initPlumeParticles(90),
  };
}

/**
 * Advance simulation state by dt seconds.
 */
export function stepHeatTransferModel(
  state: HeatTransferState,
  params: HeatTransferParams,
  dt: number,
): HeatTransferState {
  const newT = state.t + dt;
  const derived = computeHeatTransfer(params);

  // Animate buoyant convection plume particles rising above heated surface
  const updatedParticles = state.particles.map((p) => {
    // Buoyancy acceleration proportional to temperature difference
    const tempDelta = Math.max(5, params.hotTempC - params.coldTempC);
    const riseSpeed = (0.2 + (tempDelta / 200) * 0.8) * (params.convectionCoeff / 20.0);

    let nextY = p.y + (riseSpeed * p.temperature + 0.1) * dt;
    // Thermal vortex swaying
    const wave = Math.sin(nextY * 12 + newT * 6 + p.x * 10) * 0.08 * dt;
    let nextX = p.x + wave;

    // Cool down as it rises
    let nextTemp = p.temperature - 0.25 * dt;

    if (nextY > 1.05 || nextTemp <= 0.05) {
      nextY = 0.0;
      nextX = 0.2 + Math.random() * 0.6; // emit from heater plate
      nextTemp = 1.0;
    }

    return {
      x: nextX,
      y: nextY,
      vx: wave,
      vy: riseSpeed,
      temperature: nextTemp,
    };
  });

  return {
    t: newT,
    derived,
    particles: updatedParticles,
  };
}
