import type { ExperimentConfig } from '@/experiments/registry';

export const heatTransferConfig: ExperimentConfig = {
  id: 'physics/thermo/heat-transfer',
  subject: 'physics',
  topic: 'thermo',
  titleKey: 'experiments.heatTransfer.title',
  descKey: 'experiments.heatTransfer.description',
  gradeTags: ['high-school', 'university'],
  difficulty: 'medium',
  engine: 'canvas2d',

  variables: [
    {
      id: 'modeIndex',
      labelKey: 'heatTransfer.transferMode',
      unit: '',
      min: 0,
      max: 3,
      step: 1,
      default: 0,
      descKey: 'heatTransfer.transferMode_desc',
      realModeEffect: null,
    },
    {
      id: 'materialIndex',
      labelKey: 'heatTransfer.material',
      unit: '',
      min: 0,
      max: 4,
      step: 1,
      default: 0,
      descKey: 'heatTransfer.material_desc',
      realModeEffect: null,
    },
    {
      id: 'hotTempC',
      labelKey: 'heatTransfer.hotTemp',
      unit: '°C',
      min: 40,
      max: 850,
      step: 10,
      default: 120,
      descKey: 'heatTransfer.hotTemp_desc',
      realModeEffect: null,
    },
    {
      id: 'coldTempC',
      labelKey: 'heatTransfer.coldTemp',
      unit: '°C',
      min: 0,
      max: 40,
      step: 1,
      default: 20,
      descKey: 'heatTransfer.coldTemp_desc',
      realModeEffect: null,
    },
    {
      id: 'rodLength',
      labelKey: 'heatTransfer.rodLength',
      unit: 'cm',
      min: 10,
      max: 100,
      step: 5,
      default: 40,
      descKey: 'heatTransfer.rodLength_desc',
      realModeEffect: null,
    },
    {
      id: 'convectionCoeff',
      labelKey: 'heatTransfer.convectionCoeff',
      unit: 'W/m²·K',
      min: 5,
      max: 120,
      step: 5,
      default: 25,
      descKey: 'heatTransfer.convectionCoeff_desc',
      realModeEffect: null,
    },
    {
      id: 'emissivity',
      labelKey: 'heatTransfer.emissivity',
      unit: '',
      min: 0.05,
      max: 1.0,
      step: 0.05,
      default: 0.85,
      descKey: 'heatTransfer.emissivity_desc',
      realModeEffect: null,
    },
  ],

  presets: [
    {
      id: 'copperConduction',
      labelKey: 'heatTransfer.preset_copperConduction',
      params: {
        modeIndex: 0, // Conduction
        materialIndex: 0, // Copper
        hotTempC: 150,
        coldTempC: 20,
        rodLength: 35,
        convectionCoeff: 25,
        emissivity: 0.85,
      },
    },
    {
      id: 'airConvectionPlume',
      labelKey: 'heatTransfer.preset_airConvectionPlume',
      params: {
        modeIndex: 1, // Convection
        materialIndex: 1, // Aluminum
        hotTempC: 180,
        coldTempC: 20,
        rodLength: 40,
        convectionCoeff: 65,
        emissivity: 0.85,
      },
    },
    {
      id: 'blackbodyRadiation',
      labelKey: 'heatTransfer.preset_blackbodyRadiation',
      params: {
        modeIndex: 2, // Radiation
        materialIndex: 2, // Iron
        hotTempC: 750,
        coldTempC: 25,
        rodLength: 40,
        convectionCoeff: 25,
        emissivity: 0.98,
      },
    },
    {
      id: 'combinedLoss',
      labelKey: 'heatTransfer.preset_combinedLoss',
      params: {
        modeIndex: 3, // Combined
        materialIndex: 0, // Copper
        hotTempC: 350,
        coldTempC: 20,
        rodLength: 50,
        convectionCoeff: 45,
        emissivity: 0.8,
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
      titleKey: 'heatTransfer.formula_fourier',
      latex: '\\dot{Q}_{\\text{cond}} = \\frac{k A (T_H - T_C)}{L}',
      explanationKey: 'heatTransfer.fourierExpl',
    },
    {
      titleKey: 'heatTransfer.formula_newton',
      latex: '\\dot{Q}_{\\text{conv}} = h A (T_s - T_\\infty)',
      explanationKey: 'heatTransfer.newtonExpl',
    },
    {
      titleKey: 'heatTransfer.formula_stefan',
      latex: '\\dot{Q}_{\\text{rad}} = \\varepsilon \\sigma A (T_H^4 - T_C^4)',
      explanationKey: 'heatTransfer.stefanExpl',
    },
    {
      titleKey: 'heatTransfer.formula_wien',
      latex: '\\lambda_{\\text{peak}} = \\frac{b}{T}',
      explanationKey: 'heatTransfer.wienExpl',
    },
  ],
};
