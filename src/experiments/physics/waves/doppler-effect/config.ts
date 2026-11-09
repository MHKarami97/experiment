import type { ExperimentConfig } from '@/experiments/registry';

export const dopplerEffectConfig: ExperimentConfig = {
  id: 'physics/waves/doppler-effect',
  subject: 'physics',
  topic: 'waves',
  titleKey: 'experiments.dopplerEffect.title',
  descKey: 'experiments.dopplerEffect.description',
  gradeTags: ['middle-school', 'high-school', 'university'],
  difficulty: 'medium',
  engine: 'canvas2d',

  variables: [
    {
      id: 'sourceSpeed',
      labelKey: 'dopplerEffect.sourceSpeed',
      unit: 'm/s',
      min: 0,
      max: 650,
      step: 10,
      default: 137, // M = 0.4
      descKey: 'dopplerEffect.sourceSpeed_desc',
      realModeEffect: null
    },
    {
      id: 'observerSpeed',
      labelKey: 'dopplerEffect.observerSpeed',
      unit: 'm/s',
      min: -60,
      max: 60,
      step: 5,
      default: 0,
      descKey: 'dopplerEffect.observerSpeed_desc',
      realModeEffect: null
    },
    {
      id: 'soundSpeed',
      labelKey: 'dopplerEffect.soundSpeed',
      unit: 'm/s',
      min: 300,
      max: 360,
      step: 1,
      default: 343,
      descKey: 'dopplerEffect.soundSpeed_desc',
      realModeEffect: null
    },
    {
      id: 'sourceFrequency',
      labelKey: 'dopplerEffect.sourceFrequency',
      unit: 'Hz',
      min: 200,
      max: 1000,
      step: 20,
      default: 440,
      descKey: 'dopplerEffect.sourceFrequency_desc',
      realModeEffect: null
    },
    {
      id: 'observerY',
      labelKey: 'dopplerEffect.observerOffset',
      unit: 'm',
      min: 0,
      max: 100,
      step: 5,
      default: 35,
      descKey: 'dopplerEffect.observerOffset_desc',
      realModeEffect: null
    },
    {
      id: 'windSpeed',
      labelKey: 'dopplerEffect.windSpeed',
      unit: 'm/s',
      min: -30,
      max: 30,
      step: 2,
      default: 10,
      descKey: 'dopplerEffect.windSpeed_desc',
      realModeEffect: 'dopplerEffect.real_wind_effect'
    }
  ],

  presets: [
    {
      id: 'subsonic_ambulance',
      labelKey: 'dopplerEffect.preset_subsonic_ambulance',
      params: {
        sourceSpeed: 120,
        observerSpeed: 0,
        soundSpeed: 343,
        sourceFrequency: 440,
        observerY: 30,
        windSpeed: 0
      }
    },
    {
      id: 'sonic_barrier',
      labelKey: 'dopplerEffect.preset_sonic_barrier',
      params: {
        sourceSpeed: 343, // M = 1.0
        observerSpeed: 0,
        soundSpeed: 343,
        sourceFrequency: 440,
        observerY: 35,
        windSpeed: 0
      }
    },
    {
      id: 'supersonic_jet',
      labelKey: 'dopplerEffect.preset_supersonic_jet',
      params: {
        sourceSpeed: 515, // M = 1.5
        observerSpeed: 0,
        soundSpeed: 343,
        sourceFrequency: 440,
        observerY: 40,
        windSpeed: 0
      }
    },
    {
      id: 'stationary',
      labelKey: 'dopplerEffect.preset_stationary',
      params: {
        sourceSpeed: 0,
        observerSpeed: 0,
        soundSpeed: 343,
        sourceFrequency: 440,
        observerY: 30,
        windSpeed: 0
      }
    },
    {
      id: 'moving_observer',
      labelKey: 'dopplerEffect.preset_moving_observer',
      params: {
        sourceSpeed: 0,
        observerSpeed: 45,
        soundSpeed: 343,
        sourceFrequency: 440,
        observerY: 0,
        windSpeed: 0
      }
    }
  ],

  tools: [
    { id: 'ruler', nameKey: 'common.ruler', icon: '📏' },
    { id: 'stopwatch', nameKey: 'common.stopwatch', icon: '⏱️' },
    { id: 'mach_cone', nameKey: 'dopplerEffect.tool_machCone', icon: '📐' },
    { id: 'audio_synth', nameKey: 'dopplerEffect.tool_audioSynth', icon: '🔊' }
  ],

  formulas: [
    {
      titleKey: 'dopplerEffect.formula_doppler1D',
      latex: "f' = f_0 \\left( \\frac{v \\pm v_o}{v \\mp v_s} \\right)",
      explanationKey: 'dopplerEffect.formula_doppler1D_desc'
    },
    {
      titleKey: 'dopplerEffect.formula_machCone',
      latex: 'M = \\frac{v_s}{v}, \\quad \\sin\\mu = \\frac{v}{v_s} = \\frac{1}{M}',
      explanationKey: 'dopplerEffect.formula_machCone_desc'
    },
    {
      titleKey: 'dopplerEffect.formula_wavelength',
      latex: '\\lambda_{\\text{ahead}} = \\frac{v - v_s}{f_0}, \\quad \\lambda_{\\text{behind}} = \\frac{v + v_s}{f_0}',
      explanationKey: 'dopplerEffect.formula_wavelength_desc'
    },
    {
      titleKey: 'dopplerEffect.formula_pitchShift',
      latex: '\\Delta \\text{cents} = 1200 \\log_2\\left( \\frac{f\'}{f_0} \\right)',
      explanationKey: 'dopplerEffect.formula_pitchShift_desc'
    }
  ]
};
