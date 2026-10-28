/**
 * Pure TypeScript Kinematics Simulation Model (1D and 2D)
 *
 * Governing Equations:
 * Ideal Mode:
 *   dx/dt = vx
 *   dy/dt = vy
 *   dvx/dt = ax
 *   dvy/dt = ay
 *
 * Real Mode:
 *   Includes kinetic friction f_k = -mu_k * g * (v / |v|)
 *   Includes quadratic aerodynamic drag F_d = -0.5 * rho * Cd * A * |v| * v
 *   dv/dt = a_applied - (f_k + F_d) / m
 *
 * Integration Method: 4th-Order Runge-Kutta (RK4) for high precision
 */

export interface KinematicsParams {
  x0: number;        // Initial x position (m)
  y0: number;        // Initial y position (m)
  v0x: number;       // Initial x velocity (m/s)
  v0y: number;       // Initial y velocity (m/s)
  ax: number;        // Applied x acceleration (m/s^2)
  ay: number;        // Applied y acceleration (m/s^2)
  mass: number;      // Body mass (kg)
  frictionMu: number;// Kinetic friction coefficient
  dragCoeff: number; // Aerodynamic drag coefficient (Cd)
  airDensity: number;// Air density (kg/m^3)
  crossSection: number; // Cross sectional area (m^2)
}

export interface KinematicsState {
  t: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  v: number;
  ax: number;
  ay: number;
  a: number;
  isStopped: boolean;
  distanceTraveled: number;
}

export interface AnalyticalResult {
  xAtT: (t: number) => number;
  yAtT: (t: number) => number;
  vxAtT: (t: number) => number;
  vyAtT: (t: number) => number;
  stoppingTime: number | null;
  stoppingDistance: number | null;
}

export class KinematicsSimulation {
  private params: KinematicsParams;
  private mode: 'ideal' | 'real';
  private state: KinematicsState;

  constructor(params: KinematicsParams, mode: 'ideal' | 'real' = 'ideal') {
    this.params = { ...params };
    this.mode = mode;
    this.state = this.createInitialState();
  }

  private createInitialState(): KinematicsState {
    const v = Math.sqrt(this.params.v0x ** 2 + this.params.v0y ** 2);
    const a = Math.sqrt(this.params.ax ** 2 + this.params.ay ** 2);
    return {
      t: 0,
      x: this.params.x0,
      y: this.params.y0,
      vx: this.params.v0x,
      vy: this.params.v0y,
      v,
      ax: this.params.ax,
      ay: this.params.ay,
      a,
      isStopped: false,
      distanceTraveled: 0
    };
  }

  public reset(): KinematicsState {
    this.state = this.createInitialState();
    return { ...this.state };
  }

  public setParams(params: Partial<KinematicsParams>): void {
    Object.assign(this.params, params);
  }

  public setMode(mode: 'ideal' | 'real'): void {
    this.mode = mode;
  }

  public getState(): KinematicsState {
    return { ...this.state };
  }

  /**
   * Evaluates accelerations given current velocities.
   */
  private evaluateDerivatives(vx: number, vy: number): { ax: number; ay: number } {
    if (this.mode === 'ideal') {
      return { ax: this.params.ax, ay: this.params.ay };
    }

    const vMag = Math.sqrt(vx * vx + vy * vy);
    const m = Math.max(0.01, this.params.mass);
    const g = 9.80665;

    let dragFx = 0;
    let dragFy = 0;
    let frictionFx = 0;
    let frictionFy = 0;

    if (vMag > 1e-4) {
      // Quadratic aerodynamic drag
      const dragForce = 0.5 * this.params.airDensity * this.params.dragCoeff * this.params.crossSection * (vMag ** 2);
      dragFx = -dragForce * (vx / vMag);
      dragFy = -dragForce * (vy / vMag);

      // Kinetic friction opposing motion
      const frictionForce = this.params.frictionMu * m * g;
      frictionFx = -frictionForce * (vx / vMag);
      frictionFy = -frictionForce * (vy / vMag);
    }

    const netAx = this.params.ax + (dragFx + frictionFx) / m;
    const netAy = this.params.ay + (dragFy + frictionFy) / m;

    return { ax: netAx, ay: netAy };
  }

