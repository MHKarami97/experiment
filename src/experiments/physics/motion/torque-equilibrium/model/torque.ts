/**
 * Pure TypeScript physics model for Torque & Static Equilibrium (Lever / Seesaw).
 * No Vue, no DOM dependencies.
 * 
 * Supports:
 * - Seesaw beam with mass (beamMass) and total length (beamLength) pivoted at pivotX (default center = 0).
 * - Up to 4 draggable or positioned masses:
 *   - Each mass has: id, mass (kg), position x (meters, relative to pivot: left is negative, right is positive)
 * - Equilibrium condition: Net Torque sum(tau) = 0 and Net Force sum(F) = 0.
 *   tau_i = x_i * (m_i * g)
 * - Dynamic rotational physics:
 *   I_total = I_beam + sum(m_i * x_i^2)
 *   where I_beam = (1/12) * M_beam * L^2 + M_beam * (x_pivot_offset)^2
 *   alpha = tau_net / I_total
 *   theta_dot += alpha * dt
 *   theta += theta_dot * dt
 *   Seesaw tilts between [-maxAngle, +maxAngle] (default ~ 20 deg = 0.35 rad) with ground contact damping.
 * - Real mode effects: pivot bearing friction damping and slight beam mass asymmetry.
 */

export interface SeesawLoad {
  id: string
  mass: number // kg
  x: number // distance from pivot in meters (-left, +right)
}

export interface TorqueEquilibriumParams {
  beamLength: number       // total length of beam (m, default 6.0m)
  beamMass: number         // mass of the beam (kg, default 4.0kg)
  pivotOffset: number      // pivot offset from center (m, default 0 = centered)
  g: number                // gravitational acceleration (m/s^2, default 9.80665)
  maxAngleDeg: number      // max tilt angle before hitting support stands (degrees, default 20)
  friction: number         // pivot rotational damping friction (real mode)
  loads: SeesawLoad[]      // collection of masses placed on the beam
  isRealMode: boolean
}

export interface TorqueEquilibriumState {
  t: number
  theta: number            // current tilt angle of beam in radians
  omega: number            // angular velocity in rad/s
  alpha: number            // angular acceleration in rad/s^2
  netTorque: number        // net torque around pivot in N·m (positive rotates clockwise / right-down)
  leftTorque: number       // magnitude of counter-clockwise torque from left masses (N·m)
  rightTorque: number      // magnitude of clockwise torque from right masses (N·m)
  totalLoadMass: number    // sum of placed masses (kg)
  pivotSupportForce: number // upward reaction force exerted by the fulcrum (N)
  momentOfInertia: number  // total rotational inertia I around pivot (kg·m^2)
  isBalanced: boolean      // |netTorque| < 1e-3 N·m
  touchesGround: 'none' | 'left' | 'right'
}

/**
 * Analytical computation of static torque equilibrium.
 * tau_left = sum_{x_i < 0} |x_i| * m_i * g
 * tau_right = sum_{x_i > 0} x_i * m_i * g
 * tau_beam = -pivotOffset * beamMass * g
 * tau_net = tau_right - tau_left + tau_beam
 */
export function computeTorqueAnalytical(
  params: TorqueEquilibriumParams
): {
  leftTorque: number
  rightTorque: number
  beamTorque: number
  netTorque: number
  totalSupportForce: number
  momentOfInertia: number
  isBalanced: boolean
} {
  const g = params.g
  let leftTorque = 0
  let rightTorque = 0
  let totalMass = params.beamMass

  // Mass loads contribution
  let loadsInertia = 0
  for (const load of params.loads) {
    totalMass += load.mass
    loadsInertia += load.mass * load.x * load.x
    const torque = load.x * load.mass * g // positive = right/clockwise, negative = left/counter-clockwise
    if (torque < 0) {
      leftTorque += Math.abs(torque)
    } else {
      rightTorque += torque
    }
  }

  // Beam's own center of mass torque if pivot is not at beam center
  // Center of beam is at x = -pivotOffset relative to pivot
  const beamCmX = -params.pivotOffset
  const beamTorque = beamCmX * params.beamMass * g
  if (beamTorque < 0) {
    leftTorque += Math.abs(beamTorque)
  } else {
    rightTorque += beamTorque
  }

  const netTorque = rightTorque - leftTorque

  // Rotational inertia around pivot by parallel axis theorem:
  // I_beam_cm = (1/12) * M * L^2
  // I_beam = I_beam_cm + M * (pivotOffset)^2
  const iBeam = (1 / 12) * params.beamMass * params.beamLength * params.beamLength +
    params.beamMass * params.pivotOffset * params.pivotOffset
  const totalI = Math.max(0.1, iBeam + loadsInertia)

  return {
    leftTorque,
    rightTorque,
    beamTorque,
    netTorque,
    totalSupportForce: totalMass * g,
    momentOfInertia: totalI,
    isBalanced: Math.abs(netTorque) < 1e-3,
  }
}

