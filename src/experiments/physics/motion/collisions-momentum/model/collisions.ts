/**
 * Pure TypeScript physics model for 1D Elastic and Inelastic Collisions & Linear Momentum.
 * No Vue, no DOM dependencies.
 * 
 * Supports:
 * - Two colliding carts (Cart 1 and Cart 2) on a linear air track.
 * - Masses: m1, m2 (kg)
 * - Initial velocities: v1_0, v2_0 (m/s)
 * - Coefficient of restitution: e (0.0 = completely inelastic, 1.0 = perfectly elastic)
 * - Track length: trackLength (m), bumper walls at boundaries (elastic or bouncy)
 * - Real mode effects: rolling/air resistance (drag) and instrument measurement noise.
 */

export interface CollisionParams {
  m1: number            // Cart 1 mass (kg)
  m2: number            // Cart 2 mass (kg)
  v1: number            // Cart 1 initial velocity (m/s)
  v2: number            // Cart 2 initial velocity (m/s)
  restitution: number   // Coefficient of restitution e [0, 1]
  cartWidth: number     // Cart physical width (m)
  trackLength: number   // Total air track length (m)
  friction: number      // Surface/air drag coefficient (real mode)
  noiseLevel: number    // Measurement noise (real mode)
  isRealMode: boolean
}

export interface CartState {
  x: number             // Position along track (m)
  v: number             // Velocity (m/s)
  mass: number          // Mass (kg)
  p: number             // Momentum p = m*v (kg*m/s)
  ke: number            // Kinetic energy E_k = 0.5 * m * v^2 (J)
}

export interface CollisionDerived {
  pTotal: number        // Total momentum p1 + p2 (kg*m/s)
  keTotal: number       // Total kinetic energy (J)
  deltaP: number        // Change in total momentum relative to t=0 (kg*m/s)
  deltaKe: number       // Kinetic energy lost / transferred (J)
  vRel: number          // Relative approach velocity v1 - v2 (m/s)
  collisionCount: number // Number of cart-cart collisions occurred
  wallCollisions: number // Number of cart-wall collisions occurred
  hasCollided: boolean   // Whether cart1 and cart2 have collided at least once
}

export interface CollisionSimulationState {
  t: number
  cart1: CartState
  cart2: CartState
  derived: CollisionDerived
  initialPTotal: number
  initialKeTotal: number
  collisionFlash: number // Timer/counter for visual collision flash effect (seconds)
}

/**
 * Analytical solution for post-collision velocities in 1D with coefficient of restitution e.
 * v1' = (m1 - e*m2)/(m1 + m2)*v1 + (1 + e)*m2/(m1 + m2)*v2
 * v2' = (1 + e)*m1/(m1 + m2)*v1 + (m2 - e*m1)/(m1 + m2)*v2
 */
export function computeAnalyticalPostCollision(
  m1: number,
  m2: number,
  v1: number,
  v2: number,
  e: number
): { v1Prime: number; v2Prime: number; pTotal: number; keTotalBefore: number; keTotalAfter: number; deltaKe: number } {
  const totalM = m1 + m2
  const v1Prime = ((m1 - e * m2) * v1 + (1 + e) * m2 * v2) / totalM
  const v2Prime = ((1 + e) * m1 * v1 + (m2 - e * m1) * v2) / totalM

  const pAfter = m1 * v1Prime + m2 * v2Prime

  const keBefore = 0.5 * m1 * v1 * v1 + 0.5 * m2 * v2 * v2
  const keAfter = 0.5 * m1 * v1Prime * v1Prime + 0.5 * m2 * v2Prime * v2Prime

  return {
    v1Prime,
    v2Prime,
    pTotal: pAfter,
    keTotalBefore: keBefore,
    keTotalAfter: keAfter,
    deltaKe: keAfter - keBefore,
  }
}

/**
 * Creates initial simulation state.
 * By default, cart 1 starts on left at 20% track, cart 2 at 60% track.
 */
export function createCollisionModel(params: CollisionParams): CollisionSimulationState {
  const p1 = params.m1 * params.v1
  const p2 = params.m2 * params.v2
  const pTot = p1 + p2
  const ke1 = 0.5 * params.m1 * params.v1 * params.v1
  const ke2 = 0.5 * params.m2 * params.v2 * params.v2
  const keTot = ke1 + ke2

  // Default positions: cart 1 at 25% of track, cart 2 at 65% of track
  const x1 = params.trackLength * 0.25
  const x2 = params.trackLength * 0.65

  return {
    t: 0,
    cart1: {
      x: x1,
      v: params.v1,
      mass: params.m1,
      p: p1,
      ke: ke1,
    },
    cart2: {
      x: x2,
      v: params.v2,
      mass: params.m2,
      p: p2,
      ke: ke2,
    },
    derived: {
      pTotal: pTot,
      keTotal: keTot,
      deltaP: 0,
      deltaKe: 0,
      vRel: params.v1 - params.v2,
      collisionCount: 0,
      wallCollisions: 0,
      hasCollided: false,
    },
    initialPTotal: pTot,
    initialKeTotal: keTot,
    collisionFlash: 0,
  }
}

