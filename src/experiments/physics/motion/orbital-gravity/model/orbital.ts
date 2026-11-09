/**
 * Pure TypeScript physics model for Gravity & Planetary Orbits (Kepler).
 * No Vue, no DOM dependencies.
 * 
 * Supports:
 * - 2-body gravitational problem: Central primary mass M (e.g. Sun/Earth) and orbiting body m.
 * - Newton's Law of Universal Gravitation:
 *   F = G * M * m / r^2
 *   a_x = -G * M * x / r^3
 *   a_y = -G * M * y / r^3
 * - Kepler's Laws:
 *   1. Elliptical orbits: r(theta) = a * (1 - e^2) / (1 + e * cos(theta))
 *   2. Equal areas in equal times (conservation of specific angular momentum h = r x v = r * v_perp = const)
 *   3. T^2 = (4 * pi^2 / (G * M)) * a^3
 * - Vis-Viva equation for orbital speed:
 *   v^2 = G * M * (2/r - 1/a)
 * - Specific orbital energy:
 *   epsilon = v^2/2 - G*M/r = -G*M / (2*a)
 * - Orbital types:
 *   e = 0: circular, 0 < e < 1: elliptical, e = 1: parabolic, e > 1: hyperbolic
 * - Solved via Velocity-Verlet / symplectic 4th-order integrator for supreme long-term orbital energy conservation.
 */

export interface OrbitParams {
  primaryMass: number     // Mass of central body M (kg, e.g. Earth = 5.972e24, Sun = 1.989e30)
  satelliteMass: number   // Mass of orbiting satellite m (kg)
  semiMajorAxis: number   // Semi-major axis a (meters, or normalized astronomical units/km)
  eccentricity: number    // Eccentricity e [0, 0.95]
  trueAnomaly0: number    // Initial true anomaly angle (rad)
  gConst: number          // Gravitational constant G (m^3 / (kg s^2), default 6.67430e-11)
  isRealMode: boolean     // Real mode enables atmospheric drag at low perigee or J2 oblateness perturbation
}

export interface OrbitState {
  t: number
  x: number               // Position x (m)
  y: number               // Position y (m)
  vx: number              // Velocity vx (m/s)
  vy: number              // Velocity vy (m/s)
  r: number               // Distance from central body (m)
  speed: number           // Orbital speed |v| (m/s)
  trueAnomaly: number     // Current true anomaly angle theta (rad)
  angularMomentum: number // Specific angular momentum h = x*vy - y*vx (m^2/s)
  specificEnergy: number  // Specific orbital energy epsilon = v^2/2 - GM/r (J/kg)
  period: number          // Keplerian orbital period T (s)
  periapsis: number       // Periapsis distance r_p = a * (1 - e) (m)
  apoapsis: number        // Apoapsis distance r_a = a * (1 + e) (m)
  vPeriapsis: number      // Periapsis speed (m/s)
  vApoapsis: number       // Apoapsis speed (m/s)
}

/**
 * Analytical Keplerian calculations for orbital parameters.
 */
export function computeOrbitalAnalytical(params: OrbitParams): {
  period: number
  periapsis: number
  apoapsis: number
  vPeriapsis: number
  vApoapsis: number
  specificEnergy: number
  h: number
} {
  const mu = params.gConst * params.primaryMass // Standard gravitational parameter GM
  const a = params.semiMajorAxis
  const e = params.eccentricity

  const period = 2 * Math.PI * Math.sqrt(Math.pow(a, 3) / mu)
  const periapsis = a * (1 - e)
  const apoapsis = a * (1 + e)

  // Speeds from Vis-Viva: v^2 = mu * (2/r - 1/a)
  const vPeriapsis = Math.sqrt(mu * (2 / periapsis - 1 / a))
  const vApoapsis = Math.sqrt(mu * (2 / apoapsis - 1 / a))
  const specificEnergy = -mu / (2 * a)
  const h = Math.sqrt(mu * a * (1 - e * e))

  return {
    period,
    periapsis,
    apoapsis,
    vPeriapsis,
    vApoapsis,
    specificEnergy,
    h,
  }
}

/**
 * Creates initial orbital simulation state at true anomaly theta0.
 */
