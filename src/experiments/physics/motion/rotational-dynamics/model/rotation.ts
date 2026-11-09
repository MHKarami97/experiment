/**
 * Rigid Body Rotation & Gyroscopic Dynamics Physics Model
 * Strict Separation: Pure TypeScript, SI units, no Vue, no DOM dependencies.
 */

export type RotorShape = 'disk' | 'hoop' | 'sphere' | 'rod';

export interface RotationParams {
  rotorShape: RotorShape;
  rotorMass: number; // M in kg
  rotorRadius: number; // R in meters (or length L/2 for rod)
  hangingMass: number; // m in kg (falling hanging weight driving rotation)
  spindleRadius: number; // r in meters (string wrapped around spindle)
  gConst: number; // 9.80665 m/s^2
  bearingFriction: number; // N*m dry friction in real mode
  viscousDamping: number; // N*m*s/rad aerodynamic drag in real mode
  gyroSpinRate?: number; // rad/s spin rate for gyroscopic precession mode
  pivotDistance?: number; // d in meters for gyroscopic precession
  isRealMode: boolean;
}

export interface RotationState {
  t: number;
  theta: number; // rad
  omega: number; // rad/s
  alpha: number; // rad/s^2
  momentOfInertia: number; // kg*m^2
  netTorque: number; // N*m
  angularMomentum: number; // kg*m^2/s (L = I * omega)
  rotationalKineticEnergy: number; // Joules (1/2 * I * omega^2)
  stringTension: number; // N
  hangingPosition: number; // meters fallen
  precessionRate: number; // rad/s (for gyroscope mode)
}

/**
 * Computes theoretical moment of inertia I for standard geometric shapes.
 */
export function computeMomentOfInertia(shape: RotorShape, mass: number, radius: number): number {
  switch (shape) {
    case 'hoop':
      // Thin cylindrical ring: I = M * R^2
      return mass * radius * radius;
    case 'sphere':
      // Solid uniform sphere: I = 2/5 * M * R^2
      return 0.4 * mass * radius * radius;
    case 'rod':
      // Thin rod pivoted through center: I = 1/12 * M * L^2, where L = 2 * R
      return (1 / 12) * mass * Math.pow(2 * radius, 2);
    case 'disk':
    default:
      // Solid uniform cylinder / disk: I = 1/2 * M * R^2
      return 0.5 * mass * radius * radius;
  }
}

/**
 * Computes analytical linear acceleration and angular acceleration for hanging mass drive:
 * a_lin = (m * g) / (m + I / r^2)
 * alpha = a_lin / r
 * Tension T = m * (g - a_lin) = (m * g * I) / (m * r^2 + I)
 */
export function computeAnalyticalRotation(params: RotationParams): {
  I: number;
  linearAcc: number;
  angularAcc: number;
  tension: number;
  precessionRate: number;
} {
  const I = computeMomentOfInertia(params.rotorShape, params.rotorMass, params.rotorRadius);
  const r = params.spindleRadius;
  const m = params.hangingMass;
  const g = params.gConst;

  let linearAcc = 0;
  let angularAcc = 0;
  let tension = 0;

  if (m > 0 && r > 0) {
    const effectiveMass = m + I / (r * r);
    linearAcc = (m * g) / effectiveMass;
    angularAcc = linearAcc / r;
    tension = m * (g - linearAcc);
  }

  // Gyroscopic precession: Omega_p = (M * g * d) / (I * omega_s)
  let precessionRate = 0;
  const omegaS = params.gyroSpinRate || 0;
  const d = params.pivotDistance || 0.15;
  if (omegaS > 1e-3 && I > 1e-6) {
    const tauG = params.rotorMass * g * d;
    const Ls = I * omegaS;
    precessionRate = tauG / Ls;
  }

  return {
    I,
    linearAcc,
    angularAcc,
    tension,
    precessionRate,
  };
}

/**
 * Initializes the rotation simulation state.
 */
export function createRotationModel(params: RotationParams): RotationState {
  const analytical = computeAnalyticalRotation(params);
  return {
    t: 0,
    theta: 0,
    omega: 0,
    alpha: analytical.angularAcc,
    momentOfInertia: analytical.I,
    netTorque: analytical.tension * params.spindleRadius,
    angularMomentum: 0,
    rotationalKineticEnergy: 0,
    stringTension: analytical.tension,
    hangingPosition: 0,
    precessionRate: analytical.precessionRate,
  };
}

/**
 * Steps the rotational model using Velocity-Verlet / symplectic integration.
 */
export function stepRotationModel(
  state: RotationState,
  params: RotationParams,
  dt: number
): RotationState {
  const I = computeMomentOfInertia(params.rotorShape, params.rotorMass, params.rotorRadius);
  const r = params.spindleRadius;
  const m = params.hangingMass;
  const g = params.gConst;

  // Hanging mass reaches floor at ~1.5m, after which string goes slack and driving torque drops to zero
  const isStringDriving = m > 0 && state.hangingPosition < 1.5;

  let drivingTorque = 0;
  let tension = 0;
  if (isStringDriving && r > 0) {
    const effectiveMass = m + I / (r * r);
    const aLin = (m * g) / effectiveMass;
    tension = m * (g - aLin);
    drivingTorque = tension * r;
  }

  // Resisting torques in real mode (dry Coulomb bearing friction + viscous drag)
  let frictionTorque = 0;
  if (params.isRealMode) {
    if (Math.abs(state.omega) > 1e-4) {
      const dryFriction = Math.sign(state.omega) * params.bearingFriction;
      const viscousDrag = params.viscousDamping * state.omega;
      frictionTorque = dryFriction + viscousDrag;
    } else if (drivingTorque <= params.bearingFriction) {
      // Static friction prevents motion initiation
      frictionTorque = drivingTorque;
    }
  }

  const netTorque = drivingTorque - frictionTorque;
  const alpha = netTorque / I;

  // Symplectic Verlet integration
  const nextOmega = Math.max(0, state.omega + alpha * dt); // unspooling in positive direction
  const avgOmega = 0.5 * (state.omega + nextOmega);
  const nextTheta = state.theta + avgOmega * dt;

  const linSpeed = avgOmega * r;
  const nextHangingPos = isStringDriving
    ? Math.min(1.5, state.hangingPosition + linSpeed * dt)
    : state.hangingPosition;

  const angularMomentum = I * nextOmega;
  const kineticEnergy = 0.5 * I * nextOmega * nextOmega;

  const analytical = computeAnalyticalRotation(params);

  return {
    t: state.t + dt,
    theta: nextTheta,
    omega: nextOmega,
    alpha,
    momentOfInertia: I,
    netTorque,
    angularMomentum,
    rotationalKineticEnergy: kineticEnergy,
    stringTension: isStringDriving ? tension : 0,
    hangingPosition: nextHangingPos,
    precessionRate: analytical.precessionRate,
  };
}
