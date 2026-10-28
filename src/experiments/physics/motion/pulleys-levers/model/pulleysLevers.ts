/**
 * Physical simulation model for Pulleys, Levers & Simple Machines
 * Covers:
 * 1. Atwood Machine (ideal vs real with pulley inertia & axle friction)
 * 2. Block and Tackle Pulley Systems (1, 2, 4 strands, Mechanical Advantage IMA & AMA)
 * 3. Levers (Class 1, 2, 3 with torque equilibrium and rotational dynamics)
 *
 * Integrator: RK4 (Runge-Kutta 4th order)
 * Units: SI (kg, m, s, N, N·m, rad)
 */

export interface AtwoodParams {
  m1: number; // Mass 1 (kg) - left hanging mass
  m2: number; // Mass 2 (kg) - right hanging mass
  pulleyMass: number; // Mass of pulley (kg)
  pulleyRadius: number; // Radius of pulley (m)
  gravity: number; // Gravity (m/s^2)
  height: number; // Initial height above ground (m)
  frictionTorque: number; // Bearing friction torque (N·m)
}

export interface PulleySystemParams {
  loadMass: number; // Load mass to be lifted (kg)
  effortMass: number; // Effort mass pulled downwards (kg)
  strands: number; // Number of supporting strands (1, 2, 4)
  pulleyMass: number; // Mass of movable pulleys (kg)
  efficiency: number; // Real efficiency factor eta (0 to 1)
  gravity: number; // Gravity (m/s^2)
}

export interface LeverParams {
  loadMass: number; // Load mass (kg)
  loadArm: number; // Distance from fulcrum to load (m)
  effortForce: number; // Effort force applied (N)
  effortArm: number; // Distance from fulcrum to effort point (m)
  beamMass: number; // Mass of the uniform beam (kg)
  beamLength: number; // Total length of beam (m)
  fulcrumOffset: number; // Distance of fulcrum from beam center (m)
  frictionCoeff: number; // Pivot rotational damping (N·m·s/rad)
  gravity: number; // Gravity (m/s^2)
}

export type MachineType = 'atwood' | 'pulley-system' | 'lever';

export interface PulleysLeversParams {
  type: MachineType;
  atwood: AtwoodParams;
  pulleySystem: PulleySystemParams;
  lever: LeverParams;
}

export interface PulleysLeversState {
  t: number;
  type: MachineType;
  
  // Atwood state
  y1: number; // Height of m1 (m)
  y2: number; // Height of m2 (m)
  v: number; // Velocity of m1 (upwards is positive, downwards is negative) (m/s)
  a: number; // Current linear acceleration of m1 (m/s^2)
  tension1: number; // Tension in string 1 (N)
  tension2: number; // Tension in string 2 (N)
  pulleyAngle: number; // Pulley rotation angle (rad)
  isStopped: boolean; // Hit ground or pulley limit

  // Pulley System state
  loadHeight: number; // Height of lifted load (m)
  effortPos: number; // Distance pulled by effort (m)
  effortSpeed: number; // Speed of effort rope (m/s)
  ima: number; // Ideal mechanical advantage
  ama: number; // Actual mechanical advantage
  efficiencyPercent: number; // Efficiency (%)

  // Lever state
  angle: number; // Angle of beam with horizontal (rad)
  omega: number; // Angular velocity (rad/s)
  alpha: number; // Angular acceleration (rad/s^2)
  torqueLoad: number; // Torque from load (N·m)
  torqueEffort: number; // Torque from effort (N·m)
  netTorque: number; // Net torque (N·m)
  isBalanced: boolean;
}

export class PulleysLeversSimulation {
  private params: PulleysLeversParams;
  private mode: 'ideal' | 'real';
  private state: PulleysLeversState;

  constructor(params: PulleysLeversParams, mode: 'ideal' | 'real' = 'ideal') {
    this.params = JSON.parse(JSON.stringify(params));
    this.mode = mode;
    this.state = this.getInitialState();
  }

  public setParams(params: PulleysLeversParams): void {
    this.params = JSON.parse(JSON.stringify(params));
  }

  public setMode(mode: 'ideal' | 'real'): void {
    this.mode = mode;
  }

  public getState(): PulleysLeversState {
    return { ...this.state };
  }

  public reset(): PulleysLeversState {
    this.state = this.getInitialState();
    return { ...this.state };
  }

