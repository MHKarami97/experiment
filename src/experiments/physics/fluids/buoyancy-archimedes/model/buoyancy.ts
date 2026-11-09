/**
 * Buoyancy & Archimedes' Principle Physics Model
 * Strict Separation: Pure TypeScript, SI units, no Vue, no DOM dependencies.
 *
 * Governing Equations:
 * 1. Weight: W = m * g = rho_block * V_total * g
 * 2. Buoyant Force: F_b = rho_fluid * V_submerged * g
 * 3. Apparent Weight: W_app = max(0, W - F_b)
 * 4. Floating Equilibrium: V_sub / V_total = min(1, rho_block / rho_fluid)
 * 5. Dynamic Equation of Vertical Motion:
 *    m * y'' = F_b(y) - W - F_drag(v) + F_normal
 */

export type BlockMaterial = 'wood-balsa' | 'wood-pine' | 'ice' | 'aluminum' | 'iron' | 'lead' | 'custom';
export type FluidSubstance = 'water' | 'gasoline' | 'seawater' | 'honey' | 'mercury';

export interface BuoyancyParams {
  material: BlockMaterial;
  customBlockDensity: number; // kg/m^3
  fluidType: FluidSubstance;
  blockVolume: number; // m^3 (e.g. 0.001 m^3 = 1 Liter)
  blockCrossSection: number; // m^2 (e.g. 0.01 m^2 => height = Volume / Area = 0.1 m = 10 cm)
  gravity: number; // m/s^2 (default 9.80665)
  fluidViscosity: number; // Pa*s damping in real mode
  sensorNoiseLevel: number; // N uncertainty on spring scale
  isRealMode: boolean;
  tetherAttached: boolean; // suspended from spring scale hanging above fluid
  suspensionHeight: number; // meters from liquid surface (negative = submerged)
}

export interface BuoyancyState {
  t: number;
  y: number; // vertical position of block bottom relative to liquid surface (y = 0 is surface, y < 0 is submerged)
  v: number; // vertical velocity (m/s)
  mass: number; // kg
  blockDensity: number; // kg/m^3
  fluidDensity: number; // kg/m^3
  submergedFraction: number; // 0 to 1
  submergedVolume: number; // m^3
  displacedMass: number; // kg of liquid displaced
  weight: number; // N (m * g)
  buoyantForce: number; // N (rho_f * V_sub * g)
  netForce: number; // N
  apparentWeight: number; // N recorded on suspension scale
  scaleReading: number; // N (apparent weight + real mode noise)
  isFloating: boolean;
  isRestingOnFloor: boolean;
}

export function getMaterialDensity(mat: BlockMaterial, customDensity: number): number {
  switch (mat) {
    case 'wood-balsa':
      return 150;
    case 'wood-pine':
      return 600;
    case 'ice':
      return 917;
    case 'aluminum':
      return 2700;
    case 'iron':
      return 7870;
    case 'lead':
      return 11340;
    case 'custom':
    default:
      return customDensity;
  }
}

export function getFluidDensity(fluid: FluidSubstance): number {
  switch (fluid) {
    case 'gasoline':
      return 700;
    case 'seawater':
      return 1025;
    case 'honey':
      return 1420;
    case 'mercury':
      return 13600;
    case 'water':
    default:
      return 1000;
  }
}

/**
 * Computes theoretical equilibrium submerged fraction:
 * fraction = min(1, rho_block / rho_fluid)
 */
export function computeTheoreticalSubmergedFraction(rhoBlock: number, rhoFluid: number): number {
  if (rhoFluid <= 0) return 1;
  return Math.max(0, Math.min(1, rhoBlock / rhoFluid));
}

/**
 * Computes buoyant force for a given submerged volume:
 * F_b = rho_fluid * V_sub * g
 */
export function computeBuoyantForce(rhoFluid: number, vSub: number, g: number): number {
  return rhoFluid * Math.max(0, vSub) * g;
}

/**
 * Computes apparent weight measured by a spring balance:
 * W_apparent = max(0, W - F_b)
 */
export function computeApparentWeight(weight: number, buoyantForce: number): number {
  return Math.max(0, weight - buoyantForce);
}

/**
 * Initializes the buoyancy state.
 */
