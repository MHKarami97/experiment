import { describe, it, expect } from 'vitest'
import {
  computeSimplePendulumAnalyticalPeriod,
  createPendulumModel,
  stepPendulumModel,
  type PendulumParams,
} from '../model/pendulum'

describe('Simple & Double Pendulum (Chaos) Physics Model', () => {
  it('matches small angle simple harmonic period T0 = 2*pi*sqrt(L/g) within 1e-3', () => {
    const L = 1.0
    const g = 9.80665
    const expectedT0 = 2 * Math.PI * Math.sqrt(L / g) // ~ 2.00606 s
    const analyticalT = computeSimplePendulumAnalyticalPeriod(L, g, 0.05) // small 0.05 rad (~2.8 deg)

    expect(Math.abs(analyticalT - expectedT0) / expectedT0).toBeLessThan(1e-3)

    // Simulate for 1 full cycle and verify zero crossing period
    const params: PendulumParams = {
      type: 'simple',
      l1: L,
      m1: 1.0,
      theta1: 0.05,
      omega1: 0.0,
      l2: 1.0,
      m2: 1.0,
      theta2: 0.0,
      omega2: 0.0,
      g,
      damping: 0.0,
      isRealMode: false,
    }

    let state = createPendulumModel(params)
    const dt = 0.001
    let lastTh = state.theta1
    let zeroCrossings: number[] = []

    // Run for 2.5 seconds
    for (let i = 0; i < 2500; i++) {
      state = stepPendulumModel(state, params, dt)
      // Check zero crossing with linear interpolation for high precision
      if (lastTh > 0 && state.theta1 <= 0) {
        // interpolate exact t
        const frac = lastTh / (lastTh - state.theta1)
        const tCross = state.t - dt + frac * dt
        zeroCrossings.push(tCross)
      }
      lastTh = state.theta1
    }

    expect(zeroCrossings.length).toBeGreaterThanOrEqual(1)
    // First zero crossing from positive release is at t = T/4
    const simulatedT = zeroCrossings[0] * 4
    expect(Math.abs(simulatedT - analyticalT) / analyticalT).toBeLessThan(1e-3)
  })

  it('conserves mechanical energy (PE + KE) in ideal simple pendulum within 1e-4', () => {
    const params: PendulumParams = {
      type: 'simple',
      l1: 1.5,
      m1: 2.0,
      theta1: 0.6, // ~ 34 deg
      omega1: 0.0,
      l2: 1.0,
      m2: 1.0,
      theta2: 0.0,
      omega2: 0.0,
      g: 9.8,
      damping: 0.0,
      isRealMode: false,
    }

    let state = createPendulumModel(params)
    const initialE = state.totalEnergy

    for (let i = 0; i < 300; i++) {
      state = stepPendulumModel(state, params, 0.01)
      const currentE = state.totalEnergy
      expect(Math.abs(currentE - initialE) / Math.abs(initialE)).toBeLessThan(1e-4)
    }
  })

  it('damps mechanical energy continuously in real mode', () => {
    const params: PendulumParams = {
      type: 'simple',
      l1: 1.0,
      m1: 1.0,
      theta1: 0.5,
      omega1: 0.0,
      l2: 1.0,
      m2: 1.0,
      theta2: 0.0,
      omega2: 0.0,
      g: 9.8,
      damping: 0.3,
      isRealMode: true,
    }

    let state = createPendulumModel(params)
    const initialE = state.totalEnergy

    for (let i = 0; i < 200; i++) {
      state = stepPendulumModel(state, params, 0.01)
    }

    expect(state.totalEnergy).toBeLessThan(initialE)
  })

  it('conserves total mechanical energy in ideal double pendulum within numerical tolerance', () => {
    const params: PendulumParams = {
      type: 'double',
      l1: 1.0,
      m1: 1.0,
      theta1: Math.PI / 2, // 90 deg horizontal release
      omega1: 0.0,
      l2: 1.0,
      m2: 1.0,
      theta2: Math.PI / 2,
      omega2: 0.0,
      g: 9.8,
      damping: 0.0,
      isRealMode: false,
    }

    let state = createPendulumModel(params)
    const initialE = state.totalEnergy

    // Run for 200 RK4 steps
    for (let i = 0; i < 200; i++) {
      state = stepPendulumModel(state, params, 0.01)
    }

    // Energy drift for chaotic double pendulum over RK4 with sub-steps is < 0.1%
    expect(Math.abs(state.totalEnergy - initialE) / Math.abs(initialE)).toBeLessThan(1e-3)
  })

  it('exhibits chaotic divergence (Lyapunov sensitivity) for double pendulum with tiny initial perturbation', () => {
    const p1: PendulumParams = {
      type: 'double',
      l1: 1.0,
      m1: 1.0,
      theta1: 2.0,
      omega1: 0.0,
      l2: 1.0,
      m2: 1.0,
      theta2: 2.0,
      omega2: 0.0,
      g: 9.8,
      damping: 0.0,
      isRealMode: false,
    }

    // Perturb initial theta2 by 0.001 rad
    const p2: PendulumParams = {
      ...p1,
      theta2: 2.0 + 0.001,
    }

    let s1 = createPendulumModel(p1)
    let s2 = createPendulumModel(p2)

    // Evolve both systems forward for 6 seconds (600 steps)
    for (let i = 0; i < 600; i++) {
      s1 = stepPendulumModel(s1, p1, 0.01)
      s2 = stepPendulumModel(s2, p2, 0.01)
    }

    // Positions of tip 2 must diverge significantly over time due to deterministic chaos
    const dist = Math.hypot(s1.x2 - s2.x2, s1.y2 - s2.y2)
    expect(dist).toBeGreaterThan(0.05)
  })
})
