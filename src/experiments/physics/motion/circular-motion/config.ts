import type { ExperimentConfig } from '@/experiments/registry';

export const circularMotionConfig: ExperimentConfig = {
  id: 'physics/motion/circular-motion',
  subject: 'physics',
  topic: 'motion',
  titleKey: 'experiments.circularMotion.title',
  descKey: 'experiments.circularMotion.description',
  gradeTags: ['middle-school', 'high-school', 'university'],
  difficulty: 'medium',
  engine: 'canvas2d',

  variables: [
    {
      id: 'radius',
      labelKey: 'circularMotion.radius',
      unit: 'm',
      min: 0.5,
      max: 5.0,
      step: 0.1,
      default: 2.0,
      descKey: 'circularMotion.radius_desc',
      realModeEffect: null
    },
    {
      id: 'mass',
      labelKey: 'circularMotion.mass',
      unit: 'kg',
      min: 0.1,
      max: 20.0,
      step: 0.1,
      default: 1.5,
      descKey: 'circularMotion.mass_desc',
      realModeEffect: null
    },
    {
      id: 'angularVelocity',
      labelKey: 'circularMotion.angularVelocity',
      unit: 'rad/s',
      min: 0.5,
      max: 15.0,
      step: 0.1,
      default: 4.0,
      descKey: 'circularMotion.angularVelocity_desc',
      realModeEffect: null
    },
    {
      id: 'maxTension',
      labelKey: 'circularMotion.maxTension',
      unit: 'N',
      min: 20.0,
      max: 800.0,
      step: 10.0,
      default: 180.0,
      descKey: 'circularMotion.maxTension_desc',
      realModeEffect: 'circularMotion.maxTension_real'
    },
    {
      id: 'stringStiffness',
      labelKey: 'circularMotion.stringStiffness',
      unit: 'N/m',
      min: 200.0,
      max: 5000.0,
      step: 100.0,
      default: 1500.0,
      descKey: 'circularMotion.stringStiffness_desc',
      realModeEffect: 'circularMotion.stringStiffness_real'
    },
    {
      id: 'dragCoeff',
      labelKey: 'circularMotion.dragCoeff',
      unit: '—',
      min: 0.0,
      max: 1.2,
      step: 0.05,
      default: 0.47,
      descKey: 'circularMotion.dragCoeff_desc',
      realModeEffect: 'circularMotion.dragCoeff_real'
    }
  ],

  presets: [
    {
      id: 'standard-orbit',
      labelKey: 'circularMotion.presets.standardOrbit',
      params: {
        radius: 2.0,
        mass: 1.5,
        angularVelocity: 4.0,
        maxTension: 200.0,
        stringStiffness: 2000.0,
        dragCoeff: 0.0
      }
    },
    {
      id: 'high-speed',
      labelKey: 'circularMotion.presets.highSpeed',
      params: {
        radius: 1.5,
        mass: 1.0,
        angularVelocity: 8.0,
        maxTension: 300.0,
        stringStiffness: 2500.0,
        dragCoeff: 0.2
      }
    },
    {
      id: 'large-radius',
      labelKey: 'circularMotion.presets.largeRadius',
      params: {
        radius: 4.0,
        mass: 3.0,
        angularVelocity: 2.0,
        maxTension: 250.0,
        stringStiffness: 1500.0,
        dragCoeff: 0.3
      }
    },
    {
      id: 'rope-snap',
      labelKey: 'circularMotion.presets.ropeSnap',
      params: {
        radius: 2.5,
        mass: 2.0,
        angularVelocity: 9.0,
        maxTension: 140.0,
        stringStiffness: 1200.0,
        dragCoeff: 0.47
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
      titleKey: 'circularMotion.formulas.speedTitle',
      latex: 'v = \\omega \\cdot r',
      explanationKey: 'circularMotion.formulas.speedExpl'
    },
    {
      titleKey: 'circularMotion.formulas.centripetalAccTitle',
      latex: 'a_c = \\frac{v^2}{r} = \\omega^2 \\cdot r',
      explanationKey: 'circularMotion.formulas.centripetalAccExpl'
    },
    {
      titleKey: 'circularMotion.formulas.centripetalForceTitle',
      latex: 'F_c = m \\cdot a_c = m \\cdot \\omega^2 \\cdot r',
      explanationKey: 'circularMotion.formulas.centripetalForceExpl'
    },
    {
      titleKey: 'circularMotion.formulas.periodFreqTitle',
      latex: 'T = \\frac{2\\pi}{\\omega} = \\frac{2\\pi r}{v}, \\quad f = \\frac{1}{T} = \\frac{\\omega}{2\\pi}',
      explanationKey: 'circularMotion.formulas.periodFreqExpl'
    }
  ]
};
