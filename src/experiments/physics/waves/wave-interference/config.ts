import type { ExperimentConfig } from '@/experiments/registry';

export const waveInterferenceConfig: ExperimentConfig = {
  id: 'physics/waves/wave-interference',
  subject: 'physics',
  topic: 'waves',
  titleKey: 'experiments.waveInterference.title',
  descKey: 'experiments.waveInterference.description',
  gradeTags: ['middle-school', 'high-school', 'university'],
  difficulty: 'medium',
  engine: 'canvas2d',

  variables: [
    {
      id: 'waveModeIndex',
      labelKey: 'waveInterference.waveMode',
      unit: '',
      min: 0,
      max: 2,
      step: 1,
      default: 0,
      descKey: 'waveInterference.waveMode_desc',
      realModeEffect: null
    },
    {
      id: 'amplitude1',
      labelKey: 'waveInterference.amplitude1',
      unit: 'cm',
      min: 0.5,
      max: 5.0,
      step: 0.1,
      default: 2.0,
      descKey: 'waveInterference.amplitude1_desc',
      realModeEffect: null
    },
    {
      id: 'amplitude2',
      labelKey: 'waveInterference.amplitude2',
      unit: 'cm',
      min: 0.5,
      max: 5.0,
      step: 0.1,
      default: 2.0,
      descKey: 'waveInterference.amplitude2_desc',
      realModeEffect: null
    },
    {
      id: 'frequency',
      labelKey: 'waveInterference.frequency',
      unit: 'Hz',
      min: 0.2,
      max: 4.0,
      step: 0.1,
      default: 1.5,
      descKey: 'waveInterference.frequency_desc',
      realModeEffect: null
    },
    {
      id: 'waveSpeed',
      labelKey: 'waveInterference.waveSpeed',
      unit: 'cm/s',
      min: 5,
      max: 50,
      step: 1,
      default: 20,
      descKey: 'waveInterference.waveSpeed_desc',
      realModeEffect: 'waveInterference.real_speed_effect'
    },
    {
      id: 'sourceSeparation',
      labelKey: 'waveInterference.sourceSeparation',
      unit: 'cm',
      min: 4,
      max: 30,
      step: 1,
      default: 12,
      descKey: 'waveInterference.sourceSeparation_desc',
      realModeEffect: null
    },
    {
      id: 'phaseDifferenceDeg',
      labelKey: 'waveInterference.phaseDifference',
      unit: '°',
      min: 0,
      max: 360,
      step: 15,
      default: 0,
      descKey: 'waveInterference.phaseDifference_desc',
      realModeEffect: null
    },
    {
      id: 'damping',
      labelKey: 'waveInterference.damping',
      unit: '1/s',
      min: 0,
      max: 0.15,
      step: 0.01,
      default: 0.03,
      descKey: 'waveInterference.damping_desc',
      realModeEffect: 'waveInterference.real_damping_effect'
    }
  ],

  presets: [
    {
      id: 'in_phase_constructive',
      labelKey: 'waveInterference.preset_in_phase',
      params: {
        waveModeIndex: 0,
        amplitude1: 2.0,
        amplitude2: 2.0,
        frequency: 1.5,
        waveSpeed: 20,
        sourceSeparation: 12,
        phaseDifferenceDeg: 0,
        damping: 0.02
      }
    },
    {
      id: 'out_of_phase_destructive',
      labelKey: 'waveInterference.preset_out_of_phase',
      params: {
        waveModeIndex: 0,
        amplitude1: 2.0,
        amplitude2: 2.0,
        frequency: 1.5,
        waveSpeed: 20,
        sourceSeparation: 12,
        phaseDifferenceDeg: 180,
        damping: 0.02
      }
    },
    {
      id: 'wide_spacing_multinodal',
      labelKey: 'waveInterference.preset_wide_spacing',
      params: {
        waveModeIndex: 0,
        amplitude1: 2.5,
        amplitude2: 2.5,
        frequency: 2.5,
        waveSpeed: 22,
        sourceSeparation: 22,
        phaseDifferenceDeg: 0,
        damping: 0.02
      }
    },
    {
      id: 'transverse_standing_wave',
      labelKey: 'waveInterference.preset_transverse',
      params: {
        waveModeIndex: 1,
        amplitude1: 2.5,
        amplitude2: 2.5,
        frequency: 1.2,
        waveSpeed: 24,
        sourceSeparation: 10,
        phaseDifferenceDeg: 0,
        damping: 0.01
      }
    },
    {
      id: 'longitudinal_sound_compression',
      labelKey: 'waveInterference.preset_longitudinal',
      params: {
        waveModeIndex: 2,
        amplitude1: 2.0,
        amplitude2: 2.0,
        frequency: 1.0,
        waveSpeed: 18,
        sourceSeparation: 10,
        phaseDifferenceDeg: 0,
        damping: 0.01
      }
    }
  ],

  tools: [
    { id: 'probeSensor', nameKey: 'waveInterference.tool_probe', icon: '📍' },
    { id: 'nodalLines', nameKey: 'waveInterference.tool_nodal', icon: '〰️' },
    { id: 'waveformInspector', nameKey: 'waveInterference.tool_waveform', icon: '📊' }
  ],

  formulas: [
    {
      titleKey: 'waveInterference.formula_waveEquation',
      latex: 'y(x, t) = A \\sin(kx \\mp \\omega t + \\phi)',
      explanationKey: 'waveInterference.formula_waveEquation_desc'
    },
    {
      titleKey: 'waveInterference.formula_wavelength',
      latex: 'v = \\lambda f = \\frac{\\omega}{k}',
      explanationKey: 'waveInterference.formula_wavelength_desc'
    },
    {
      titleKey: 'waveInterference.formula_superposition',
      latex: 'y_{\\text{tot}}(x, t) = y_1(x, t) + y_2(x, t)',
      explanationKey: 'waveInterference.formula_superposition_desc'
    },
    {
      titleKey: 'waveInterference.formula_constructive',
      latex: '\\Delta r = |r_1 - r_2| = m \\lambda \\quad (m \\in \\mathbb{Z})',
      explanationKey: 'waveInterference.formula_constructive_desc'
    },
    {
      titleKey: 'waveInterference.formula_destructive',
      latex: '\\Delta r = \\left(m + \\frac{1}{2}\\right) \\lambda \\quad (m \\in \\mathbb{Z})',
      explanationKey: 'waveInterference.formula_destructive_desc'
    }
  ]
};
