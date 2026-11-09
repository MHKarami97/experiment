import type { Component } from 'vue';

export interface ExperimentVariableDef {
  id: string;
  labelKey: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  default: number;
  descKey: string;
  realModeEffect: string | null;
}

export interface ExperimentPresetDef {
  id: string;
  labelKey: string;
  descKey?: string;
  params: Record<string, number>;
}

export interface ExperimentToolDef {
  id: string;
  nameKey: string;
  icon: string;
}

export interface ExperimentFormulaDef {
  titleKey: string;
  latex: string;
  explanationKey: string;
}

export interface ExperimentConfig {
  id: string;
  subject:
    | 'physics'
    | 'chemistry'
    | 'biology'
    | 'earth'
    | 'math'
    | 'engineering'
    | 'cs'
    | 'environment'
    | 'psychology'
    | 'astronomy'
    | 'economics';
  topic: string;
  titleKey: string;
  descKey: string;
  gradeTags: ('middle-school' | 'high-school' | 'university')[];
  difficulty: 'easy' | 'medium' | 'advanced';
  engine: 'canvas2d' | 'threejs';
  variables: ExperimentVariableDef[];
  presets: ExperimentPresetDef[];
  tools: ExperimentToolDef[];
  formulas: ExperimentFormulaDef[];
}

export interface ExperimentPlugin {
  config: ExperimentConfig;
  component: Component;
  messages: {
    fa: Record<string, any>;
    en: Record<string, any>;
  };
}

export interface ExperimentCatalogItem {
  id: string;
  subject: ExperimentConfig['subject'];
  topic: string;
  titleKey: string;
  descKey: string;
  gradeTags: ExperimentConfig['gradeTags'];
  difficulty: ExperimentConfig['difficulty'];
  engine: ExperimentConfig['engine'];
  status: 'planned' | 'in-progress' | 'built' | 'tested';
  load: () => Promise<ExperimentPlugin>;
}

