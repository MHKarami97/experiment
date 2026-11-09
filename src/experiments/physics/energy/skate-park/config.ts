import type { ExperimentConfig } from '@/experiments/registry';

export const skateParkConfig: ExperimentConfig = {
  id: 'physics/energy/skate-park',
  subject: 'physics',
  topic: 'energy',
  titleKey: 'experiments.skatePark.title',
  descKey: 'experiments.skatePark.description',
  gradeTags: ['middle-school', 'high-school', 'university'],
  difficulty: 'easy',
  engine: 'canvas2d',

  variables: [
    {
      id: 'trackShapeIndex',
      labelKey: 'skatePark.trackShape',
      unit: '',
      min: 0,
      max: 2,
      step: 1,
      default: 0,
      descKey: 'skatePark.trackShape_desc',
      realModeEffect: null,
    },
    {
      id: 'skaterMass',
      labelKey: 'skatePark.skaterMass',
      unit: 'kg',
      min: 20,
      max: 120,
      step: 1,
      default: 60,
      descKey: 'skatePark.skaterMass_desc',
      realModeEffect: null,
    },
    {
      id: 'initialHeight',
      labelKey: 'skatePark.initialHeight',
      unit: 'm',
      min: 1.0,
      max: 6.0,
      step: 0.2,
      default: 4.0,
      descKey: 'skatePark.initialHeight_desc',
      realModeEffect: null,
    },
    {
      id: 'gravity',
      labelKey: 'skatePark.gravity',
      unit: 'm/s²',
      min: 1.0,
      max: 25.0,
      step: 0.1,
      default: 9.8,
      descKey: 'skatePark.gravity_desc',
      realModeEffect: null,
    },
    {
      id: 'trackFrictionMu',
      labelKey: 'skatePark.trackFrictionMu',
      unit: '',
      min: 0.0,
      max: 0.2,
      step: 0.01,
      default: 0.04,
      descKey: 'skatePark.trackFrictionMu_desc',
      realModeEffect: 'skatePark.trackFrictionMu_real',
    },
  ],

  presets: [
    {
      id: 'classicU',
      labelKey: 'skatePark.preset_classicU',
      params: {
        trackShapeIndex: 0,
        skaterMass: 60,
        initialHeight: 4.0,
        gravity: 9.8,
        trackFrictionMu: 0.03,
      },
    },
    {
      id: 'doubleDip',
      labelKey: 'skatePark.preset_doubleDip',
      params: {
        trackShapeIndex: 1,
        skaterMass: 55,
        initialHeight: 4.2,
        gravity: 9.8,
        trackFrictionMu: 0.02,
      },
    },
    {
      id: 'lunarSkate',
      labelKey: 'skatePark.preset_lunarSkate',
      params: {
        trackShapeIndex: 0,
        skaterMass: 65,
        initialHeight: 4.5,
        gravity: 1.62,
        trackFrictionMu: 0.01,
      },
    },
    {
      id: 'steepSlope',
      labelKey: 'skatePark.preset_steepSlope',
      params: {
        trackShapeIndex: 2,
        skaterMass: 70,
        initialHeight: 3.5,
        gravity: 9.8,
        trackFrictionMu: 0.08,
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
      titleKey: 'skatePark.formula_totalEnergy',
      latex: 'E_{\\text{total}} = PE + KE + E_{\\text{thermal}} = \\text{const}',
      explanationKey: 'skatePark.totalEnergyExpl',
    },
    {
      titleKey: 'skatePark.formula_potentialEnergy',
      latex: 'PE = m g y',
      explanationKey: 'skatePark.potentialEnergyExpl',
    },
    {
      titleKey: 'skatePark.formula_kineticEnergy',
      latex: 'KE = \\frac{1}{2} m v^2',
      explanationKey: 'skatePark.kineticEnergyExpl',
    },
    {
      titleKey: 'skatePark.formula_torricelli',
      latex: 'v_{\\max} = \\sqrt{2 g \\Delta y}',
      explanationKey: 'skatePark.torricelliExpl',
    },
  ],
};
