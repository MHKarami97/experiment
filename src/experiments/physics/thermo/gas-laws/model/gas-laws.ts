/**
 * Physical model for Gas Laws & Molecular Kinetics.
 * Pure TypeScript — no DOM, no Vue dependencies.
 */

export const R_IDEAL = 8.314462618; // J / (mol * K)
export const BOLTZMANN = 1.380649e-23; // J / K
export const AVOGADRO = 6.02214076e23; // mol^-1

export type GasType = 'helium' | 'neon' | 'argon' | 'nitrogen' | 'co2';
export type GasLawMode = 'ideal' | 'boyle' | 'charles' | 'gayLussac';

export interface GasProperties {
  name: GasType;
  molarMassKg: number; // kg / mol
  vdwA: number; // Pa * m^6 / mol^2 (Van der Waals parameter a)
  vdwB: number; // m^3 / mol (Van der Waals parameter b)
  colorHex: string;
  particleRadius: number;
}

export const GAS_DATABASE: Record<GasType, GasProperties> = {
  helium: {
    name: 'helium',
    molarMassKg: 0.0040026,
    vdwA: 0.00346,
    vdwB: 0.0000237,
    colorHex: '#38bdf8',
    particleRadius: 3.5,
  },
  neon: {
    name: 'neon',
    molarMassKg: 0.02018,
    vdwA: 0.0215,
    vdwB: 0.0000171,
    colorHex: '#fb7185',
    particleRadius: 4.0,
  },
  argon: {
    name: 'argon',
    molarMassKg: 0.039948,
    vdwA: 0.1358,
    vdwB: 0.0000320,
    colorHex: '#c084fc',
    particleRadius: 4.5,
  },
  nitrogen: {
    name: 'nitrogen',
    molarMassKg: 0.028014,
    vdwA: 0.1370,
    vdwB: 0.0000387,
    colorHex: '#34d399',
    particleRadius: 4.2,
  },
  co2: {
    name: 'co2',
    molarMassKg: 0.04401,
    vdwA: 0.3640,
    vdwB: 0.0000427,
    colorHex: '#fbbf24',
    particleRadius: 5.0,
  },
};

export interface GasLawParams {
  lawMode: GasLawMode;
  gasType: GasType;
  moles: number; // n (moles of gas, e.g. 0.5 to 3.0 mol)
  volumeLiters: number; // V in Liters (e.g. 5 to 35 L)
  temperatureKelvin: number; // T in Kelvin (e.g. 100 to 750 K)
  particleCount: number; // visual representation count (e.g. 50 to 150)
  isRealMode: boolean; // enables Van der Waals real gas correction & collision statistics
}

export interface GasParticle {
  x: number; // normalized position [0, 1] across container width
  y: number; // normalized position [0, 1] within current piston volume height
  vx: number; // velocity in m/s
  vy: number; // velocity in m/s
  speed: number; // speed magnitude in m/s
}

export interface GasLawDerived {
  idealPressureKPa: number; // P_ideal = n R T / V (kPa)
  realPressureKPa: number; // P_vdw = nRT / (V - nb) - a n^2 / V^2 (kPa)
  displayedPressureKPa: number; // kPa based on mode
  rmsSpeed: number; // v_rms = sqrt(3 R T / M) in m/s
  avgKineticEnergyJoules: number; // (3/2) k_B T in Joules
  totalInternalEnergyJoules: number; // U = (3/2) n R T in Joules
  collisionRateHz: number; // wall collision frequency
}

export interface GasLawState {
  t: number; // simulation time
  particles: GasParticle[];
  derived: GasLawDerived;
  wallCollisionsAccumulator: number;
}

/**
 * Compute derived thermodynamic quantities for ideal and real gas equations.
 */
