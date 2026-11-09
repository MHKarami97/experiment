/**
 * Pure TypeScript physics model for Simple Pendulum & Double Pendulum (Chaos).
 * No Vue, no DOM dependencies.
 * 
 * Supports:
 * 1. Simple Pendulum:
 *    - Equation: theta'' + (b/m)*theta' + (g/L)*sin(theta) = 0
 *    - Small angle analytical period: T_0 = 2 * pi * sqrt(L / g)
 *    - Large angle Borda approximation: T = T_0 * (1 + (1/16)*theta_0^2 + (11/3072)*theta_0^4)
 *    - Mechanical energy conservation (PE + KE = const in ideal mode).
 * 
 * 2. Double Pendulum (Chaos):
 *    - Two coupled links: L1, m1, theta1 and L2, m2, theta2
 *    - Standard Lagrangian equations of motion solved via Runge-Kutta 4th order (RK4).
 *    - Potential energy reference: PE = 0 when both arms hang straight down (y = L1 + L2).
 */

export type PendulumType = 'simple' | 'double'

export interface PendulumParams {
  type: PendulumType      // 'simple' or 'double'
  l1: number              // Length of arm 1 (m)
  m1: number              // Mass of bob 1 (kg)
  theta1: number          // Initial angle 1 (rad)
  omega1: number          // Initial angular velocity 1 (rad/s)
  l2: number              // Length of arm 2 (m, double pendulum)
  m2: number              // Mass of bob 2 (kg, double pendulum)
  theta2: number          // Initial angle 2 (rad, double pendulum)
  omega2: number          // Initial angular velocity 2 (rad/s, double pendulum)
  g: number               // Gravitational acceleration (m/s^2, default 9.80665)
  damping: number         // Air drag / pivot friction damping (real mode)
  isRealMode: boolean
}

export interface PendulumState {
  t: number
  type: PendulumType
  theta1: number          // Angle of bob 1 (rad)
  omega1: number          // Angular velocity 1 (rad/s)
  alpha1: number          // Angular acceleration 1 (rad/s^2)
  x1: number              // Bob 1 x coordinate (m)
  y1: number              // Bob 1 y coordinate (m, downward positive)
  
  // Bob 2 (double pendulum only)
  theta2: number
  omega2: number
  alpha2: number
  x2: number
  y2: number

  // Energetics & Analytics
  pe: number              // Potential energy (J)
  ke: number              // Kinetic energy (J)
  totalEnergy: number     // E = PE + KE (J)
  initialEnergy: number   // E at t=0 (J)
  analyticalPeriod: number // T for simple pendulum (s)
}

/**
 * Analytical period for simple pendulum with arbitrary initial amplitude theta0.
 */
export function computeSimplePendulumAnalyticalPeriod(l: number, g: number, theta0Rad: number): number {
  const t0 = 2 * Math.PI * Math.sqrt(l / g)
  const th = Math.abs(theta0Rad)
  // Borda's series expansion: T = T_0 * (1 + 1/16*th^2 + 11/3072*th^4)
  return t0 * (1 + (1 / 16) * th * th + (11 / 3072) * Math.pow(th, 4))
}

/**
 * Computes instantaneous potential and kinetic energy.
 * Reference: PE = 0 when hanging vertically downwards.
 */
function computeEnergies(
  th1: number,
  w1: number,
  th2: number,
  w2: number,
  params: PendulumParams
): { pe: number; ke: number } {
  const g = params.g
  const m1 = params.m1
  const l1 = params.l1

  if (params.type === 'simple') {
    // PE = m1 * g * l1 * (1 - cos(th1)) >= 0
    const pe = m1 * g * l1 * (1 - Math.cos(th1))
    const ke = 0.5 * m1 * Math.pow(l1 * w1, 2)
    return { pe, ke }
  } else {
    const m2 = params.m2
    const l2 = params.l2

    // Bob 1 height from lowest point: l1*(1 - cos(th1))
    // Bob 2 height from lowest point: l1*(1 - cos(th1)) + l2*(1 - cos(th2))
    const pe1 = m1 * g * l1 * (1 - Math.cos(th1))
    const pe2 = m2 * g * (l1 * (1 - Math.cos(th1)) + l2 * (1 - Math.cos(th2)))

    const ke1 = 0.5 * m1 * Math.pow(l1 * w1, 2)
    // For bob 2: v2^2 = (l1*w1)^2 + (l2*w2)^2 + 2*l1*l2*w1*w2*cos(th1 - th2)
    const ke2 = 0.5 * m2 * (
      Math.pow(l1 * w1, 2) +
      Math.pow(l2 * w2, 2) +
      2 * l1 * l2 * w1 * w2 * Math.cos(th1 - th2)
    )

    return {
      pe: pe1 + pe2,
      ke: ke1 + ke2,
    }
  }
}

