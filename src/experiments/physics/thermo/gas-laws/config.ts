import type { ExperimentConfig } from '@/experiments/registry';

export const gasLawsConfig: ExperimentConfig = {
  id: 'physics/thermo/gas-laws',
  subject: 'physics',
  topic: 'thermo',
  titleKey: 'experiments.gasLaws.title',
  descKey: 'experiments.gasLaws.description',
  gradeTags: ['middle-school', 'high-school', 'university'],
  difficulty: 'medium',
  engine: 'canvas2d',

  variables: [
    {
      id: 'lawModeIndex',
      labelKey: 'gasLaws.lawMode',
      unit: '',
      min: 0,
      max: 3,
      step: 1,
      default: 0,
      descKey: 'gasLaws.lawMode_desc',
      realModeEffect: null,
    },
    {
      id: 'gasTypeIndex',
      labelKey: 'gasLaws.gasType',
      unit: '',
      min: 0,
      max: 4,
      step: 1,
      default: 0,
      descKey: 'gasLaws.gasType_desc',
      realModeEffect: null,
    },
    {
      id: 'moles',
      labelKey: 'gasLaws.moles',
      unit: 'mol',
      min: 0.2,
      max: 4.0,
      step: 0.1,
      default: 1.0,
      descKey: 'gasLaws.moles_desc',
      realModeEffect: null,
    },
    {
      id: 'volumeLiters',
      labelKey: 'gasLaws.volume',
      unit: 'L',
      min: 5,
      max: 35,
      step: 1,
      default: 15,
      descKey: 'gasLaws.volume_desc',
      realModeEffect: null,
    },
    {
      id: 'temperatureKelvin',
      labelKey: 'gasLaws.temperature',
      unit: 'K',
      min: 100,
      max: 750,
      step: 10,
      default: 300,
      descKey: 'gasLaws.temperature_desc',
      realModeEffect: null,
    },
  ],

  presets: [
    {
      id: 'stpState',
      labelKey: 'gasLaws.preset_stpState',
      params: {
        lawModeIndex: 0,
        gasTypeIndex: 0, // Helium
        moles: 1.0,
        volumeLiters: 22.4,
        temperatureKelvin: 273,
      },
    },
    {
      id: 'boyleCompression',
      labelKey: 'gasLaws.preset_boyleCompression',
      params: {
        lawModeIndex: 1, // Boyle
        gasTypeIndex: 3, // Nitrogen
        moles: 1.2,
        volumeLiters: 10,
        temperatureKelvin: 300,
      },
    },
    {
      id: 'charlesExpansion',
      labelKey: 'gasLaws.preset_charlesExpansion',
      params: {
        lawModeIndex: 2, // Charles
        gasTypeIndex: 1, // Neon
        moles: 1.0,
        volumeLiters: 24,
        temperatureKelvin: 520,
      },
    },
    {
      id: 'gayLussacHeating',
      labelKey: 'gasLaws.preset_gayLussacHeating',
      params: {
        lawModeIndex: 3, // Gay-Lussac
        gasTypeIndex: 2, // Argon
        moles: 1.5,
        volumeLiters: 15,
        temperatureKelvin: 600,
      },
    },
    {
      id: 'heavyGasCO2',
      labelKey: 'gasLaws.preset_heavyGasCO2',
      params: {
        lawModeIndex: 0,
        gasTypeIndex: 4, // CO2
        moles: 2.5,
        volumeLiters: 8,
        temperatureKelvin: 280,
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
      titleKey: 'gasLaws.formula_ideal',
      latex: 'P \\cdot V = n \\cdot R \\cdot T',
      explanationKey: 'gasLaws.idealExpl',
    },
    {
      titleKey: 'gasLaws.formula_boyle',
      latex: 'P_1 V_1 = P_2 V_2 \\quad (T = \\text{const})',
      explanationKey: 'gasLaws.boyleExpl',
    },
    {
      titleKey: 'gasLaws.formula_charles',
      latex: '\\frac{V_1}{T_1} = \\frac{V_2}{T_2} \\quad (P = \\text{const})',
      explanationKey: 'gasLaws.charlesExpl',
    },
    {
      titleKey: 'gasLaws.formula_gayLussac',
      latex: '\\frac{P_1}{T_1} = \\frac{P_2}{T_2} \\quad (V = \\text{const})',
      explanationKey: 'gasLaws.gayLussacExpl',
    },
    {
      titleKey: 'gasLaws.formula_rms',
      latex: 'v_{\\text{rms}} = \\sqrt{\\frac{3 R T}{M}}',
      explanationKey: 'gasLaws.rmsExpl',
    },
    {
      titleKey: 'gasLaws.formula_vdw',
      latex: '\\left(P + \\frac{a n^2}{V^2}\\right)(V - n b) = n R T',
      explanationKey: 'gasLaws.vdwExpl',
    },
  ],
};
