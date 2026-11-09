import type { ExperimentConfig } from '@/experiments/registry';

export const calorimetryConfig: ExperimentConfig = {
  id: 'physics/thermo/calorimetry',
  subject: 'physics',
  topic: 'thermo',
  titleKey: 'experiments.calorimetry.title',
  descKey: 'experiments.calorimetry.description',
  gradeTags: ['middle-school', 'high-school', 'university'],
  difficulty: 'medium',
  engine: 'canvas2d',

  variables: [
    {
      id: 'solidMaterialIndex',
      labelKey: 'calorimetry.solidMaterial',
      unit: '',
      min: 0,
      max: 5,
      step: 1,
      default: 0,
      descKey: 'calorimetry.solidMaterial_desc',
      realModeEffect: null,
    },
    {
      id: 'solidMassGrams',
      labelKey: 'calorimetry.solidMass',
      unit: 'g',
      min: 20,
      max: 500,
      step: 10,
      default: 150,
      descKey: 'calorimetry.solidMass_desc',
      realModeEffect: null,
    },
    {
      id: 'solidInitialTempC',
      labelKey: 'calorimetry.solidTemp',
      unit: '°C',
      min: -20,
      max: 120,
      step: 5,
      default: 90,
      descKey: 'calorimetry.solidTemp_desc',
      realModeEffect: null,
    },
    {
      id: 'liquidMediumIndex',
      labelKey: 'calorimetry.liquidMedium',
      unit: '',
      min: 0,
      max: 2,
      step: 1,
      default: 0,
      descKey: 'calorimetry.liquidMedium_desc',
      realModeEffect: null,
    },
    {
      id: 'liquidMassGrams',
      labelKey: 'calorimetry.liquidMass',
      unit: 'g',
      min: 100,
      max: 600,
      step: 25,
      default: 250,
      descKey: 'calorimetry.liquidMass_desc',
      realModeEffect: null,
    },
    {
      id: 'liquidInitialTempC',
      labelKey: 'calorimetry.liquidTemp',
      unit: '°C',
      min: 5,
      max: 60,
      step: 1,
      default: 20,
      descKey: 'calorimetry.liquidTemp_desc',
      realModeEffect: null,
    },
    {
      id: 'calorimeterWaterEquivalentGrams',
      labelKey: 'calorimetry.waterEquivalent',
      unit: 'g',
      min: 0,
      max: 50,
      step: 5,
      default: 15,
      descKey: 'calorimetry.waterEquivalent_desc',
      realModeEffect: null,
    },
  ],

  presets: [
    {
      id: 'copperWater',
      labelKey: 'calorimetry.preset_copperWater',
      params: {
        solidMaterialIndex: 0, // Copper
        solidMassGrams: 180,
        solidInitialTempC: 95,
        liquidMediumIndex: 0, // Water
        liquidMassGrams: 250,
        liquidInitialTempC: 20,
        calorimeterWaterEquivalentGrams: 15,
      },
    },
    {
      id: 'aluminumWater',
      labelKey: 'calorimetry.preset_aluminumWater',
      params: {
        solidMaterialIndex: 1, // Aluminum
        solidMassGrams: 120,
        solidInitialTempC: 90,
        liquidMediumIndex: 0, // Water
        liquidMassGrams: 250,
        liquidInitialTempC: 20,
        calorimeterWaterEquivalentGrams: 15,
      },
    },
    {
      id: 'iceMeltingLatent',
      labelKey: 'calorimetry.preset_iceMeltingLatent',
      params: {
        solidMaterialIndex: 5, // Ice
        solidMassGrams: 60,
        solidInitialTempC: -10,
        liquidMediumIndex: 0, // Water
        liquidMassGrams: 300,
        liquidInitialTempC: 45,
        calorimeterWaterEquivalentGrams: 15,
      },
    },
    {
      id: 'leadLowCapacity',
      labelKey: 'calorimetry.preset_leadLowCapacity',
      params: {
        solidMaterialIndex: 3, // Lead
        solidMassGrams: 250,
        solidInitialTempC: 100,
        liquidMediumIndex: 0, // Water
        liquidMassGrams: 200,
        liquidInitialTempC: 20,
        calorimeterWaterEquivalentGrams: 15,
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
      titleKey: 'calorimetry.formula_heat',
      latex: 'Q = m \\cdot c \\cdot \\Delta T',
      explanationKey: 'calorimetry.heatExpl',
    },
    {
      titleKey: 'calorimetry.formula_equilibrium',
      latex: '\\sum Q = 0 \\implies Q_{\\text{lost}} + Q_{\\text{gained}} = 0',
      explanationKey: 'calorimetry.equilibriumExpl',
    },
    {
      titleKey: 'calorimetry.formula_teq',
      latex: 'T_{\\text{eq}} = \\frac{m_s c_s T_s + (m_l c_l + C_{\\text{cal}}) T_l}{m_s c_s + m_l c_l + C_{\\text{cal}}}',
      explanationKey: 'calorimetry.teqExpl',
    },
    {
      titleKey: 'calorimetry.formula_latent',
      latex: 'Q_f = m \\cdot L_f',
      explanationKey: 'calorimetry.latentExpl',
    },
  ],
};
