import { describe, it, expect } from 'vitest'
import {
  computeOrbitalAnalytical,
  createOrbitModel,
  stepOrbitModel,
  type OrbitParams,
} from '../model/orbital'

describe('Gravity & Planetary Orbits (Kepler) Physics Model', () => {
  it('verifies Kepler third law T^2 = (4*pi^2 / GM) * a^3 within 1e-4 tolerance', () => {
    // Earth-like orbit around Sun: M = 1.989e30 kg, a = 1.496e11 m (1 AU)
    const G = 6.67430e-11
    const M = 1.989e30
    const a = 1.496e11
    const mu = G * M

    const expectedPeriod = 2 * Math.PI * Math.sqrt(Math.pow(a, 3) / mu) // ~ 3.1558e7 s (~1 year)
    const params: OrbitParams = {
      primaryMass: M,
      satelliteMass: 1000,
      semiMajorAxis: a,
      eccentricity: 0.0167, // Earth's eccentricity
      trueAnomaly0: 0.0,
      gConst: G,
      isRealMode: false,
    }

    const analytical = computeOrbitalAnalytical(params)
    expect(Math.abs(analytical.period - expectedPeriod) / expectedPeriod).toBeLessThan(1e-5)
  })

  it('accurately calculates Vis-Viva speeds at periapsis and apoapsis', () => {
    // Highly elliptical orbit: e = 0.5, a = 1.0e7 m around Earth (M = 5.972e24 kg)
    const G = 6.67430e-11
    const M = 5.972e24
    const a = 1.0e7
    const e = 0.5

    const params: OrbitParams = {
      primaryMass: M,
      satelliteMass: 500,
      semiMajorAxis: a,
      eccentricity: e,
      trueAnomaly0: 0.0, // starts at periapsis
      gConst: G,
      isRealMode: false,
    }

    const state = createOrbitModel(params)
    const analytical = computeOrbitalAnalytical(params)

    // At true anomaly = 0, distance must be periapsis r_p = a*(1 - e) = 0.5e7 m
    expect(Math.abs(state.r - analytical.periapsis)).toBeLessThan(1e-3)
    // Speed at periapsis must match analytical Vis-Viva
    expect(Math.abs(state.speed - analytical.vPeriapsis) / analytical.vPeriapsis).toBeLessThan(1e-5)
    // Apoapsis distance r_a = a*(1 + e) = 1.5e7 m
    expect(Math.abs(analytical.apoapsis - 1.5e7)).toBeLessThan(1e-3)
  })

  it('preserves specific angular momentum h and specific orbital energy in symplectic integrator', () => {
    // Normalised orbital scale for high-speed simulation:
    // GM = 1000, a = 10, e = 0.3
    const params: OrbitParams = {
      primaryMass: 1000 / 6.67430e-11,
      satelliteMass: 1,
      semiMajorAxis: 10,
      eccentricity: 0.3,
      trueAnomaly0: 0,
      gConst: 6.67430e-11,
      isRealMode: false,
    }

    let state = createOrbitModel(params)
    const initialH = state.angularMomentum
    const initialE = state.specificEnergy

    // Step for ~1 full orbit (~ 19.87 s)
    const dt = 0.01
    for (let i = 0; i < 2000; i++) {
      state = stepOrbitModel(state, params, dt)

      // Angular momentum must be strictly conserved at every step
      expect(Math.abs(state.angularMomentum - initialH) / initialH).toBeLessThan(1e-4)
      // Specific orbital energy must be strictly conserved
      expect(Math.abs(state.specificEnergy - initialE) / Math.abs(initialE)).toBeLessThan(1e-4)
    }
  })

  it('demonstrates orbital decay in real mode under atmospheric drag', () => {
    const params: OrbitParams = {
      primaryMass: 5.972e24,
      satelliteMass: 1000,
      semiMajorAxis: 7.0e6,
      eccentricity: 0.1,
      trueAnomaly0: 0,
      gConst: 6.67430e-11,
      isRealMode: true,
    }

    let state = createOrbitModel(params)
    const initialEnergy = state.specificEnergy

    for (let i = 0; i < 50; i++) {
      state = stepOrbitModel(state, params, 1.0)
    }

    // Energy becomes more negative as orbit decays
    expect(state.specificEnergy).toBeLessThan(initialEnergy)
  })
})
