import type { ExperimentConfig } from '@/experiments/registry';

export const snellRefractionConfig: ExperimentConfig = {
  id: 'physics/optics/snell-refraction',
  subject: 'physics',
  topic: 'optics',
  titleKey: 'experiments.snellRefraction.title',
  descKey: 'experiments.snellRefraction.description',
  gradeTags: ['middle-school', 'high-school', 'university'],
  difficulty: 'medium',
  engine: 'canvas2d',

  variables: [
    {
      id: 'theta1Deg',
      labelKey: 'snellRefraction.theta1Deg',
      unit: '°',
      min: 0,
      max: 85,
      step: 0.5,
      default: 45,
      descKey: 'snellRefraction.theta1Deg_desc',
      realModeEffect: null
    },
    {
      id: 'n1',
      labelKey: 'snellRefraction.n1',
      unit: '',
      min: 1.00,
      max: 2.50,
      step: 0.01,
      default: 1.00,
      descKey: 'snellRefraction.n1_desc',
      realModeEffect: null
    },
    {
      id: 'n2',
      labelKey: 'snellRefraction.n2',
      unit: '',
      min: 1.00,
      max: 2.50,
      step: 0.01,
      default: 1.52,
      descKey: 'snellRefraction.n2_desc',
      realModeEffect: null
    },
    {
      id: 'wavelengthNm',
      labelKey: 'snellRefraction.wavelength',
      unit: 'nm',
      min: 380,
      max: 750,
      step: 2,
      default: 532,
      descKey: 'snellRefraction.wavelength_desc',
      realModeEffect: 'snellRefraction.real_dispersion_effect'
    },
    {
      id: 'laserPowerMw',
      labelKey: 'snellRefraction.laserPower',
      unit: 'mW',
      min: 1,
      max: 20,
      step: 1,
      default: 5,
      descKey: 'snellRefraction.laserPower_desc',
      realModeEffect: null
    }
  ],

  presets: [
    {
      id: 'air_to_glass',
      labelKey: 'snellRefraction.preset_air_to_glass',
      params: {
        theta1Deg: 45,
        n1: 1.00,
        n2: 1.52,
        wavelengthNm: 532,
        laserPowerMw: 5
      }
    },
    {
      id: 'air_to_water',
      labelKey: 'snellRefraction.preset_air_to_water',
      params: {
        theta1Deg: 30,
        n1: 1.00,
        n2: 1.333,
        wavelengthNm: 532,
        laserPowerMw: 5
      }
    },
    {
      id: 'glass_to_air_tir',
      labelKey: 'snellRefraction.preset_glass_to_air_tir',
      params: {
        theta1Deg: 55,
        n1: 1.52,
        n2: 1.00,
        wavelengthNm: 532,
        laserPowerMw: 5
      }
    },
    {
      id: 'brewster_polarization',
      labelKey: 'snellRefraction.preset_brewster_polarization',
      params: {
        theta1Deg: 56.7,
        n1: 1.00,
        n2: 1.52,
        wavelengthNm: 532,
        laserPowerMw: 5
      }
    },
    {
      id: 'water_to_air_critical',
      labelKey: 'snellRefraction.preset_water_to_air_critical',
      params: {
        theta1Deg: 48.6,
        n1: 1.333,
        n2: 1.00,
        wavelengthNm: 532,
        laserPowerMw: 5
      }
    },
    {
      id: 'diamond_sparkle',
      labelKey: 'snellRefraction.preset_diamond_sparkle',
      params: {
        theta1Deg: 45,
        n1: 1.00,
        n2: 2.42,
        wavelengthNm: 532,
        laserPowerMw: 5
      }
    }
  ],

  tools: [
    { id: 'protractor', nameKey: 'snellRefraction.tool_protractor', icon: '📐' },
    { id: 'lux_meter', nameKey: 'snellRefraction.tool_luxMeter', icon: '💡' },
    { id: 'color_probe', nameKey: 'snellRefraction.tool_colorProbe', icon: '🌈' }
  ],

  formulas: [
    {
      titleKey: 'snellRefraction.formula_reflection',
      latex: '\\theta_r = \\theta_i',
      explanationKey: 'snellRefraction.formula_reflection_desc'
    },
    {
      titleKey: 'snellRefraction.formula_snell',
      latex: 'n_1 \\sin\\theta_1 = n_2 \\sin\\theta_2 \\implies \\sin\\theta_2 = \\frac{n_1}{n_2} \\sin\\theta_1',
      explanationKey: 'snellRefraction.formula_snell_desc'
    },
    {
      titleKey: 'snellRefraction.formula_critical',
      latex: '\\theta_c = \\arcsin\\left(\\frac{n_2}{n_1}\\right) \\quad (n_1 > n_2)',
      explanationKey: 'snellRefraction.formula_critical_desc'
    },
    {
      titleKey: 'snellRefraction.formula_brewster',
      latex: '\\theta_B = \\arctan\\left(\\frac{n_2}{n_1}\\right)',
      explanationKey: 'snellRefraction.formula_brewster_desc'
    },
    {
      titleKey: 'snellRefraction.formula_fresnel',
      latex: 'R = \\frac{R_s + R_p}{2}, \\quad T = 1 - R',
      explanationKey: 'snellRefraction.formula_fresnel_desc'
    }
  ]
};
