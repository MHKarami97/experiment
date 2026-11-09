import type { ExperimentConfig } from '@/experiments/registry';

export const pascalBernoulliConfig: ExperimentConfig = {
  id: 'physics/fluids/pascal-bernoulli',
  subject: 'physics',
  topic: 'fluids',
  titleKey: 'experiments.pascalBernoulli.title',
  descKey: 'experiments.pascalBernoulli.description',
  gradeTags: ['high-school', 'university'],
  difficulty: 'medium',
  engine: 'canvas2d',

  variables: [
    {
      id: 'apparatusModeIndex',
      labelKey: 'pascalBernoulli.apparatusMode',
      unit: '',
      min: 0,
      max: 1,
      step: 1,
      default: 0,
      descKey: 'pascalBernoulli.apparatusMode_desc',
      realModeEffect: null,
    },
    {
      id: 'fluidTypeIndex',
      labelKey: 'pascalBernoulli.fluidType',
      unit: '',
      min: 0,
      max: 3,
      step: 1,
      default: 0,
      descKey: 'pascalBernoulli.fluidType_desc',
      realModeEffect: null,
    },
    {
      id: 'inletVelocity',
      labelKey: 'pascalBernoulli.inletVelocity',
      unit: 'm/s',
      min: 0.5,
      max: 6.0,
      step: 0.1,
      default: 2.0,
      descKey: 'pascalBernoulli.inletVelocity_desc',
      realModeEffect: null,
    },
    {
      id: 'constrictionRatio',
      labelKey: 'pascalBernoulli.constrictionRatio',
      unit: '',
      min: 0.3,
      max: 0.8,
      step: 0.05,
      default: 0.5,
      descKey: 'pascalBernoulli.constrictionRatio_desc',
      realModeEffect: null,
    },
    {
      id: 'inputForce',
      labelKey: 'pascalBernoulli.inputForce',
      unit: 'N',
      min: 50,
      max: 1000,
      step: 10,
      default: 200,
      descKey: 'pascalBernoulli.inputForce_desc',
      realModeEffect: null,
    },
    {
      id: 'pistonAreaRatio',
      labelKey: 'pascalBernoulli.pistonAreaRatio',
      unit: '',
      min: 2,
      max: 40,
      step: 1,
      default: 16,
      descKey: 'pascalBernoulli.pistonAreaRatio_desc',
      realModeEffect: null,
    },
    {
      id: 'gravity',
      labelKey: 'pascalBernoulli.gravity',
      unit: 'm/s²',
      min: 1.6,
      max: 20.0,
      step: 0.1,
      default: 9.8,
      descKey: 'pascalBernoulli.gravity_desc',
      realModeEffect: null,
    },
  ],

  presets: [
    {
      id: 'standardVenturiWater',
      labelKey: 'pascalBernoulli.preset_standardVenturiWater',
      params: {
        apparatusModeIndex: 0,
        fluidTypeIndex: 0, // Water
        inletVelocity: 2.0,
        constrictionRatio: 0.5,
        gravity: 9.8,
      },
    },
    {
      id: 'highSpeedAirVenturi',
      labelKey: 'pascalBernoulli.preset_highSpeedAirVenturi',
      params: {
        apparatusModeIndex: 0,
        fluidTypeIndex: 2, // Air
        inletVelocity: 5.0,
        constrictionRatio: 0.4,
        gravity: 9.8,
      },
    },
    {
      id: 'carHydraulicLift',
      labelKey: 'pascalBernoulli.preset_carHydraulicLift',
      params: {
        apparatusModeIndex: 1,
        fluidTypeIndex: 1, // Oil
        inputForce: 300,
        pistonAreaRatio: 25,
        gravity: 9.8,
      },
    },
    {
      id: 'miniJack',
      labelKey: 'pascalBernoulli.preset_miniJack',
      params: {
        apparatusModeIndex: 1,
        fluidTypeIndex: 1,
        inputForce: 100,
        pistonAreaRatio: 9,
        gravity: 9.8,
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
      titleKey: 'pascalBernoulli.formula_continuity',
      latex: 'A_1 v_1 = A_2 v_2',
      explanationKey: 'pascalBernoulli.continuityExpl',
    },
    {
      titleKey: 'pascalBernoulli.formula_bernoulli',
      latex: 'P_1 + \\frac{1}{2}\\rho v_1^2 = P_2 + \\frac{1}{2}\\rho v_2^2',
      explanationKey: 'pascalBernoulli.bernoulliExpl',
    },
    {
      titleKey: 'pascalBernoulli.formula_pascal',
      latex: '\\frac{F_1}{A_1} = \\frac{F_2}{A_2}',
      explanationKey: 'pascalBernoulli.pascalExpl',
    },
  ],
};
