/**
 * Conservation of Energy (Skate Park) Physics Model
 * Strict Separation: Pure TypeScript, SI units, no Vue, no DOM dependencies.
 * Uses exact Lagrangian equation of motion along arbitrary track curves y(x):
 * x'' = (-g * y' - y' * y'' * x'^2) / (1 + y'^2) - friction
 */

export type TrackShape = 'u-ramp' | 'double-well' | 'slope';

export interface SkateParkParams {
  trackShape: TrackShape;
  skaterMass: number; // kg
  gravity: number; // m/s^2 (e.g. Earth 9.80665)
  trackFrictionMu: number; // kinetic friction coefficient in real mode
  initialHeight: number; // starting height y0 in meters
  isRealMode: boolean;
}

export interface SkateParkState {
  t: number;
  x: number; // x position in meters
  y: number; // y position in meters
  vx: number; // dx/dt
  speed: number; // scalar speed |v| = sqrt(x'^2 + y'^2) = |x'| * sqrt(1 + y'^2)
  vTangential: number; // signed tangential velocity
  tangentialAcc: number;
  normalForce: number; // Newtons
  potentialEnergy: number; // Joules (m * g * y)
  kineticEnergy: number; // Joules (0.5 * m * v^2)
  thermalEnergy: number; // Joules (accumulated friction work)
  totalEnergy: number; // Joules (PE + KE + Thermal)
  isOffTrack: boolean;
}

/**
 * Returns height y, first derivative dy/dx, and second derivative d2y/dx2.
 */
export function getTrackGeometry(
  x: number,
  shape: TrackShape
): { y: number; slope: number; d2ydx2: number; theta: number } {
  let y = 0;
  let dydx = 0;
  let d2ydx2 = 0;

  switch (shape) {
    case 'double-well': {
      // W-shaped double dip: y = 0.015*x^4 - 0.25*x^2 + 2.5
      y = 0.015 * Math.pow(x, 4) - 0.25 * Math.pow(x, 2) + 2.5;
      dydx = 0.06 * Math.pow(x, 3) - 0.5 * x;
      d2ydx2 = 0.18 * Math.pow(x, 2) - 0.5;
      break;
    }
    case 'slope': {
      // Incline transitioning to flat run-out
      if (x < -2) {
        y = -0.6 * (x + 2) + 1.2;
        dydx = -0.6;
        d2ydx2 = 0;
      } else if (x < 2) {
        const u = (x + 2) / 4;
        y = 1.2 * (1 - 3 * u * u + 2 * u * u * u);
        dydx = (1.2 / 4) * (-6 * u + 6 * u * u);
        d2ydx2 = (1.2 / 16) * (-6 + 12 * u);
      } else {
        y = 0;
        dydx = 0;
        d2ydx2 = 0;
      }
      break;
    }
    case 'u-ramp':
    default: {
      // Parabolic symmetric U-ramp: y = 0.18 * x^2
      y = 0.18 * x * x;
      dydx = 0.36 * x;
      d2ydx2 = 0.36;
      break;
    }
  }

  const theta = Math.atan(dydx);
  return { y, slope: dydx, d2ydx2, theta };
}

/**
 * Computes exact x'' acceleration from Lagrangian mechanics:
 * x'' = (-g * y' - y' * y'' * x'^2) / (1 + y'^2) - friction_term
 */
function computeAcceleration(
  x: number,
  vx: number,
  params: SkateParkParams
): { ax: number; normalForce: number; speed: number; frictionWorkRate: number } {
  const geom = getTrackGeometry(x, params.trackShape);
  const yp = geom.slope;
  const ypp = geom.d2ydx2;
  const g = params.gravity;
  const m = params.skaterMass;

  const denom = 1 + yp * yp;
  const speed = Math.abs(vx) * Math.sqrt(denom);

  // Exact normal force magnitude: N = m * (g * cos(theta) + speed^2 * kappa)
  const normalForce = Math.max(
    0,
    m * ((g + vx * vx * ypp) / Math.sqrt(denom))
  );

  let ax = (-g * yp - yp * ypp * vx * vx) / denom;
  let frictionWorkRate = 0;

  if (params.isRealMode && params.trackFrictionMu > 0 && normalForce > 0) {
    const frictionForce = params.trackFrictionMu * normalForce;
    frictionWorkRate = frictionForce * speed;

    if (Math.abs(speed) > 1e-4) {
      const aFricTangential = frictionForce / m;
      ax -= Math.sign(vx) * (aFricTangential / Math.sqrt(denom));
    } else if (Math.abs(g * yp) <= (params.trackFrictionMu * normalForce) / m) {
      ax = 0;
    }
  }

  return { ax, normalForce, speed, frictionWorkRate };
}

