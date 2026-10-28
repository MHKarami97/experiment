import type { ExperimentConfig } from '@/experiments/registry';

export const pulleysLeversConfig: ExperimentConfig = {
  id: 'physics/motion/pulleys-levers',
  subject: 'physics',
  topic: 'motion',
  titleKey: 'experiments.pulleysLevers.title',
  descKey: 'experiments.pulleysLevers.description',
  gradeTags: ['middle-school', 'high-school', 'university'],
  difficulty: 'medium',
  engine: 'canvas2d',

  variables: [
    {
      id: 'm1',
      labelKey: 'pulleysLevers.m1',
      unit: 'kg',
      min: 0.5,
      max: 20.0,
      step: 0.1,
      default: 3.0,
      descKey: 'pulleysLevers.m1_desc',
      realModeEffect: null
    },
    {
      id: 'm2',
      labelKey: 'pulleysLevers.m2',
      unit: 'kg',
      min: 0.5,
      max: 20.0,
      step: 0.1,
      default: 5.0,
      descKey: 'pulleysLevers.m2_desc',
      realModeEffect: null
    },
    {
      id: 'pulleyMass',
      labelKey: 'pulleysLevers.pulleyMass',
      unit: 'kg',
      min: 0.0,
      max: 5.0,
      step: 0.1,
      default: 0.5,
      descKey: 'pulleysLevers.pulleyMass_desc',
      realModeEffect: 'pulleysLevers.pulleyMass_real'
    },
    {
      id: 'pulleyRadius',
      labelKey: 'pulleysLevers.pulleyRadius',
      unit: 'm',
      min: 0.05,
      max: 0.5,
      step: 0.01,
      default: 0.15,
      descKey: 'pulleysLevers.pulleyRadius_desc',
      realModeEffect: null
    },
    {
      id: 'frictionTorque',
      labelKey: 'pulleysLevers.frictionTorque',
      unit: 'N·m',
      min: 0.0,
      max: 2.0,
      step: 0.05,
      default: 0.1,
      descKey: 'pulleysLevers.frictionTorque_desc',
      realModeEffect: 'pulleysLevers.frictionTorque_real'
    },
    {
      id: 'gravity',
      labelKey: 'pulleysLevers.gravity',
      unit: 'm/s²',
      min: 1.0,
      max: 25.0,
      step: 0.1,
      default: 9.80665,
      descKey: 'pulleysLevers.gravity_desc',
      realModeEffect: null
    }
  ],

  presets: [
    {
      id: 'atwood-standard',
      labelKey: 'pulleysLevers.presets.atwoodStandard',
      params: {
        m1: 3.0,
        m2: 5.0,
        pulleyMass: 0.0,
        pulleyRadius: 0.15,
        frictionTorque: 0.0,
        gravity: 9.80665
      }
    },
    {
      id: 'atwood-balanced',
      labelKey: 'pulleysLevers.presets.atwoodBalanced',
      params: {
        m1: 4.0,
        m2: 4.0,
        pulleyMass: 0.0,
        pulleyRadius: 0.15,
        frictionTorque: 0.0,
        gravity: 9.80665
      }
    },
    {
      id: 'atwood-heavy-pulley',
      labelKey: 'pulleysLevers.presets.atwoodHeavyPulley',
      params: {
        m1: 2.0,
        m2: 6.0,
        pulleyMass: 2.0,
        pulleyRadius: 0.2,
        frictionTorque: 0.2,
        gravity: 9.80665
      }
    },
    {
      id: 'atwood-moon',
      labelKey: 'pulleysLevers.presets.atwoodMoon',
      params: {
        m1: 3.0,
        m2: 6.0,
        pulleyMass: 0.0,
        pulleyRadius: 0.15,
        frictionTorque: 0.0,
        gravity: 1.62
      }
    }
  ],

  tools: [
    {
      id: 'ruler',
      nameKey: 'common.ruler',
      icon: '📏'
    },
    {
      id: 'stopwatch',
      nameKey: 'common.stopwatch',
      icon: '⏱️'
    }
  ],

  formulas: [
    {
      titleKey: 'pulleysLevers.formulas.atwoodAccTitle',
      latex: 'a = \\frac{m_2 - m_1}{m_1 + m_2} g',
      explanationKey: 'pulleysLevers.formulas.atwoodAccExpl'
    },
    {
      titleKey: 'pulleysLevers.formulas.atwoodTensionTitle',
      latex: 'T = \\frac{2 m_1 m_2}{m_1 + m_2} g',
      explanationKey: 'pulleysLevers.formulas.atwoodTensionExpl'
    },
    {
      titleKey: 'pulleysLevers.formulas.realInertiaTitle',
      latex: 'a_{\\text{real}} = \\frac{(m_2 - m_1)g - \\frac{\\tau_f}{R}}{m_1 + m_2 + \\frac{1}{2}M_p}',
      explanationKey: 'pulleysLevers.formulas.realInertiaExpl'
    },
    {
      titleKey: 'pulleysLevers.formulas.maTitle',
      latex: 'IMA = N, \\quad AMA = \\frac{F_{\\text{load}}}{F_{\\text{effort}}}',
      explanationKey: 'pulleysLevers.formulas.maExpl'
    }
  ]
};
