import type { ExperimentConfig } from '@/experiments/registry';

export const resonanceTubesConfig: ExperimentConfig = {
  id: 'physics/waves/resonance-tubes',
  subject: 'physics',
  topic: 'waves',
  titleKey: 'experiments.resonanceTubes.title',
  descKey: 'experiments.resonanceTubes.description',
  gradeTags: ['middle-school', 'high-school', 'university'],
  difficulty: 'medium',
  engine: 'canvas2d',

  variables: [
    {
      id: 'frequency',
      labelKey: 'resonanceTubes.frequency',
      unit: 'Hz',
      min: 256,
      max: 1024,
      step: 16,
      default: 512,
      descKey: 'resonanceTubes.frequency_desc',
      realModeEffect: null
    },
    {
      id: 'columnLength',
      labelKey: 'resonanceTubes.columnLength',
      unit: 'm',
      min: 0.05,
      max: 1.10,
      step: 0.005,
      default: 0.155,
      descKey: 'resonanceTubes.columnLength_desc',
      realModeEffect: null
    },
    {
      id: 'temperatureC',
      labelKey: 'resonanceTubes.temperatureC',
      unit: '°C',
      min: 0,
      max: 45,
      step: 1,
      default: 20,
      descKey: 'resonanceTubes.temperatureC_desc',
      realModeEffect: null
    },
    {
      id: 'tubeRadiusMm',
      labelKey: 'resonanceTubes.tubeRadius',
      unit: 'mm',
      min: 10,
      max: 35,
      step: 1,
      default: 20,
      descKey: 'resonanceTubes.tubeRadius_desc',
      realModeEffect: null
    },
    {
      id: 'relativeHumidity',
      labelKey: 'resonanceTubes.humidity',
      unit: '%',
      min: 10,
      max: 95,
      step: 5,
      default: 45,
      descKey: 'resonanceTubes.humidity_desc',
      realModeEffect: 'resonanceTubes.real_humidity_effect'
    }
  ],

  presets: [
    {
      id: 'first_resonance',
      labelKey: 'resonanceTubes.preset_first_resonance',
      params: {
        frequency: 512,
        columnLength: 0.155,
        temperatureC: 20,
        tubeRadiusMm: 20,
        relativeHumidity: 45
      }
    },
    {
      id: 'second_resonance',
      labelKey: 'resonanceTubes.preset_second_resonance',
      params: {
        frequency: 512,
        columnLength: 0.490,
        temperatureC: 20,
        tubeRadiusMm: 20,
        relativeHumidity: 45
      }
    },
    {
      id: 'third_resonance',
      labelKey: 'resonanceTubes.preset_third_resonance',
      params: {
        frequency: 512,
        columnLength: 0.825,
        temperatureC: 20,
        tubeRadiusMm: 20,
        relativeHumidity: 45
      }
    },
    {
      id: 'speed_of_sound_exp',
      labelKey: 'resonanceTubes.preset_speed_of_sound_exp',
      params: {
        frequency: 512,
        columnLength: 0.155,
        temperatureC: 20,
        tubeRadiusMm: 20,
        relativeHumidity: 45
      }
    },
    {
      id: 'helmholtz_cavity',
      labelKey: 'resonanceTubes.preset_helmholtz_cavity',
      params: {
        frequency: 280,
        columnLength: 0.200,
        temperatureC: 20,
        tubeRadiusMm: 20,
        relativeHumidity: 45
      }
    }
  ],

  tools: [
    { id: 'ruler', nameKey: 'common.ruler', icon: '📏' },
    { id: 'stopwatch', nameKey: 'common.stopwatch', icon: '⏱️' },
    { id: 'spl_meter', nameKey: 'resonanceTubes.tool_splMeter', icon: '🔊' },
    { id: 'audio_probe', nameKey: 'resonanceTubes.tool_audioProbe', icon: '🎵' }
  ],

  formulas: [
    {
      titleKey: 'resonanceTubes.formula_closedTube',
      latex: 'L_n + \\Delta L = (2n - 1) \\frac{\\lambda}{4} \\quad (n = 1, 2, 3, \\dots)',
      explanationKey: 'resonanceTubes.formula_closedTube_desc'
    },
    {
      titleKey: 'resonanceTubes.formula_speedElimination',
      latex: 'v = f \\lambda = 2 f (L_{n+1} - L_n)',
      explanationKey: 'resonanceTubes.formula_speedElimination_desc'
    },
    {
      titleKey: 'resonanceTubes.formula_endCorrection',
      latex: '\\Delta L = 0.61 r = \\frac{L_2 - 3L_1}{2}',
      explanationKey: 'resonanceTubes.formula_endCorrection_desc'
    },
    {
      titleKey: 'resonanceTubes.formula_speedTemperature',
      latex: 'v(T) = 331.3 \\sqrt{1 + \\frac{T}{273.15}} \\approx 331.3 + 0.606 T \\quad (\\text{m/s})',
      explanationKey: 'resonanceTubes.formula_speedTemperature_desc'
    }
  ]
};