/**
 * Creates initial simulation state.
 */
export function createTorqueModel(params: TorqueEquilibriumParams): TorqueEquilibriumState {
  const analytical = computeTorqueAnalytical(params)
  const totalLoadMass = params.loads.reduce((sum, l) => sum + l.mass, 0)
  const alpha = analytical.netTorque / analytical.momentOfInertia

  return {
    t: 0,
    theta: 0,
    omega: 0,
    alpha,
    netTorque: analytical.netTorque,
    leftTorque: analytical.leftTorque,
    rightTorque: analytical.rightTorque,
    totalLoadMass,
    pivotSupportForce: analytical.totalSupportForce,
    momentOfInertia: analytical.momentOfInertia,
    isBalanced: analytical.isBalanced,
    touchesGround: 'none',
  }
}

/**
 * Steps the rotational seesaw simulation forward by dt (seconds) using Velocity Verlet / RK4.
 */
export function stepTorqueModel(
  state: TorqueEquilibriumState,
  params: TorqueEquilibriumParams,
  dt: number
): TorqueEquilibriumState {
  const maxAngleRad = (params.maxAngleDeg * Math.PI) / 180
  const analytical = computeTorqueAnalytical(params)

  let theta = state.theta
  let omega = state.omega
  let touchesGround: 'none' | 'left' | 'right' = 'none'

  // Effective torque diminishes with cos(theta) as beam tilts
  // tau(theta) = tau_net * cos(theta)
  let restoringTorque = analytical.netTorque * Math.cos(theta)

  // Pivot damping / friction in real mode
  const damping = params.isRealMode ? params.friction * 2.5 : 0.05
  restoringTorque -= damping * omega

  const I = analytical.momentOfInertia
  const alpha = restoringTorque / I

  // Semi-implicit Euler / Verlet step
  omega += alpha * dt
  theta += omega * dt

  // Ground stops / bumpers at +- maxAngleRad
  if (theta >= maxAngleRad) {
    theta = maxAngleRad
    if (omega > 0) {
      omega = -omega * (params.isRealMode ? 0.2 : 0.4) // bounce coefficient
      if (Math.abs(omega) < 0.05) omega = 0
    }
    touchesGround = 'right'
  } else if (theta <= -maxAngleRad) {
    theta = -maxAngleRad
    if (omega < 0) {
      omega = -omega * (params.isRealMode ? 0.2 : 0.4)
      if (Math.abs(omega) < 0.05) omega = 0
    }
    touchesGround = 'left'
  }

  // If balanced and near zero angle/velocity, settle completely
  if (analytical.isBalanced && Math.abs(theta) < 1e-3 && Math.abs(omega) < 1e-3) {
    theta = 0
    omega = 0
  }

  return {
    t: state.t + dt,
    theta,
    omega,
    alpha,
    netTorque: restoringTorque,
    leftTorque: analytical.leftTorque,
    rightTorque: analytical.rightTorque,
    totalLoadMass: state.totalLoadMass,
    pivotSupportForce: analytical.totalSupportForce,
    momentOfInertia: I,
    isBalanced: analytical.isBalanced,
    touchesGround,
  }
}
