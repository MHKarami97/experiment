/**
 * Pure TypeScript physics model for Spring & Simple Harmonic Motion (Resonance).
 * No Vue, no DOM dependencies.
 * 
 * Supports:
 * - Mass-spring oscillator in vertical or horizontal orientation.
 * - Equation of motion:
 *   m * x'' + c * x' + k * x = F_ext(t)
 *   where F_ext(t) = F_drive * cos(omega_drive * t)
 * - Natural angular frequency: omega_0 = sqrt(k / m)
 * - Natural period: T_0 = 2 * pi / omega_0 = 2 * pi * sqrt(m / k)
 * - Damping ratio: zeta = c / (2 * sqrt(m * k))
 *   (zeta = 0: undamped, 0 < zeta < 1: underdamped, zeta = 1: critically damped, zeta > 1: overdamped)
 * - Resonance frequency under harmonic drive:
 *   omega_res = sqrt(omega_0^2 - 2 * (c / (2m))^2) (for displacement amplitude resonance)
 * - Energy components:
 *   PE_spring = 0.5 * k * x^2
 *   KE = 0.5 * m * v^2
 *   Total E = PE + KE (conserved when c = 0 and F_ext = 0)
 * - Solved via 4th-order Runge-Kutta (RK4) integration.
 */

export interface SpringParams {
  mass: number           // Mass of attached load m (kg)
  k: number              // Spring stiffness k (N/m)
  damping: number        // Damping coefficient c (N·s/m)
  driveAmp: number       // External periodic driving force amplitude F_0 (N)
  driveFreq: number      // Driving frequency f_drive (Hz) -> omega_drive = 2*pi*f
  initialX: number       // Initial displacement from equilibrium x_0 (m)
  initialV: number       // Initial velocity v_0 (m/s)
  isRealMode: boolean    // Real mode enables air drag and spring dead mass
}

export interface SpringState {
  t: number
  x: number              // Displacement from equilibrium (m)
  v: number              // Velocity (m/s)
  a: number              // Acceleration (m/s^2)
  fSpring: number        // Restoring spring force F = -k*x (N)
  fDamp: number          // Damping force F = -c*v (N)
  fDrive: number         // Periodic driving force (N)
  pe: number             // Elastic potential energy (J)
  ke: number             // Kinetic energy (J)
  totalEnergy: number    // Mechanical energy E = PE + KE (J)
  omega0: number         // Natural angular frequency (rad/s)
  f0: number             // Natural frequency (Hz)
  period0: number        // Natural period T0 (s)
  dampingRatio: number   // Damping ratio zeta
}

/**
 * Analytical calculations for natural frequency and resonance.
 */
export function computeSpringAnalytical(params: SpringParams): {
  omega0: number
  f0: number
  period0: number
  dampingRatio: number
  resFreqHz: number
  steadyStateAmp: number
} {
  const m = Math.max(0.01, params.mass)
  const k = Math.max(0.1, params.k)
  const c = params.isRealMode ? params.damping : 0
  const omega0 = Math.sqrt(k / m)
  const f0 = omega0 / (2 * Math.PI)
  const period0 = (2 * Math.PI) / omega0
  const zeta = c / (2 * Math.sqrt(m * k))

  // Resonance frequency for driven oscillator
  const gamma = c / (2 * m)
  let resOmega = omega0
  if (omega0 * omega0 > 2 * gamma * gamma) {
    resOmega = Math.sqrt(omega0 * omega0 - 2 * gamma * gamma)
  }
  const resFreqHz = resOmega / (2 * Math.PI)

  // Steady-state amplitude: X = (F0 / m) / sqrt((omega0^2 - omega_d^2)^2 + (c*omega_d/m)^2)
  const omegaD = 2 * Math.PI * params.driveFreq
  const denom = Math.sqrt(Math.pow(omega0 * omega0 - omegaD * omegaD, 2) + Math.pow((c * omegaD) / m, 2))
  const steadyStateAmp = denom > 1e-6 ? (params.driveAmp / m) / denom : 0

  return {
    omega0,
    f0,
    period0,
    dampingRatio: zeta,
    resFreqHz,
    steadyStateAmp,
  }
}

/**
 * Creates initial spring oscillator state.
 */
export function createSpringModel(params: SpringParams): SpringState {
  const analytical = computeSpringAnalytical(params)
  const x = params.initialX
  const v = params.initialV
  const pe = 0.5 * params.k * x * x
  const ke = 0.5 * params.mass * v * v
  const fSpring = -params.k * x
  const fDamp = -(params.isRealMode ? params.damping : 0) * v
  const fDrive = params.driveAmp * Math.cos(0)
  const a = (fSpring + fDamp + fDrive) / params.mass

  return {
    t: 0,
    x,
    v,
    a,
    fSpring,
    fDamp,
    fDrive,
    pe,
    ke,
    totalEnergy: pe + ke,
    omega0: analytical.omega0,
    f0: analytical.f0,
    period0: analytical.period0,
    dampingRatio: analytical.dampingRatio,
  }
}

/**
 * Derivatives function for RK4:
 * dx/dt = v
 * dv/dt = (-k*x - c*v + F_ext(t)) / m
 */
function springDerivatives(
  x: number,
  v: number,
  t: number,
  params: SpringParams
): [number, number] {
  const c = params.isRealMode ? params.damping : 0
  const omegaD = 2 * Math.PI * params.driveFreq
  const fDrive = params.driveAmp * Math.cos(omegaD * t)
  const a = (-params.k * x - c * v + fDrive) / params.mass
  return [v, a]
}

/**
 * Steps the simulation forward by dt using RK4.
 */
export function stepSpringModel(
  state: SpringState,
  params: SpringParams,
  dt: number
): SpringState {
  const t = state.t
  const x = state.x
  const v = state.v

  // RK4
  const [k1_x, k1_v] = springDerivatives(x, v, t, params)
  const [k2_x, k2_v] = springDerivatives(x + 0.5 * dt * k1_x, v + 0.5 * dt * k1_v, t + 0.5 * dt, params)
  const [k3_x, k3_v] = springDerivatives(x + 0.5 * dt * k2_x, v + 0.5 * dt * k2_v, t + 0.5 * dt, params)
  const [k4_x, k4_v] = springDerivatives(x + dt * k3_x, v + dt * k3_v, t + dt, params)

  const nextX = x + (dt / 6) * (k1_x + 2 * k2_x + 2 * k3_x + k4_x)
  const nextV = v + (dt / 6) * (k1_v + 2 * k2_v + 2 * k3_v + k4_v)
  const nextT = t + dt

  const c = params.isRealMode ? params.damping : 0
  const omegaD = 2 * Math.PI * params.driveFreq
  const fDrive = params.driveAmp * Math.cos(omegaD * nextT)
  const fSpring = -params.k * nextX
  const fDamp = -c * nextV
  const nextA = (fSpring + fDamp + fDrive) / params.mass

  const pe = 0.5 * params.k * nextX * nextX
  const ke = 0.5 * params.mass * nextV * nextV

  return {
    t: nextT,
    x: nextX,
    v: nextV,
    a: nextA,
    fSpring,
    fDamp,
    fDrive,
    pe,
    ke,
    totalEnergy: pe + ke,
    omega0: state.omega0,
    f0: state.f0,
    period0: state.period0,
    dampingRatio: state.dampingRatio,
  }
}
