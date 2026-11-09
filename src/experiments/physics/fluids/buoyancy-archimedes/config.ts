import type { ExperimentConfig } from '@/experiments/registry';

export const buoyancyConfig: ExperimentConfig = {
  id: 'physics/fluids/buoyancy-archimedes',
  subject: 'physics',
  topic: 'fluids',
  titleKey: 'experiments.buoyancy.title',
  descKey: 'experiments.buoyancy.description',
  gradeTags: ['middle-school', 'high-school', 'university'],
  difficulty: 'easy',
  engine: 'canvas2d',

  variables: [
    {
      id: 'materialIndex',
      labelKey: 'buoyancy.material',
      unit: '',
      min: 0,
      max: 5,
      step: 1,
      default: 1, // Pine wood
      descKey: 'buoyancy.material_desc',
      realModeEffect: null,
    },
    {
      id: 'fluidTypeIndex',
      labelKey: 'buoyancy.fluidType',
      unit: '',
      min: 0,
      max: 4,
      step: 1,
      default: 0, // Water
      descKey: 'buoyancy.fluidType_desc',
      realModeEffect: null,
    },
    {
      id: 'blockVolumeLiters',
      labelKey: 'buoyancy.blockVolume',
      unit: 'L',
      min: 0.2,
      max: 5.0,
      step: 0.1,
      default: 1.0,
      descKey: 'buoyancy.blockVolume_desc',
      realModeEffect: null,
    },
    {
      id: 'gravity',
      labelKey: 'buoyancy.gravity',
      unit: 'm/s²',
      min: 1.6,
      max: 25.0,
      step: 0.1,
      default: 9.8,
      descKey: 'buoyancy.gravity_desc',
      realModeEffect: null,
    },
    {
      id: 'tetherMode',
      labelKey: 'buoyancy.tetherMode',
      unit: '',
      min: 0,
      max: 1,
      step: 1,
      default: 0,
      descKey: 'buoyancy.tetherMode_desc',
      realModeEffect: null,
    },
    {
      id: 'suspensionDepth',
      labelKey: 'buoyancy.suspensionDepth',
      unit: 'm',
      min: 0.0,
      max: 0.8,
      step: 0.05,
      default: 0.3,
      descKey: 'buoyancy.suspensionDepth_desc',
      realModeEffect: null,
    },
  ],

  presets: [
    {
      id: 'floatingWood',
      labelKey: 'buoyancy.preset_floatingWood',
      params: {
        materialIndex: 1, // pine
        fluidTypeIndex: 0, // water
        blockVolumeLiters: 1.5,
        gravity: 9.8,
        tetherMode: 0,
        suspensionDepth: 0.2,
      },
    },
    {
      id: 'icebergWater',
      labelKey: 'buoyancy.preset_icebergWater',
      params: {
        materialIndex: 2, // ice
        fluidTypeIndex: 2, // seawater
        blockVolumeLiters: 3.0,
        gravity: 9.8,
        tetherMode: 0,
        suspensionDepth: 0.2,
      },
    },
    {
      id: 'sinkingIron',
      labelKey: 'buoyancy.preset_sinkingIron',
      params: {
        materialIndex: 4, // iron
        fluidTypeIndex: 0, // water
        blockVolumeLiters: 1.0,
        gravity: 9.8,
        tetherMode: 0,
        suspensionDepth: 0.4,
      },
    },
    {
      id: 'submergedAluminum',
      labelKey: 'buoyancy.preset_submergedAluminum',
      params: {
        materialIndex: 3, // aluminum
        fluidTypeIndex: 0, // water
        blockVolumeLiters: 2.0,
        gravity: 9.8,
        tetherMode: 1, // suspended on scale
        suspensionDepth: 0.35,
      },
    },
    {
      id: 'mercuryIronFloat',
      labelKey: 'buoyancy.preset_mercuryIronFloat',
      params: {
        materialIndex: 4, // iron
        fluidTypeIndex: 4, // mercury
        blockVolumeLiters: 1.5,
        gravity: 9.8,
        tetherMode: 0,
        suspensionDepth: 0.2,
      },
    },
  ],

  tools: [
    { id: 'ruler', nameKey: 'common.ruler', icon: '📏' },
    { id: 'stopwatch', nameKey: 'common.stopwatch', icon: '⏱️' },
  ],

  formulas: [
    {
      titleKey: 'buoyancy.formula_archimedes',
      latex: 'F_b = \\rho_{\\text{fluid}} V_{\\text{sub}} g',
      explanationKey: 'buoyancy.archimedesExpl',
    },
    {
      titleKey: 'buoyancy.formula_floating',
      latex: '\\frac{V_{\\text{sub}}}{V} = \\frac{\\rho_{\\text{block}}}{\\rho_{\\text{fluid}}}',
      explanationKey: 'buoyancy.floatingExpl',
    },
    {
      titleKey: 'buoyancy.formula_apparentWeight',
      latex: 'W_{\\text{apparent}} = W - F_b = (\\rho_{\\text{block}} - \\rho_{\\text{fluid}}) V g',
      explanationKey: 'buoyancy.apparentWeightExpl',
    },
    {
      titleKey: 'buoyancy.formula_netForce',
      latex: 'F_{\\text{net}} = F_b - m g',
      explanationKey: 'buoyancy.netForceExpl',
    },
  ],
};
