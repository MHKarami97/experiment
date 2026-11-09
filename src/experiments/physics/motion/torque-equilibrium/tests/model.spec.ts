import { describe, it, expect } from 'vitest'
import {
  computeTorqueAnalytical,
  createTorqueModel,
  stepTorqueModel,
  type TorqueEquilibriumParams,
} from '../model/torque'

describe('Torque & Static Equilibrium (Lever / Seesaw) Physics Model', () => {
  it('identifies perfect static balance with symmetric equal loads', () => {
    // 2 kg at -1.5 m (left) and 2 kg at +1.5 m (right)
    const params: TorqueEquilibriumParams = {
      beamLength: 6.0,
      beamMass: 4.0,
      pivotOffset: 0.0,
      g: 9.8,
      maxAngleDeg: 20,
      friction: 0.1,
      loads: [
        { id: '1', mass: 2.0, x: -1.5 },
        { id: '2', mass: 2.0, x: 1.5 },
      ],
      isRealMode: false,
    }

    const analytical = computeTorqueAnalytical(params)
    expect(analytical.isBalanced).toBe(true)
    expect(Math.abs(analytical.netTorque)).toBeLessThan(1e-6)
    expect(Math.abs(analytical.leftTorque - 2.0 * 9.8 * 1.5)).toBeLessThan(1e-6)
    expect(Math.abs(analytical.rightTorque - 2.0 * 9.8 * 1.5)).toBeLessThan(1e-6)
  })

  it('balances unequal masses using Archimedes law of the lever (m1 * x1 = m2 * x2)', () => {
    // 6 kg at -1.0 m vs 2 kg at +3.0 m -> Torques: 6*1*g = 6g left, 2*3*g = 6g right
    const params: TorqueEquilibriumParams = {
      beamLength: 6.0,
      beamMass: 0.0,
      pivotOffset: 0.0,
      g: 10.0,
      maxAngleDeg: 20,
      friction: 0.05,
      loads: [
        { id: '1', mass: 6.0, x: -1.0 },
        { id: '2', mass: 2.0, x: 3.0 },
      ],
      isRealMode: false,
    }

    const analytical = computeTorqueAnalytical(params)
    expect(analytical.isBalanced).toBe(true)
    expect(Math.abs(analytical.leftTorque - 60.0)).toBeLessThan(1e-6)
    expect(Math.abs(analytical.rightTorque - 60.0)).toBeLessThan(1e-6)
    expect(Math.abs(analytical.netTorque)).toBeLessThan(1e-6)
  })

  it('correctly accounts for beam center of mass torque when fulcrum is shifted', () => {
    // Fulcrum shifted +0.5 m to the right:
    // Beam center is at -0.5 m relative to pivot -> tau_beam = -0.5 * 10 kg * 9.8 = -49 N·m (leftward)
    const params: TorqueEquilibriumParams = {
      beamLength: 6.0,
      beamMass: 10.0,
      pivotOffset: 0.5,
      g: 9.8,
      maxAngleDeg: 20,
      friction: 0.1,
      loads: [],
      isRealMode: false,
    }

    const analytical = computeTorqueAnalytical(params)
    expect(analytical.isBalanced).toBe(false)
    expect(analytical.beamTorque).toBeLessThan(0)
    expect(Math.abs(analytical.leftTorque - 49.0)).toBeLessThan(1e-6)
    expect(Math.abs(analytical.netTorque - (-49.0))).toBeLessThan(1e-6)
  })

  it('tilts dynamically to ground bumper when unbalanced and damps in real mode', () => {
    // Heavy mass on right: 10 kg at +2 m vs 1 kg at -2 m
    const params: TorqueEquilibriumParams = {
      beamLength: 6.0,
      beamMass: 4.0,
      pivotOffset: 0.0,
      g: 9.8,
      maxAngleDeg: 20,
      friction: 0.2,
      loads: [
        { id: '1', mass: 1.0, x: -2.0 },
        { id: '2', mass: 10.0, x: 2.0 },
      ],
      isRealMode: true,
    }

    let state = createTorqueModel(params)
    expect(state.touchesGround).toBe('none')

    // Step simulation
    for (let i = 0; i < 100; i++) {
      state = stepTorqueModel(state, params, 0.02)
    }

    // Must tilt towards right and hit ground bumper (+20 deg = ~0.349 rad)
    expect(state.touchesGround).toBe('right')
    const maxRad = (20 * Math.PI) / 180
    expect(Math.abs(state.theta - maxRad)).toBeLessThan(1e-3)
  })

  it('accurately calculates fulcrum support force sum(F_y) = 0', () => {
    // Support force = (beamMass + sum(m_i)) * g
    const params: TorqueEquilibriumParams = {
      beamLength: 6.0,
      beamMass: 5.0,
      pivotOffset: 0.0,
      g: 9.8,
      maxAngleDeg: 20,
      friction: 0.1,
      loads: [
        { id: '1', mass: 3.0, x: -1.0 },
        { id: '2', mass: 7.0, x: 2.0 },
      ],
      isRealMode: false,
    }

    const analytical = computeTorqueAnalytical(params)
    const expectedSupport = (5.0 + 3.0 + 7.0) * 9.8 // 15 * 9.8 = 147 N
    expect(Math.abs(analytical.totalSupportForce - expectedSupport)).toBeLessThan(1e-6)
  })
})