/**
 * Steps the simulation forward by dt (seconds).
 * Integrates positions with sub-stepping for collision detection to prevent tunneling.
 */
export function stepCollisionModel(
  state: CollisionSimulationState,
  params: CollisionParams,
  dt: number
): CollisionSimulationState {
  // Use small internal sub-steps for robust continuous collision detection
  const subSteps = 10
  const subDt = dt / subSteps

  let x1 = state.cart1.x
  let v1 = state.cart1.v
  let x2 = state.cart2.x
  let v2 = state.cart2.v
  let collisionCount = state.derived.collisionCount
  let wallCollisions = state.derived.wallCollisions
  let hasCollided = state.derived.hasCollided
  let flash = Math.max(0, state.collisionFlash - dt)

  const w = params.cartWidth
  const trackLen = params.trackLength
  const e = params.restitution
  const m1 = params.m1
  const m2 = params.m2

  // Drag deceleration in real mode
  const dragCoeff = params.isRealMode ? params.friction : 0

  for (let s = 0; s < subSteps; s++) {
    // Apply drag
    if (dragCoeff > 0) {
      v1 -= Math.sign(v1) * dragCoeff * v1 * v1 * subDt
      v2 -= Math.sign(v2) * dragCoeff * v2 * v2 * subDt
      if (Math.abs(v1) < 1e-4) v1 = 0
      if (Math.abs(v2) < 1e-4) v2 = 0
    }

    // Tentative next positions
    let nextX1 = x1 + v1 * subDt
    let nextX2 = x2 + v2 * subDt

    // 1. Check cart-to-cart collision
    // Since cart1 is to the left of cart2 (x1 + w/2 touches x2 - w/2)
    // Distance between centers <= w
    const dist = nextX2 - nextX1
    if (dist <= w && (v1 - v2) > 0) {
      // Collision occurs!
      const post = computeAnalyticalPostCollision(m1, m2, v1, v2, e)
      v1 = post.v1Prime
      v2 = post.v2Prime

      // Separate them symmetrically to touch exactly
      const overlap = w - dist
      nextX1 -= overlap * 0.5
      nextX2 += overlap * 0.5

      collisionCount++
      hasCollided = true
      flash = 0.25 // 250ms visual flash
    }

    // 2. Check track boundary walls
    // Left wall at x = w/2
    const minX = w / 2
    if (nextX1 < minX) {
      nextX1 = minX
      v1 = -v1 * (params.isRealMode ? 0.95 : 1.0) // slightly inelastic wall bounce in real mode
      wallCollisions++
    }
    // Right wall at x = trackLen - w/2
    const maxX = trackLen - w / 2
    if (nextX2 > maxX) {
      nextX2 = maxX
      v2 = -v2 * (params.isRealMode ? 0.95 : 1.0)
      wallCollisions++
    }

    // In case cart 1 hits cart 2 after wall bounce or vice versa
    if (nextX1 > nextX2 - w) {
      nextX1 = nextX2 - w
    }

    x1 = nextX1
    x2 = nextX2
  }

  // Calculate current quantities
  const p1 = m1 * v1
  const p2 = m2 * v2
  const pTot = p1 + p2
  const ke1 = 0.5 * m1 * v1 * v1
  const ke2 = 0.5 * m2 * v2 * v2
  const keTot = ke1 + ke2

  return {
    t: state.t + dt,
    cart1: {
      x: x1,
      v: v1,
      mass: m1,
      p: p1,
      ke: ke1,
    },
    cart2: {
      x: x2,
      v: v2,
      mass: m2,
      p: p2,
      ke: ke2,
    },
    derived: {
      pTotal: pTot,
      keTotal: keTot,
      deltaP: pTot - state.initialPTotal,
      deltaKe: keTot - state.initialKeTotal,
      vRel: v1 - v2,
      collisionCount,
      wallCollisions,
      hasCollided,
    },
    initialPTotal: state.initialPTotal,
    initialKeTotal: state.initialKeTotal,
    collisionFlash: flash,
  }
}
