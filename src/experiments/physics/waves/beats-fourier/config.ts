import type { ExperimentConfig } from '@/experiments/registry';

export const beatsFourierConfig: ExperimentConfig = {
  id: 'physics/waves/beats-fourier',
  subject: 'physics',
  topic: 'waves',
  titleKey: 'experiments.beatsFourier.title',
  descKey: 'experiments.beatsFourier.description',
  gradeTags: ['middle-school', 'high-school', 'university'],
  difficulty: 'medium',
  engine: 'canvas2d',

  variables: [
    {
      id: 'freq1',
      labelKey: 'beatsFourier.freq1',
      unit: 'Hz',
      min: 400,
      max: 500,
      step: 0.5,
      default: 440,
      descKey: 'beatsFourier.freq1_desc',
      realModeEffect: null
    },
    {
      id: 'freq2',
      labelKey: 'beatsFourier.freq2',
      unit: 'Hz',
      min: 400,
      max: 500,
      step: 0.5,
      default: 444,
      descKey: 'beatsFourier.freq2_desc',
      realModeEffect: null
    },
    {
      id: 'amplitude1',
      labelKey: 'beatsFourier.amplitude1',
      unit: '',
      min: 0.2,
      max: 1.0,
      step: 0.05,
      default: 1.0,
      descKey: 'beatsFourier.amplitude1_desc',
      realModeEffect: null
    },
    {
      id: 'amplitude2',
      labelKey: 'beatsFourier.amplitude2',
      unit: '',
      min: 0.2,
      max: 1.0,
      step: 0.05,
      default: 1.0,
      descKey: 'beatsFourier.amplitude2_desc',
      realModeEffect: null
    },
    {
      id: 'phaseDiffDeg',
      labelKey: 'beatsFourier.phaseDiff',
      unit: '°',
      min: 0,
      max: 360,
      step: 15,
      default: 0,
      descKey: 'beatsFourier.phaseDiff_desc',
      realModeEffect: null
    },
    {
      id: 'fourierHarmonicsCount',
      labelKey: 'beatsFourier.harmonicsCount',
      unit: '',
      min: 1,
      max: 11,
      step: 1,
      default: 5,
      descKey: 'beatsFourier.harmonicsCount_desc',
      realModeEffect: null
    },
    {
      id: 'fundamentalFreq',
      labelKey: 'beatsFourier.fundamentalFreq',
      unit: 'Hz',
      min: 110,
      max: 440,
      step: 10,
      default: 220,
      descKey: 'beatsFourier.fundamentalFreq_desc',
      realModeEffect: null
    },
    {
      id: 'noiseLevel',
      labelKey: 'beatsFourier.noiseLevel',
      unit: '',
      min: 0,
      max: 0.08,
      step: 0.005,
      default: 0.02,
      descKey: 'beatsFourier.noiseLevel_desc',
      realModeEffect: 'beatsFourier.real_noise_effect'
    }
  ],

  presets: [
    {
      id: 'standard_beats',
      labelKey: 'beatsFourier.preset_standard_beats',
      params: {
        freq1: 440,
        freq2: 444,
        amplitude1: 1.0,
        amplitude2: 1.0,
        phaseDiffDeg: 0,
        fourierHarmonicsCount: 5,
        fundamentalFreq: 220,
        noiseLevel: 0.02
      }
    },
    {
      id: 'slow_tuning_beat',
      labelKey: 'beatsFourier.preset_slow_tuning_beat',
      params: {
        freq1: 440,
        freq2: 441,
        amplitude1: 1.0,
        amplitude2: 1.0,
        phaseDiffDeg: 0,
        fourierHarmonicsCount: 5,
        fundamentalFreq: 220,
        noiseLevel: 0.02
      }
    },
    {
      id: 'unison',
      labelKey: 'beatsFourier.preset_unison',
      params: {
        freq1: 440,
        freq2: 440,
        amplitude1: 1.0,
        amplitude2: 1.0,
        phaseDiffDeg: 0,
        fourierHarmonicsCount: 5,
        fundamentalFreq: 220,
        noiseLevel: 0.02
      }
    },
    {
      id: 'fourier_square',
      labelKey: 'beatsFourier.preset_fourier_square',
      params: {
        freq1: 440,
        freq2: 444,
        amplitude1: 1.0,
        amplitude2: 1.0,
        phaseDiffDeg: 0,
        fourierHarmonicsCount: 5,
        fundamentalFreq: 220,
        noiseLevel: 0.02
      }
    },
    {
      id: 'fourier_sawtooth',
      labelKey: 'beatsFourier.preset_fourier_sawtooth',
      params: {
        freq1: 440,
        freq2: 444,
        amplitude1: 1.0,
        amplitude2: 1.0,
        phaseDiffDeg: 0,
        fourierHarmonicsCount: 7,
        fundamentalFreq: 220,
        noiseLevel: 0.02
      }
    },
    {
      id: 'fourier_triangle',
      labelKey: 'beatsFourier.preset_fourier_triangle',
      params: {
        freq1: 440,
        freq2: 444,
        amplitude1: 1.0,
        amplitude2: 1.0,
        phaseDiffDeg: 0,
        fourierHarmonicsCount: 4,
        fundamentalFreq: 220,
        noiseLevel: 0.02
      }
    }
  ],

  tools: [
    { id: 'ruler', nameKey: 'common.ruler', icon: '📏' },
    { id: 'stopwatch', nameKey: 'common.stopwatch', icon: '⏱️' },
    { id: 'spectrum_analyzer', nameKey: 'beatsFourier.tool_spectrum', icon: '📊' },
    { id: 'audio_beats', nameKey: 'beatsFourier.tool_audioBeats', icon: '🎵' }
  ],

  formulas: [
    {
      titleKey: 'beatsFourier.formula_beat',
      latex: 'f_{\\text{beat}} = |f_1 - f_2|, \\quad T_{\\text{beat}} = \\frac{1}{f_{\\text{beat}}}',
      explanationKey: 'beatsFourier.formula_beat_desc'
    },
    {
      titleKey: 'beatsFourier.formula_superposition',
      latex: 'y(t) = 2A \\cos\\left(2\\pi \\frac{f_1 - f_2}{2} t\\right) \\sin\\left(2\\pi \\frac{f_1 + f_2}{2} t\\right)',
      explanationKey: 'beatsFourier.formula_superposition_desc'
    },
    {
      titleKey: 'beatsFourier.formula_fourier',
      latex: 'y(t) = \\sum_{k=1}^N c_k \\sin(2\\pi k f_0 t)',
      explanationKey: 'beatsFourier.formula_fourier_desc'
    },
    {
      titleKey: 'beatsFourier.formula_envelope',
      latex: 'A_{\\text{env}}(t) = \\sqrt{A_1^2 + A_2^2 + 2A_1 A_2 \\cos(2\\pi(f_1 - f_2)t - \\phi)}',
      explanationKey: 'beatsFourier.formula_envelope_desc'
    }
  ]
};