  private getInitialState(): PulleysLeversState {
    const at = this.params.atwood;
    const ps = this.params.pulleySystem;
    const lev = this.params.lever;

    const ima = ps.strands;
    const efficiency = this.mode === 'real' ? ps.efficiency : 1.0;
    const ama = ima * efficiency;

    return {
      t: 0,
      type: this.params.type,
      
      // Atwood
      y1: at.height,
      y2: at.height,
      v: 0,
      a: 0,
      tension1: at.m1 * at.gravity,
      tension2: at.m2 * at.gravity,
      pulleyAngle: 0,
      isStopped: false,

      // Pulley System
      loadHeight: 0,
      effortPos: 0,
      effortSpeed: 0,
      ima,
      ama,
      efficiencyPercent: efficiency * 100,

      // Lever
      angle: 0,
      omega: 0,
      alpha: 0,
      torqueLoad: lev.loadMass * lev.gravity * lev.loadArm,
      torqueEffort: lev.effortForce * lev.effortArm,
      netTorque: 0,
      isBalanced: Math.abs(lev.loadMass * lev.gravity * lev.loadArm - lev.effortForce * lev.effortArm) < 1e-4
    };
  }

  /**
   * Performs an RK4 integration step of size dt.
   */
  public step(dt: number): PulleysLeversState {
    if (this.state.isStopped) {
      return { ...this.state };
    }

    if (this.params.type === 'atwood') {
      this.stepAtwood(dt);
    } else if (this.params.type === 'pulley-system') {
      this.stepPulleySystem(dt);
    } else if (this.params.type === 'lever') {
      this.stepLever(dt);
    }

    this.state.t += dt;
    return { ...this.state };
  }

  private stepAtwood(dt: number) {
    const at = this.params.atwood;
    const g = at.gravity;
    const m1 = at.m1;
    const m2 = at.m2;
    const R = Math.max(0.01, at.pulleyRadius);
    const Mp = this.mode === 'real' ? at.pulleyMass : 0;
    const I_pulley = 0.5 * Mp * R * R;
    const frictionTorque = this.mode === 'real' ? at.frictionTorque : 0;

    // Effective system inertia: m1 + m2 + I/R^2 = m1 + m2 + 0.5*Mp
    const M_eff = m1 + m2 + I_pulley / (R * R);

    // Compute acceleration given current velocity v (m1 moving upwards is positive)
    const computeAcc = (currentV: number) => {
      // Net driving force on m1 in upward direction: m2 pulls down on its side => pulls m1 up
      let drivingForce = (m2 - m1) * g;

      if (frictionTorque > 0 && Math.abs(currentV) > 1e-5) {
        const fFrictionLinear = frictionTorque / R;
        drivingForce -= Math.sign(currentV) * fFrictionLinear;
      }

      return drivingForce / M_eff;
    };

    // RK4 for (y1, v)
    const k1_v = computeAcc(this.state.v);
    const k1_y = this.state.v;

    const k2_v = computeAcc(this.state.v + 0.5 * dt * k1_v);
    const k2_y = this.state.v + 0.5 * dt * k1_v;

    const k3_v = computeAcc(this.state.v + 0.5 * dt * k2_v);
    const k3_y = this.state.v + 0.5 * dt * k2_v;

    const k4_v = computeAcc(this.state.v + dt * k3_v);
    const k4_y = this.state.v + dt * k3_v;

    const dV = (dt / 6) * (k1_v + 2 * k2_v + 2 * k3_v + k4_v);
    const dY = (dt / 6) * (k1_y + 2 * k2_y + 2 * k3_y + k4_y);

    const nextV = this.state.v + dV;
    const nextY1 = this.state.y1 + dY;
    const nextY2 = at.height * 2 - nextY1; // Conservation of rope length

    // Check collision / stop boundaries (ground = 0, top pulley limit = 2 * height)
    if (nextY1 <= 0) {
      this.state.y1 = 0;
      this.state.y2 = at.height * 2;
      this.state.v = 0;
      this.state.a = 0;
      this.state.isStopped = true;
    } else if (nextY2 <= 0) {
      this.state.y2 = 0;
      this.state.y1 = at.height * 2;
      this.state.v = 0;
      this.state.a = 0;
      this.state.isStopped = true;
    } else {
      this.state.y1 = nextY1;
      this.state.y2 = nextY2;
      this.state.v = nextV;
      this.state.a = k1_v;
    }

    // Tensions
    // T1 = m1*(g + a) when m1 accelerates upwards
    // T2 = m2*(g - a)
    this.state.tension1 = Math.max(0, m1 * (g + this.state.a));
    this.state.tension2 = Math.max(0, m2 * (g - this.state.a));
    this.state.pulleyAngle += (this.state.v / R) * dt;
  }

