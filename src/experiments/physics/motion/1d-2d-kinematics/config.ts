import type { ExperimentConfig } from '@/experiments/registry';

export const kinematicsConfig: ExperimentConfig = {
  id: 'physics/motion/1d-2d-kinematics',
  subject: 'physics',
  topic: 'motion',
  titleKey: 'kinematics.title',
  descKey: 'kinematics.description',
  gradeTags: ['middle-school', 'high-school', 'university'],
  difficulty: 'easy',
  engine: 'canvas2d',
  variables: [
    {
      id: 'x0',
      labelKey: 'kinematics.x0',
      unit: 'm',
      min: -50,
      max: 50,
      step: 1,
      default: 0,
      descKey: 'kinematics.x0_desc',
      realModeEffect: null
    },
    {
      id: 'v0x',
      labelKey: 'kinematics.v0x',
      unit: 'm/s',
      min: -50,
      max: 50,
      step: 0.5,
      default: 10,
      descKey: 'kinematics.v0x_desc',
      realModeEffect: null
    },
    {
      id: 'ax',
      labelKey: 'kinematics.ax',
      unit: 'm/s²',
      min: -15,
      max: 15,
      step: 0.2,
      default: 0,
      descKey: 'kinematics.ax_desc',
      realModeEffect: null
    },
    {
      id: 'y0',
      labelKey: 'kinematics.y0',
      unit: 'm',
      min: -50,
      max: 50,
      step: 1,
      default: 0,
      descKey: 'kinematics.y0_desc',
      realModeEffect: null
    },
    {
      id: 'v0y',
      labelKey: 'kinematics.v0y',
      unit: 'm/s',
      min: -50,
      max: 50,
      step: 0.5,
      default: 0,
      descKey: 'kinematics.v0y_desc',
      realModeEffect: null
    },
    {
      id: 'ay',
      labelKey: 'kinematics.ay',
      unit: 'm/s²',
      min: -15,
      max: 15,
      step: 0.2,
      default: 0,
      descKey: 'kinematics.ay_desc',
      realModeEffect: null
    },
    {
      id: 'mass',
      labelKey: 'kinematics.mass',
      unit: 'kg',
      min: 0.1,
      max: 100,
      step: 0.5,
      default: 2.0,
      descKey: 'kinematics.mass_desc',
      realModeEffect: 'در حالت واقعی شتاب اصطکاک و پسار به جرم وابسته است'
    },
    {
      id: 'frictionMu',
      labelKey: 'kinematics.frictionMu',
      unit: '—',
      min: 0,
      max: 1.0,
      step: 0.02,
      default: 0.05,
      descKey: 'kinematics.frictionMu_desc',
      realModeEffect: 'نیروی اصطکاک جنبشی بین جسم و سطح'
    },
    {
      id: 'dragCoeff',
      labelKey: 'kinematics.dragCoeff',
      unit: '—',
      min: 0,
      max: 1.5,
      step: 0.05,
      default: 0.45,
      descKey: 'kinematics.dragCoeff_desc',
      realModeEffect: 'مقاومت آیرودینامیک هوا'
    }
  ],
  presets: [
    {
      id: 'uniform-1d',
      labelKey: 'kinematics.presets.uniform1d',
      descKey: 'kinematics.presets.uniform1dDesc',
      params: {
        x0: 0,
        y0: 0,
        v0x: 12,
        v0y: 0,
        ax: 0,
        ay: 0,
        mass: 1.5,
        frictionMu: 0,
        dragCoeff: 0,
        airDensity: 0,
        crossSection: 0.01
      }
    },
    {
      id: 'accel-1d',
      labelKey: 'kinematics.presets.accel1d',
      descKey: 'kinematics.presets.accel1dDesc',
      params: {
        x0: 0,
        y0: 0,
        v0x: 0,
        v0y: 0,
        ax: 2.5,
        ay: 0,
        mass: 2.0,
        frictionMu: 0,
        dragCoeff: 0,
        airDensity: 0,
        crossSection: 0.01
      }
    },
    {
      id: 'brake-1d',
      labelKey: 'kinematics.presets.brake1d',
      descKey: 'kinematics.presets.brake1dDesc',
      params: {
        x0: 0,
        y0: 0,
        v0x: 20,
        v0y: 0,
        ax: -4,
        ay: 0,
        mass: 1.0,
        frictionMu: 0,
        dragCoeff: 0,
        airDensity: 0,
        crossSection: 0.01
      }
    },
    {
      id: 'parabolic-2d',
      labelKey: 'kinematics.presets.parabolic2d',
      descKey: 'kinematics.presets.parabolic2dDesc',
      params: {
        x0: 0,
        y0: 0,
        v0x: 15,
        v0y: 0,
        ax: 0,
        ay: 3,
        mass: 1.0,
        frictionMu: 0,
        dragCoeff: 0,
        airDensity: 0,
        crossSection: 0.01
      }
    },
    {
      id: 'real-friction',
      labelKey: 'kinematics.presets.realFriction',
      descKey: 'kinematics.presets.realFrictionDesc',
      params: {
        x0: 0,
        y0: 0,
        v0x: 18,
        v0y: 0,
        ax: 0,
        ay: 0,
        mass: 2.0,
        frictionMu: 0.08,
        dragCoeff: 0.5,
        airDensity: 1.225,
        crossSection: 0.02
      }
    }
  ],
  tools: [
    { id: 'ruler', nameKey: 'common.ruler', icon: '📏' },
    { id: 'stopwatch', nameKey: 'common.stopwatch', icon: '⏱️' }
  ],
  formulas: [
    {
      titleKey: 'kinematics.formulas.posTitle',
      latex: 'x(t) = x_0 + v_{0x} t + \\frac{1}{2} a_x t^2',
      explanationKey: 'kinematics.formulas.posExpl'
    },
    {
      titleKey: 'kinematics.formulas.velTitle',
      latex: 'v_x(t) = v_{0x} + a_x t',
      explanationKey: 'kinematics.formulas.velExpl'
    },
    {
      titleKey: 'kinematics.formulas.torricelliTitle',
      latex: 'v_x^2 - v_{0x}^2 = 2 a_x (x - x_0)',
      explanationKey: 'kinematics.formulas.torricelliExpl'
    },
    {
      titleKey: 'kinematics.formulas.frictionTitle',
      latex: 'f_k = \\mu_k m g',
      explanationKey: 'kinematics.formulas.frictionExpl'
    }
  ]
};
