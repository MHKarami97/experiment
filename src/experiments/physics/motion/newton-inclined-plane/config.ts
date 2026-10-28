import type { ExperimentConfig } from '@/experiments/registry';

export const inclinedPlaneConfig: ExperimentConfig = {
  id: 'physics/motion/newton-inclined-plane',
  subject: 'physics',
  topic: 'motion',
  titleKey: 'inclinedPlane.title',
  descKey: 'inclinedPlane.description',
  gradeTags: ['middle-school', 'high-school', 'university'],
  difficulty: 'medium',
  engine: 'canvas2d',
  variables: [
    {
      id: 'angle',
      labelKey: 'inclinedPlane.angle',
      unit: '°',
      min: 0,
      max: 80,
      step: 1,
      default: 30,
      descKey: 'inclinedPlane.angle_desc',
      realModeEffect: null
    },
    {
      id: 'mass',
      labelKey: 'inclinedPlane.mass',
      unit: 'kg',
      min: 0.5,
      max: 50,
      step: 0.5,
      default: 2.0,
      descKey: 'inclinedPlane.mass_desc',
      realModeEffect: null
    },
    {
      id: 'gravity',
      labelKey: 'inclinedPlane.gravity',
      unit: 'm/s²',
      min: 1,
      max: 25,
      step: 0.1,
      default: 9.81,
      descKey: 'inclinedPlane.gravity_desc',
      realModeEffect: null
    },
    {
      id: 'fPull',
      labelKey: 'inclinedPlane.fPull',
      unit: 'N',
      min: -80,
      max: 120,
      step: 1,
      default: 0,
      descKey: 'inclinedPlane.fPull_desc',
      realModeEffect: null
    },
    {
      id: 'initialPos',
      labelKey: 'inclinedPlane.initialPos',
      unit: 'm',
      min: 0,
      max: 20,
      step: 0.5,
      default: 15,
      descKey: 'inclinedPlane.initialPos_desc',
      realModeEffect: null
    },
    {
      id: 'initialSpeed',
      labelKey: 'inclinedPlane.initialSpeed',
      unit: 'm/s',
      min: -15,
      max: 15,
      step: 0.5,
      default: 0,
      descKey: 'inclinedPlane.initialSpeed_desc',
      realModeEffect: null
    },
    {
      id: 'muS',
      labelKey: 'inclinedPlane.muS',
      unit: '—',
      min: 0,
      max: 1.2,
      step: 0.02,
      default: 0.4,
      descKey: 'inclinedPlane.muS_desc',
      realModeEffect: 'ضریب اصطکاک ایستایی ماکزیمم آستانه حرکت'
    },
    {
      id: 'muK',
      labelKey: 'inclinedPlane.muK',
      unit: '—',
      min: 0,
      max: 1.0,
      step: 0.02,
      default: 0.25,
      descKey: 'inclinedPlane.muK_desc',
      realModeEffect: 'نیروی اصطکاک جنبشی بازدارنده در حین لغزش'
    }
  ],
  presets: [
    {
      id: 'frictionless-slide',
      labelKey: 'inclinedPlane.presets.frictionless',
      params: {
        angle: 30,
        mass: 2.0,
        gravity: 9.81,
        fPull: 0,
        initialPos: 15,
        initialSpeed: 0,
        muS: 0,
        muK: 0
      }
    },
    {
      id: 'static-stick',
      labelKey: 'inclinedPlane.presets.staticStick',
      params: {
        angle: 20,
        mass: 3.0,
        gravity: 9.81,
        fPull: 0,
        initialPos: 12,
        initialSpeed: 0,
        muS: 0.6,
        muK: 0.4
      }
    },
    {
      id: 'critical-angle',
      labelKey: 'inclinedPlane.presets.criticalAngle',
      params: {
        angle: 26.57,
        mass: 2.5,
        gravity: 9.81,
        fPull: 0,
        initialPos: 14,
        initialSpeed: 0,
        muS: 0.5,
        muK: 0.35
      }
    },
    {
      id: 'pull-upwards',
      labelKey: 'inclinedPlane.presets.pullUp',
      params: {
        angle: 30,
        mass: 2.0,
        gravity: 9.81,
        fPull: 35,
        initialPos: 2,
        initialSpeed: 0,
        muS: 0.3,
        muK: 0.2
      }
    },
    {
      id: 'real-friction',
      labelKey: 'inclinedPlane.presets.realFriction',
      params: {
        angle: 35,
        mass: 4.0,
        gravity: 9.81,
        fPull: 0,
        initialPos: 18,
        initialSpeed: 0,
        muS: 0.4,
        muK: 0.25
      }
    }
  ],
  tools: [
    { id: 'ruler', nameKey: 'common.ruler', icon: '📏' },
    { id: 'stopwatch', nameKey: 'common.stopwatch', icon: '⏱️' }
  ],
  formulas: [
    {
      titleKey: 'inclinedPlane.formulas.netForceTitle',
      latex: 'F_{\\text{net}} = F_{\\text{pull}} - m g \\sin\\theta + f_{\\text{friction}} = m a',
      explanationKey: 'inclinedPlane.formulas.netForceExpl'
    },
    {
      titleKey: 'inclinedPlane.formulas.normalTitle',
      latex: 'N = m g \\cos\\theta',
      explanationKey: 'inclinedPlane.formulas.normalExpl'
    },
    {
      titleKey: 'inclinedPlane.formulas.frictionTitle',
      latex: 'f_s \\le \\mu_s N, \\quad f_k = \\mu_k N',
      explanationKey: 'inclinedPlane.formulas.frictionExpl'
    },
    {
      titleKey: 'inclinedPlane.formulas.criticalTitle',
      latex: '\\tan\\theta_c = \\mu_s',
      explanationKey: 'inclinedPlane.formulas.criticalExpl'
    }
  ]
};
