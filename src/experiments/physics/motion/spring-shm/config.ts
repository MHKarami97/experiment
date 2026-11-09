import type { ExperimentConfig } from '@/experiments/registry'

export const springShmConfig: ExperimentConfig = {
  id: 'physics/motion/spring-shm',
  subject: 'physics',
  topic: 'motion',
  titleKey: 'experiments.springShm.title',
  descKey: 'experiments.springShm.description',
  gradeTags: ['middle-school', 'high-school', 'university'],
  difficulty: 'medium',
  engine: 'canvas2d',

  variables: [
    {
      id: 'mass',
      labelKey: 'springShm.variables.mass',
      unit: 'kg',
      min: 0.2,
      max: 10.0,
      step: 0.1,
      default: 1.0,
      descKey: 'springShm.variables.massDesc',
      realModeEffect: null,
    },
    {
      id: 'k',
      labelKey: 'springShm.variables.k',
      unit: 'N/m',
      min: 5.0,
      max: 200.0,
      step: 5.0,
      default: 40.0,
      descKey: 'springShm.variables.kDesc',
      realModeEffect: null,
    },
    {
      id: 'initialX',
      labelKey: 'springShm.variables.initialX',
      unit: 'm',
      min: -1.0,
      max: 1.0,
      step: 0.05,
      default: 0.5,
      descKey: 'springShm.variables.initialXDesc',
      realModeEffect: null,
    },
    {
      id: 'damping',
      labelKey: 'springShm.variables.damping',
      unit: 'N·s/m',
      min: 0.0,
      max: 5.0,
      step: 0.1,
      default: 0.3,
      descKey: 'springShm.variables.dampingDesc',
      realModeEffect: 'springShm.realMode.dampingLoss',
    },
    {
      id: 'driveAmp',
      labelKey: 'springShm.variables.driveAmp',
      unit: 'N',
      min: 0.0,
      max: 20.0,
      step: 0.5,
      default: 0.0,
      descKey: 'springShm.variables.driveAmpDesc',
      realModeEffect: null,
    },
    {
      id: 'driveFreq',
      labelKey: 'springShm.variables.driveFreq',
      unit: 'Hz',
      min: 0.1,
      max: 5.0,
      step: 0.05,
      default: 1.0,
      descKey: 'springShm.variables.driveFreqDesc',
      realModeEffect: null,
    },
  ],

  presets: [
    {
      id: 'undamped-simple',
      labelKey: 'springShm.presets.undampedSimple',
      params: {
        mass: 1.0,
        k: 40.0,
        initialX: 0.5,
        damping: 0.0,
        driveAmp: 0.0,
        driveFreq: 1.0,
      },
    },
    {
      id: 'underdamped-decay',
      labelKey: 'springShm.presets.underdamped',
      params: {
        mass: 1.5,
        k: 60.0,
        initialX: 0.6,
        damping: 0.8,
        driveAmp: 0.0,
        driveFreq: 1.0,
      },
    },
    {
      id: 'resonance-peak',
      labelKey: 'springShm.presets.resonance',
      params: {
        mass: 1.0,
        k: 39.48, // omega0 = 2*pi = 6.28 rad/s -> f0 = 1.0 Hz
        initialX: 0.0,
        damping: 0.4,
        driveAmp: 2.5,
        driveFreq: 1.0,
      },
    },
    {
      id: 'critically-damped',
      labelKey: 'springShm.presets.critical',
      params: {
        mass: 1.0,
        k: 40.0,
        initialX: 0.7,
        damping: 12.65, // c_crit = 2*sqrt(m*k) = 2*sqrt(40) = 12.65
        driveAmp: 0.0,
        driveFreq: 1.0,
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
      titleKey: 'springShm.formulas.hookeLaw',
      latex: 'F_s = -k \\cdot x',
      explanationKey: 'springShm.formulas.hookeLaw',
    },
    {
      titleKey: 'springShm.formulas.periodFormula',
      latex: 'T_0 = 2\\pi\\sqrt{\\frac{m}{k}}, \\quad \\omega_0 = \\sqrt{\\frac{k}{m}}',
      explanationKey: 'springShm.formulas.periodFormula',
    },
    {
      titleKey: 'springShm.formulas.energy',
      latex: 'E = \\frac{1}{2}k x^2 + \\frac{1}{2}m v^2 = \\text{const}',
      explanationKey: 'springShm.formulas.energy',
    },
    {
      titleKey: 'springShm.formulas.resonanceEq',
      latex: 'A(\\omega) = \\frac{F_0 / m}{\\sqrt{(\\omega_0^2 - \\omega_d^2)^2 + (c\\omega_d/m)^2}}',
      explanationKey: 'springShm.formulas.resonanceEq',
    },
  ],
}
