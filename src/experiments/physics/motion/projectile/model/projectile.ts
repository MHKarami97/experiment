/**
 * Pure TypeScript numerical simulation model for 2D Projectile Motion.
 * Supports RK4 integration, quadratic aerodynamic drag, wind, and analytical comparison.
 */

export interface ProjectileParams {
  v0: number; // initial velocity (m/s)
  angle: number; // launch angle in degrees (0 to 90)
  h0: number; // initial launch height (m)
  gravity: number; // gravitational acceleration (m/s^2)
  mass: number; // mass of projectile (kg)
  dragCoeff: number; // aerodynamic drag coefficient Cd (dimensionless)
  crossSection: number; // cross-sectional area A (m^2)
  airDensity: number; // ambient fluid density rho (kg/m^3)
  wind: number; // horizontal wind velocity (m/s, + in launch direction)
}

export interface ProjectileState {
  t: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  ax: number;
  ay: number;
  v: number;
  isLanded: boolean;
  maxHeight: number;
}

export interface AnalyticalSolution {
  range: number;
  maxHeight: number;
  flightTime: number;
  impactVelocity: number;
}

/**
 * Computes exact closed-form analytical solutions for ideal vacuum conditions.
 */
export function computeIdealAnalytical(params: ProjectileParams): AnalyticalSolution {
  const theta = (params.angle * Math.PI) / 180;
  const v0x = params.v0 * Math.cos(theta);
  const v0y = params.v0 * Math.sin(theta);
  const g = params.gravity;
  const h0 = Math.max(0, params.h0);

  // Time of flight: y(t) = h0 + v0y*t - 0.5*g*t^2 = 0
  // t = (v0y + sqrt(v0y^2 + 2*g*h0)) / g
  const discriminant = v0y * v0y + 2 * g * h0;
  const flightTime = (v0y + Math.sqrt(Math.max(0, discriminant))) / g;

  // Horizontal range: R = v0x * t
  const range = v0x * flightTime;

  // Maximum height above ground: H = h0 + (v0y^2)/(2*g)
  const maxHeight = h0 + (v0y * v0y) / (2 * g);

  // Impact speed by conservation of mechanical energy: 0.5*m*v^2 = 0.5*m*v0^2 + m*g*h0
  const impactVelocity = Math.sqrt(params.v0 * params.v0 + 2 * g * h0);

  return {
    range,
    maxHeight,
    flightTime,
    impactVelocity
  };
}

export class ProjectileSimulation {
  private params: ProjectileParams;
  private mode: 'ideal' | 'real';
  private state: ProjectileState;

  constructor(params: ProjectileParams, mode: 'ideal' | 'real' = 'ideal') {
    this.params = { ...params };
    this.mode = mode;
    this.state = this.createInitialState();
  }

  public setParams(params: Partial<ProjectileParams>): void {
    this.params = { ...this.params, ...params };
  }

  public setMode(mode: 'ideal' | 'real'): void {
    this.mode = mode;
  }

  public getParams(): ProjectileParams {
    return { ...this.params };
  }

  public getState(): ProjectileState {
    return { ...this.state };
  }

  public reset(): ProjectileState {
    this.state = this.createInitialState();
    return this.getState();
  }

  private createInitialState(): ProjectileState {
    const theta = (this.params.angle * Math.PI) / 180;
    const vx = this.params.v0 * Math.cos(theta);
    const vy = this.params.v0 * Math.sin(theta);
    const v = Math.hypot(vx, vy);

    const [ax, ay] = this.computeAccelerations(vx, vy);

    return {
      t: 0,
      x: 0,
      y: Math.max(0, this.params.h0),
      vx,
      vy,
      ax,
      ay,
      v,
      isLanded: false,
      maxHeight: Math.max(0, this.params.h0)
    };
  }

