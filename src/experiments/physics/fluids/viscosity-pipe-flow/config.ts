import type { ExperimentConfig } from '@/experiments/registry';

export const viscosityPipeConfig: ExperimentConfig = {
  id: 'physics/fluids/viscosity-pipe-flow',
  subject: 'physics',
  topic: 'fluids',
  titleKey: 'experiments.viscosityPipe.title',
  descKey: 'experiments.viscosityPipe.description',
  gradeTags: ['high-school', 'university'],
  difficulty: 'medium',
  engine: 'canvas2d',

  variables: [
    {
      id: 'fluidTypeIndex',
      labelKey: 'viscosityPipe.fluidType',
      unit: '',
      min: 0,
      max: 4,
      step: 1,
      default: 0,
      descKey: 'viscosityPipe.fluidType_desc',
      realModeEffect: null,
    },
    {
      id: 'pressureDiff',
      labelKey: 'viscosityPipe.pressureDiff',
      unit: 'Pa',
      min: 50,
      max: 5000,
      step: 50,
      default: 600,
      descKey: 'viscosityPipe.pressureDiff_desc',
      realModeEffect: null,
    },
    {
      id: 'pipeDiameter',
      labelKey: 'viscosityPipe.pipeDiameter',
      unit: 'cm',
      min: 1.0,
      max: 10.0,
      step: 0.5,
      default: 3.0,
      descKey: 'viscosityPipe.pipeDiameter_desc',
      realModeEffect: null,
    },
    {
      id: 'pipeLength',
      labelKey: 'viscosityPipe.pipeLength',
      unit: 'm',
      min: 0.5,
      max: 5.0,
      step: 0.25,
      default: 2.0,
      descKey: 'viscosityPipe.pipeLength_desc',
      realModeEffect: null,
    },
    {
      id: 'temperatureC',
      labelKey: 'viscosityPipe.temperature',
      unit: '°C',
      min: 5,
      max: 95,
      step: 1,
      default: 20,
      descKey: 'viscosityPipe.temperature_desc',
      realModeEffect: 'viscosityPipe.temperature_real',
    },
    {
      id: 'wallRoughnessMm',
      labelKey: 'viscosityPipe.wallRoughness',
      unit: 'mm',
      min: 0.0,
      max: 0.5,
      step: 0.01,
      default: 0.02,
      descKey: 'viscosityPipe.wallRoughness_desc',
      realModeEffect: 'viscosityPipe.wallRoughness_real',
    },
  ],

  presets: [
    {
      id: 'glycerinLaminar',
      labelKey: 'viscosityPipe.preset_glycerinLaminar',
      params: {
        fluidTypeIndex: 2, // Glycerin
        pressureDiff: 1200,
        pipeDiameter: 2.0,
        pipeLength: 1.5,
        temperatureC: 20,
        wallRoughnessMm: 0.01,
      },
    },
    {
      id: 'waterTransition',
      labelKey: 'viscosityPipe.preset_waterTransition',
      params: {
        fluidTypeIndex: 0, // Water
        pressureDiff: 300,
        pipeDiameter: 2.5,
        pipeLength: 2.0,
        temperatureC: 20,
        wallRoughnessMm: 0.02,
      },
    },
    {
      id: 'turbulentWaterHigh',
      labelKey: 'viscosityPipe.preset_turbulentWaterHigh',
      params: {
        fluidTypeIndex: 0, // Water
        pressureDiff: 2500,
        pipeDiameter: 5.0,
        pipeLength: 1.0,
        temperatureC: 25,
        wallRoughnessMm: 0.05,
      },
    },
    {
      id: 'hotOilEngine',
      labelKey: 'viscosityPipe.preset_hotOilEngine',
      params: {
        fluidTypeIndex: 1, // Motor Oil
        pressureDiff: 1800,
        pipeDiameter: 1.5,
        pipeLength: 1.0,
        temperatureC: 80,
        wallRoughnessMm: 0.01,
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
      titleKey: 'viscosityPipe.formula_poiseuille',
      latex: 'Q = \\frac{\\pi R^4 \\Delta P}{8 \\eta L}',
      explanationKey: 'viscosityPipe.poiseuilleExpl',
    },
    {
      titleKey: 'viscosityPipe.formula_reynolds',
      latex: 'Re = \\frac{\\rho v D}{\\eta}',
      explanationKey: 'viscosityPipe.reynoldsExpl',
    },
    {
      titleKey: 'viscosityPipe.formula_velocityProfile',
      latex: 'v(r) = v_{\\max} \\left(1 - \\frac{r^2}{R^2}\\right)',
      explanationKey: 'viscosityPipe.velocityProfileExpl',
    },
    {
      titleKey: 'viscosityPipe.formula_wallStress',
      latex: '\\tau_w = \\frac{\\Delta P \\cdot R}{2 L}',
      explanationKey: 'viscosityPipe.wallStressExpl',
    },
  ],
};
