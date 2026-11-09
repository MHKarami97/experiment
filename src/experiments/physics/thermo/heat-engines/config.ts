import type { ExperimentConfig } from '@/experiments/registry';

export const heatEnginesConfig: ExperimentConfig = {
  id: 'physics/thermo/heat-engines',
  subject: 'physics',
  topic: 'thermo',
  titleKey: 'experiments.heatEngines.title',
  descKey: 'experiments.heatEngines.description',
  gradeTags: ['high-school', 'university'],
  difficulty: 'advanced',
  engine: 'canvas2d',

  variables: [
    {
      id: 'cycleTypeIndex',
      labelKey: 'heatEngines.cycleType',
      unit: '',
      min: 0,
      max: 3,
      step: 1,
      default: 0,
      descKey: 'heatEngines.cycleType_desc',
      realModeEffect: null
    },
    {
      id: 'th',
      labelKey: 'heatEngines.th',
      unit: 'K',
      min: 350,
      max: 1500,
      step: 10,
      default: 600,
      descKey: 'heatEngines.th_desc',
      realModeEffect: 'heatEngines.real_th_effect'
    },
    {
      id: 'tc',
      labelKey: 'heatEngines.tc',
      unit: 'K',
      min: 250,
      max: 450,
      step: 5,
      default: 300,
      descKey: 'heatEngines.tc_desc',
      realModeEffect: null
    },
    {
      id: 'compressionRatio',
      labelKey: 'heatEngines.compressionRatio',
      unit: '',
      min: 2,
      max: 22,
      step: 0.5,
      default: 4.0,
      descKey: 'heatEngines.compressionRatio_desc',
      realModeEffect: null
    },
    {
      id: 'cutOffRatio',
      labelKey: 'heatEngines.cutOffRatio',
      unit: '',
      min: 1.2,
      max: 3.5,
      step: 0.1,
      default: 2.0,
      descKey: 'heatEngines.cutOffRatio_desc',
      realModeEffect: null
    },
    {
      id: 'gasTypeIndex',
      labelKey: 'heatEngines.gasType',
      unit: '',
      min: 0,
      max: 2,
      step: 1,
      default: 1, // Diatomic (Air)
      descKey: 'heatEngines.gasType_desc',
      realModeEffect: null
    },
    {
      id: 'moles',
      labelKey: 'heatEngines.moles',
      unit: 'mol',
      min: 0.01,
      max: 0.20,
      step: 0.01,
      default: 0.05,
      descKey: 'heatEngines.moles_desc',
      realModeEffect: null
    },
    {
      id: 'rpm',
      labelKey: 'heatEngines.rpm',
      unit: 'RPM',
      min: 10,
      max: 120,
      step: 5,
      default: 30,
      descKey: 'heatEngines.rpm_desc',
      realModeEffect: null
    },
    {
      id: 'pistonFriction',
      labelKey: 'heatEngines.friction',
      unit: '%',
      min: 0,
      max: 25,
      step: 1,
      default: 6,
      descKey: 'heatEngines.friction_desc',
      realModeEffect: 'heatEngines.real_friction_effect'
    },
    {
      id: 'heatLeak',
      labelKey: 'heatEngines.heatLeak',
      unit: 'W/K',
      min: 0,
      max: 3.0,
      step: 0.1,
      default: 0.5,
      descKey: 'heatEngines.heatLeak_desc',
      realModeEffect: 'heatEngines.real_leak_effect'
    }
  ],

  presets: [
    {
      id: 'carnot_ideal',
      labelKey: 'heatEngines.preset_carnot',
      params: {
        cycleTypeIndex: 0,
        th: 600,
        tc: 300,
        compressionRatio: 4.0,
        cutOffRatio: 2.0,
        gasTypeIndex: 1,
        moles: 0.05,
        rpm: 30,
        pistonFriction: 5,
        heatLeak: 0.3
      }
    },
    {
      id: 'otto_petrol',
      labelKey: 'heatEngines.preset_otto',
      params: {
        cycleTypeIndex: 1,
        th: 1300,
        tc: 300,
        compressionRatio: 8.5,
        cutOffRatio: 2.0,
        gasTypeIndex: 1,
        moles: 0.05,
        rpm: 45,
        pistonFriction: 8,
        heatLeak: 0.8
      }
    },
    {
      id: 'diesel_engine',
      labelKey: 'heatEngines.preset_diesel',
      params: {
        cycleTypeIndex: 2,
        th: 1500,
        tc: 300,
        compressionRatio: 16.5,
        cutOffRatio: 2.2,
        gasTypeIndex: 1,
        moles: 0.05,
        rpm: 35,
        pistonFriction: 9,
        heatLeak: 0.9
      }
    },
    {
      id: 'stirling_engine',
      labelKey: 'heatEngines.preset_stirling',
      params: {
        cycleTypeIndex: 3,
        th: 750,
        tc: 300,
        compressionRatio: 3.0,
        cutOffRatio: 2.0,
        gasTypeIndex: 0, // Monatomic He
        moles: 0.05,
        rpm: 25,
        pistonFriction: 4,
        heatLeak: 0.4
      }
    },
    {
      id: 'high_temp_cycle',
      labelKey: 'heatEngines.preset_high_temp',
      params: {
        cycleTypeIndex: 0,
        th: 1000,
        tc: 300,
        compressionRatio: 6.0,
        cutOffRatio: 2.0,
        gasTypeIndex: 1,
        moles: 0.06,
        rpm: 40,
        pistonFriction: 6,
        heatLeak: 0.5
      }
    }
  ],

  tools: [
    { id: 'pvDiagram', nameKey: 'heatEngines.tool_pv', icon: '📈' },
    { id: 'tsDiagram', nameKey: 'heatEngines.tool_ts', icon: '🌡️' },
    { id: 'stateInspector', nameKey: 'heatEngines.tool_inspector', icon: '🔍' },
    { id: 'lossesBreakdown', nameKey: 'heatEngines.tool_losses', icon: '⚙️' }
  ],

  formulas: [
    {
      titleKey: 'heatEngines.carnotLimit',
      latex: '\\eta_{\\text{Carnot}} = 1 - \\frac{T_C}{T_H}',
      explanationKey: 'heatEngines.formula_carnot'
    },
    {
      titleKey: 'heatEngines.workNet',
      latex: 'W_{\\text{net}} = \\oint P \\, dV = Q_{\\text{in}} - Q_{\\text{out}}',
      explanationKey: 'heatEngines.formula_work'
    },
    {
      titleKey: 'heatEngines.cycle_otto',
      latex: '\\eta_{\\text{Otto}} = 1 - \\frac{1}{r^{\\gamma - 1}}',
      explanationKey: 'heatEngines.formula_otto'
    },
    {
      titleKey: 'heatEngines.cycle_diesel',
      latex: '\\eta_{\\text{Diesel}} = 1 - \\frac{1}{r^{\\gamma - 1}} \\left[ \\frac{r_c^{\\gamma} - 1}{\\gamma (r_c - 1)} \\right]',
      explanationKey: 'heatEngines.formula_diesel'
    },
    {
      titleKey: 'heatEngines.power',
      latex: 'P = W_{\\text{net}} \\times \\frac{\\text{RPM}}{60}',
      explanationKey: 'heatEngines.formula_power'
    }
  ]
};