export function createBuoyancyModel(params: BuoyancyParams): BuoyancyState {
  const rhoBlock = getMaterialDensity(params.material, params.customBlockDensity);
  const rhoFluid = getFluidDensity(params.fluidType);
  const mass = rhoBlock * params.blockVolume;
  const weight = mass * params.gravity;

  const blockHeight = params.blockVolume / Math.max(1e-4, params.blockCrossSection);
  const tankFloorDepth = 1.0; // 1 meter tank depth

  let y: number;
  let submergedFraction: number;

  if (params.tetherAttached) {
    // Block suspended from scale at suspensionHeight
    // Depth of bottom below surface: y = params.suspensionHeight
    y = params.suspensionHeight;
    const submergedDepth = Math.max(0, Math.min(blockHeight, -y));
    submergedFraction = Math.max(0, Math.min(1, submergedDepth / blockHeight));
  } else {
    // Free floating or resting equilibrium
    submergedFraction = computeTheoreticalSubmergedFraction(rhoBlock, rhoFluid);
    if (submergedFraction < 1) {
      // Floating at equilibrium
      const submergedDepth = blockHeight * submergedFraction;
      y = -submergedDepth;
    } else {
      // Sunk to bottom
      y = -tankFloorDepth;
    }
  }

  const submergedVolume = submergedFraction * params.blockVolume;
  const fb = computeBuoyantForce(rhoFluid, submergedVolume, params.gravity);
  const displacedMass = rhoFluid * submergedVolume;
  const appWeight = computeApparentWeight(weight, fb);

  return {
    t: 0,
    y,
    v: 0,
    mass,
    blockDensity: rhoBlock,
    fluidDensity: rhoFluid,
    submergedFraction,
    submergedVolume,
    displacedMass,
    weight,
    buoyantForce: fb,
    netForce: 0,
    apparentWeight: appWeight,
    scaleReading: appWeight,
    isFloating: submergedFraction < 1 && !params.tetherAttached,
    isRestingOnFloor: y <= -tankFloorDepth && !params.tetherAttached,
  };
}

/**
 * Numerical step for dynamic vertical bobbing oscillation or suspended probe.
 */
export function stepBuoyancyModel(
  state: BuoyancyState,
  params: BuoyancyParams,
  dt: number
): BuoyancyState {
  const rhoBlock = getMaterialDensity(params.material, params.customBlockDensity);
  const rhoFluid = getFluidDensity(params.fluidType);
  const mass = rhoBlock * params.blockVolume;
  const weight = mass * params.gravity;
  const blockHeight = params.blockVolume / Math.max(1e-4, params.blockCrossSection);
  const tankFloorDepth = 1.0;

  let y = state.y;
  let v = state.v;
  let isRestingOnFloor = false;

  if (params.tetherAttached) {
    // Tethered at fixed scale height
    y = params.suspensionHeight;
    v = 0;
  } else {
    // Dynamic integration (fluid drag + buoyancy + gravity)
    // 1. Calculate submerged volume at current y
    // y is position of block bottom relative to water surface (y = 0).
    // top of block is at y + blockHeight.
    // Liquid spans from surface down to -tankFloorDepth.
    let submergedDepth = 0;
    if (y < 0) {
      submergedDepth = Math.min(blockHeight, -y);
    }
    const submergedFraction = Math.max(0, Math.min(1, submergedDepth / blockHeight));
    const submergedVolume = submergedFraction * params.blockVolume;
    const fb = computeBuoyantForce(rhoFluid, submergedVolume, params.gravity);

    // Damping drag
    const fluidDragCoeff = params.isRealMode ? params.fluidViscosity * 30 + 15 : 8; // gentle fluid damping
    const dragForce = -fluidDragCoeff * v;

    let netF = fb - weight + dragForce;

    // Tank floor contact: y cannot go below -tankFloorDepth
    if (y <= -tankFloorDepth && netF <= 0) {
      y = -tankFloorDepth;
      v = 0;
      netF = 0;
      isRestingOnFloor = true;
    } else {
      const a = netF / mass;
      v += a * dt;
      y += v * dt;

      if (y < -tankFloorDepth) {
        y = -tankFloorDepth;
        v = 0;
        isRestingOnFloor = true;
      }
    }
  }

  // Recalculate forces at new y
  let submergedDepth = 0;
  if (y < 0) {
    submergedDepth = Math.min(blockHeight, -y);
  }
  const submergedFraction = Math.max(0, Math.min(1, submergedDepth / blockHeight));
  const submergedVolume = submergedFraction * params.blockVolume;
  const fb = computeBuoyantForce(rhoFluid, submergedVolume, params.gravity);
  const displacedMass = rhoFluid * submergedVolume;
  const appWeight = computeApparentWeight(weight, fb);

  // Scale instrument noise in real mode
  let noise = 0;
  if (params.isRealMode && params.sensorNoiseLevel > 0) {
    const seed = Math.sin((state.t + dt) * 51.3) * 43758.5453;
    const rnd = seed - Math.floor(seed);
    noise = (rnd - 0.5) * 2 * params.sensorNoiseLevel;
  }
  const scaleReading = Math.max(0, appWeight + noise);

  return {
    t: state.t + dt,
    y,
    v,
    mass,
    blockDensity: rhoBlock,
    fluidDensity: rhoFluid,
    submergedFraction,
    submergedVolume,
    displacedMass,
    weight,
    buoyantForce: fb,
    netForce: fb - weight,
    apparentWeight: appWeight,
    scaleReading,
    isFloating: submergedFraction < 1 && !params.tetherAttached && !isRestingOnFloor,
    isRestingOnFloor,
  };
}
