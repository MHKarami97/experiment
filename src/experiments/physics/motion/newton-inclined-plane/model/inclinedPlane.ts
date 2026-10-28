/**
 * Pure TypeScript Newton's Laws & Inclined Plane Model
 *
 * Governing Equations:
 * Coordinate system: s along incline, 0 at base, L at summit.
 * Positive s is UP the incline.
 * Angle theta with horizontal.
 *
 * Normal force:
 *   N = m * g * cos(theta)
 *
 * Gravity component along incline:
 *   F_g_parallel = -m * g * sin(theta)  (pulls down towards s=0)
 *
 * Active force along incline:
 *   F_active = F_pull - m * g * sin(theta)
 *
 * Static friction threshold:
 *   f_s_max = mu_s * N = mu_s * m * g * cos(theta)
 *
 * Kinetic friction magnitude:
 *   f_k = mu_k * N = mu_k * m * g * cos(theta)
 *
 * Aerodynamic drag (Real mode):
 *   F_drag = -0.5 * rho * Cd * A * v * |v|
 *
 * Dynamic conditions:
 * - If at rest (|v| < v_thresh):
 *     If |F_active| <= f_s_max => a = 0, v = 0, f_friction = -F_active (static equilibrium)
 *     Else => f_friction = -sign(F_active) * f_k, a = (F_active + f_friction) / m
 * - If in motion (|v| >= v_thresh):
 *     f_friction = -sign(v) * f_k
 *     a = (F_active + f_friction + F_drag) / m
 *
 * Integrator: 4th-Order Runge-Kutta (RK4) with zero-crossing detection.
 */

export interface InclinedPlaneParams {
  angle: number;         // Incline angle in degrees (0 to 85)
  mass: number;          // Block mass (kg)
  gravity: number;       // Gravitational acceleration (m/s^2)
  muS: number;           // Static friction coefficient
  muK: number;           // Kinetic friction coefficient (muK <= muS)
  fPull: number;         // External pulling force along incline (N, positive = up)
  initialPos: number;    // Initial position along incline (m, 0 to inclineLength)
  initialSpeed: number;  // Initial velocity along incline (m/s)
  inclineLength: number; // Incline length (m)
  airDensity: number;    // Air density for real mode drag (kg/m^3)
  dragCoeff: number;     // Drag coefficient Cd (dimensionless)
  crossSection: number;  // Frontal area (m^2)
}

export interface InclinedPlaneState {
  t: number;             // Time elapsed (s)
  s: number;             // Position along incline (m)
  v: number;             // Velocity along incline (m/s)
  a: number;             // Acceleration along incline (m/s^2)
  normalForce: number;   // Normal force N (N)
  gravityParallel: number; // Gravity component along incline (N)
  frictionForce: number; // Friction force (N)
  appliedForce: number;  // External pulling force (N)
  dragForce: number;     // Aerodynamic drag force (N)
  netForce: number;      // Net force along incline (N)
  isStatic: boolean;     // Whether block is stuck due to static friction
  kineticEnergy: number; // 0.5 * m * v^2 (J)
  potentialEnergy: number; // m * g * s * sin(theta) (J)
  totalEnergy: number;   // K + U (J)
  atBoundary: 'none' | 'bottom' | 'top';
}

export class InclinedPlaneSimulation {
  private params: InclinedPlaneParams;
  private mode: 'ideal' | 'real';
  private state: InclinedPlaneState;

  constructor(params: InclinedPlaneParams, mode: 'ideal' | 'real' = 'ideal') {
    this.params = { ...params };
    this.mode = mode;
    this.state = this.createInitialState();
  }

  private radAngle(): number {
    return (this.params.angle * Math.PI) / 180;
  }

