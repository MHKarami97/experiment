import { describe, it, expect } from 'vitest'
import {
  computeAnalyticalPostCollision,
  createCollisionModel,
  stepCollisionModel,
  type CollisionParams,
} from '../model/collisions'

describe('1D Collisions & Linear Momentum Physics Model', () => {
  it('conserves momentum perfectly in ideal elastic collision with equal masses', () => {
    // m1 = 1kg, m2 = 1kg, v1 = 2m/s, v2 = 0m/s, e = 1.0 (elastic)
    // Expect: v1' = 0, v2' = 2 m/s (perfect velocity swap)
    const analytical = computeAnalyticalPostCollision(1.0, 1.0, 2.0, 0.0, 1.0)
    expect(Math.abs(analytical.v1Prime - 0.0)).toBeLessThan(1e-6)
    expect(Math.abs(analytical.v2Prime - 2.0)).toBeLessThan(1e-6)
    expect(Math.abs(analytical.pTotal - 2.0)).toBeLessThan(1e-6)
    expect(Math.abs(analytical.deltaKe)).toBeLessThan(1e-6)
  })

  it('accurately predicts velocities and kinetic energy loss for completely inelastic collision (e = 0)', () => {
    // m1 = 2kg, m2 = 3kg, v1 = 5m/s, v2 = 0m/s, e = 0.0
    // Total p = 10 kg*m/s. Total mass = 5kg. Common velocity v' = 10/5 = 2.0 m/s
    // KE_before = 0.5 * 2 * 25 = 25 J. KE_after = 0.5 * 5 * 4 = 10 J. Loss = 15 J
    const analytical = computeAnalyticalPostCollision(2.0, 3.0, 5.0, 0.0, 0.0)
    expect(Math.abs(analytical.v1Prime - 2.0)).toBeLessThan(1e-6)
    expect(Math.abs(analytical.v2Prime - 2.0)).toBeLessThan(1e-6)
    expect(Math.abs(analytical.pTotal - 10.0)).toBeLessThan(1e-6)
    expect(Math.abs(analytical.deltaKe - (-15.0))).toBeLessThan(1e-6)
  })

  it('preserves total momentum across numerical step simulation during collision', () => {
    const params: CollisionParams = {
      m1: 1.5,
      m2: 2.5,
      v1: 3.0,
      v2: -1.0,
      restitution: 0.8,
      cartWidth: 0.4,
      trackLength: 10.0,
      friction: 0.0,
      noiseLevel: 0.0,
      isRealMode: false,
    }

    let state = createCollisionModel(params)
    const initialP = state.derived.pTotal

    // Step forward until carts collide
    let hasCollided = false
    const dt = 0.016
    for (let step = 0; step < 200; step++) {
      state = stepCollisionModel(state, params, dt)
      if (state.derived.hasCollided) {
        hasCollided = true
      }
      // Total momentum must remain constant at every step before wall collisions
      if (state.derived.wallCollisions === 0) {
        expect(Math.abs(state.derived.pTotal - initialP)).toBeLessThan(1e-4)
      }
    }

    expect(hasCollided).toBe(true)
  })

  it('matches analytical post-collision velocities within 1e-3 tolerance in numerical loop', () => {
    const m1 = 2.0
    const m2 = 1.0
    const v1 = 4.0
    const v2 = 1.0
    const e = 0.6

    const analytical = computeAnalyticalPostCollision(m1, m2, v1, v2, e)

    const params: CollisionParams = {
      m1,
      m2,
      v1,
      v2,
      restitution: e,
      cartWidth: 0.3,
      trackLength: 10.0,
      friction: 0.0,
      noiseLevel: 0.0,
      isRealMode: false,
    }

    let state = createCollisionModel(params)
    // Run until collision occurs
    for (let step = 0; step < 250; step++) {
      state = stepCollisionModel(state, params, 0.01)
      if (state.derived.hasCollided) break
    }

    expect(state.derived.hasCollided).toBe(true)
    expect(Math.abs(state.cart1.v - analytical.v1Prime)).toBeLessThan(1e-3)
    expect(Math.abs(state.cart2.v - analytical.v2Prime)).toBeLessThan(1e-3)
  })

  it('demonstrates mechanical kinetic energy dissipation when e < 1.0', () => {
    const params: CollisionParams = {
      m1: 1.0,
      m2: 1.0,
      v1: 2.0,
      v2: -2.0,
      restitution: 0.5,
      cartWidth: 0.4,
      trackLength: 10.0,
      friction: 0.0,
      noiseLevel: 0.0,
      isRealMode: false,
    }

    let state = createCollisionModel(params)
    const initialKe = state.initialKeTotal

    for (let step = 0; step < 150; step++) {
      state = stepCollisionModel(state, params, 0.016)
      if (state.derived.hasCollided) break
    }

    expect(state.derived.hasCollided).toBe(true)
    // KE must strictly decrease after inelastic collision
    expect(state.derived.keTotal).toBeLessThan(initialKe)
    // Total momentum was 1*(2) + 1*(-2) = 0, should still be 0
    expect(Math.abs(state.derived.pTotal)).toBeLessThan(1e-4)
  })
})
