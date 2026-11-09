import { describe, it, expect } from 'vitest';
import {
  calculateStandingWaveDerived,
  calculateWaveProfile,
  generateKundtParticles,
  StandingWaveParams
} from '../model/standing-waves';

describe('Standing Waves Model (String & Air Columns)', () => {
  it('calculates string wave speed accurately from tension and linear mass density v = sqrt(T/μ)', () => {
    const params: StandingWaveParams = {
      system: 'string',
      harmonicNumber: 1,
      length: 1.0,
      tension: 40.0, // N
      linearDensityGPerM: 2.5, // 2.5 g/m = 0.0025 kg/m
      soundSpeed: 343,
      autoResonance: true,
      damping: 0.02,
      realMode: false
    };

    const derived = calculateStandingWaveDerived(params);

    // v = sqrt(40 / 0.0025) = sqrt(16000) ≈ 126.491 m/s
    expect(derived.waveSpeed).toBeCloseTo(Math.sqrt(40 / 0.0025), 3);
    // f1 = v / 2L = 126.491 / 2.0 ≈ 63.245 Hz
    expect(derived.fundamentalFrequency).toBeCloseTo(derived.waveSpeed / 2.0, 3);
    expect(derived.resonantFrequency).toBeCloseTo(derived.fundamentalFrequency, 3);
  });

  it('correctly predicts nodes and antinodes for higher harmonics on a fixed string (n = 3)', () => {
    const L = 1.2;
    const params: StandingWaveParams = {
      system: 'string',
      harmonicNumber: 3,
      length: L,
      tension: 50.0,
      linearDensityGPerM: 2.0,
      soundSpeed: 343,
      autoResonance: true,
      damping: 0.02,
      realMode: false
    };

    const derived = calculateStandingWaveDerived(params);

    // λ_3 = 2L / 3 = 2 * 1.2 / 3 = 0.8 m
    expect(derived.wavelength).toBeCloseTo(0.8, 3);
    // 3 loops -> 4 nodes (including both fixed ends)
    expect(derived.nodeCount).toBe(4);
    expect(derived.antinodeCount).toBe(3);

    // Node locations: 0, 0.4, 0.8, 1.2
    expect(derived.nodePositions[0]).toBeCloseTo(0, 3);
    expect(derived.nodePositions[1]).toBeCloseTo(0.4, 3);
    expect(derived.nodePositions[2]).toBeCloseTo(0.8, 3);
    expect(derived.nodePositions[3]).toBeCloseTo(1.2, 3);

    // Antinode locations: 0.2, 0.6, 1.0
    expect(derived.antinodePositions[0]).toBeCloseTo(0.2, 3);
    expect(derived.antinodePositions[1]).toBeCloseTo(0.6, 3);
    expect(derived.antinodePositions[2]).toBeCloseTo(1.0, 3);
  });

  it('models open-open acoustic pipes with displacement antinodes at both ends', () => {
    const L = 1.0;
    const vSound = 340.0;
    const params: StandingWaveParams = {
      system: 'open_pipe',
      harmonicNumber: 2,
      length: L,
      tension: 50,
      linearDensityGPerM: 2,
      soundSpeed: vSound,
      autoResonance: true,
      damping: 0.02,
      realMode: false
    };

    const derived = calculateStandingWaveDerived(params);

    // f_1 = v / 2L = 340 / 2 = 170 Hz
    expect(derived.fundamentalFrequency).toBeCloseTo(170.0, 2);
    // f_2 = 2 * 170 = 340 Hz
    expect(derived.resonantFrequency).toBeCloseTo(340.0, 2);

    // For open-open pipe, antinodes are at x = 0, x = L/2, x = L
    expect(derived.antinodePositions[0]).toBeCloseTo(0, 3);
    expect(derived.antinodePositions[derived.antinodePositions.length - 1]).toBeCloseTo(L, 3);
  });

  it('models open-closed acoustic pipes with odd harmonics and quarter-wavelength fundamental', () => {
    const L = 0.85;
    const vSound = 340.0;
    const params: StandingWaveParams = {
      system: 'closed_pipe',
      harmonicNumber: 1, // First mode (fundamental)
      length: L,
      tension: 50,
      linearDensityGPerM: 2,
      soundSpeed: vSound,
      autoResonance: true,
      damping: 0.02,
      realMode: false
    };

    const derived = calculateStandingWaveDerived(params);

    // λ_1 = 4L = 4 * 0.85 = 3.4 m
    expect(derived.wavelength).toBeCloseTo(3.4, 3);
    // f_1 = v / 4L = 340 / 3.4 = 100 Hz
    expect(derived.fundamentalFrequency).toBeCloseTo(100.0, 2);
    expect(derived.resonantFrequency).toBeCloseTo(100.0, 2);

    // Closed end x = 0 is a node
    expect(derived.nodePositions[0]).toBeCloseTo(0, 3);
    // Open end x = L is an antinode
    expect(derived.antinodePositions[0]).toBeCloseTo(L, 3);
  });

  it('models acoustic end correction in real mode lowering the resonant frequency', () => {
    const baseParams: StandingWaveParams = {
      system: 'open_pipe',
      harmonicNumber: 1,
      length: 1.0,
      tension: 50,
      linearDensityGPerM: 2,
      soundSpeed: 340,
      autoResonance: true,
      damping: 0.02,
      realMode: false,
      pipeRadiusMm: 30
    };

    const idealDerived = calculateStandingWaveDerived(baseParams);

    const realParams: StandingWaveParams = {
      ...baseParams,
      realMode: true
    };

    const realDerived = calculateStandingWaveDerived(realParams);

    // In real mode, acoustic length is longer: L_eff = L + 2 * 0.61 * r > L
    expect(realDerived.effectiveLength).toBeGreaterThan(idealDerived.effectiveLength);
    // Therefore resonant frequency is slightly lower
    expect(realDerived.resonantFrequency).toBeLessThan(idealDerived.resonantFrequency);
  });

  it('generates continuous wave profiles and Kundt dust particles without numerical errors', () => {
    const params: StandingWaveParams = {
      system: 'string',
      harmonicNumber: 2,
      length: 1.2,
      tension: 40,
      linearDensityGPerM: 2,
      soundSpeed: 343,
      autoResonance: true,
      damping: 0.02,
      realMode: false
    };

    const derived = calculateStandingWaveDerived(params);
    const profile = calculateWaveProfile(50, 0.05, params, derived, 3.0);
    const particles = generateKundtParticles(40, 0.05, params, derived);

    expect(profile.length).toBe(50);
    expect(particles.length).toBe(40);

    for (const pt of profile) {
      expect(Number.isFinite(pt.displacement)).toBe(true);
      expect(Number.isFinite(pt.envelope)).toBe(true);
      expect(pt.envelope).toBeGreaterThanOrEqual(0);
    }

    for (const p of particles) {
      expect(Number.isFinite(p.x)).toBe(true);
      expect(Number.isFinite(p.y)).toBe(true);
    }
  });
});