  /**
   * Advances the simulation by dt seconds using 4th-order Runge-Kutta.
   */
  public step(dt: number): KinematicsState {
    if (this.state.isStopped) {
      return { ...this.state };
    }

    const s = this.state;

    // Check if coming to a complete stop due to braking / friction
    const currentSpeed = Math.sqrt(s.vx ** 2 + s.vy ** 2);
    if (this.mode === 'real' && currentSpeed < 1e-3 && Math.abs(this.params.ax) < 1e-3 && Math.abs(this.params.ay) < 1e-3) {
      s.isStopped = true;
      s.vx = 0;
      s.vy = 0;
      s.v = 0;
      s.ax = 0;
      s.ay = 0;
      s.a = 0;
      return { ...this.state };
    }

    // RK4 Integration for coupled x, y, vx, vy
    // k1
    const d1 = this.evaluateDerivatives(s.vx, s.vy);
    const k1_vx = d1.ax;
    const k1_vy = d1.ay;
    const k1_x = s.vx;
    const k1_y = s.vy;

    // k2
    const vx2 = s.vx + 0.5 * dt * k1_vx;
    const vy2 = s.vy + 0.5 * dt * k1_vy;
    const d2 = this.evaluateDerivatives(vx2, vy2);
    const k2_vx = d2.ax;
    const k2_vy = d2.ay;
    const k2_x = vx2;
    const k2_y = vy2;

    // k3
    const vx3 = s.vx + 0.5 * dt * k2_vx;
    const vy3 = s.vy + 0.5 * dt * k2_vy;
    const d3 = this.evaluateDerivatives(vx3, vy3);
    const k3_vx = d3.ax;
    const k3_vy = d3.ay;
    const k3_x = vx3;
    const k3_y = vy3;

    // k4
    const vx4 = s.vx + dt * k3_vx;
    const vy4 = s.vy + dt * k3_vy;
    const d4 = this.evaluateDerivatives(vx4, vy4);
    const k4_vx = d4.ax;
    const k4_vy = d4.ay;
    const k4_x = vx4;
    const k4_y = vy4;

    // Update state
    const nextVx = s.vx + (dt / 6) * (k1_vx + 2 * k2_vx + 2 * k3_vx + k4_vx);
    const nextVy = s.vy + (dt / 6) * (k1_vy + 2 * k2_vy + 2 * k3_vy + k4_vy);
    const dx = (dt / 6) * (k1_x + 2 * k2_x + 2 * k3_x + k4_x);
    const dy = (dt / 6) * (k1_y + 2 * k2_y + 2 * k3_y + k4_y);

    // If direction inverted during braking in real mode without external push, halt
    if (this.mode === 'real') {
      const dot = s.vx * nextVx + s.vy * nextVy;
      if (dot < 0 && Math.abs(this.params.ax) < 1e-4 && Math.abs(this.params.ay) < 1e-4) {
        s.vx = 0;
        s.vy = 0;
        s.v = 0;
        s.isStopped = true;
        s.ax = 0;
        s.ay = 0;
        s.a = 0;
        s.t += dt;
        return { ...this.state };
      }
    }

    s.x += dx;
    s.y += dy;
    s.vx = nextVx;
    s.vy = nextVy;
    s.v = Math.sqrt(nextVx ** 2 + nextVy ** 2);
    s.distanceTraveled += Math.sqrt(dx ** 2 + dy ** 2);
    s.t += dt;

    const latestDeriv = this.evaluateDerivatives(s.vx, s.vy);
    s.ax = latestDeriv.ax;
    s.ay = latestDeriv.ay;
    s.a = Math.sqrt(s.ax ** 2 + s.ay ** 2);

    return { ...this.state };
  }
}

/**
 * Closed-form analytical solution for ideal constant-acceleration motion
 */
export function computeIdealKinematicsAnalytical(params: KinematicsParams): AnalyticalResult {
  const { x0, y0, v0x, v0y, ax, ay } = params;

  let stoppingTime: number | null = null;
  let stoppingDistance: number | null = null;

  // In 1D along x: if accelerating against velocity
  if (Math.abs(v0y) < 1e-5 && Math.abs(ay) < 1e-5) {
    if (v0x > 0 && ax < 0) {
      stoppingTime = -v0x / ax;
      stoppingDistance = (-(v0x ** 2)) / (2 * ax);
    } else if (v0x < 0 && ax > 0) {
      stoppingTime = -v0x / ax;
      stoppingDistance = (-(v0x ** 2)) / (2 * ax);
    }
  }

  return {
    xAtT: (t: number) => x0 + v0x * t + 0.5 * ax * (t ** 2),
    yAtT: (t: number) => y0 + v0y * t + 0.5 * ay * (t ** 2),
    vxAtT: (t: number) => v0x + ax * t,
    vyAtT: (t: number) => v0y + ay * t,
    stoppingTime,
    stoppingDistance
  };
}