  private stepPulleySystem(dt: number) {
    const ps = this.params.pulleySystem;
    const N = ps.strands;
    const g = ps.gravity;
    const mL = ps.loadMass;
    const mE = ps.effortMass;
    const efficiency = this.mode === 'real' ? ps.efficiency : 1.0;

    // Ideal Mechanical Advantage = N
    // Actual Mechanical Advantage = N * efficiency
    const ima = N;
    const ama = N * efficiency;

    // Equivalent effort force required to support load:
    const F_support = (mL * g) / ama;

    // Net force driving the effort mass downward:
    // F_net = mE * g - F_support
    // Equivalent inertia: mE + mL / (N^2)
    const effectiveInertia = mE + mL / (N * N);
    const accEffort = (mE * g - F_support) / Math.max(1e-4, effectiveInertia);

    this.state.effortSpeed += accEffort * dt;
    this.state.effortPos += this.state.effortSpeed * dt;
    this.state.loadHeight = this.state.effortPos / N;

    // Stop condition if load reaches top limit (say 4 meters) or ground
    if (this.state.loadHeight < 0) {
      this.state.loadHeight = 0;
      this.state.effortPos = 0;
      this.state.effortSpeed = 0;
      this.state.isStopped = true;
    } else if (this.state.loadHeight >= 4.0) {
      this.state.loadHeight = 4.0;
      this.state.effortSpeed = 0;
      this.state.isStopped = true;
    }

    this.state.ima = ima;
    this.state.ama = ama;
    this.state.efficiencyPercent = efficiency * 100;
  }

  private stepLever(dt: number) {
    const lev = this.params.lever;
    const g = lev.gravity;
    const theta = this.state.angle;

    // Torque from Load: pulls clockwise/counterclockwise depending on position
    // Lever is in horizontal at theta = 0.
    // Torque = r * F * cos(theta)
    const tauLoad = -lev.loadMass * g * lev.loadArm * Math.cos(theta);
    const tauEffort = lev.effortForce * lev.effortArm * Math.cos(theta);

    let netTorque = tauLoad + tauEffort;

    // Pivot damping in real mode
    if (this.mode === 'real') {
      netTorque -= lev.frictionCoeff * this.state.omega;
    }

    // Rotational inertia of beam + point masses
    // I_beam around center = (1/12)*M*L^2, plus parallel axis theorem for fulcrum offset: + M*offset^2
    const I_beam = (1 / 12) * lev.beamMass * lev.beamLength ** 2 + lev.beamMass * lev.fulcrumOffset ** 2;
    const I_load = lev.loadMass * lev.loadArm ** 2;
    const I_total = Math.max(0.01, I_beam + I_load);

    const alpha = netTorque / I_total;

    // RK4 for angle and omega
    const nextOmega = this.state.omega + alpha * dt;
    let nextAngle = this.state.angle + nextOmega * dt;

    // Mechanical stops at +/- 25 degrees (approx +/- 0.44 rad)
    const MAX_ANGLE = 0.44;
    if (nextAngle > MAX_ANGLE) {
      nextAngle = MAX_ANGLE;
      this.state.omega = 0;
    } else if (nextAngle < -MAX_ANGLE) {
      nextAngle = -MAX_ANGLE;
      this.state.omega = 0;
    } else {
      this.state.omega = nextOmega;
    }

    this.state.angle = nextAngle;
    this.state.alpha = alpha;
    this.state.torqueLoad = Math.abs(tauLoad);
    this.state.torqueEffort = Math.abs(tauEffort);
    this.state.netTorque = netTorque;
    this.state.isBalanced = Math.abs(netTorque) < 0.05 && Math.abs(this.state.omega) < 0.01;
  }
}

/**
 * Analytical theoretical formulas for ideal systems
 */
export function computeIdealAtwoodAnalytical(m1: number, m2: number, g = 9.80665) {
  const diff = m2 - m1;
  const sum = m1 + m2;
  const acceleration = (diff / sum) * g;
  const tension = (2 * m1 * m2 * g) / sum;
  return {
    acceleration,
    tension
  };
}

export function computeIdealLeverAnalytical(loadMass: number, loadArm: number, effortArm: number, g = 9.80665) {
  const loadWeight = loadMass * g;
  const ima = effortArm / Math.max(1e-4, loadArm);
  const requiredEffort = loadWeight / ima;
  return {
    loadWeight,
    ima,
    requiredEffort
  };
}