  public createInitialState(): InclinedPlaneState {
    const theta = this.radAngle();
    const g = this.params.gravity;
    const m = this.params.mass;

    const N = m * g * Math.cos(theta);
    const F_g_par = -m * g * Math.sin(theta);
    const F_pull = this.params.fPull;
    const F_active = F_pull + F_g_par;

    const mu_s = this.mode === 'real' ? this.params.muS : 0;
    const mu_k = this.mode === 'real' ? this.params.muK : 0;
    const f_s_max = mu_s * N;

    let isStatic = false;
    let friction = 0;
    let a = 0;

    const v0 = this.params.initialSpeed;
    if (Math.abs(v0) < 1e-4) {
      if (Math.abs(F_active) <= f_s_max) {
        isStatic = true;
        friction = -F_active;
        a = 0;
      } else {
        friction = -Math.sign(F_active) * (mu_k * N);
        a = (F_active + friction) / m;
      }
    } else {
      friction = -Math.sign(v0) * (mu_k * N);
      a = (F_active + friction) / m;
    }

    const s0 = Math.max(0, Math.min(this.params.inclineLength, this.params.initialPos));
    const K = 0.5 * m * v0 * v0;
    const U = m * g * s0 * Math.sin(theta);

    return {
      t: 0,
      s: s0,
      v: v0,
      a,
      normalForce: N,
      gravityParallel: F_g_par,
      frictionForce: friction,
      appliedForce: F_pull,
      dragForce: 0,
      netForce: m * a,
      isStatic,
      kineticEnergy: K,
      potentialEnergy: U,
      totalEnergy: K + U,
      atBoundary: s0 <= 0 ? 'bottom' : s0 >= this.params.inclineLength ? 'top' : 'none'
    };
  }

  private computeForces(
    _s: number,
    v: number
  ): { a: number; friction: number; drag: number; isStatic: boolean } {
    const theta = this.radAngle();
    const g = this.params.gravity;
    const m = this.params.mass;

    const N = m * g * Math.cos(theta);
    const F_g_par = -m * g * Math.sin(theta);
    const F_pull = this.params.fPull;
    const F_active = F_pull + F_g_par;

    const mu_s = this.mode === 'real' ? this.params.muS : 0;
    const mu_k = this.mode === 'real' ? this.params.muK : 0;
    const f_s_max = mu_s * N;

    let drag = 0;
    if (this.mode === 'real' && this.params.dragCoeff > 0) {
      drag = -0.5 * this.params.airDensity * this.params.dragCoeff * this.params.crossSection * v * Math.abs(v);
    }

    const vThreshold = 1e-3;

    if (Math.abs(v) < vThreshold) {
      if (Math.abs(F_active) <= f_s_max) {
        return { a: 0, friction: -F_active, drag: 0, isStatic: true };
      } else {
        const friction = -Math.sign(F_active) * (mu_k * N);
        const a = (F_active + friction + drag) / m;
        return { a, friction, drag, isStatic: false };
      }
    } else {
      const friction = -Math.sign(v) * (mu_k * N);
      const a = (F_active + friction + drag) / m;
      return { a, friction, drag, isStatic: false };
    }
  }

  public step(dt: number): InclinedPlaneState {
    let s = this.state.s;
    let v = this.state.v;
    let t = this.state.t;

    // Check boundary stops
    if (s <= 0 && v <= 0 && this.computeForces(0, 0).a <= 0) {
      return {
        ...this.state,
        t: t + dt,
        s: 0,
        v: 0,
        a: 0,
        isStatic: true,
        atBoundary: 'bottom'
      };
    }

    if (s >= this.params.inclineLength && v >= 0 && this.computeForces(s, 0).a >= 0) {
      return {
        ...this.state,
        t: t + dt,
        s: this.params.inclineLength,
        v: 0,
        a: 0,
        isStatic: true,
        atBoundary: 'top'
      };
    }

    // RK4 Integration for (s, v)
    // k1
    const deriv1 = this.computeForces(s, v);
    if (deriv1.isStatic) {
      this.state = {
        ...this.state,
        t: t + dt,
        v: 0,
        a: 0,
        frictionForce: deriv1.friction,
        dragForce: 0,
        netForce: 0,
        isStatic: true
      };
      return this.state;
    }

    const ds1 = v;
    const dv1 = deriv1.a;

    // k2
    const s2 = s + 0.5 * dt * ds1;
    const v2 = v + 0.5 * dt * dv1;
    const deriv2 = this.computeForces(s2, v2);
    const ds2 = v2;
    const dv2 = deriv2.a;

    // k3
    const s3 = s + 0.5 * dt * ds2;
    const v3 = v + 0.5 * dt * dv2;
    const deriv3 = this.computeForces(s3, v3);
    const ds3 = v3;
    const dv3 = deriv3.a;

    // k4
    const s4 = s + dt * ds3;
    const v4 = v + dt * dv3;
    const deriv4 = this.computeForces(s4, v4);
    const ds4 = v4;
    const dv4 = deriv4.a;

    let nextS = s + (dt / 6) * (ds1 + 2 * ds2 + 2 * ds3 + ds4);
    let nextV = v + (dt / 6) * (dv1 + 2 * dv2 + 2 * dv3 + dv4);

    // Friction zero crossing check to prevent chatter / reversing without cause
    if (v !== 0 && Math.sign(nextV) !== Math.sign(v)) {
      const restForces = this.computeForces(nextS, 0);
      if (restForces.isStatic) {
        nextV = 0;
      }
    }

    // Boundary clamping
    let atBoundary: 'none' | 'bottom' | 'top' = 'none';
    if (nextS <= 0) {
      nextS = 0;
      nextV = 0;
      atBoundary = 'bottom';
    } else if (nextS >= this.params.inclineLength) {
      nextS = this.params.inclineLength;
      nextV = 0;
      atBoundary = 'top';
    }

    const nextForces = this.computeForces(nextS, nextV);
    const theta = this.radAngle();
    const g = this.params.gravity;
    const m = this.params.mass;
    const K = 0.5 * m * nextV * nextV;
    const U = m * g * nextS * Math.sin(theta);

    this.state = {
      t: t + dt,
      s: nextS,
      v: nextV,
      a: nextForces.a,
      normalForce: m * g * Math.cos(theta),
      gravityParallel: -m * g * Math.sin(theta),
      frictionForce: nextForces.friction,
      appliedForce: this.params.fPull,
      dragForce: nextForces.drag,
      netForce: m * nextForces.a,
      isStatic: nextForces.isStatic,
      kineticEnergy: K,
      potentialEnergy: U,
      totalEnergy: K + U,
      atBoundary
    };

    return this.state;
  }

