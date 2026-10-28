import type { ExperimentConfig } from '@/experiments/registry';
import { CONSTANTS } from '@/core/constants';

export const projectileConfig: ExperimentConfig = {
  id: 'physics/motion/projectile',
  subject: 'physics',
  topic: 'motion',
  titleKey: 'projectile.title',
  descKey: 'projectile.description',
  gradeTags: ['high-school', 'university'],
  difficulty: 'medium',
  engine: 'canvas2d',
  variables: [
    {
      id: 'v0',
      labelKey: 'projectile.v0',
      unit: 'm/s',
      min: 1,
      max: 100,
      step: 0.5,
      default: 20,
      descKey: 'projectile.v0.desc',
      realModeEffect: null
    },
    {
      id: 'angle',
      labelKey: 'projectile.angle',
      unit: '°',
      min: 0,
      max: 90,
      step: 1,
      default: 45,
      descKey: 'projectile.angle.desc',
      realModeEffect: null
    },
    {
      id: 'h0',
      labelKey: 'projectile.h0',
      unit: 'm',
      min: 0,
      max: 50,
      step: 1,
      default: 0,
      descKey: 'projectile.h0.desc',
      realModeEffect: null
    },
    {
      id: 'gravity',
      labelKey: 'projectile.gravity',
      unit: 'm/s²',
      min: 1,
      max: 30,
      step: 0.1,
      default: CONSTANTS.GRAVITY_EARTH,
      descKey: 'projectile.gravity.desc',
      realModeEffect: null
    },
    {
      id: 'mass',
      labelKey: 'projectile.mass',
      unit: 'kg',
      min: 0.05,
      max: 50,
      step: 0.1,
      default: 1.0,
      descKey: 'projectile.mass.desc',
      realModeEffect: 'در حالت واقعی شتاب پسار با جرم نسبت عکس دارد (a = F_d / m)'
    },
    {
      id: 'dragCoeff',
      labelKey: 'projectile.dragCoeff',
      unit: '—',
      min: 0.01,
      max: 2.0,
      step: 0.01,
      default: 0.47, // Sphere drag coefficient
      descKey: 'projectile.dragCoeff.desc',
      realModeEffect: 'ضریب پسار شکل کروی (۰.۴۷)'
    },
    {
      id: 'crossSection',
      labelKey: 'projectile.crossSection',
      unit: 'm²',
      min: 0.001,
      max: 0.5,
      step: 0.005,
      default: 0.01,
      descKey: 'projectile.crossSection.desc',
      realModeEffect: 'سطح مقطع پرتابه در برابر جریان هوا'
    },
    {
      id: 'airDensity',
      labelKey: 'projectile.airDensity',
      unit: 'kg/m³',
      min: 0,
      max: 3.0,
      step: 0.05,
      default: CONSTANTS.AIR_DENSITY_SEA_LEVEL,
      descKey: 'projectile.airDensity.desc',
      realModeEffect: 'چگالی هوای محیط'
    },
    {
      id: 'wind',
      labelKey: 'projectile.wind',
      unit: 'm/s',
      min: -30,
      max: 30,
      step: 1,
      default: 0,
      descKey: 'projectile.wind.desc',
      realModeEffect: 'سرعت افقی باد (+ موافق پرتاب، - مخالف)'
    }
  ],
  presets: [
    {
      id: 'earth-ideal',
      labelKey: 'projectile.presets.earthIdeal',
      descKey: 'projectile.presets.earthIdealDesc',
      params: {
        v0: 25,
        angle: 45,
        h0: 0,
        gravity: 9.80665,
        mass: 1.0,
        dragCoeff: 0.47,
        crossSection: 0.01,
        airDensity: 1.225,
        wind: 0
      }
    },
    {
      id: 'moon',
      labelKey: 'projectile.presets.moon',
      descKey: 'projectile.presets.moonDesc',
      params: {
        v0: 25,
        angle: 45,
        h0: 0,
        gravity: 1.62,
        mass: 1.0,
        dragCoeff: 0.47,
        crossSection: 0.01,
        airDensity: 0, // No atmosphere on Moon
        wind: 0
      }
    },
    {
      id: 'mars',
      labelKey: 'projectile.presets.mars',
      descKey: 'projectile.presets.marsDesc',
      params: {
        v0: 25,
        angle: 45,
        h0: 0,
        gravity: 3.72,
        mass: 1.0,
        dragCoeff: 0.47,
        crossSection: 0.01,
        airDensity: 0.02, // Thin Martian atmosphere
        wind: 5
      }
    },
    {
      id: 'jupiter',
      labelKey: 'projectile.presets.jupiter',
      descKey: 'projectile.presets.jupiterDesc',
      params: {
        v0: 30,
        angle: 45,
        h0: 0,
        gravity: 24.79,
        mass: 5.0,
        dragCoeff: 0.47,
        crossSection: 0.02,
        airDensity: 1.5,
        wind: 0
      }
    }
  ],
  tools: [
    { id: 'ruler', nameKey: 'projectile.tools.ruler', icon: '📏' },
    { id: 'stopwatch', nameKey: 'projectile.tools.stopwatch', icon: '⏱️' }
  ],
  formulas: [
    {
      titleKey: 'projectile.formulas.rangeTitle',
      latex: 'R_{\\text{ideal}} = \\frac{v_0 \\cos\\theta}{g} \\left( v_0 \\sin\\theta + \\sqrt{v_0^2 \\sin^2\\theta + 2gh_0} \\right)',
      explanationKey: 'projectile.formulas.rangeExpl'
    },
    {
      titleKey: 'projectile.formulas.maxHeightTitle',
      latex: 'H_{\\text{max, ideal}} = h_0 + \\frac{v_0^2 \\sin^2\\theta}{2g}',
      explanationKey: 'projectile.formulas.maxHeightExpl'
    },
    {
      titleKey: 'projectile.formulas.flightTimeTitle',
      latex: 'T_{\\text{flight, ideal}} = \\frac{v_0 \\sin\\theta + \\sqrt{v_0^2 \\sin^2\\theta + 2gh_0}}{g}',
      explanationKey: 'projectile.formulas.flightTimeExpl'
    },
    {
      titleKey: 'projectile.formulas.dragTitle',
      latex: '\\vec{F}_{\\text{drag}} = -\\frac{1}{2} \\rho C_d A |\\vec{v} - \\vec{v}_{\\text{wind}}| (\\vec{v} - \\vec{v}_{\\text{wind}})',
      explanationKey: 'projectile.formulas.dragExpl'
    }
  ]
};
