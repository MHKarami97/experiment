/**
 * Physical model for Viscosity and Pipe Flow (Poiseuille Law, Velocity Profile & Reynolds Regime).
 * Pure TypeScript — no DOM, no Vue dependencies.
 */

export type FlowRegime = 'laminar' | 'transition' | 'turbulent';

export type FluidType = 'water' | 'motor-oil' | 'glycerin' | 'honey' | 'air';

export interface FluidProperties {
  name: FluidType;
  baseDensity: number; // kg/m^3 at 20 C
  baseViscosity: number; // Pa·s at 20 C
  tempCoeff: number; // exponential temperature activation factor
}

export const FLUID_DATABASE: Record<FluidType, FluidProperties> = {
  water: {
    name: 'water',
    baseDensity: 1000,
    baseViscosity: 0.001002, // ~1.0 mPa·s
    tempCoeff: 1800,
  },
  'motor-oil': {
    name: 'motor-oil',
    baseDensity: 880,
    baseViscosity: 0.29, // 290 mPa·s
    tempCoeff: 3200,
  },
  glycerin: {
    name: 'glycerin',
    baseDensity: 1260,
    baseViscosity: 1.412, // 1412 mPa·s
    tempCoeff: 4500,
  },
  honey: {
    name: 'honey',
    baseDensity: 1420,
    baseViscosity: 8.5, // 8.5 Pa·s
    tempCoeff: 5200,
  },
  air: {
    name: 'air',
    baseDensity: 1.204,
    baseViscosity: 0.0000182, // 18.2 uPa·s
    tempCoeff: -350, // Gas viscosity increases slightly with temp
  },
};

export interface ViscosityParams {
  fluidType: FluidType;
  pressureDiff: number; // Delta P across pipe (Pa)
  pipeDiameter: number; // D (m)
  pipeLength: number; // L (m)
  temperatureC: number; // T (°C)
  wallRoughnessMm: number; // epsilon (mm)
  isRealMode: boolean;
}

export interface DyeParticle {
  x: number; // 0 to 1 along pipe
  y: number; // normalized -1 to +1 across radius
  vx: number; // normalized velocity
  vy: number; // lateral disturbance velocity
  age: number; // seconds
}

export interface ViscosityDerived {
  density: number; // kg/m^3
  dynamicViscosity: number; // Pa·s
  kinematicViscosity: number; // m^2/s (eta / rho)
  pipeRadius: number; // m
  crossSectionArea: number; // m^2
  volumeFlowRate: number; // m^3/s
  massFlowRate: number; // kg/s
  maxVelocity: number; // m/s (centerline velocity)
  avgVelocity: number; // m/s
  reynoldsNumber: number; // dimensionless
  regime: FlowRegime;
  wallShearStress: number; // Pa (tau_w)
  darcyFrictionFactor: number; // f
  pressureDropPerMeter: number; // Pa/m
}

export interface ViscosityState {
  t: number;
  derived: ViscosityDerived;
  dyeParticles: DyeParticle[];
}

/**
 * Calculate dynamic viscosity dependent on temperature (°C)
 * Using Vogel-Fulcher-Tammann / Andrade exponential curve.
 */
export function calculateViscosity(fluid: FluidProperties, tempC: number): number {
  const tKelvin = tempC + 273.15;
  const tRefKelvin = 293.15; // 20 °C
  // eta(T) = eta_0 * exp(B * (1/T - 1/T_0))
  const exponent = fluid.tempCoeff * (1 / tKelvin - 1 / tRefKelvin);
  const clampedExp = Math.max(-5, Math.min(5, exponent));
  return fluid.baseViscosity * Math.exp(clampedExp);
}

/**
 * Compute derived physical quantities for pipe flow.
 */