  public getState(): InclinedPlaneState {
    return { ...this.state };
  }

  public setParams(p: Partial<InclinedPlaneParams>) {
    this.params = { ...this.params, ...p };
  }

  public setMode(m: 'ideal' | 'real') {
    this.mode = m;
  }

  public reset(): InclinedPlaneState {
    this.state = this.createInitialState();
    return this.getState();
  }
}

/**
 * Analytical theoretical solution for validation (frictionless or constant acceleration)
 */
export function computeAnalyticalInclinedPlane(
  params: InclinedPlaneParams,
  mode: 'ideal' | 'real'
): {
  acceleration: number;
  criticalAngleDeg: number;
  timeToBottomFromRest: number | null;
  speedAtBottomFromRest: number | null;
  positionAtT: (t: number) => number;
  velocityAtT: (t: number) => number;
} {
  const theta = (params.angle * Math.PI) / 180;
  const g = params.gravity;
  const m = params.mass;
  const mu_k = mode === 'real' ? params.muK : 0;
  const mu_s = mode === 'real' ? params.muS : 0;

  // Critical angle for spontaneous slide from rest under gravity only: tan(theta_c) = mu_s
  const criticalAngleDeg = (Math.atan(mu_s) * 180) / Math.PI;

  // Downward acceleration along incline: a = g * (sin(theta) - mu_k * cos(theta)) - F_pull / m
  // In our coordinate system (positive = up):
  // F_active = F_pull - m*g*sin(theta)
  // For sliding down (v < 0), friction opposes downwards, so it pushes UP (+mu_k*m*g*cos(theta)):
  // a_down_dir = g * sin(theta) - mu_k * g * cos(theta) - F_pull / m
  const a_downwards = g * (Math.sin(theta) - mu_k * Math.cos(theta)) - params.fPull / m;

  let timeToBottom: number | null = null;
  let speedAtBottom: number | null = null;

  if (a_downwards > 0 && params.initialPos > 0) {
    const d = params.initialPos;
    timeToBottom = Math.sqrt((2 * d) / a_downwards);
    speedAtBottom = Math.sqrt(2 * a_downwards * d);
  }

  const s0 = params.initialPos;
  const v0 = params.initialSpeed;

  return {
    acceleration: -a_downwards, // in coordinates where positive = UP
    criticalAngleDeg,
    timeToBottomFromRest: timeToBottom,
    speedAtBottomFromRest: speedAtBottom,
    positionAtT: (t: number) => Math.max(0, s0 + v0 * t + 0.5 * (-a_downwards) * t * t),
    velocityAtT: (t: number) => v0 + (-a_downwards) * t
  };
}
