import type { ExperimentConfig } from '@/experiments/registry';

export const rotationalDynamicsConfig: ExperimentConfig = {
  id: 'physics/motion/rotational-dynamics',
  subject: 'physics',
  topic: 'motion',
  titleKey: 'experiments.rotationalDynamics.title',
  descKey: 'experiments.rotationalDynamics.description',
  gradeTags: ['high-school', 'university'],
  difficulty: 'medium',
  engine: 'canvas2d',

  variables: [
    {
      id: 'rotorShapeIndex',
      labelKey: 'rotationalDynamics.rotorShape',
      unit: '',
      min: 0,
      max: 3,
      step: 1,
      default: 0, // 0: disk, 1: hoop, 2: sphere, 3: rod
      descKey: 'rotationalDynamics.rotorShape_desc',
      realModeEffect: null,
    },
    {
      id: 'rotorMass',
      labelKey: 'rotationalDynamics.rotorMass',
      unit: 'kg',
      min: 0.5,
      max: 10.0,
      step: 0.1,
      default: 2.0,
      descKey: 'rotationalDynamics.rotorMass_desc',
      realModeEffect: null,
    },
    {
      id: 'rotorRadius',
      labelKey: 'rotationalDynamics.rotorRadius',
      unit: 'm',
      min: 0.1,
      max: 0.8,
      step: 0.02,
      default: 0.3,
      descKey: 'rotationalDynamics.rotorRadius_desc',
      realModeEffect: null,
    },
    {
      id: 'hangingMass',
      labelKey: 'rotationalDynamics.hangingMass',
      unit: 'kg',
      min: 0.0,
      max: 3.0,
      step: 0.05,
      default: 0.4,
      descKey: 'rotationalDynamics.hangingMass_desc',
      realModeEffect: null,
    },
    {
      id: 'spindleRadius',
      labelKey: 'rotationalDynamics.spindleRadius',
      unit: 'cm',
      min: 1.0,
      max: 12.0,
      step: 0.5,
      default: 4.0,
      descKey: 'rotationalDynamics.spindleRadius_desc',
      realModeEffect: null,
    },
    {
      id: 'bearingFriction',
      labelKey: 'rotationalDynamics.bearingFriction',
      unit: 'N·m',
      min: 0.0,
      max: 0.3,
      step: 0.01,
      default: 0.04,
      descKey: 'rotationalDynamics.bearingFriction_desc',
      realModeEffect: 'rotationalDynamics.bearingFriction_real',
    },
  ],

  presets: [
    {
      id: 'heavyDisk',
      labelKey: 'rotationalDynamics.preset_heavyDisk',
      params: {
        rotorShapeIndex: 0,
        rotorMass: 2.5,
        rotorRadius: 0.35,
        hangingMass: 0.5,
        spindleRadius: 4.0,
        bearingFriction: 0.04,
      },
    },
    {
      id: 'hollowHoop',
      labelKey: 'rotationalDynamics.preset_hollowHoop',
      params: {
        rotorShapeIndex: 1,
        rotorMass: 2.0,
        rotorRadius: 0.3,
        hangingMass: 0.4,
        spindleRadius: 4.0,
        bearingFriction: 0.03,
      },
    },
    {
      id: 'solidSphere',
      labelKey: 'rotationalDynamics.preset_solidSphere',
      params: {
        rotorShapeIndex: 2,
        rotorMass: 2.0,
        rotorRadius: 0.3,
        hangingMass: 0.4,
        spindleRadius: 4.0,
        bearingFriction: 0.03,
      },
    },
    {
      id: 'pivotedRod',
      labelKey: 'rotationalDynamics.preset_pivotedRod',
      params: {
        rotorShapeIndex: 3,
        rotorMass: 1.5,
        rotorRadius: 0.4,
        hangingMass: 0.3,
        spindleRadius: 3.5,
        bearingFriction: 0.02,
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
      titleKey: 'rotationalDynamics.formula_torque',
      latex: '\\tau_{\\text{net}} = I \\alpha = T r - \\tau_f',
      explanationKey: 'rotationalDynamics.torqueExpl',
    },
    {
      titleKey: 'rotationalDynamics.formula_inertia',
      latex: 'I = c \\cdot M R^2',
      explanationKey: 'rotationalDynamics.inertiaExpl',
    },
    {
      titleKey: 'rotationalDynamics.formula_linearAcc',
      latex: 'a_{\\text{lin}} = \\frac{m g}{m + I / r^2}',
      explanationKey: 'rotationalDynamics.linearAccExpl',
    },
    {
      titleKey: 'rotationalDynamics.formula_energy',
      latex: 'K_{\\text{rot}} = \\frac{1}{2} I \\omega^2, \\quad L = I \\omega',
      explanationKey: 'rotationalDynamics.energyExpl',
    },
  ],
};
