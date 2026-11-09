import { describe, it, expect } from 'vitest'
import {
  computeSpringAnalytical,
  createSpringModel,
  stepSpringModel,
  type SpringParams,
} from '../model/spring'

describe('Spring & Simple Harmonic Motion (Resonance) Physics Model', () => {
  it('accurately verifies natural period T0 = 2*pi*sqrt(m/k) within 1e-3 tolerance', () => {
    // m = 2.0 kg, k = 50 N/m -> omega0 = sqrt(50/2) = 5 rad/s -> T0 = 2*pi/5 = ~1.256637 s
    const params: SpringParams = {
      mass: 2.0,
      k: 50.0,
      damping: 0.0,
      driveAmp: 0.0,
      driveFreq: 0.0,
      initialX: 0.5, // 50 cm displacement
      initialV: 0.0,
      isRealMode: false,
    }

    const analytical = computeSpringAnalytical(params)
    const expectedT = (2 * Math.PI) / 5.0
    expect(Math.abs(analytical.period0 - expectedT) / expectedT).toBeLessThan(1e-6)

    // Numerical verification via zero crossings
    let state = createSpringModel(params)
    const dt = 0.001
    let lastX = state.x
    let zeroCrossings: number[] = []

    // Simulate for 2 cycles (~ 2.5 s)
    for (let i = 0; i < 2500; i++) {
      state = stepSpringModel(state, params, dt)
      if (lastX > 0 && state.x <= 0) {
        // Linear interpolation of exact crossing time
        const frac = lastX / (lastX - state.x)
        const tCross = state.t - dt + frac * dt
        zeroCrossings.push(tCross)
      }
      lastX = state.x
    }

    expect(zeroCrossings.length).toBeGreaterThanOrEqual(2)
    // Period is difference between successive zero crossings in the same direction (every 2 crossings) or T/4 for first
    const simulatedT = zeroCrossings[0] * 4
    expect(Math.abs(simulatedT - analytical.period0) / analytical.period0).toBeLessThan(1e-3)
  })

  it('conserves mechanical energy (0.5*k*x^2 + 0.5*m*v^2) in ideal undamped oscillation within 1e-4', () => {
    const params: SpringParams = {
      mass: 1.5,
      k: 60.0,
      damping: 0.0,
      driveAmp: 0.0,
      driveFreq: 0.0,
      initialX: 0.4,
      initialV: 0.2,
      isRealMode: false,
    }

    let state = createSpringModel(params)
    const initialE = state.totalEnergy

    for (let i = 0; i < 400; i++) {
      state = stepSpringModel(state, params, 0.01)
      const currentE = state.totalEnergy
      expect(Math.abs(currentE - initialE) / initialE).toBeLessThan(1e-4)
    }
  })

  it('damps oscillation amplitude exponentially in underdamped real mode', () => {
    const params: SpringParams = {
      mass: 1.0,
      k: 40.0,
      damping: 0.5,
      driveAmp: 0.0,
      driveFreq: 0.0,
      initialX: 0.8,
      initialV: 0.0,
      isRealMode: true,
    }

    let state = createSpringModel(params)
    const initialE = state.totalEnergy

    // Simulate for 6 seconds (600 steps of 0.01s)
    for (let i = 0; i < 600; i++) {
      state = stepSpringModel(state, params, 0.01)
    }

    // Energy must strictly decrease over time
    expect(state.totalEnergy).toBeLessThan(initialE * 0.1)
  })

  it('demonstrates resonance amplitude amplification when driving frequency matches natural frequency', () => {
    // k = 100 N/m, m = 1 kg -> f0 = sqrt(100)/2pi = 10 / (2*pi) = ~1.59155 Hz
    const f0 = 10.0 / (2 * Math.PI)
    const c = 0.4
    const F0 = 2.0

    // Resonant driving
    const resonantParams: SpringParams = {
      mass: 1.0,
      k: 100.0,
      damping: c,
      driveAmp: F0,
      driveFreq: f0,
      initialX: 0.0,
      initialV: 0.0,
      isRealMode: true,
    }

    // Off-resonance driving (f = 0.5 * f0)
    const offResonantParams: SpringParams = {
      ...resonantParams,
      driveFreq: f0 * 0.5,
    }

    let resState = createSpringModel(resonantParams)
    let offState = createSpringModel(offResonantParams)

    let maxResX = 0
    let maxOffX = 0

    // Simulate for 10 seconds to allow steady-state response to develop
    for (let i = 0; i < 1000; i++) {
      resState = stepSpringModel(resState, resonantParams, 0.01)
      offState = stepSpringModel(offState, offResonantParams, 0.01)

      if (i > 500) {
        maxResX = Math.max(maxResX, Math.abs(resState.x))
        maxOffX = Math.max(maxOffX, Math.abs(offState.x))
      }
    }

    // Amplitude at resonance must be substantially greater than off-resonance
    expect(maxResX).toBeGreaterThan(maxOffX * 2.0)
  })
})
