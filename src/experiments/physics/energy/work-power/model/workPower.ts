/**
 * Work & Power Physics Model
 * Strict Separation: Pure TypeScript, SI units, no Vue, no DOM dependencies.
 * Models:
 * 1. Work-Energy Theorem: W_net = Delta K
 * 2. Force vs Displacement: W = integral(F(x) * cos(theta) * dx)
 * 3. Instantaneous Power: P(t) = F * v * cos(theta)
 * 4. Average Power: P_avg = W / Delta t
 * 5. Mechanical Efficiency: eta = P_useful / P_input
 */

export type ForceProfile = 'constant' | 'linear-ramp' | 'spring' | 'pulsed';

export interface WorkPowerParams {
  forceProfile: ForceProfile;
  appliedForceMax: number; // Newtons (F0)
  forceAngle: number; // degrees (angle relative to motion horizontal, 0 = forward, 30 = pulling upwards)
  payloadMass: number; // kg
  surfaceFrictionMu: number; // friction coefficient mu_k
  springConstant: number; // N/m (when profile is spring)
  gConst: number; // 9.80665 m/s^2
  motorEfficiency: number; // 0.0 to 1.0 (e.g. 0.85 = 85%)
  isRealMode: boolean;
}

export interface WorkPowerState {
  t: number;
  x: number; // horizontal displacement in meters
  v: number; // velocity in m/s
  a: number; // acceleration in m/s^2
  appliedForce: number; // instantaneous applied force F(x) in N
  frictionForce: number; // Newtons
  netForce: number; // F_net = F_x - F_f in N
  workApplied: number; // Joules (integral of F_applied * cos(theta) * dx)
  workFriction: number; // Joules (integral of -f_k * dx)
  workNet: number; // Joules (W_applied + W_friction)
  kineticEnergy: number; // Joules (0.5 * m * v^2)
  instantaneousPower: number; // Watts (F_applied * v * cos(theta))
  inputPower: number; // Watts (instantaneous power / motorEfficiency)
  totalInputEnergy: number; // Joules (integral of inputPower * dt)
  averagePower: number; // Watts (W_applied / t)
  deltaKineticEnergy: number; // Joules (K - K0)
}

/**
 * Computes applied force F(x, t) based on selected force profile.
 */
export function getAppliedForce(x: number, t: number, params: WorkPowerParams): number {
  switch (params.forceProfile) {
    case 'linear-ramp': {
      // Force increases linearly with distance: F(x) = F_max * min(1.0, x / 4.0)
      return params.appliedForceMax * Math.min(1.0, Math.max(0.1, x / 4.0));
    }
    case 'spring': {
      // Linear restoring spring: F(x) = k * (4.0 - x)
      return Math.max(0, params.springConstant * (4.0 - x));
    }
    case 'pulsed': {
      // Periodic motor pulse (e.g. reciprocating engine or intermittent drive)
      const phase = (t % 1.0) / 1.0;
      return phase < 0.6 ? params.appliedForceMax : 0;
    }
    case 'constant':
    default:
      return params.appliedForceMax;
  }
}

/**
 * Initializes the Work & Power simulation state.
 */
export function createWorkPowerModel(params: WorkPowerParams): WorkPowerState {
  const F0 = getAppliedForce(0, 0, params);
  const thetaRad = (params.forceAngle * Math.PI) / 180;
  const Fx = F0 * Math.cos(thetaRad);
  const Fy = F0 * Math.sin(thetaRad);

  const m = params.payloadMass;
  const g = params.gConst;
  const normalForce = Math.max(0, m * g - Fy);

  let friction = 0;
  if (params.isRealMode && params.surfaceFrictionMu > 0) {
    friction = params.surfaceFrictionMu * normalForce;
  }

  const netForce = Math.max(0, Fx - friction);
  const a0 = netForce / m;

  return {
    t: 0,
    x: 0,
    v: 0,
    a: a0,
    appliedForce: F0,
    frictionForce: friction,
    netForce,
    workApplied: 0,
    workFriction: 0,
    workNet: 0,
    kineticEnergy: 0,
    instantaneousPower: 0,
    inputPower: 0,
    totalInputEnergy: 0,
    averagePower: 0,
    deltaKineticEnergy: 0,
  };
}

/**
 * Steps the Work & Power simulation forward using Velocity-Verlet.
 */
export function stepWorkPowerModel(
  state: WorkPowerState,
  params: WorkPowerParams,
  dt: number
): WorkPowerState {
  const thetaRad = (params.forceAngle * Math.PI) / 180;
  const cosTheta = Math.cos(thetaRad);
  const sinTheta = Math.sin(thetaRad);
  const m = params.payloadMass;
  const g = params.gConst;

  // 1. Current acceleration
  const F0 = getAppliedForce(state.x, state.t, params);
  const Fx0 = F0 * cosTheta;
  const Fy0 = F0 * sinTheta;
  const N0 = Math.max(0, m * g - Fy0);
  let f0 = 0;
  if (params.isRealMode && params.surfaceFrictionMu > 0) {
    f0 = params.surfaceFrictionMu * N0;
  }
  let a0 = 0;
  if (state.v > 1e-4) {
    a0 = (Fx0 - f0) / m;
  } else {
    a0 = Math.max(0, Fx0 - f0) / m;
  }

  // 2. Velocity-Verlet half-step velocity and full-step position
  const vMid = state.v + 0.5 * a0 * dt;
  const dx = vMid * dt;
  const nextX = Math.max(0, state.x + dx);

  // 3. New acceleration at next position
  const nextT = state.t + dt;
  const F1 = getAppliedForce(nextX, nextT, params);
  const Fx1 = F1 * cosTheta;
  const Fy1 = F1 * sinTheta;
  const N1 = Math.max(0, m * g - Fy1);
  let f1 = 0;
  if (params.isRealMode && params.surfaceFrictionMu > 0) {
    f1 = params.surfaceFrictionMu * N1;
  }
  let a1 = 0;
  if (vMid > 1e-4) {
    a1 = (Fx1 - f1) / m;
  } else {
    a1 = Math.max(0, Fx1 - f1) / m;
  }

  // 4. Finish velocity
  let nextV = Math.max(0, vMid + 0.5 * a1 * dt);

  // 5. Work integration: dW = F_avg * dx
  const avgAppliedForce = 0.5 * (F0 + F1);
  const dW_applied = avgAppliedForce * cosTheta * dx;
  const avgFriction = 0.5 * (f0 + f1);
  const dW_friction = -avgFriction * dx;

  const workApplied = state.workApplied + dW_applied;
  const workFriction = state.workFriction + dW_friction;
  const workNet = workApplied + workFriction;

  const ke = 0.5 * m * nextV * nextV;
  const instPower = F1 * cosTheta * nextV;
  const eff = params.isRealMode ? Math.max(0.1, params.motorEfficiency) : 1.0;
  const inputPower = instPower / eff;
  const dInputEnergy = dW_applied / eff;
  const totalInputEnergy = state.totalInputEnergy + dInputEnergy;
  const averagePower = nextT > 1e-4 ? workApplied / nextT : 0;

  return {
    t: nextT,
    x: nextX,
    v: nextV,
    a: a1,
    appliedForce: F1,
    frictionForce: f1,
    netForce: Fx1 - f1,
    workApplied,
    workFriction,
    workNet,
    kineticEnergy: ke,
    instantaneousPower: instPower,
    inputPower,
    totalInputEnergy,
    averagePower,
    deltaKineticEnergy: ke,
  };
}