/**
 * Initializes the skate park simulation state.
 */
export function createSkateParkModel(params: SkateParkParams): SkateParkState {
  let startX = -Math.sqrt(Math.max(0, params.initialHeight / 0.18));
  if (params.trackShape === 'double-well') {
    startX = -3.8;
  } else if (params.trackShape === 'slope') {
    startX = -4.5;
  }

  const geom = getTrackGeometry(startX, params.trackShape);
  const pe = params.skaterMass * params.gravity * Math.max(0, geom.y);

  return {
    t: 0,
    x: startX,
    y: geom.y,
    vx: 0,
    speed: 0,
    vTangential: 0,
    tangentialAcc: 0,
    normalForce: params.skaterMass * params.gravity * Math.cos(geom.theta),
    potentialEnergy: pe,
    kineticEnergy: 0,
    thermalEnergy: 0,
    totalEnergy: pe,
    isOffTrack: false,
  };
}

/**
 * Steps the simulation using 4th-order Runge-Kutta (RK4) for the exact Lagrangian ODE.
 */
export function stepSkateParkModel(
  state: SkateParkState,
  params: SkateParkParams,
  dt: number
): SkateParkState {
  if (state.isOffTrack) return state;

  const m = params.skaterMass;
  const g = params.gravity;

  // RK4 Integration for [x, vx]
  const k1v = computeAcceleration(state.x, state.vx, params);
  const k1_vx = k1v.ax;
  const k1_x = state.vx;

  const x_mid1 = state.x + 0.5 * dt * k1_x;
  const vx_mid1 = state.vx + 0.5 * dt * k1_vx;
  const k2v = computeAcceleration(x_mid1, vx_mid1, params);
  const k2_vx = k2v.ax;
  const k2_x = vx_mid1;

  const x_mid2 = state.x + 0.5 * dt * k2_x;
  const vx_mid2 = state.vx + 0.5 * dt * k2_vx;
  const k3v = computeAcceleration(x_mid2, vx_mid2, params);
  const k3_vx = k3v.ax;
  const k3_x = vx_mid2;

  const x_end = state.x + dt * k3_x;
  const vx_end = state.vx + dt * k3_vx;
  const k4v = computeAcceleration(x_end, vx_end, params);
  const k4_vx = k4v.ax;
  const k4_x = vx_end;

  const nextX = state.x + (dt / 6) * (k1_x + 2 * k2_x + 2 * k3_x + k4_x);
  let nextVx = state.vx + (dt / 6) * (k1_vx + 2 * k2_vx + 2 * k3_vx + k4_vx);

  if (params.isRealMode && state.vx * nextVx < 0 && Math.abs(nextVx) < 0.05) {
    const checkAcc = computeAcceleration(nextX, 0, params);
    if (Math.abs(checkAcc.ax) < 1e-4) {
      nextVx = 0;
    }
  }

  const nextGeom = getTrackGeometry(nextX, params.trackShape);
  const denom = 1 + nextGeom.slope * nextGeom.slope;
  const speed = Math.abs(nextVx) * Math.sqrt(denom);
  const vTangential = nextVx * Math.sqrt(denom);

  const pe = m * g * Math.max(0, nextGeom.y);
  const ke = 0.5 * m * speed * speed;

  const avgFrictionPower =
    (k1v.frictionWorkRate + 2 * k2v.frictionWorkRate + 2 * k3v.frictionWorkRate + k4v.frictionWorkRate) / 6;
  const thermalEnergy = state.thermalEnergy + avgFrictionPower * dt;
  const totalEnergy = pe + ke + thermalEnergy;

  return {
    t: state.t + dt,
    x: nextX,
    y: nextGeom.y,
    vx: nextVx,
    speed,
    vTangential,
    tangentialAcc: k1v.ax * Math.sqrt(denom),
    normalForce: k1v.normalForce,
    potentialEnergy: pe,
    kineticEnergy: ke,
    thermalEnergy,
    totalEnergy,
    isOffTrack: false,
  };
}