/**
 * Creates initial state.
 */
export function createPendulumModel(params: PendulumParams): PendulumState {
  const x1 = params.l1 * Math.sin(params.theta1)
  const y1 = params.l1 * Math.cos(params.theta1)

  let x2 = x1
  let y2 = y1
  if (params.type === 'double') {
    x2 = x1 + params.l2 * Math.sin(params.theta2)
    y2 = y1 + params.l2 * Math.cos(params.theta2)
  }

  const { pe, ke } = computeEnergies(params.theta1, params.omega1, params.theta2, params.omega2, params)
  const analyticalPeriod = computeSimplePendulumAnalyticalPeriod(params.l1, params.g, params.theta1)

  return {
    t: 0,
    type: params.type,
    theta1: params.theta1,
    omega1: params.omega1,
    alpha1: 0,
    x1,
    y1,
    theta2: params.theta2,
    omega2: params.omega2,
    alpha2: 0,
    x2,
    y2,
    pe,
    ke,
    totalEnergy: pe + ke,
    initialEnergy: pe + ke,
    analyticalPeriod,
  }
}

/**
 * Derivatives for Simple Pendulum.
 */
function simplePendulumDerivatives(
  theta: number,
  omega: number,
  params: PendulumParams
): [number, number] {
  const damp = params.isRealMode ? params.damping / params.m1 : 0
  const alpha = -(params.g / params.l1) * Math.sin(theta) - damp * omega
  return [omega, alpha]
}

/**
 * Derivatives for Double Pendulum Lagrangian Equations of Motion:
 * theta1'' = ( -g*(2*m1 + m2)*sin(th1) - m2*g*sin(th1 - 2*th2) - 2*sin(th1 - th2)*m2*(w2^2*l2 + w1^2*l1*cos(th1 - th2)) ) /
 *            ( l1 * (2*m1 + m2 - m2*cos(2*th1 - 2*th2)) )
 * 
 * theta2'' = ( 2*sin(th1 - th2)*( w1^2*l1*(m1 + m2) + g*(m1 + m2)*cos(th1) + w2^2*l2*m2*cos(th1 - th2) ) ) /
 *            ( l2 * (2*m1 + m2 - m2*cos(2*th1 - 2*th2)) )
 */
function doublePendulumDerivatives(
  th1: number,
  w1: number,
  th2: number,
  w2: number,
  params: PendulumParams
): [number, number, number, number] {
  const g = params.g
  const m1 = params.m1
  const m2 = params.m2
  const l1 = params.l1
  const l2 = params.l2
  const delta = th1 - th2

  const commonDen = 2 * m1 + m2 - m2 * Math.cos(2 * delta)
  const den1 = l1 * commonDen
  const den2 = l2 * commonDen

  const num1 = -g * (2 * m1 + m2) * Math.sin(th1) -
    m2 * g * Math.sin(th1 - 2 * th2) -
    2 * Math.sin(delta) * m2 * (w2 * w2 * l2 + w1 * w1 * l1 * Math.cos(delta))

  const num2 = 2 * Math.sin(delta) * (
    w1 * w1 * l1 * (m1 + m2) +
    g * (m1 + m2) * Math.cos(th1) +
    w2 * w2 * l2 * m2 * Math.cos(delta)
  )

  let alpha1 = num1 / den1
  let alpha2 = num2 / den2

  if (params.isRealMode && params.damping > 0) {
    alpha1 -= (params.damping / m1) * w1
    alpha2 -= (params.damping / m2) * w2
  }

  return [w1, alpha1, w2, alpha2]
}

/**
 * Steps the simulation forward by dt using Runge-Kutta 4th Order (RK4).
 */