export function computeGasDerivations(params: GasLawParams): GasLawDerived {
  const gas = GAS_DATABASE[params.gasType] || GAS_DATABASE.helium;
  const n = Math.max(0.01, params.moles);
  const vM3 = Math.max(0.001, params.volumeLiters / 1000.0); // convert L to m^3
  const tK = Math.max(10, params.temperatureKelvin);

  // 1. Ideal Gas Law: P = n R T / V
  const pIdealPa = (n * R_IDEAL * tK) / vM3;
  const pIdealKPa = pIdealPa / 1000.0;

  // 2. Van der Waals Real Gas: P = [n R T / (V - n b)] - [a n^2 / V^2]
  const effectiveV = Math.max(0.0001, vM3 - n * gas.vdwB);
  const attractionTerm = (gas.vdwA * Math.pow(n, 2)) / Math.pow(vM3, 2);
  const pVdwPa = Math.max(100, (n * R_IDEAL * tK) / effectiveV - attractionTerm);
  const pVdwKPa = pVdwPa / 1000.0;

  // 3. Kinetic Molecular Theory
  // RMS molecular velocity: v_rms = sqrt(3 R T / M)
  const rmsSpeed = Math.sqrt((3 * R_IDEAL * tK) / gas.molarMassKg);

  // Average kinetic energy per molecule: (3/2) k_B T
  const avgKe = 1.5 * BOLTZMANN * tK;

  // Total internal thermal energy: U = (3/2) n R T
  const totalU = 1.5 * n * R_IDEAL * tK;

  // Wall collision frequency estimate proportional to n * v_rms / V^(1/3)
  const charLength = Math.pow(vM3, 1 / 3);
  const collisionRateHz = (n * AVOGADRO * 1e-21 * rmsSpeed) / charLength;

  return {
    idealPressureKPa: pIdealKPa,
    realPressureKPa: pVdwKPa,
    displayedPressureKPa: params.isRealMode ? pVdwKPa : pIdealKPa,
    rmsSpeed,
    avgKineticEnergyJoules: avgKe,
    totalInternalEnergyJoules: totalU,
    collisionRateHz,
  };
}

/**
 * Initialize particle cloud with Maxwell-Boltzmann inspired speed distribution.
 */
export function initGasParticles(count: number, vRms: number): GasParticle[] {
  const particles: GasParticle[] = [];
  for (let i = 0; i < count; i++) {
    // Generate 2D velocity components with normal-like distribution (Box-Muller)
    const u1 = Math.max(1e-6, Math.random());
    const u2 = Math.random();
    const standardMag = Math.sqrt(-2.0 * Math.log(u1));
    const angle = 2.0 * Math.PI * u2;

    const speedScale = vRms * 0.707; // 2D rms per axis
    const vx = standardMag * Math.cos(angle) * speedScale;
    const vy = standardMag * Math.sin(angle) * speedScale;
    const speed = Math.sqrt(vx * vx + vy * vy);

    particles.push({
      x: 0.05 + Math.random() * 0.9,
      y: 0.05 + Math.random() * 0.9,
      vx,
      vy,
      speed,
    });
  }
  return particles;
}

/**
 * Initialize simulation state.
 */
export function createGasLawModel(params: GasLawParams): GasLawState {
  const derived = computeGasDerivations(params);
  const count = Math.min(180, Math.max(30, params.particleCount));
  return {
    t: 0,
    particles: initGasParticles(count, derived.rmsSpeed),
    derived,
    wallCollisionsAccumulator: 0,
  };
}

/**
 * Step simulation particles and enforce container wall reflections.
 */
export function stepGasLawModel(
  state: GasLawState,
  params: GasLawParams,
  dt: number,
): GasLawState {
  const derived = computeGasDerivations(params);
  let wallCollisions = state.wallCollisionsAccumulator;

  // Normalized visual movement speed factor (so particles animate smoothly on canvas)
  const normFactor = 0.0006;

  const updatedParticles = state.particles.map((p) => {
    let nextX = p.x + p.vx * normFactor * dt * 60;
    let nextY = p.y + p.vy * normFactor * dt * 60;
    let nextVx = p.vx;
    let nextVy = p.vy;

    // Bounce off left / right container walls (x in [0.02, 0.98])
    if (nextX <= 0.03) {
      nextX = 0.03;
      nextVx = Math.abs(nextVx);
      wallCollisions++;
    } else if (nextX >= 0.97) {
      nextX = 0.97;
      nextVx = -Math.abs(nextVx);
      wallCollisions++;
    }

    // Bounce off bottom floor & moving piston roof (y in [0.03, 0.97])
    if (nextY <= 0.03) {
      nextY = 0.03;
      nextVy = Math.abs(nextVy);
      wallCollisions++;
    } else if (nextY >= 0.97) {
      nextY = 0.97;
      nextVy = -Math.abs(nextVy);
      wallCollisions++;
    }

    return {
      x: nextX,
      y: nextY,
      vx: nextVx,
      vy: nextVy,
      speed: Math.sqrt(nextVx * nextVx + nextVy * nextVy),
    };
  });

  return {
    t: state.t + dt,
    particles: updatedParticles,
    derived,
    wallCollisionsAccumulator: wallCollisions,
  };
}