export function computeViscosityModel(params: ViscosityParams): ViscosityDerived {
  const fluid = FLUID_DATABASE[params.fluidType] || FLUID_DATABASE.water;
  const eta = calculateViscosity(fluid, params.temperatureC);
  const rho = fluid.baseDensity;
  const nu = eta / rho; // kinematic viscosity

  const d = Math.max(0.005, params.pipeDiameter);
  const r = d / 2;
  const a = Math.PI * r * r;
  const l = Math.max(0.1, params.pipeLength);
  const deltaP = Math.max(1, params.pressureDiff);

  // 1. Poiseuille Laminar Volume Flow Rate:
  // Q_lam = (pi * r^4 * deltaP) / (8 * eta * l)
  const qLaminar = (Math.PI * Math.pow(r, 4) * deltaP) / (8 * eta * l);
  const vAvgLaminar = qLaminar / a;
  const reLaminar = (rho * vAvgLaminar * d) / eta;

  let regime: FlowRegime = 'laminar';
  let vAvg = vAvgLaminar;
  let q = qLaminar;
  let f = 64 / Math.max(1e-6, reLaminar);

  if (reLaminar < 2300) {
    regime = 'laminar';
    f = 64 / Math.max(1e-6, reLaminar);
    vAvg = vAvgLaminar;
    q = qLaminar;
  } else if (reLaminar <= 4000) {
    regime = 'transition';
    // Blended flow regime
    const frac = (reLaminar - 2300) / 1700;
    // Turbulent friction factor estimation (Haaland equation approximation)
    const relRough = (params.wallRoughnessMm / 1000) / d;
    const fTurb = 0.079 / Math.pow(Math.max(1000, reLaminar), 0.25) + 0.01 * relRough;
    f = (1 - frac) * (64 / reLaminar) + frac * fTurb;

    // Head loss equation: deltaP = f * (L/D) * (rho * v^2 / 2) => v = sqrt(2 * deltaP * D / (f * L * rho))
    const vTurbEst = Math.sqrt((2 * deltaP * d) / (f * l * rho));
    vAvg = (1 - frac) * vAvgLaminar + frac * vTurbEst;
    q = vAvg * a;
  } else {
    regime = 'turbulent';
    // Darcy-Weisbach friction factor (Haaland equation)
    const relRough = (params.wallRoughnessMm / 1000) / d;
    f = Math.pow(-1.8 * Math.log10(Math.pow(relRough / 3.7, 1.11) + 6.9 / reLaminar), -2);
    if (!isFinite(f) || f <= 0) f = 0.032;

    // Velocity from Darcy-Weisbach: deltaP = f * (L/D) * 0.5 * rho * v^2
    vAvg = Math.sqrt((2 * deltaP * d) / (f * l * rho));
    q = vAvg * a;
  }

  // Live Reynolds based on actual velocity
  const reActual = (rho * vAvg * d) / eta;

  // Maximum centerline velocity:
  // In laminar: v_max = 2 * v_avg
  // In turbulent: v_max ~ 1.22 * v_avg (flatter 1/7th power profile)
  const vMax = regime === 'laminar' ? 2 * vAvg : (regime === 'transition' ? 1.6 * vAvg : 1.25 * vAvg);

  // Wall shear stress: tau_w = (deltaP * r) / (2 * l)
  const tauW = (deltaP * r) / (2 * l);

  const massFlow = q * rho;
  const dpPerMeter = deltaP / l;

  return {
    density: rho,
    dynamicViscosity: eta,
    kinematicViscosity: nu,
    pipeRadius: r,
    crossSectionArea: a,
    volumeFlowRate: q,
    massFlowRate: massFlow,
    maxVelocity: vMax,
    avgVelocity: vAvg,
    reynoldsNumber: reActual,
    regime,
    wallShearStress: tauW,
    darcyFrictionFactor: f,
    pressureDropPerMeter: dpPerMeter,
  };
}

/**
 * Initialize dye tracer particles at the needle injection point.
 */
export function initDyeParticles(count: number = 100): DyeParticle[] {
  const particles: DyeParticle[] = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: (i / count) * 1.0,
      y: (Math.random() - 0.5) * 0.04, // Starts tightly concentrated at center
      vx: 1.0,
      vy: 0,
      age: Math.random() * 2.0,
    });
  }
  return particles;
}

/**
 * Velocity profile function v(r) across normalized radial position rNorm in [-1, +1].
 */
export function getLocalVelocity(derived: ViscosityDerived, rNorm: number): number {
  const rClamped = Math.min(1.0, Math.max(-1.0, Math.abs(rNorm)));
  if (derived.regime === 'laminar') {
    // Parabolic profile: v(r) = vMax * (1 - r^2)
    return derived.maxVelocity * (1 - rClamped * rClamped);
  } else if (derived.regime === 'transition') {
    // Blended profile
    return derived.maxVelocity * Math.pow(1 - rClamped, 0.4);
  } else {
    // Turbulent 1/7th power law: v(r) = vMax * (1 - r)^(1/7)
    return derived.maxVelocity * Math.pow(Math.max(0, 1 - rClamped), 1 / 7);
  }
}

/**
 * Create initial simulation model state.
 */
export function createViscosityModel(params: ViscosityParams): ViscosityState {
  const derived = computeViscosityModel(params);
  return {
    t: 0,
    derived,
    dyeParticles: initDyeParticles(120),
  };
}

/**
 * Step simulation state forward by dt seconds.
 */
export function stepViscosityModel(
  state: ViscosityState,
  params: ViscosityParams,
  dt: number,
): ViscosityState {
  const newT = state.t + dt;
  const derived = computeViscosityModel(params);

  // Advance and perturb dye particles based on regime
  const updatedDye = state.dyeParticles.map((p) => {
    const localV = getLocalVelocity(derived, p.y);
    // Speed factor to animate nicely on screen
    const speedRatio = Math.max(0.1, Math.min(3.0, derived.avgVelocity));
    const advanceX = (localV / Math.max(0.01, derived.maxVelocity)) * speedRatio * 0.45 * dt;

    let nextX = p.x + advanceX;
    let nextY = p.y;
    let nextAge = p.age + dt;

    // Turbulence perturbations
    if (derived.regime === 'laminar') {
      // Very slight molecular diffusion
      nextY += (Math.random() - 0.5) * 0.002;
      nextY = Math.max(-0.92, Math.min(0.92, nextY));
    } else if (derived.regime === 'transition') {
      // Sinuous wave motion breaking into vortices
      const wave = Math.sin(nextX * 22 + newT * 8) * 0.025;
      nextY += wave + (Math.random() - 0.5) * 0.02;
      nextY = Math.max(-0.92, Math.min(0.92, nextY));
    } else {
      // Full chaotic turbulent eddies dispersing across entire diameter
      const eddy = (Math.random() - 0.5) * 0.12 * Math.min(1.0, nextX * 1.5);
      nextY += eddy;
      nextY = Math.max(-0.92, Math.min(0.92, nextY));
    }

    // Respawn particle at injection point once it leaves the pipe
    if (nextX > 1.05) {
      nextX = 0.0;
      nextY = (Math.random() - 0.5) * 0.04;
      nextAge = 0;
    }

    return {
      x: nextX,
      y: nextY,
      vx: localV,
      vy: 0,
      age: nextAge,
    };
  });

  return {
    t: newT,
    derived,
    dyeParticles: updatedDye,
  };
}
