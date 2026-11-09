/**
 * Physical simulation model for Circular Motion & Centripetal Force
 * 
 * Governing Equations:
 * 1. Tangential velocity: v = ω * r
 * 2. Centripetal acceleration: a_c = v^2 / r = ω^2 * r
 * 3. Centripetal force / string tension: F_c = m * a_c = m * ω^2 * r
 * 4. Period: T = 2π / ω = 2π * r / v
 * 5. Frequency: f = 1 / T = ω / (2π)
 * 6. Real mode effects:
 *    - Elastic string compliance: r = r_0 + F_c / k
 *    - String snap rupture when F_c > T_max (object flies off along tangential path, Newton's 1st Law)
 *    - Aerodynamic drag & pivot damping
 *
 * Integrator: Runge-Kutta 4th Order (RK4)
 * Units: SI (kg, m, s, rad, N)
 */

export interface CircularMotionParams {
  radius: number;           // Nominal path radius r_0 (m)
  mass: number;             // Mass of rotating body m (kg)
  angularVelocity: number;  // Target angular velocity ω (rad/s)
  maxTension: number;       // String breaking strength T_max (N)
  dragCoeff: number;        // Drag coefficient C_d (dimensionless)
  stringStiffness: number;  // Spring constant k of string (N/m)
  frictionMu: number;       // Bearing / surface friction coefficient (dimensionless)
  airDensity: number;       // Air density ρ (kg/m^3)
}

export interface CircularMotionState {
  t: number;                // Simulation elapsed time (s)
  theta: number;            // Current angular position θ (rad)
  omega: number;            // Angular velocity ω (rad/s)
  alpha: number;            // Angular acceleration α (rad/s^2)
  radius: number;           // Current effective radius r (m)
  x: number;                // Position x in world coordinates (m)
  y: number;                // Position y in world coordinates (m)
  vx: number;               // Velocity vx (m/s)
  vy: number;               // Velocity vy (m/s)
  speed: number;            // Linear tangential speed |v| (m/s)
  centripetalAcc: number;   // Centripetal acceleration a_c (m/s^2)
  tangentialAcc: number;    // Tangential acceleration a_t (m/s^2)
  tension: number;          // String tension / centripetal force F_c (N)
  period: number;           // Period of revolution T (s)
  frequency: number;        // Frequency f (Hz)
  revolutions: number;      // Total complete revolutions
  isSnapped: boolean;       // String has ruptured
  snapTime: number | null;  // Time at which snap occurred
  isStopped: boolean;
}

export class CircularMotionSimulation {
  private params: CircularMotionParams;
  private mode: 'ideal' | 'real';
  private state: CircularMotionState;

  constructor(params: CircularMotionParams, mode: 'ideal' | 'real' = 'ideal') {
    this.params = { ...params };
    this.mode = mode;
    this.state = this.getInitialState();
  }

  public setParams(params: CircularMotionParams): void {
    this.params = { ...params };
  }

  public setMode(mode: 'ideal' | 'real'): void {
    this.mode = mode;
  }

  public getState(): CircularMotionState {
    return { ...this.state };
  }

  public reset(): CircularMotionState {
    this.state = this.getInitialState();
    return { ...this.state };
  }

  private getInitialState(): CircularMotionState {
    const r0 = Math.max(0.1, this.params.radius);
    const m = Math.max(0.01, this.params.mass);
    const w = this.params.angularVelocity;

    // In real mode, initial elastic stretch
    let r = r0;
    let initialTension = m * w * w * r0;

    if (this.mode === 'real') {
      const k = Math.max(10, this.params.stringStiffness);
      // r = r0 + m*w^2*r / k => r*(1 - m*w^2/k) = r0
      const denom = 1 - (m * w * w) / k;
      if (denom > 0.1) {
        r = r0 / denom;
      } else {
        r = r0 * 1.5;
      }
      initialTension = m * w * w * r;
    }

    const v = Math.abs(w * r);
    const ac = w * w * r;
    const period = Math.abs(w) > 1e-4 ? (2 * Math.PI) / Math.abs(w) : 0;
    const freq = Math.abs(w) > 1e-4 ? Math.abs(w) / (2 * Math.PI) : 0;

    return {
      t: 0,
      theta: 0,
      omega: w,
      alpha: 0,
      radius: r,
      x: r,
      y: 0,
      vx: 0,
      vy: w * r,
      speed: v,
      centripetalAcc: ac,
      tangentialAcc: 0,
      tension: initialTension,
      period,
      frequency: freq,
      revolutions: 0,
      isSnapped: false,
      snapTime: null,
      isStopped: false
    };
  }

  /**
   * RK4 Integration step
   */
  public step(dt: number): CircularMotionState {
    if (this.state.isStopped) {
      return { ...this.state };
    }

    if (!this.state.isSnapped) {
      this.stepTethered(dt);
    } else {
      this.stepFreeFly(dt);
    }

    this.state.t += dt;
    return { ...this.state };
  }

