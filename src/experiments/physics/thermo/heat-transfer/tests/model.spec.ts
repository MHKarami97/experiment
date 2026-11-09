import { describe, it, expect } from 'vitest';
import {
  computeHeatTransfer,
  createHeatTransferModel,
  stepHeatTransferModel,
  STEFAN_BOLTZMANN,
  WIEN_DISPLACEMENT,
  MATERIAL_DATABASE,
  type HeatTransferParams,
} from '../model/heat-transfer';

describe('Heat Transfer Mechanisms Physical Model', () => {
  const baseParams: HeatTransferParams = {
    transferMode: 'conduction',
    material: 'copper',
    hotTempC: 100, // 373.15 K
    coldTempC: 20, // 293.15 K => Delta T = 80 K
    crossSectionArea: 0.002, // 20 cm^2 = 0.002 m^2
    rodLength: 0.5, // 0.5 m
    convectionCoeff: 25, // W/(m^2*K)
    emissivity: 0.9,
    isRealMode: false,
  };

  it('verifies Fourier conduction law (Q_cond = k * A * DeltaT / L)', () => {
    const derived = computeHeatTransfer(baseParams);

    const k = MATERIAL_DATABASE.copper.k; // 385 W/(m*K)
    const expectedQ = (k * baseParams.crossSectionArea * 80) / baseParams.rodLength;

    expect(derived.conduction.heatFluxRate).toBeCloseTo(expectedQ, 3);
    expect(derived.conduction.heatFluxDensity).toBeCloseTo(expectedQ / baseParams.crossSectionArea, 2);
  });

  it('verifies material thermal conductivities follow physical hierarchy', () => {
    const copper = computeHeatTransfer({ ...baseParams, material: 'copper' });
    const aluminum = computeHeatTransfer({ ...baseParams, material: 'aluminum' });
    const iron = computeHeatTransfer({ ...baseParams, material: 'iron' });
    const glass = computeHeatTransfer({ ...baseParams, material: 'glass' });
    const wood = computeHeatTransfer({ ...baseParams, material: 'wood' });

    expect(copper.conduction.heatFluxRate).toBeGreaterThan(aluminum.conduction.heatFluxRate);
    expect(aluminum.conduction.heatFluxRate).toBeGreaterThan(iron.conduction.heatFluxRate);
    expect(iron.conduction.heatFluxRate).toBeGreaterThan(glass.conduction.heatFluxRate);
    expect(glass.conduction.heatFluxRate).toBeGreaterThan(wood.conduction.heatFluxRate);
  });

  it('verifies Newton cooling law for convection (Q_conv = h * A * DeltaT)', () => {
    const derived = computeHeatTransfer({ ...baseParams, transferMode: 'convection' });

    const expectedQ = baseParams.convectionCoeff * baseParams.crossSectionArea * 80;
    expect(derived.convection.convectiveHeatRate).toBeCloseTo(expectedQ, 4);
    expect(derived.totalHeatRate).toBeCloseTo(expectedQ, 4);
  });

  it('verifies Stefan-Boltzmann radiation law (Q_rad = eps * sigma * A * (Th^4 - Tc^4))', () => {
    const derived = computeHeatTransfer({ ...baseParams, transferMode: 'radiation' });

    const thK = 100 + 273.15;
    const tcK = 20 + 273.15;
    const expectedQ = baseParams.emissivity * STEFAN_BOLTZMANN * baseParams.crossSectionArea * (Math.pow(thK, 4) - Math.pow(tcK, 4));

    expect(derived.radiation.radiativeHeatRate).toBeCloseTo(expectedQ, 4);
    expect(derived.totalHeatRate).toBeCloseTo(expectedQ, 4);
  });

  it('verifies Wien displacement law for peak thermal radiation wavelength', () => {
    const derived = computeHeatTransfer({ ...baseParams, hotTempC: 726.85 }); // 1000 K

    // lambda_max = 2.89777e-3 / 1000 = 2.89777e-6 m = 2.898 um
    const expectedUm = (WIEN_DISPLACEMENT / 1000) * 1e6;
    expect(derived.radiation.peakWavelengthUm).toBeCloseTo(expectedUm, 3);
  });

  it('verifies combined mode aggregates conduction, convection and radiation', () => {
    const derived = computeHeatTransfer({ ...baseParams, transferMode: 'combined' });

    const sum = derived.conduction.heatFluxRate + derived.convection.convectiveHeatRate + derived.radiation.radiativeHeatRate;
    expect(derived.totalHeatRate).toBeCloseTo(sum, 3);
  });

  it('advances buoyant plume particles across simulation steps', () => {
    const state = createHeatTransferModel(baseParams);
    expect(state.t).toBe(0);
    expect(state.particles.length).toBeGreaterThan(0);

    const stepped = stepHeatTransferModel(state, baseParams, 0.05);
    expect(stepped.t).toBeCloseTo(0.05, 4);
    expect(stepped.particles[0].y).not.toBe(state.particles[0].y);
  });
});
