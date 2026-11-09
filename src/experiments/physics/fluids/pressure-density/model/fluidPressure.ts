/**
 * Fluid Pressure & Density Physics Model
 * Strict Separation: Pure TypeScript, SI units, no Vue, no DOM dependencies.
 * Models:
 * 1. Hydrostatic Pressure: P = P0 + rho * g * h
 * 2. Gauge Pressure: P_gauge = rho * g * h
 * 3. U-Tube Manometer equilibrium: rho1 * h1 = rho2 * h2
 * 4. Temperature-dependent density: rho(T) = rho0 * (1 - beta * (T - T0))
 */

export type FluidType = 'water' | 'gasoline' | 'seawater' | 'honey' | 'mercury' | 'custom';
export type TankMode = 'tank' | 'u-tube';

export interface FluidPressureParams {
  tankMode: TankMode;
  fluidType: FluidType;
  customDensity: number; // kg/m^3
  fluid2Density: number; // kg/m^3 for U-tube second fluid
  gravity: number; // m/s^2 (default 9.80665)
  probeDepth: number; // meters below surface (h)
  atmosphericPressure: number; // Pa (default 101325)
  includeAtmosphere: boolean; // true = absolute pressure, false = gauge pressure
  temperature: number; // Celsius (default 20 C)
  sensorNoiseLevel: number; // Pa of instrument uncertainty in real mode
  isRealMode: boolean;
}

export interface FluidPressureState {
  t: number;
  depth: number; // meters
  density: number; // effective density in kg/m^3 (accounting for temperature in real mode)
  gaugePressure: number; // Pascals (rho * g * h)
  absolutePressure: number; // Pascals (P0 + rho * g * h)
  measuredPressure: number; // Pascals (gauge or absolute + sensor noise)
  fluidColumnHeight1: number; // meters in left arm (U-tube)
  fluidColumnHeight2: number; // meters in right arm (U-tube)
  manometerDeltaH: number; // h1 - h2
}

/**
 * Returns baseline fluid density at 20°C in kg/m^3.
 */
export function getBaseDensity(type: FluidType, customDensity: number): number {
  switch (type) {
    case 'gasoline':
      return 700;
    case 'seawater':
      return 1025;
    case 'honey':
      return 1420;
    case 'mercury':
      return 13600;
    case 'custom':
      return customDensity;
    case 'water':
    default:
      return 1000;
  }
}

/**
 * Computes effective density adjusted for thermal expansion:
 * rho(T) = rho0 / (1 + beta * (T - 20))
 */
export function computeEffectiveDensity(
  baseDensity: number,
  temperatureC: number,
  isRealMode: boolean
): number {
  if (!isRealMode) return baseDensity;
  const beta = 2.1e-4; // Volumetric thermal expansion coefficient for liquid (1/K)
  const deltaT = temperatureC - 20;
  return baseDensity / (1 + beta * deltaT);
}

/**
 * Computes theoretical hydrostatic pressure:
 * P_gauge = rho * g * h
 * P_abs = P0 + P_gauge
 */
export function computeHydrostaticPressure(
  density: number,
  depth: number,
  gravity: number,
  pAtm: number,
  includeAtmosphere: boolean
): { gauge: number; absolute: number; reported: number } {
  const gauge = density * gravity * Math.max(0, depth);
  const absolute = pAtm + gauge;
  const reported = includeAtmosphere ? absolute : gauge;
  return { gauge, absolute, reported };
}

/**
 * Computes U-tube equilibrium height in right arm given height in left arm:
 * rho1 * h1 = rho2 * h2 => h2 = h1 * (rho1 / rho2)
 */
export function computeUTubeEquilibrium(
  rho1: number,
  h1: number,
  rho2: number
): { h1: number; h2: number; deltaH: number } {
  const h2 = Math.max(0, h1 * (rho1 / Math.max(1, rho2)));
  return {
    h1,
    h2,
    deltaH: Math.abs(h1 - h2),
  };
}

/**
 * Initializes the fluid pressure simulation state.
 */
export function createFluidPressureModel(params: FluidPressureParams): FluidPressureState {
  const baseRho = getBaseDensity(params.fluidType, params.customDensity);
  const effRho = computeEffectiveDensity(baseRho, params.temperature, params.isRealMode);

  const pCalc = computeHydrostaticPressure(
    effRho,
    params.probeDepth,
    params.gravity,
    params.atmosphericPressure,
    params.includeAtmosphere
  );

  const uCalc = computeUTubeEquilibrium(effRho, params.probeDepth, params.fluid2Density);

  return {
    t: 0,
    depth: params.probeDepth,
    density: effRho,
    gaugePressure: pCalc.gauge,
    absolutePressure: pCalc.absolute,
    measuredPressure: pCalc.reported,
    fluidColumnHeight1: uCalc.h1,
    fluidColumnHeight2: uCalc.h2,
    manometerDeltaH: uCalc.deltaH,
  };
}

/**
 * Steps the fluid pressure simulation (updates live probe readings & sensor noise).
 */
export function stepFluidPressureModel(
  state: FluidPressureState,
  params: FluidPressureParams,
  dt: number
): FluidPressureState {
  const baseRho = getBaseDensity(params.fluidType, params.customDensity);
  const effRho = computeEffectiveDensity(baseRho, params.temperature, params.isRealMode);

  const pCalc = computeHydrostaticPressure(
    effRho,
    params.probeDepth,
    params.gravity,
    params.atmosphericPressure,
    params.includeAtmosphere
  );

  const uCalc = computeUTubeEquilibrium(effRho, params.probeDepth, params.fluid2Density);

  // Sensor instrument noise in real mode
  let noise = 0;
  if (params.isRealMode && params.sensorNoiseLevel > 0) {
    const seed = Math.sin(state.t * 37.1) * 43758.5453;
    const rnd = seed - Math.floor(seed); // pseudo-random [-1, 1]
    noise = (rnd - 0.5) * 2 * params.sensorNoiseLevel;
  }

  const measured = Math.max(0, pCalc.reported + noise);

  return {
    t: state.t + dt,
    depth: params.probeDepth,
    density: effRho,
    gaugePressure: pCalc.gauge,
    absolutePressure: pCalc.absolute,
    measuredPressure: measured,
    fluidColumnHeight1: uCalc.h1,
    fluidColumnHeight2: uCalc.h2,
    manometerDeltaH: uCalc.deltaH,
  };
}