  /**
   * Computes net instantaneous acceleration components (ax, ay).
   */
  private computeAccelerations(vx: number, vy: number): [number, number] {
    const g = this.params.gravity;

    if (this.mode === 'ideal') {
      return [0, -g];
    }

    // Real mode: Quadratic aerodynamic drag + wind
    // Velocity relative to surrounding air mass:
    const vRelX = vx - this.params.wind;
    const vRelY = vy;
    const vRelMag = Math.hypot(vRelX, vRelY);

    if (vRelMag < 1e-9) {
      return [0, -g];
    }

    // Drag force magnitude: F_drag = 0.5 * rho * Cd * A * vRel^2
    const dragMagnitude =
      0.5 *
      this.params.airDensity *
      this.params.dragCoeff *
      this.params.crossSection *
      vRelMag *
      vRelMag;

    // Force components opposite to relative velocity:
    const fDragX = -dragMagnitude * (vRelX / vRelMag);
    const fDragY = -dragMagnitude * (vRelY / vRelMag);

    const m = Math.max(1e-4, this.params.mass);
    const ax = fDragX / m;
    const ay = -g + fDragY / m;

    return [ax, ay];
  }

  /**
   * Advances the simulation by a fixed time step dt using 4th-order Runge-Kutta (RK4).
   */
  public step(dt: number): ProjectileState {
    if (this.state.isLanded) {
      return this.getState();
    }

    const { x, y, vx, vy, t } = this.state;

    // k1
    const k1_vx = vx;
    const k1_vy = vy;
    const [k1_ax, k1_ay] = this.computeAccelerations(vx, vy);

    // k2 (midpoint)
    const k2_vx = vx + 0.5 * dt * k1_ax;
    const k2_vy = vy + 0.5 * dt * k1_ay;
    const [k2_ax, k2_ay] = this.computeAccelerations(k2_vx, k2_vy);

    // k3 (midpoint)
    const k3_vx = vx + 0.5 * dt * k2_ax;
    const k3_vy = vy + 0.5 * dt * k2_ay;
    const [k3_ax, k3_ay] = this.computeAccelerations(k3_vx, k3_vy);

    // k4 (endpoint)
    const k4_vx = vx + dt * k3_ax;
    const k4_vy = vy + dt * k3_ay;
    const [k4_ax, k4_ay] = this.computeAccelerations(k4_vx, k4_vy);

    // Update state via weighted average
    const nextX = x + (dt / 6) * (k1_vx + 2 * k2_vx + 2 * k3_vx + k4_vx);
    const nextY = y + (dt / 6) * (k1_vy + 2 * k2_vy + 2 * k3_vy + k4_vy);
    const nextVx = vx + (dt / 6) * (k1_ax + 2 * k2_ax + 2 * k3_ax + k4_ax);
    const nextVy = vy + (dt / 6) * (k1_ay + 2 * k2_ay + 2 * k3_ay + k4_ay);
    const nextT = t + dt;

    // Check ground collision
    if (nextY <= 0) {
      // Interpolate exact landing time and position where y = 0
      const fraction = (0 - y) / (nextY - y);
      const clampedFraction = Math.max(0, Math.min(1, fraction));

      this.state.t = t + clampedFraction * dt;
      this.state.x = x + clampedFraction * (nextX - x);
      this.state.y = 0;
      this.state.vx = vx + clampedFraction * (nextVx - vx);
      this.state.vy = vy + clampedFraction * (nextVy - vy);
      this.state.v = Math.hypot(this.state.vx, this.state.vy);
      const [ax, ay] = this.computeAccelerations(this.state.vx, this.state.vy);
      this.state.ax = ax;
      this.state.ay = ay;
      this.state.isLanded = true;
      return this.getState();
    }

    this.state.t = nextT;
    this.state.x = nextX;
    this.state.y = nextY;
    this.state.vx = nextVx;
    this.state.vy = nextVy;
    this.state.v = Math.hypot(nextVx, nextVy);
    const [ax, ay] = this.computeAccelerations(nextVx, nextVy);
    this.state.ax = ax;
    this.state.ay = ay;

    if (nextY > this.state.maxHeight) {
      this.state.maxHeight = nextY;
    }

    return this.getState();
  }
}