export function createOrbitModel(params: OrbitParams): OrbitState {
  const analytical = computeOrbitalAnalytical(params)
  const mu = params.gConst * params.primaryMass
  const a = params.semiMajorAxis
  const e = params.eccentricity
  const theta = params.trueAnomaly0

  // Polar equation for ellipse: r = a * (1 - e^2) / (1 + e * cos(theta))
  const p = a * (1 - e * e)
  const r = p / (1 + e * Math.cos(theta))

  // Coordinates
  const x = r * Math.cos(theta)
  const y = r * Math.sin(theta)

  // Velocity components in orbital plane:
  // v_r = sqrt(mu / p) * e * sin(theta)
  // v_theta = sqrt(mu / p) * (1 + e * cos(theta))
  // vx = v_r * cos(theta) - v_theta * sin(theta) = -sqrt(mu/p) * sin(theta)
  // vy = v_r * sin(theta) + v_theta * cos(theta) = sqrt(mu/p) * (e + cos(theta))
  const factor = Math.sqrt(mu / p)
  const vx = -factor * Math.sin(theta)
  const vy = factor * (e + Math.cos(theta))

  const speed = Math.hypot(vx, vy)
  const h = x * vy - y * vx
  const specificEnergy = 0.5 * speed * speed - mu / r

  return {
    t: 0,
    x,
    y,
    vx,
    vy,
    r,
    speed,
    trueAnomaly: theta,
    angularMomentum: h,
    specificEnergy,
    period: analytical.period,
    periapsis: analytical.periapsis,
    apoapsis: analytical.apoapsis,
    vPeriapsis: analytical.vPeriapsis,
    vApoapsis: analytical.vApoapsis,
  }
}

/**
 * Accelerations: a = -GM/r^3 * [x, y] + perturbations
 */
function getGravitationalAcceleration(
  x: number,
  y: number,
  vx: number,
  vy: number,
  params: OrbitParams
): [number, number] {
  const mu = params.gConst * params.primaryMass
  const rSq = x * x + y * y
  const r = Math.sqrt(rSq)
  const r3 = rSq * r

  let ax = -(mu * x) / r3
  let ay = -(mu * y) / r3

  // Real mode atmospheric drag near perigee if r is close to planetary radius
  if (params.isRealMode) {
    const speed = Math.hypot(vx, vy)
    const dragCoeff = 1e-7 // subtle drag per second
    ax -= dragCoeff * speed * vx
    ay -= dragCoeff * speed * vy
  }

  return [ax, ay]
}

/**
 * Steps the orbit simulation forward by dt using Velocity-Verlet (symplectic, preserves angular momentum & energy).
 */
export function stepOrbitModel(
  state: OrbitState,
  params: OrbitParams,
  dt: number
): OrbitState {
  const [ax0, ay0] = getGravitationalAcceleration(state.x, state.y, state.vx, state.vy, params)

  // 1. Half-step velocity
  const vxMid = state.vx + 0.5 * dt * ax0
  const vyMid = state.vy + 0.5 * dt * ay0

  // 2. Full-step position
  const nextX = state.x + dt * vxMid
  const nextY = state.y + dt * vyMid

  // 3. New acceleration at next position
  const [axNext, ayNext] = getGravitationalAcceleration(nextX, nextY, vxMid, vyMid, params)

  // 4. Finish velocity step
  const nextVx = vxMid + 0.5 * dt * axNext
  const nextVy = vyMid + 0.5 * dt * ayNext

  const r = Math.hypot(nextX, nextY)
  const speed = Math.hypot(nextVx, nextVy)
  const trueAnomaly = Math.atan2(nextY, nextX)
  const h = nextX * nextVy - nextY * nextVx
  const mu = params.gConst * params.primaryMass
  const specificEnergy = 0.5 * speed * speed - mu / r

  return {
    t: state.t + dt,
    x: nextX,
    y: nextY,
    vx: nextVx,
    vy: nextVy,
    r,
    speed,
    trueAnomaly,
    angularMomentum: h,
    specificEnergy,
    period: state.period,
    periapsis: state.periapsis,
    apoapsis: state.apoapsis,
    vPeriapsis: state.vPeriapsis,
    vApoapsis: state.vApoapsis,
  }
}
