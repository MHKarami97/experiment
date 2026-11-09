import { describe, it, expect } from 'vitest';
import {
  calculateCycleMetrics,
  calculateInstantaneousState,
  generateCycleCurvePoints,
  EngineParams
} from '../model/heat-engines';

describe('Thermodynamic Heat Engines Model', () => {
  it('computes Carnot cycle efficiency and energy conservation correctly', () => {
    const params: EngineParams = {
      cycleType: 'carnot',
      gasType: 'diatomic',
      moles: 0.05,
      th: 600, // K
      tc: 300, // K
      compressionRatio: 4.0,
      realMode: false
    };

    const metrics = calculateCycleMetrics(params);

    // Analytical Carnot efficiency: 1 - Tc/Th = 1 - 300/600 = 0.50 (50%)
    expect(metrics.carnotLimit).toBeCloseTo(0.5, 3);
    expect(metrics.thermalEfficiencyIdeal).toBeCloseTo(0.5, 3);

    // First Law: W_net = Q_in - Q_out
    expect(metrics.workNetIdeal).toBeGreaterThan(0);
    expect(metrics.workNetIdeal).toBeCloseTo(metrics.qIn - metrics.qOut, 2);

    // State 1 and 2 are at Th, State 3 and 4 are at Tc
    const [s1, s2, s3, s4] = metrics.states;
    expect(s1.temperature).toBeCloseTo(600, 1);
    expect(s2.temperature).toBeCloseTo(600, 1);
    expect(s3.temperature).toBeCloseTo(300, 1);
    expect(s4.temperature).toBeCloseTo(300, 1);
  });

  it('computes Otto cycle efficiency matching the analytical formula η = 1 - 1/r^(γ-1)', () => {
    const r = 8.0;
    const gamma = 1.4; // Diatomic air
    const analyticalEfficiency = 1 - 1 / Math.pow(r, gamma - 1); // 1 - 1/(8^0.4) ≈ 0.5647

    const params: EngineParams = {
      cycleType: 'otto',
      gasType: 'diatomic',
      moles: 0.04,
      th: 1200,
      tc: 300,
      compressionRatio: r,
      realMode: false
    };

    const metrics = calculateCycleMetrics(params);

    expect(metrics.thermalEfficiencyIdeal).toBeCloseTo(analyticalEfficiency, 3);
    expect(metrics.workNetIdeal).toBeCloseTo(metrics.qIn - metrics.qOut, 2);
    expect(metrics.thermalEfficiencyIdeal).toBeLessThan(metrics.carnotLimit);
  });

  it('computes Diesel cycle efficiency matching analytical cut-off formula', () => {
    const r = 16.0;
    const rc = 2.0;
    const gamma = 1.4;

    const factor = (Math.pow(rc, gamma) - 1) / (gamma * (rc - 1));
    const analyticalDieselEff = 1 - (1 / Math.pow(r, gamma - 1)) * factor;

    const params: EngineParams = {
      cycleType: 'diesel',
      gasType: 'diatomic',
      moles: 0.04,
      th: 1400,
      tc: 300,
      compressionRatio: r,
      cutOffRatio: rc,
      realMode: false
    };

    const metrics = calculateCycleMetrics(params);

    expect(metrics.thermalEfficiencyIdeal).toBeCloseTo(analyticalDieselEff, 3);
    expect(metrics.workNetIdeal).toBeCloseTo(metrics.qIn - metrics.qOut, 2);
  });

  it('computes Stirling cycle with ideal regenerator achieving Carnot efficiency limit', () => {
    const params: EngineParams = {
      cycleType: 'stirling',
      gasType: 'monatomic',
      moles: 0.05,
      th: 800,
      tc: 400,
      compressionRatio: 3.0,
      realMode: false
    };

    const metrics = calculateCycleMetrics(params);

    // 1 - 400/800 = 0.5
    expect(metrics.carnotLimit).toBeCloseTo(0.5, 3);
    expect(metrics.thermalEfficiencyIdeal).toBeCloseTo(0.5, 3);
    expect(metrics.workNetIdeal).toBeCloseTo(metrics.qIn - metrics.qOut, 2);
  });

  it('models real mode losses (friction and heat leak) reducing net work and efficiency', () => {
    const baseParams: EngineParams = {
      cycleType: 'otto',
      gasType: 'diatomic',
      moles: 0.04,
      th: 1200,
      tc: 300,
      compressionRatio: 8.0,
      realMode: false
    };

    const idealMetrics = calculateCycleMetrics(baseParams);

    const realParams: EngineParams = {
      ...baseParams,
      realMode: true,
      frictionCoeff: 0.08,
      heatLeakCoeff: 1.0
    };

    const realMetrics = calculateCycleMetrics(realParams, 60);

    expect(realMetrics.workNetReal).toBeLessThan(idealMetrics.workNetIdeal);
    expect(realMetrics.thermalEfficiencyReal).toBeLessThan(idealMetrics.thermalEfficiencyIdeal);
  });

  it('calculates continuous cycle states without NaN or infinite values', () => {
    const params: EngineParams = {
      cycleType: 'otto',
      gasType: 'diatomic',
      moles: 0.05,
      th: 1200,
      tc: 300,
      compressionRatio: 8.0,
      realMode: false
    };

    const metrics = calculateCycleMetrics(params);
    const points = generateCycleCurvePoints(metrics, params, 20);

    expect(points.length).toBeGreaterThan(50);
    for (const pt of points) {
      expect(Number.isFinite(pt.v)).toBe(true);
      expect(Number.isFinite(pt.p)).toBe(true);
      expect(pt.v).toBeGreaterThan(0);
      expect(pt.p).toBeGreaterThan(0);
    }

    // Check instantaneous state at 4 different phases
    const phases = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
    for (const ph of phases) {
      const state = calculateInstantaneousState(ph, metrics, params);
      expect(Number.isFinite(state.pressure)).toBe(true);
      expect(Number.isFinite(state.volume)).toBe(true);
      expect(Number.isFinite(state.temperature)).toBe(true);
      expect(state.pistonPosition).toBeGreaterThanOrEqual(0);
      expect(state.pistonPosition).toBeLessThanOrEqual(1.001);
    }
  });
});