export const EXPERIMENT_CATALOG: ExperimentCatalogItem[] = [
  {
    id: 'physics/motion/projectile',
    subject: 'physics',
    topic: 'motion',
    titleKey: 'experiments.projectile.title',
    descKey: 'experiments.projectile.description',
    gradeTags: ['high-school', 'university'],
    difficulty: 'medium',
    engine: 'canvas2d',
    status: 'tested',
    load: async () => {
      const [configModule, uiModule, faModule, enModule] = await Promise.all([
        import('./physics/motion/projectile/config'),
        import('./physics/motion/projectile/ui/Experiment.vue'),
        import('./physics/motion/projectile/i18n/fa.json'),
        import('./physics/motion/projectile/i18n/en.json')
      ]);
      return {
        config: configModule.projectileConfig,
        component: uiModule.default,
        messages: {
          fa: faModule.default,
          en: enModule.default
        }
      };
    }
  },
  {
    id: 'physics/motion/1d-2d-kinematics',
    subject: 'physics',
    topic: 'motion',
    titleKey: 'experiments.kinematics.title',
    descKey: 'experiments.kinematics.description',
    gradeTags: ['middle-school', 'high-school', 'university'],
    difficulty: 'easy',
    engine: 'canvas2d',
    status: 'tested',
    load: async () => {
      const [configModule, uiModule, faModule, enModule] = await Promise.all([
        import('./physics/motion/1d-2d-kinematics/config'),
        import('./physics/motion/1d-2d-kinematics/ui/Experiment.vue'),
        import('./physics/motion/1d-2d-kinematics/i18n/fa.json'),
        import('./physics/motion/1d-2d-kinematics/i18n/en.json')
      ]);
      return {
        config: configModule.kinematicsConfig,
        component: uiModule.default,
        messages: {
          fa: faModule.default,
          en: enModule.default
        }
      };
    }
  },
  {
    id: 'physics/motion/newton-inclined-plane',
    subject: 'physics',
    topic: 'motion',
    titleKey: 'experiments.inclinedPlane.title',
    descKey: 'experiments.inclinedPlane.description',
    gradeTags: ['middle-school', 'high-school', 'university'],
    difficulty: 'medium',
    engine: 'canvas2d',
    status: 'tested',
    load: async () => {
      const [configModule, uiModule, faModule, enModule] = await Promise.all([
        import('./physics/motion/newton-inclined-plane/config'),
        import('./physics/motion/newton-inclined-plane/ui/Experiment.vue'),
        import('./physics/motion/newton-inclined-plane/i18n/fa.json'),
        import('./physics/motion/newton-inclined-plane/i18n/en.json')
      ]);
      return {
        config: configModule.inclinedPlaneConfig,
        component: uiModule.default,
        messages: {
          fa: faModule.default,
          en: enModule.default
        }
      };
    }
  },
  {
    id: 'physics/motion/pulleys-levers',
    subject: 'physics',
    topic: 'motion',
    titleKey: 'experiments.pulleysLevers.title',
    descKey: 'experiments.pulleysLevers.description',
    gradeTags: ['middle-school', 'high-school', 'university'],
    difficulty: 'medium',
    engine: 'canvas2d',
    status: 'tested',
    load: async () => {
      const [configModule, uiModule, faModule, enModule] = await Promise.all([
        import('./physics/motion/pulleys-levers/config'),
        import('./physics/motion/pulleys-levers/ui/Experiment.vue'),
        import('./physics/motion/pulleys-levers/i18n/fa.json'),
        import('./physics/motion/pulleys-levers/i18n/en.json')
      ]);
      return {
        config: configModule.pulleysLeversConfig,
        component: uiModule.default,
        messages: {
          fa: faModule.default,
          en: enModule.default
        }
      };
    }
  },
  {
    id: 'physics/motion/circular-motion',
    subject: 'physics',
    topic: 'motion',
    titleKey: 'experiments.circularMotion.title',
    descKey: 'experiments.circularMotion.description',
    gradeTags: ['middle-school', 'high-school', 'university'],
    difficulty: 'medium',
    engine: 'canvas2d',
    status: 'tested',
    load: async () => {
      const [configModule, uiModule, faModule, enModule] = await Promise.all([
        import('./physics/motion/circular-motion/config'),
        import('./physics/motion/circular-motion/ui/Experiment.vue'),
        import('./physics/motion/circular-motion/i18n/fa.json'),
        import('./physics/motion/circular-motion/i18n/en.json')
      ]);
      return {
        config: configModule.circularMotionConfig,
        component: uiModule.default,
        messages: {
          fa: faModule.default,
          en: enModule.default
        }
      };
    }
  },
  {
    id: 'physics/motion/collisions-momentum',
    subject: 'physics',
    topic: 'motion',
    titleKey: 'experiments.collisionsMomentum.title',
    descKey: 'experiments.collisionsMomentum.description',
    gradeTags: ['middle-school', 'high-school', 'university'],
    difficulty: 'medium',
    engine: 'canvas2d',
    status: 'tested',
    load: async () => {
      const [configModule, uiModule, faModule, enModule] = await Promise.all([
        import('./physics/motion/collisions-momentum/config'),
        import('./physics/motion/collisions-momentum/ui/Experiment.vue'),
        import('./physics/motion/collisions-momentum/i18n/fa.json'),
        import('./physics/motion/collisions-momentum/i18n/en.json')
      ]);
      return {
        config: configModule.collisionsConfig,
        component: uiModule.default,
        messages: {
          fa: faModule.default,
          en: enModule.default
        }
      };
    }
  },
  {
    id: 'physics/motion/torque-equilibrium',
    subject: 'physics',
    topic: 'motion',
    titleKey: 'experiments.torqueEquilibrium.title',
    descKey: 'experiments.torqueEquilibrium.description',
    gradeTags: ['middle-school', 'high-school', 'university'],
    difficulty: 'medium',
    engine: 'canvas2d',
    status: 'tested',
    load: async () => {
      const [configModule, uiModule, faModule, enModule] = await Promise.all([
        import('./physics/motion/torque-equilibrium/config'),
        import('./physics/motion/torque-equilibrium/ui/Experiment.vue'),
        import('./physics/motion/torque-equilibrium/i18n/fa.json'),
        import('./physics/motion/torque-equilibrium/i18n/en.json')
      ]);
      return {
        config: configModule.torqueEquilibriumConfig,
        component: uiModule.default,
        messages: {
          fa: faModule.default,
          en: enModule.default
        }
      };
    }
  },
  {
    id: 'physics/motion/pendulums',
    subject: 'physics',
    topic: 'motion',
    titleKey: 'experiments.pendulums.title',
    descKey: 'experiments.pendulums.description',
    gradeTags: ['middle-school', 'high-school', 'university'],
    difficulty: 'medium',
    engine: 'canvas2d',
    status: 'tested',
    load: async () => {
      const [configModule, uiModule, faModule, enModule] = await Promise.all([
        import('./physics/motion/pendulums/config'),
        import('./physics/motion/pendulums/ui/Experiment.vue'),
        import('./physics/motion/pendulums/i18n/fa.json'),
        import('./physics/motion/pendulums/i18n/en.json')
      ]);
      return {
        config: configModule.pendulumsConfig,
        component: uiModule.default,
        messages: {
          fa: faModule.default,
          en: enModule.default
        }
      };
    }
  },
  {
    id: 'physics/motion/spring-shm',
    subject: 'physics',
    topic: 'motion',
    titleKey: 'experiments.springShm.title',
    descKey: 'experiments.springShm.description',
    gradeTags: ['middle-school', 'high-school', 'university'],
    difficulty: 'medium',
    engine: 'canvas2d',
    status: 'tested',
    load: async () => {
      const [configModule, uiModule, faModule, enModule] = await Promise.all([
        import('./physics/motion/spring-shm/config'),
        import('./physics/motion/spring-shm/ui/Experiment.vue'),
        import('./physics/motion/spring-shm/i18n/fa.json'),
        import('./physics/motion/spring-shm/i18n/en.json')
      ]);
      return {
        config: configModule.springShmConfig,
        component: uiModule.default,
        messages: {
          fa: faModule.default,
          en: enModule.default
        }
      };
    }
  },
  {
    id: 'physics/motion/orbital-gravity',
    subject: 'physics',
    topic: 'motion',
    titleKey: 'experiments.orbitalGravity.title',
    descKey: 'experiments.orbitalGravity.description',
    gradeTags: ['high-school', 'university'],
    difficulty: 'advanced',
    engine: 'canvas2d',
    status: 'tested',
    load: async () => {
      const [configModule, uiModule, faModule, enModule] = await Promise.all([
        import('./physics/motion/orbital-gravity/config'),
        import('./physics/motion/orbital-gravity/ui/Experiment.vue'),
        import('./physics/motion/orbital-gravity/i18n/fa.json'),
        import('./physics/motion/orbital-gravity/i18n/en.json')
      ]);
      return {
        config: configModule.orbitalGravityConfig,
        component: uiModule.default,
        messages: {
          fa: faModule.default,
          en: enModule.default
        }
      };
    }
  },
  {
    id: 'physics/motion/rotational-dynamics',
    subject: 'physics',
    topic: 'motion',
    titleKey: 'experiments.rotationalDynamics.title',
    descKey: 'experiments.rotationalDynamics.description',
    gradeTags: ['high-school', 'university'],
    difficulty: 'medium',
    engine: 'canvas2d',
    status: 'tested',
    load: async () => {
      const [configModule, uiModule, faModule, enModule] = await Promise.all([
        import('./physics/motion/rotational-dynamics/config'),
        import('./physics/motion/rotational-dynamics/ui/Experiment.vue'),
        import('./physics/motion/rotational-dynamics/i18n/fa.json'),
        import('./physics/motion/rotational-dynamics/i18n/en.json')
      ]);
      return {
        config: configModule.rotationalDynamicsConfig,
        component: uiModule.default,
        messages: {
          fa: faModule.default,
          en: enModule.default
        }
      };
    }
  },
  {
    id: 'physics/energy/skate-park',
    subject: 'physics',
    topic: 'energy',
    titleKey: 'experiments.skatePark.title',
    descKey: 'experiments.skatePark.description',
    gradeTags: ['middle-school', 'high-school', 'university'],
    difficulty: 'easy',
    engine: 'canvas2d',
    status: 'tested',
    load: async () => {
      const [configModule, uiModule, faModule, enModule] = await Promise.all([
        import('./physics/energy/skate-park/config'),
        import('./physics/energy/skate-park/ui/Experiment.vue'),
        import('./physics/energy/skate-park/i18n/fa.json'),
        import('./physics/energy/skate-park/i18n/en.json')
      ]);
      return {
        config: configModule.skateParkConfig,
        component: uiModule.default,
        messages: {
          fa: faModule.default,
          en: enModule.default
        }
      };
    }
  },
  {
    id: 'physics/energy/work-power',
    subject: 'physics',
    topic: 'energy',
    titleKey: 'experiments.workPower.title',
    descKey: 'experiments.workPower.description',
    gradeTags: ['middle-school', 'high-school', 'university'],
    difficulty: 'easy',
    engine: 'canvas2d',
    status: 'tested',
    load: async () => {
      const [configModule, uiModule, faModule, enModule] = await Promise.all([
        import('./physics/energy/work-power/config'),
        import('./physics/energy/work-power/ui/Experiment.vue'),
        import('./physics/energy/work-power/i18n/fa.json'),
        import('./physics/energy/work-power/i18n/en.json')
      ]);
      return {
        config: configModule.workPowerConfig,
        component: uiModule.default,
        messages: {
          fa: faModule.default,
          en: enModule.default
        }
      };
    }
  },
  {
    id: 'physics/fluids/pressure-density',
    subject: 'physics',
    topic: 'fluids',
    titleKey: 'experiments.pressureDensity.title',
    descKey: 'experiments.pressureDensity.description',
    gradeTags: ['middle-school', 'high-school', 'university'],
    difficulty: 'easy',
    engine: 'canvas2d',
    status: 'tested',
    load: async () => {
      const [configModule, uiModule, faModule, enModule] = await Promise.all([
        import('./physics/fluids/pressure-density/config'),
        import('./physics/fluids/pressure-density/ui/Experiment.vue'),
        import('./physics/fluids/pressure-density/i18n/fa.json'),
        import('./physics/fluids/pressure-density/i18n/en.json')
      ]);
      return {
        config: configModule.fluidPressureConfig,
        component: uiModule.default,
        messages: {
          fa: faModule.default,
          en: enModule.default
        }
      };
    }
  },
  {
    id: 'physics/fluids/buoyancy-archimedes',
    subject: 'physics',
    topic: 'fluids',
    titleKey: 'experiments.buoyancy.title',
    descKey: 'experiments.buoyancy.description',
    gradeTags: ['middle-school', 'high-school', 'university'],
    difficulty: 'easy',
    engine: 'canvas2d',
    status: 'tested',
    load: async () => {
      const [configModule, uiModule, faModule, enModule] = await Promise.all([
        import('./physics/fluids/buoyancy-archimedes/config'),
        import('./physics/fluids/buoyancy-archimedes/ui/Experiment.vue'),
        import('./physics/fluids/buoyancy-archimedes/i18n/fa.json'),
        import('./physics/fluids/buoyancy-archimedes/i18n/en.json')
      ]);
      return {
        config: configModule.buoyancyConfig,
        component: uiModule.default,
        messages: {
          fa: faModule.default,
          en: enModule.default
        }
      };
    }
  },
  {
    id: 'physics/fluids/pascal-bernoulli',
    subject: 'physics',
    topic: 'fluids',
    titleKey: 'experiments.pascalBernoulli.title',
    descKey: 'experiments.pascalBernoulli.description',
    gradeTags: ['high-school', 'university'],
    difficulty: 'medium',
    engine: 'canvas2d',
    status: 'tested',
    load: async () => {
      const [configModule, uiModule, faModule, enModule] = await Promise.all([
        import('./physics/fluids/pascal-bernoulli/config'),
        import('./physics/fluids/pascal-bernoulli/ui/Experiment.vue'),
        import('./physics/fluids/pascal-bernoulli/i18n/fa.json'),
        import('./physics/fluids/pascal-bernoulli/i18n/en.json')
      ]);
      return {
        config: configModule.pascalBernoulliConfig,
        component: uiModule.default,
        messages: {
          fa: faModule.default,
          en: enModule.default
        }
      };
    }
  },
  {
    id: 'physics/fluids/viscosity-pipe-flow',
    subject: 'physics',
    topic: 'fluids',
    titleKey: 'experiments.viscosityPipe.title',
    descKey: 'experiments.viscosityPipe.description',
    gradeTags: ['high-school', 'university'],
    difficulty: 'medium',
    engine: 'canvas2d',
    status: 'tested',
    load: async () => {
      const [configModule, uiModule, faModule, enModule] = await Promise.all([
        import('./physics/fluids/viscosity-pipe-flow/config'),
        import('./physics/fluids/viscosity-pipe-flow/ui/Experiment.vue'),
        import('./physics/fluids/viscosity-pipe-flow/i18n/fa.json'),
        import('./physics/fluids/viscosity-pipe-flow/i18n/en.json')
      ]);
      return {
        config: configModule.viscosityPipeConfig,
        component: uiModule.default,
        messages: {
          fa: faModule.default,
          en: enModule.default
        }
      };
    }
  },
  {
    id: 'physics/thermo/heat-transfer',
    subject: 'physics',
    topic: 'thermo',
    titleKey: 'experiments.heatTransfer.title',
    descKey: 'experiments.heatTransfer.description',
    gradeTags: ['high-school', 'university'],
    difficulty: 'medium',
    engine: 'canvas2d',
    status: 'tested',
    load: async () => {
      const [configModule, uiModule, faModule, enModule] = await Promise.all([
        import('./physics/thermo/heat-transfer/config'),
        import('./physics/thermo/heat-transfer/ui/Experiment.vue'),
        import('./physics/thermo/heat-transfer/i18n/fa.json'),
        import('./physics/thermo/heat-transfer/i18n/en.json')
      ]);
      return {
        config: configModule.heatTransferConfig,
        component: uiModule.default,
        messages: {
          fa: faModule.default,
          en: enModule.default
        }
      };
    }
  },
  {
    id: 'physics/thermo/calorimetry',
    subject: 'physics',
    topic: 'thermo',
    titleKey: 'experiments.calorimetry.title',
    descKey: 'experiments.calorimetry.description',
    gradeTags: ['middle-school', 'high-school', 'university'],
    difficulty: 'medium',
    engine: 'canvas2d',
    status: 'tested',
    load: async () => {
      const [configModule, uiModule, faModule, enModule] = await Promise.all([
        import('./physics/thermo/calorimetry/config'),
        import('./physics/thermo/calorimetry/ui/Experiment.vue'),
        import('./physics/thermo/calorimetry/i18n/fa.json'),
        import('./physics/thermo/calorimetry/i18n/en.json')
      ]);
      return {
        config: configModule.calorimetryConfig,
        component: uiModule.default,
        messages: {
          fa: faModule.default,
          en: enModule.default
        }
      };
    }
  }
];

export function getExperimentById(id: string): ExperimentCatalogItem | undefined {
  return EXPERIMENT_CATALOG.find((exp) => exp.id === id);
}

export function getExperimentsBySubject(subject: string): ExperimentCatalogItem[] {
  return EXPERIMENT_CATALOG.filter((exp) => exp.subject === subject);
}
