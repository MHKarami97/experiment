import type { ExperimentConfig } from '@/experiments/registry';

export const standingWavesConfig: ExperimentConfig = {
  id: 'physics/waves/standing-waves',
  subject: 'physics',
  topic: 'waves',
  titleKey: 'experiments.standingWaves.title',
  descKey: 'experiments.standingWaves.description',
  gradeTags: ['middle-school', 'high-school', 'university'],
  difficulty: 'medium',
  engine: 'canvas2d',

  variables: [
    {
      id: 'systemModeIndex',
      labelKey: 'standingWaves.systemMode',
      unit: '',
      min: 0,
      max: 2,
      step: 1,
      default: 0,
      descKey: 'standingWaves.systemMode_desc',
      realModeEffect: null
    },
    {
      id: 'harmonicNumber',
      labelKey: 'standingWaves.harmonicNumber',
      unit: '',
      min: 1,
      max: 6,
      step: 1,
      default: 2,
      descKey: 'standingWaves.harmonicNumber_desc',
      realModeEffect: null
    },
    {
      id: 'length',
      labelKey: 'standingWaves.length',
      unit: 'm',
      min: 0.5,
      max: 2.5,
      step: 0.1,
      default: 1.2,
      descKey: 'standingWaves.length_desc',
      realModeEffect: 'standingWaves.real_length_effect'
    },
    {
      id: 'tension',
      labelKey: 'standingWaves.tension',
      unit: 'N',
      min: 5,
      max: 100,
      step: 5,
      default: 45,
      descKey: 'standingWaves.tension_desc',
      realModeEffect: null
    },
    {
      id: 'linearDensityGPerM',
      labelKey: 'standingWaves.linearDensity',
      unit: 'g/m',
      min: 0.5,
      max: 8.0,
      step: 0.5,
      default: 2.0,
      descKey: 'standingWaves.linearDensity_desc',
      realModeEffect: null
    },
    {
      id: 'soundSpeed',
      labelKey: 'standingWaves.soundSpeed',
      unit: 'm/s',
      min: 320,
      max: 360,
      step: 1,
      default: 343,
      descKey: 'standingWaves.soundSpeed_desc',
      realModeEffect: null
    },
    {
      id: 'damping',
      labelKey: 'standingWaves.damping',
      unit: '',
      min: 0.01,
      max: 0.08,
      step: 0.005,
      default: 0.025,
      descKey: 'standingWaves.damping_desc',
      realModeEffect: 'standingWaves.real_damping_effect'
    }
  ],

  presets: [
    {
      id: 'fundamental_string',
      labelKey: 'standingWaves.preset_fundamental_string',
      params: {
        systemModeIndex: 0,
        harmonicNumber: 1,
        length: 1.2,
        tension: 45,
        linearDensityGPerM: 2.0,
        soundSpeed: 343,
        damping: 0.02
      }
    },
    {
      id: 'second_harmonic_string',
      labelKey: 'standingWaves.preset_second_harmonic_string',
      params: {
        systemModeIndex: 0,
        harmonicNumber: 2,
        length: 1.2,
        tension: 45,
        linearDensityGPerM: 2.0,
        soundSpeed: 343,
        damping: 0.02
      }
    },
    {
      id: 'third_harmonic_string',
      labelKey: 'standingWaves.preset_third_harmonic_string',
      params: {
        systemModeIndex: 0,
        harmonicNumber: 3,
        length: 1.2,
        tension: 45,
        linearDensityGPerM: 2.0,
        soundSpeed: 343,
        damping: 0.02
      }
    },
    {
      id: 'open_open_pipe',
      labelKey: 'standingWaves.preset_open_pipe',
      params: {
        systemModeIndex: 1,
        harmonicNumber: 2,
        length: 1.0,
        tension: 45,
        linearDensityGPerM: 2.0,
        soundSpeed: 343,
        damping: 0.02
      }
    },
    {
      id: 'closed_quarter_pipe',
      labelKey: 'standingWaves.preset_closed_pipe',
      params: {
        systemModeIndex: 2,
        harmonicNumber: 1,
        length: 0.85,
        tension: 45,
        linearDensityGPerM: 2.0,
        soundSpeed: 343,
        damping: 0.02
      }
    }
  ],

  tools: [
    { id: 'nodeMarkers', nameKey: 'standingWaves.tool_markers', icon: '🔴' },
    { id: 'envelopeLobes', nameKey: 'standingWaves.tool_envelope', icon: '〰️' },
    { id: 'soundDust', nameKey: 'standingWaves.tool_dust', icon: '✨' }
  ],

  formulas: [
    {
      titleKey: 'standingWaves.formula_speed',
      latex: 'v = \\sqrt{\\frac{T}{\\mu}}',
      explanationKey: 'standingWaves.formula_speed_desc'
    },
    {
      titleKey: 'standingWaves.formula_stringHarmonics',
      latex: 'f_n = n \\frac{v}{2L} \\quad (n = 1, 2, 3, \\dots)',
      explanationKey: 'standingWaves.formula_stringHarmonics_desc'
    },
    {
      titleKey: 'standingWaves.formula_closedPipeHarmonics',
      latex: 'f_n = (2n - 1) \\frac{v_{\\text{sound}}}{4L} \\quad (n = 1, 2, 3, \\dots)',
      explanationKey: 'standingWaves.formula_closedPipeHarmonics_desc'
    },
    {
      titleKey: 'standingWaves.formula_standingEquation',
      latex: 'y(x, t) = 2A \\sin(k_n x) \\cos(\\omega_n t)',
      explanationKey: 'standingWaves.formula_standingEquation_desc'
    }
  ]
};