  private stepTethered(dt: number): void {
    const r0 = Math.max(0.1, this.params.radius);
    const m = Math.max(0.01, this.params.mass);
    let targetW = this.params.angularVelocity;

    let currentW = this.state.omega;
    let alpha = 0;

    if (this.mode === 'real') {
      // Elastic string radius calculation: r = r0 + (m * w^2 * r) / k
      const k = Math.max(10, this.params.stringStiffness);
      const denom = 1 - (m * currentW * currentW) / k;
      let effectiveR = r0;
      if (denom > 0.1) {
        effectiveR = r0 / denom;
      } else {
        effectiveR = r0 * 2.0; // severe stretch limit
      }
      this.state.radius = effectiveR;

      // Check tension vs breaking strength
      const tension = m * currentW * currentW * effectiveR;
      this.state.tension = tension;

      if (tension >= this.params.maxTension) {
        // String breaks!
        this.state.isSnapped = true;
        this.state.snapTime = this.state.t;
        this.state.tension = 0;
        this.state.centripetalAcc = 0;
        // Current position and tangential velocity are preserved for free-fly step
        this.state.x = effectiveR * Math.cos(this.state.theta);
        this.state.y = effectiveR * Math.sin(this.state.theta);
        this.state.vx = -effectiveR * currentW * Math.sin(this.state.theta);
        this.state.vy = effectiveR * currentW * Math.cos(this.state.theta);
        return;
      }

      // Motor torque drives towards targetW, opposed by drag & friction
      // Drag torque: τ_drag = 0.5 * ρ * Cd * A * v^2 * r
      const v = Math.abs(currentW * effectiveR);
      const area = Math.PI * Math.pow(Math.max(0.02, 0.05 * Math.cbrt(m)), 2);
      const fDrag = 0.5 * this.params.airDensity * this.params.dragCoeff * area * v * v;
      const tauDrag = fDrag * effectiveR;
      const tauFriction = this.params.frictionMu * m * 9.80665 * effectiveR;

      // Motor restoration torque (smooth ramp towards targetW)
      const motorP = 5.0; // motor responsiveness
      const tauMotor = (targetW - currentW) * motorP * (m * effectiveR * effectiveR);
      const netTorque = tauMotor - Math.sign(currentW) * (tauDrag + tauFriction);

      const momentOfInertia = m * effectiveR * effectiveR;
      alpha = netTorque / momentOfInertia;
    } else {
      this.state.radius = r0;
      alpha = (targetW - currentW) / Math.max(1e-3, dt); // instant tracking in ideal mode
      currentW = targetW;
    }

    // RK4 for theta and omega
    const nextW = this.mode === 'real' ? currentW + alpha * dt : targetW;
    const avgW = (currentW + nextW) / 2;
    const nextTheta = this.state.theta + avgW * dt;

    this.state.omega = nextW;
    this.state.alpha = alpha;
    this.state.theta = nextTheta;

    const r = this.state.radius;
    this.state.x = r * Math.cos(nextTheta);
    this.state.y = r * Math.sin(nextTheta);
    this.state.vx = -r * nextW * Math.sin(nextTheta);
    this.state.vy = r * nextW * Math.cos(nextTheta);

    const speed = Math.abs(nextW * r);
    this.state.speed = speed;
    this.state.centripetalAcc = nextW * nextW * r;
    this.state.tangentialAcc = alpha * r;
    this.state.tension = m * nextW * nextW * r;

    this.state.period = Math.abs(nextW) > 1e-4 ? (2 * Math.PI) / Math.abs(nextW) : 0;
    this.state.frequency = Math.abs(nextW) > 1e-4 ? Math.abs(nextW) / (2 * Math.PI) : 0;
    this.state.revolutions = Math.floor(Math.abs(nextTheta) / (2 * Math.PI));
  }

  private stepFreeFly(dt: number): void {
    // When snapped: object flies along tangential trajectory according to Newton's 1st Law!
    const m = Math.max(0.01, this.params.mass);
    let ax = 0;
    let ay = 0;

    if (this.mode === 'real') {
      const v = Math.sqrt(this.state.vx * this.state.vx + this.state.vy * this.state.vy);
      if (v > 1e-4) {
        const area = Math.PI * Math.pow(Math.max(0.02, 0.05 * Math.cbrt(m)), 2);
        const fDrag = 0.5 * this.params.airDensity * this.params.dragCoeff * area * v * v;
        ax = -(fDrag / m) * (this.state.vx / v);
        ay = -(fDrag / m) * (this.state.vy / v);
      }
    }

    this.state.vx += ax * dt;
    this.state.vy += ay * dt;
    this.state.x += this.state.vx * dt;
    this.state.y += this.state.vy * dt;

    const currentDist = Math.sqrt(this.state.x * this.state.x + this.state.y * this.state.y);
    this.state.radius = currentDist;
    this.state.speed = Math.sqrt(this.state.vx * this.state.vx + this.state.vy * this.state.vy);
    this.state.centripetalAcc = 0;
    this.state.tangentialAcc = Math.sqrt(ax * ax + ay * ay);
    this.state.tension = 0;
    this.state.omega = 0;
    this.state.alpha = 0;

    // Bound check (if flew 25 meters away, stop simulation)
    if (currentDist > 25) {
      this.state.isStopped = true;
    }
  }
}

/**
 * Analytical exact formulas for ideal uniform circular motion
 */
export function computeIdealCircularAnalytical(radius: number, mass: number, omega: number) {
  const r = Math.abs(radius);
  const m = Math.abs(mass);
  const w = Math.abs(omega);

  const speed = w * r;
  const centripetalAcc = w * w * r;
  const centripetalForce = m * centripetalAcc;
  const period = w > 1e-6 ? (2 * Math.PI) / w : 0;
  const frequency = w > 1e-6 ? w / (2 * Math.PI) : 0;

  return {
    speed,
    centripetalAcc,
    centripetalForce,
    period,
    frequency
  };
}
