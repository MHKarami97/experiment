import type { ExperimentConfig } from '@/experiments/registry';

export const orbitalGravityConfig: ExperimentConfig = {
  id: 'physics/motion/orbital-gravity',
  subject: 'physics',
  topic: 'motion',
  titleKey: 'experiments.orbitalGravity.title',
  descKey: 'experiments.orbitalGravity.description',
  gradeTags: ['high-school', 'university'],
  difficulty: 'advanced',
  engine: 'canvas2d',

  variables: [
    {
      id: 'semiMajorAxis',
      labelKey: 'orbitalGravity.semiMajorAxis',
      unit: 'km',
      min: 6800,
      max: 45000,
      step: 100,
      default: 12000,
      descKey: 'orbitalGravity.semiMajorAxis_desc',
      realModeEffect: null,
    },
    {
      id: 'eccentricity',
      labelKey: 'orbitalGravity.eccentricity',
      unit: '',
      min: 0.0,
      max: 0.85,
      step: 0.01,
      default: 0.35,
      descKey: 'orbitalGravity.eccentricity_desc',
      realModeEffect: null,
    },
    {
      id: 'primaryMassFactor',
      labelKey: 'orbitalGravity.primaryMassFactor',
      unit: 'M⊕',
      min: 0.2,
      max: 5.0,
      step: 0.1,
      default: 1.0,
      descKey: 'orbitalGravity.primaryMassFactor_desc',
      realModeEffect: null,
    },
    {
      id: 'satelliteMass',
      labelKey: 'orbitalGravity.satelliteMass',
      unit: 'kg',
      min: 100,
      max: 20000,
      step: 100,
      default: 1500,
      descKey: 'orbitalGravity.satelliteMass_desc',
      realModeEffect: null,
    },
    {
      id: 'atmosphericDrag',
      labelKey: 'orbitalGravity.atmosphericDrag',
      unit: '',
      min: 0,
      max: 1.0,
      step: 0.05,
      default: 0.2,
      descKey: 'orbitalGravity.atmosphericDrag_desc',
      realModeEffect: 'orbitalGravity.atmosphericDrag_real',
    },
  ],

  presets: [
    {
      id: 'leo',
      labelKey: 'orbitalGravity.preset_leo',
      params: {
        semiMajorAxis: 7000,
        eccentricity: 0.01,
        primaryMassFactor: 1.0,
        satelliteMass: 1000,
        atmosphericDrag: 0.4,
      },
    },
    {
      id: 'geo',
      labelKey: 'orbitalGravity.preset_geo',
      params: {
        semiMajorAxis: 42164,
        eccentricity: 0.0,
        primaryMassFactor: 1.0,
        satelliteMass: 2500,
        atmosphericDrag: 0.0,
      },
    },
    {
      id: 'molniya',
      labelKey: 'orbitalGravity.preset_molniya',
      params: {
        semiMajorAxis: 26600,
        eccentricity: 0.72,
        primaryMassFactor: 1.0,
        satelliteMass: 1500,
        atmosphericDrag: 0.1,
      },
    },
    {
      id: 'eccentric',
      labelKey: 'orbitalGravity.preset_eccentric',
      params: {
        semiMajorAxis: 15000,
        eccentricity: 0.55,
        primaryMassFactor: 1.2,
        satelliteMass: 1200,
        atmosphericDrag: 0.2,
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
      titleKey: 'orbitalGravity.formula_vis_viva',
      latex: 'v^2 = GM \\left(\\frac{2}{r} - \\frac{1}{a}\\right)',
      explanationKey: 'orbitalGravity.speed',
    },
    {
      titleKey: 'orbitalGravity.formula_kepler_third',
      latex: 'T^2 = \\frac{4\\pi^2}{GM} a^3',
      explanationKey: 'orbitalGravity.orbitalPeriod',
    },
    {
      titleKey: 'orbitalGravity.formula_angular_momentum',
      latex: 'h = r v_\\theta = \\sqrt{GM a (1 - e^2)} = \\text{const}',
      explanationKey: 'orbitalGravity.angularMomentum',
    },
    {
      titleKey: 'orbitalGravity.formula_orbit_equation',
      latex: 'r(\\theta) = \\frac{a(1 - e^2)}{1 + e \\cos\\theta}',
      explanationKey: 'orbitalGravity.orbitalRadius',
    },
  ],
};
