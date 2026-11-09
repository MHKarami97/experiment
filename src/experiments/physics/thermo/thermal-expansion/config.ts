import type { ExperimentConfig } from '@/experiments/registry';

export const thermalExpansionConfig: ExperimentConfig = {
  id: 'physics/thermo/thermal-expansion',
  subject: 'physics',
  topic: 'thermo',
  titleKey: 'experiments.thermalExpansion.title',
  descKey: 'experiments.thermalExpansion.description',
  gradeTags: ['middle-school', 'high-school', 'university'],
  difficulty: 'medium',
  engine: 'canvas2d',

  variables: [
    {
      id: 'expansionTypeIndex',
      labelKey: 'thermalExpansion.expansionType',
      unit: '',
      min: 0,
      max: 2,
      step: 1,
      default: 0,
      descKey: 'thermalExpansion.expansionType_desc',
      realModeEffect: null,
    },
    {
      id: 'metal1Index',
      labelKey: 'thermalExpansion.metal1',
      unit: '',
      min: 0,
      max: 5,
      step: 1,
      default: 2, // Copper
      descKey: 'thermalExpansion.metal1_desc',
      realModeEffect: null,
    },
    {
      id: 'metal2Index',
      labelKey: 'thermalExpansion.metal2',
      unit: '',
      min: 0,
      max: 5,
      step: 1,
      default: 0, // Invar
      descKey: 'thermalExpansion.metal2_desc',
      realModeEffect: null,
    },
    {
      id: 'initialLengthMm',
      labelKey: 'thermalExpansion.initialLength',
      unit: 'mm',
      min: 200,
      max: 2000,
      step: 50,
      default: 1000,
      descKey: 'thermalExpansion.initialLength_desc',
      realModeEffect: null,
    },
    {
      id: 'currentTempC',
      labelKey: 'thermalExpansion.currentTemp',
      unit: '°C',
      min: -20,
      max: 350,
      step: 5,
      default: 80,
      descKey: 'thermalExpansion.currentTemp_desc',
      realModeEffect: null,
    },
    {
      id: 'initialTempC',
      labelKey: 'thermalExpansion.initialTemp',
      unit: '°C',
      min: 0,
      max: 40,
      step: 1,
      default: 20,
      descKey: 'thermalExpansion.initialTemp_desc',
      realModeEffect: null,
    },
    {
      id: 'stripThicknessMm',
      labelKey: 'thermalExpansion.stripThickness',
      unit: 'mm',
      min: 0.5,
      max: 5.0,
      step: 0.5,
      default: 2.0,
      descKey: 'thermalExpansion.stripThickness_desc',
      realModeEffect: null,
    },
  ],

  presets: [
    {
      id: 'copperRodLinear',
      labelKey: 'thermalExpansion.preset_copperRodLinear',
      params: {
        expansionTypeIndex: 0,
        metal1Index: 2, // Copper
        metal2Index: 0,
        initialLengthMm: 1000,
        currentTempC: 120,
        initialTempC: 20,
        stripThicknessMm: 2.0,
      },
    },
    {
      id: 'invarPrecision',
      labelKey: 'thermalExpansion.preset_invarPrecision',
      params: {
        expansionTypeIndex: 0,
        metal1Index: 0, // Invar
        metal2Index: 0,
        initialLengthMm: 1000,
        currentTempC: 150,
        initialTempC: 20,
        stripThicknessMm: 2.0,
      },
    },
    {
      id: 'bimetalThermostat',
      labelKey: 'thermalExpansion.preset_bimetalThermostat',
      params: {
        expansionTypeIndex: 1,
        metal1Index: 3, // Brass (top)
        metal2Index: 0, // Invar (bottom)
        initialLengthMm: 250,
        currentTempC: 75,
        initialTempC: 20,
        stripThicknessMm: 2.0,
      },
    },
    {
      id: 'waterAnomalyCooling',
      labelKey: 'thermalExpansion.preset_waterAnomalyCooling',
      params: {
        expansionTypeIndex: 2,
        metal1Index: 2,
        metal2Index: 0,
        initialLengthMm: 1000,
        currentTempC: 1, // 1°C in anomaly zone
        initialTempC: 4, // 4°C peak density
        stripThicknessMm: 2.0,
      },
    },
    {
      id: 'aluminumHighExpansion',
      labelKey: 'thermalExpansion.preset_aluminumHighExpansion',
      params: {
        expansionTypeIndex: 0,
        metal1Index: 4, // Aluminum
        metal2Index: 0,
        initialLengthMm: 1200,
        currentTempC: 180,
        initialTempC: 20,
        stripThicknessMm: 2.0,
      },
    },
  ],

  tools: [
    {
      id: 'ruler',
      nameKey: 'common.ruler',
      icon: '📏',
    },
    {
      id: 'stopwatch',
      nameKey: 'common.stopwatch',
      icon: '⏱️',
    },
  ],

  formulas: [
    {
      titleKey: 'thermalExpansion.formula_linear',
      latex: '\\Delta L = \\alpha \\cdot L_0 \\cdot \\Delta T',
      explanationKey: 'thermalExpansion.linearExpl',
    },
    {
      titleKey: 'thermalExpansion.formula_finalLength',
      latex: 'L = L_0 (1 + \\alpha \\Delta T)',
      explanationKey: 'thermalExpansion.finalLengthExpl',
    },
    {
      titleKey: 'thermalExpansion.formula_bimetal',
      latex: '\\delta_{\\text{tip}} = \\frac{3 (\\alpha_1 - \\alpha_2) \\Delta T \\cdot L^2}{4 d}',
      explanationKey: 'thermalExpansion.bimetalExpl',
    },
    {
      titleKey: 'thermalExpansion.formula_volume',
      latex: '\\Delta V = \\beta \\cdot V_0 \\cdot \\Delta T \\quad (\\beta \\approx 3\\alpha)',
      explanationKey: 'thermalExpansion.volumeExpl',
    },
    {
      titleKey: 'thermalExpansion.formula_stress',
      latex: '\\sigma = E \\cdot \\alpha \\cdot \\Delta T',
      explanationKey: 'thermalExpansion.stressExpl',
    },
  ],
};