export function stepPendulumModel(
  state: PendulumState,
  params: PendulumParams,
  dt: number
): PendulumState {
  if (params.type === 'simple') {
    let th = state.theta1
    let w = state.omega1

    const [k1_th, k1_w] = simplePendulumDerivatives(th, w, params)
    const [k2_th, k2_w] = simplePendulumDerivatives(th + 0.5 * dt * k1_th, w + 0.5 * dt * k1_w, params)
    const [k3_th, k3_w] = simplePendulumDerivatives(th + 0.5 * dt * k2_th, w + 0.5 * dt * k2_w, params)
    const [k4_th, k4_w] = simplePendulumDerivatives(th + dt * k3_th, w + dt * k3_w, params)

    const nextTh = th + (dt / 6) * (k1_th + 2 * k2_th + 2 * k3_th + k4_th)
    const nextW = w + (dt / 6) * (k1_w + 2 * k2_w + 2 * k3_w + k4_w)
    const alpha = dt > 0 ? (nextW - w) / dt : 0

    const x1 = params.l1 * Math.sin(nextTh)
    const y1 = params.l1 * Math.cos(nextTh)
    const { pe, ke } = computeEnergies(nextTh, nextW, 0, 0, params)

    return {
      t: state.t + dt,
      type: 'simple',
      theta1: nextTh,
      omega1: nextW,
      alpha1: alpha,
      x1,
      y1,
      theta2: 0,
      omega2: 0,
      alpha2: 0,
      x2: x1,
      y2: y1,
      pe,
      ke,
      totalEnergy: pe + ke,
      initialEnergy: state.initialEnergy,
      analyticalPeriod: state.analyticalPeriod,
    }
  } else {
    // RK4 for double pendulum with sub-stepping for extreme energy conservation
    const subSteps = 4
    const subDt = dt / subSteps
    let th1 = state.theta1
    let w1 = state.omega1
    let th2 = state.theta2
    let w2 = state.omega2

    for (let s = 0; s < subSteps; s++) {
      const [k1_th1, k1_w1, k1_th2, k1_w2] = doublePendulumDerivatives(th1, w1, th2, w2, params)
      const [k2_th1, k2_w1, k2_th2, k2_w2] = doublePendulumDerivatives(
        th1 + 0.5 * subDt * k1_th1, w1 + 0.5 * subDt * k1_w1,
        th2 + 0.5 * subDt * k1_th2, w2 + 0.5 * subDt * k1_w2,
        params
      )
      const [k3_th1, k3_w1, k3_th2, k3_w2] = doublePendulumDerivatives(
        th1 + 0.5 * subDt * k2_th1, w1 + 0.5 * subDt * k2_w1,
        th2 + 0.5 * subDt * k2_th2, w2 + 0.5 * subDt * k2_w2,
        params
      )
      const [k4_th1, k4_w1, k4_th2, k4_w2] = doublePendulumDerivatives(
        th1 + subDt * k3_th1, w1 + subDt * k3_w1,
        th2 + subDt * k3_th2, w2 + subDt * k3_w2,
        params
      )

      th1 += (subDt / 6) * (k1_th1 + 2 * k2_th1 + 2 * k3_th1 + k4_th1)
      w1 += (subDt / 6) * (k1_w1 + 2 * k2_w1 + 2 * k3_w1 + k4_w1)
      th2 += (subDt / 6) * (k1_th2 + 2 * k2_th2 + 2 * k3_th2 + k4_th2)
      w2 += (subDt / 6) * (k1_w2 + 2 * k2_w2 + 2 * k3_w2 + k4_w2)
    }

    const x1 = params.l1 * Math.sin(th1)
    const y1 = params.l1 * Math.cos(th1)
    const x2 = x1 + params.l2 * Math.sin(th2)
    const y2 = y1 + params.l2 * Math.cos(th2)
    const { pe, ke } = computeEnergies(th1, w1, th2, w2, params)

    return {
      t: state.t + dt,
      type: 'double',
      theta1: th1,
      omega1: w1,
      alpha1: (w1 - state.omega1) / dt,
      x1,
      y1,
      theta2: th2,
      omega2: w2,
      alpha2: (w2 - state.omega2) / dt,
      x2,
      y2,
      pe,
      ke,
      totalEnergy: pe + ke,
      initialEnergy: state.initialEnergy,
      analyticalPeriod: state.analyticalPeriod,
    }
  }
}
